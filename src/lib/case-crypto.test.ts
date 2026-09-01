import { describe, expect, it } from "vitest";
import { createCasePackage } from "./case-crypto";

describe("createCasePackage", () => {
  it("uses unique nonces and secrets for the same report", async () => {
    const input = { report: "A sufficiently detailed vulnerability report." };
    const first = await createCasePackage(input); const second = await createCasePackage(input);
    expect(first.iv).not.toBe(second.iv); expect(first.caseSecret).not.toBe(second.caseSecret); expect(first.ciphertext).not.toBe(second.ciphertext);
  });
  it("domain-separates case and report commitments", async () => {
    const result = await createCasePackage({ report: "A sufficiently detailed vulnerability report." });
    expect(result.caseCommitment).not.toBe(result.reportCommitment); expect(result.caseCommitment).toMatch(/^[0-9a-f]{64}$/);
  });
  it("rejects empty and oversized payloads", async () => {
    await expect(createCasePackage({ report: "short" })).rejects.toThrow();
    await expect(createCasePackage({ report: "x".repeat(16_385) })).rejects.toThrow();
  });
});
