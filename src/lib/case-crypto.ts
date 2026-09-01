import { z } from "zod";

const caseInput = z.object({ report: z.string().min(20).max(16_384), programEncryptionKey: z.string().max(512).optional() });

export type CasePackage = {
  version: 1; algorithm: "AES-256-GCM"; caseCommitment: string; reportCommitment: string;
  ciphertext: string; iv: string; caseSecret: string; localEncryptionKey: string;
  programKeyBinding: string; sizeClass: "small" | "medium" | "large"; createdAt: string;
};

const encoder = new TextEncoder();
function hex(bytes: ArrayBuffer | Uint8Array) { return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join(""); }
function base64(bytes: ArrayBuffer) { const view = new Uint8Array(bytes); let binary = ""; for (const byte of view) binary += String.fromCharCode(byte); return btoa(binary); }
async function digest(domain: string, ...parts: Uint8Array[]) {
  const prefix = encoder.encode(`VEILZERO_V1:${domain}:`);
  const material = new Uint8Array(prefix.length + parts.reduce((total, part) => total + part.length, 0));
  material.set(prefix); let offset = prefix.length;
  for (const part of parts) { material.set(part, offset); offset += part.length; }
  return hex(await crypto.subtle.digest("SHA-256", material));
}

export async function createCasePackage(rawInput: unknown): Promise<CasePackage> {
  const input = caseInput.parse(rawInput);
  const reportBytes = encoder.encode(input.report);
  const caseSecret = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encoder.encode("VEILZERO_V1:ENCRYPTED_REPORT") }, key, reportBytes);
  const rawKey = await crypto.subtle.exportKey("raw", key);
  const programBinding = encoder.encode(input.programEncryptionKey ?? "diagnostic-local-key-only");
  return {
    version: 1, algorithm: "AES-256-GCM", caseCommitment: await digest("CASE", caseSecret, programBinding),
    reportCommitment: await digest("REPORT", reportBytes, caseSecret), ciphertext: base64(ciphertext), iv: hex(iv),
    caseSecret: hex(caseSecret), localEncryptionKey: hex(rawKey), programKeyBinding: await digest("PROGRAM_KEY", programBinding),
    sizeClass: reportBytes.length <= 1024 ? "small" : reportBytes.length <= 4096 ? "medium" : "large", createdAt: new Date().toISOString(),
  };
}
