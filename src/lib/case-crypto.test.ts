import { describe, expect, it } from "vitest";
import {
  createCasePackage,
  decryptCaseForVendor,
  generateVendorKeyPackage,
  parsePublicCaseEnvelope,
  toPublicCaseEnvelope,
  verifyCasePackage,
  verifyPublicCaseEnvelope,
  verifyVendorKeyPackage,
} from "./case-crypto";

describe("createCasePackage", () => {
  it("uses unique nonces and secrets for the same report", async () => {
    const input = { report: "A sufficiently detailed vulnerability report." };
    const first = await createCasePackage(input); const second = await createCasePackage(input);
    expect(first.iv).not.toBe(second.iv); expect(first.caseSecret).not.toBe(second.caseSecret); expect(first.ciphertext).not.toBe(second.ciphertext);
  });
  it("domain-separates case and report commitments", async () => {
    const result = await createCasePackage({ report: "A sufficiently detailed vulnerability report." });
    expect(result.caseCommitment).not.toBe(result.reportCommitment); expect(result.caseCommitment).toMatch(/^0x[0-9a-f]{1,63}$/);
    expect(result.ciphertextCommitment).toMatch(/^0x[0-9a-f]{1,63}$/);
    expect(result.version).toBe(3); expect(result.caseSigningPublicKey).toMatch(/^0x[0-9a-f]+$/);
  });
  it("rejects empty and oversized payloads", async () => {
    await expect(createCasePackage({ report: "short" })).rejects.toThrow();
    await expect(createCasePackage({ report: "x".repeat(16_385) })).rejects.toThrow();
  });
  it("encrypts to a vendor X25519 key and decrypts only with its private key", async () => {
    const vendor = await generateVendorKeyPackage();
    const report = "A detailed report encrypted for the vendor security team.";
    const pkg = await createCasePackage({ report, programEncryptionKey: vendor.publicKey });
    expect(pkg.algorithm).toBe("X25519-HKDF-SHA256+A256GCM");
    expect(pkg.ephemeralPublicKey).not.toBe("");
    const envelope = toPublicCaseEnvelope(pkg);
    expect(envelope).not.toHaveProperty("caseSecret");
    expect(envelope).not.toHaveProperty("caseSigningPrivateKey");
    expect(envelope).not.toHaveProperty("claimSecret");
    expect(envelope.payloadSize).toBe(new TextEncoder().encode(report).length + 16);
    expect(() => parsePublicCaseEnvelope({ ...envelope, caseSecret: pkg.caseSecret })).toThrow();
    await expect(verifyPublicCaseEnvelope(envelope)).resolves.toEqual(envelope);
    await expect(decryptCaseForVendor(envelope, vendor)).resolves.toBe(report);
    await expect(decryptCaseForVendor(pkg, vendor)).resolves.toBe(report);
    await expect(decryptCaseForVendor({ ...envelope, ciphertextCommitment: "0x1" }, vendor)).rejects.toThrow(/commitment/);
    await expect(decryptCaseForVendor({ ...envelope, reportCommitment: "0x1" }, vendor)).rejects.toThrow(/commitment/);
    await expect(decryptCaseForVendor({ ...envelope, caseSigningPublicKey: "0x1" }, vendor)).rejects.toThrow(/commitment/);
    const wrongVendor = await generateVendorKeyPackage();
    await expect(decryptCaseForVendor(pkg, wrongVendor)).rejects.toThrow();
  });
  it("rejects malformed vendor public keys", async () => {
    await expect(createCasePackage({ report: "A sufficiently detailed vulnerability report.", programEncryptionKey: "not-base64" })).rejects.toThrow();
  });
  it("rejects malformed imported envelopes before decryption", () => {
    expect(() => parsePublicCaseEnvelope({ version: 1, algorithm: "X25519-HKDF-SHA256+A256GCM", ciphertext: "<script>" })).toThrow();
  });
  it("strictly verifies vendor key pairs before use", async () => {
    const first = await generateVendorKeyPackage();
    const second = await generateVendorKeyPackage();
    await expect(verifyVendorKeyPackage(first)).resolves.toEqual(first);
    await expect(verifyVendorKeyPackage({ ...first, publicKey: second.publicKey })).rejects.toThrow(/do not match/);
    await expect(verifyVendorKeyPackage({ ...first, unexpected: true })).rejects.toThrow();
  });
  it("round-trips and cryptographically verifies vendor and diagnostic recovery packages", async () => {
    const vendor = await generateVendorKeyPackage();
    const encrypted = await createCasePackage({
      report: "A recovery package report encrypted for the vendor program.",
      programEncryptionKey: vendor.publicKey,
    });
    const diagnostic = await createCasePackage({ report: "A diagnostic recovery package report with sufficient detail." });
    await expect(verifyCasePackage(JSON.parse(JSON.stringify(encrypted)))).resolves.toEqual(encrypted);
    await expect(verifyCasePackage(JSON.parse(JSON.stringify(diagnostic)))).resolves.toEqual(diagnostic);
  });
  it("rejects malformed or tampered recovery material", async () => {
    const vendor = await generateVendorKeyPackage();
    const recovery = await createCasePackage({
      report: "A recovery integrity report encrypted for a specific vendor program.",
      programEncryptionKey: vendor.publicKey,
    });
    const otherVendor = await generateVendorKeyPackage();
    await expect(verifyCasePackage({ ...recovery, unexpected: true })).rejects.toThrow();
    await expect(verifyCasePackage({ ...recovery, caseSecret: "01".repeat(32) })).rejects.toThrow(/integrity/);
    await expect(verifyCasePackage({ ...recovery, localEncryptionKey: "01".repeat(32) })).rejects.toThrow();
    await expect(verifyCasePackage({ ...recovery, caseSigningPrivateKey: "0x1" })).rejects.toThrow(/integrity/);
    await expect(verifyCasePackage({ ...recovery, programEncryptionKey: otherVendor.publicKey })).rejects.toThrow(/integrity/);
    await expect(verifyCasePackage({ ...recovery, claimSecret: "0x1" })).rejects.toThrow(/integrity/);
    await expect(verifyCasePackage({ ...recovery, createdAt: new Date(Date.now() + 1_000).toISOString() })).rejects.toThrow(/integrity/);
    await expect(verifyCasePackage({ ...recovery, ciphertext: recovery.ciphertext.slice(0, -2) + "AA" })).rejects.toThrow();
  });
  it("enforces the report limit in UTF-8 bytes, not JavaScript characters", async () => {
    await expect(createCasePackage({ report: "🛡️".repeat(4_000) })).rejects.toThrow(/16 KiB/);
  });
});
