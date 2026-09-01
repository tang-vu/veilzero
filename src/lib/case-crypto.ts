import { z } from "zod";
import { ec } from "starknet";

const caseInput = z.object({ report: z.string().min(20).max(16_384), programEncryptionKey: z.string().max(512).optional() });

export type CasePackage = {
  version: 2; algorithm: "AES-256-GCM" | "X25519-HKDF-SHA256+A256GCM"; caseCommitment: string; reportCommitment: string;
  ciphertextCommitment: string; ciphertext: string; payloadSize: number; iv: string; caseSecret: string; localEncryptionKey: string;
  caseSigningPrivateKey: string; caseSigningPublicKey: string; caseSigningVerificationKey: string; claimSecret: string;
  ephemeralPublicKey: string; hkdfSalt: string; programKeyBinding: string;
  sizeClass: "small" | "medium" | "large"; createdAt: string;
};

export type VendorKeyPackage = {
  version: 1;
  algorithm: "X25519";
  publicKey: string;
  privateKey: string;
  createdAt: string;
};

export type PublicCaseEnvelope = Pick<
  CasePackage,
  | "algorithm"
  | "caseCommitment"
  | "reportCommitment"
  | "ciphertextCommitment"
  | "ciphertext"
  | "payloadSize"
  | "iv"
  | "caseSigningPublicKey"
  | "caseSigningVerificationKey"
  | "ephemeralPublicKey"
  | "hkdfSalt"
  | "programKeyBinding"
  | "sizeClass"
  | "createdAt"
> & { version: 1 };

const base64Value = z.string().min(1).max(32_768).regex(/^[A-Za-z0-9+/]+={0,2}$/);
const hexValue = z.string().regex(/^[0-9a-f]+$/i);
const feltValue = z.string().max(66).regex(/^0x[0-9a-f]+$/i).refine((value) => BigInt(value) < BigInt(ec.starkCurve.MAX_VALUE), "Value is outside the Stark field.");
const publicKeyValue = z.string().max(134).regex(/^0x[0-9a-f]+$/i);
const publicEnvelopeSchema = z.object({
  version: z.literal(1),
  algorithm: z.literal("X25519-HKDF-SHA256+A256GCM"),
  caseCommitment: feltValue,
  reportCommitment: feltValue,
  ciphertextCommitment: feltValue,
  ciphertext: base64Value,
  payloadSize: z.number().int().positive().max(16_400),
  iv: hexValue.length(24),
  caseSigningPublicKey: feltValue,
  caseSigningVerificationKey: publicKeyValue,
  ephemeralPublicKey: base64Value,
  hkdfSalt: base64Value,
  programKeyBinding: feltValue,
  sizeClass: z.enum(["small", "medium", "large"]),
  createdAt: z.iso.datetime(),
}).superRefine((value, context) => {
  try {
    if (fromBase64(value.ciphertext).length !== value.payloadSize) context.addIssue({ code: "custom", path: ["payloadSize"], message: "Payload size does not match ciphertext." });
    if (fromBase64(value.ephemeralPublicKey).length !== 32) context.addIssue({ code: "custom", path: ["ephemeralPublicKey"], message: "Expected a 32-byte X25519 key." });
    if (fromBase64(value.hkdfSalt).length !== 32) context.addIssue({ code: "custom", path: ["hkdfSalt"], message: "Expected a 32-byte salt." });
  } catch { context.addIssue({ code: "custom", message: "Invalid envelope encoding." }); }
});
const vendorKeySchema = z.object({
  version: z.literal(1), algorithm: z.literal("X25519"), publicKey: base64Value,
  privateKey: base64Value, createdAt: z.iso.datetime(),
});

const encoder = new TextEncoder();
function hex(bytes: ArrayBuffer | Uint8Array) { return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join(""); }
function base64(bytes: ArrayBuffer | Uint8Array) { const view = new Uint8Array(bytes); let binary = ""; for (const byte of view) binary += String.fromCharCode(byte); return btoa(binary); }
function fromBase64(value: string): Uint8Array<ArrayBuffer> { const binary = atob(value); const bytes = new Uint8Array(binary.length); for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index); return bytes; }
function fromHex(value: string): Uint8Array<ArrayBuffer> { if (!/^(?:[0-9a-f]{2})+$/i.test(value)) throw new Error("Invalid hexadecimal value."); const parts = value.match(/.{2}/g)!; const bytes = new Uint8Array(parts.length); parts.forEach((part, index) => { bytes[index] = Number.parseInt(part, 16); }); return bytes; }
async function digest(domain: string, ...parts: Uint8Array[]) {
  const prefix = encoder.encode(`VEILZERO_V1:${domain}:`);
  const material = new Uint8Array(prefix.length + parts.reduce((total, part) => total + 4 + part.length, 0));
  material.set(prefix); let offset = prefix.length;
  for (const part of parts) {
    new DataView(material.buffer).setUint32(offset, part.length, false); offset += 4;
    material.set(part, offset); offset += part.length;
  }
  const raw = BigInt(`0x${hex(await crypto.subtle.digest("SHA-256", material))}`);
  return `0x${(raw & ((1n << 250n) - 1n)).toString(16)}`;
}

function randomFelt() {
  const value = BigInt(`0x${hex(crypto.getRandomValues(new Uint8Array(32)))}`) & ((1n << 250n) - 1n);
  return `0x${(value || 1n).toString(16)}`;
}

async function deriveEnvelopeKey(privateKey: CryptoKey, publicKey: CryptoKey, salt: Uint8Array<ArrayBuffer>) {
  const shared = await crypto.subtle.deriveBits({ name: "X25519", public: publicKey }, privateKey, 256);
  const sharedKey = await crypto.subtle.importKey("raw", shared, "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt, info: encoder.encode("VEILZERO_V1:REPORT_ENVELOPE") },
    sharedKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );
}

export async function generateVendorKeyPackage(): Promise<VendorKeyPackage> {
  const keys = await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"]) as CryptoKeyPair;
  return {
    version: 1,
    algorithm: "X25519",
    publicKey: base64(await crypto.subtle.exportKey("raw", keys.publicKey)),
    privateKey: base64(await crypto.subtle.exportKey("pkcs8", keys.privateKey)),
    createdAt: new Date().toISOString(),
  };
}

export async function createCasePackage(rawInput: unknown): Promise<CasePackage> {
  const input = caseInput.parse(rawInput);
  const reportBytes = encoder.encode(input.report);
  if (reportBytes.length > 16_384) throw new Error("Report exceeds the 16 KiB UTF-8 limit.");
  const caseSecret = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(32));
  let key: CryptoKey;
  let algorithm: CasePackage["algorithm"] = "AES-256-GCM";
  let ephemeralPublicKey = "";
  if (input.programEncryptionKey) {
    const rawProgramKey = fromBase64(input.programEncryptionKey);
    if (rawProgramKey.length !== 32) throw new Error("Program X25519 public key must decode to 32 bytes.");
    const vendorPublicKey = await crypto.subtle.importKey("raw", rawProgramKey, { name: "X25519" }, false, []);
    const ephemeral = await crypto.subtle.generateKey({ name: "X25519" }, true, ["deriveBits"]) as CryptoKeyPair;
    key = await deriveEnvelopeKey(ephemeral.privateKey, vendorPublicKey, salt);
    ephemeralPublicKey = base64(await crypto.subtle.exportKey("raw", ephemeral.publicKey));
    algorithm = "X25519-HKDF-SHA256+A256GCM";
  } else {
    key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  }
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode("VEILZERO_V1:ENCRYPTED_REPORT") }, key, reportBytes);
  const ciphertextBytes = new Uint8Array(ciphertext);
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const signingPrivateKey = `0x${hex(ec.starkCurve.utils.randomPrivateKey())}`;
  const signingPublicKey = ec.starkCurve.getStarkKey(signingPrivateKey);
  const signingVerificationKey = `0x${hex(ec.starkCurve.getPublicKey(signingPrivateKey))}`;
  const programBinding = encoder.encode(input.programEncryptionKey ?? "diagnostic-local-key-only");
  const programKeyBinding = await digest("PROGRAM_KEY", programBinding);
  const caseCommitment = await digest("CASE", caseSecret, programBinding);
  const reportCommitment = await digest("REPORT", reportBytes, caseSecret);
  return {
    version: 2, algorithm, caseCommitment,
    reportCommitment,
    ciphertextCommitment: await digest(
      "ENVELOPE", ciphertextBytes, iv, salt, encoder.encode(ephemeralPublicKey),
      encoder.encode(programKeyBinding), encoder.encode(caseCommitment),
      encoder.encode(reportCommitment), encoder.encode(signingPublicKey),
    ),
    ciphertext: base64(ciphertext), payloadSize: ciphertextBytes.length, iv: hex(iv),
    caseSecret: hex(caseSecret), localEncryptionKey: hex(rawKey),
    caseSigningPrivateKey: signingPrivateKey,
    caseSigningPublicKey: signingPublicKey,
    caseSigningVerificationKey: signingVerificationKey,
    claimSecret: randomFelt(),
    ephemeralPublicKey,
    hkdfSalt: algorithm === "X25519-HKDF-SHA256+A256GCM" ? base64(salt) : "",
    programKeyBinding,
    sizeClass: reportBytes.length <= 1024 ? "small" : reportBytes.length <= 4096 ? "medium" : "large", createdAt: new Date().toISOString(),
  };
}

export function toPublicCaseEnvelope(casePackage: CasePackage): PublicCaseEnvelope {
  if (casePackage.algorithm !== "X25519-HKDF-SHA256+A256GCM") throw new Error("A shareable case must use the vendor program key.");
  return publicEnvelopeSchema.parse({
    version: 1,
    algorithm: casePackage.algorithm,
    caseCommitment: casePackage.caseCommitment,
    reportCommitment: casePackage.reportCommitment,
    ciphertextCommitment: casePackage.ciphertextCommitment,
    ciphertext: casePackage.ciphertext,
    payloadSize: casePackage.payloadSize,
    iv: casePackage.iv,
    caseSigningPublicKey: casePackage.caseSigningPublicKey,
    caseSigningVerificationKey: casePackage.caseSigningVerificationKey,
    ephemeralPublicKey: casePackage.ephemeralPublicKey,
    hkdfSalt: casePackage.hkdfSalt,
    programKeyBinding: casePackage.programKeyBinding,
    sizeClass: casePackage.sizeClass,
    createdAt: casePackage.createdAt,
  });
}

export function parsePublicCaseEnvelope(value: unknown): PublicCaseEnvelope {
  return publicEnvelopeSchema.parse(value);
}

export async function verifyPublicCaseEnvelope(value: unknown): Promise<PublicCaseEnvelope> {
  const envelope = parsePublicCaseEnvelope(value);
  const commitment = await digest(
    "ENVELOPE",
    fromBase64(envelope.ciphertext),
    fromHex(envelope.iv),
    fromBase64(envelope.hkdfSalt),
    encoder.encode(envelope.ephemeralPublicKey),
    encoder.encode(envelope.programKeyBinding),
    encoder.encode(envelope.caseCommitment),
    encoder.encode(envelope.reportCommitment),
    encoder.encode(envelope.caseSigningPublicKey),
  );
  if (commitment !== envelope.ciphertextCommitment) throw new Error("Ciphertext commitment mismatch.");
  return envelope;
}

export function parseVendorKeyPackage(value: unknown): VendorKeyPackage {
  return vendorKeySchema.parse(value);
}

export async function decryptCaseForVendor(casePackage: PublicCaseEnvelope | CasePackage, vendorKeys: VendorKeyPackage): Promise<string> {
  const safeVendorKeys = parseVendorKeyPackage(vendorKeys);
  const safeCase = await verifyPublicCaseEnvelope({ ...casePackage, version: 1 });
  const privateKey = await crypto.subtle.importKey("pkcs8", fromBase64(safeVendorKeys.privateKey), { name: "X25519" }, false, ["deriveBits"]);
  const ephemeralPublicKey = await crypto.subtle.importKey("raw", fromBase64(safeCase.ephemeralPublicKey), { name: "X25519" }, false, []);
  const key = await deriveEnvelopeKey(privateKey, ephemeralPublicKey, fromBase64(safeCase.hkdfSalt));
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromHex(safeCase.iv), additionalData: encoder.encode("VEILZERO_V1:ENCRYPTED_REPORT") },
    key,
    fromBase64(safeCase.ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}
