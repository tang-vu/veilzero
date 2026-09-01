import { describe, expect, it } from "vitest";
import { createCasePackage, generateVendorKeyPackage } from "./case-crypto";
import { createPublicProgramManifest } from "./program-manifest";
import { createRewardAuthorizationRequest, verifyRewardAuthorizationRequest } from "./reward-authorization-request";

async function fixture() {
  const keys = await generateVendorKeyPackage();
  const program = await createPublicProgramManifest({
    programId: "0x123",
    name: "VeilZero Security Program",
    encryptionPublicKey: keys.publicKey,
    policy: "Acknowledge valid encrypted reports within the publicly committed service level.",
    acknowledgementSla: 3_600,
    remediationSla: 86_400,
    token: "0x456",
    rewardTiers: ["10", "25", "50"],
  });
  const casePackage = await createCasePackage({
    report: "A detailed report with reproducible security impact.",
    programEncryptionKey: program.encryptionPublicKey,
  });
  return { program, casePackage };
}

describe("reward authorization request", () => {
  it("exports only a signed public claim commitment", async () => {
    const { program, casePackage } = await fixture();
    const request = createRewardAuthorizationRequest(program, casePackage);
    expect(verifyRewardAuthorizationRequest(request)).toEqual(request);
    const serialized = JSON.stringify(request);
    expect(serialized).not.toContain(casePackage.claimSecret);
    expect(serialized).not.toContain(casePackage.caseSigningPrivateKey);
    expect(serialized).not.toContain(casePackage.localEncryptionKey);
  });

  it("rejects substitution and secret-bearing extensions", async () => {
    const { program, casePackage } = await fixture();
    const request = createRewardAuthorizationRequest(program, casePackage);
    expect(() => verifyRewardAuthorizationRequest({ ...request, caseId: "0x999" })).toThrow();
    expect(() => verifyRewardAuthorizationRequest({ ...request, claimSecret: casePackage.claimSecret })).toThrow();
    expect(() => verifyRewardAuthorizationRequest({ ...request, claimCommitment: "0x0" })).toThrow("non-zero Stark");
    expect(() => verifyRewardAuthorizationRequest({ ...request, caseId: `0x${"f".repeat(64)}` })).toThrow("non-zero Stark");
  });

  it("rejects a case encrypted for a different program key", async () => {
    const first = await fixture();
    const second = await fixture();
    expect(() => createRewardAuthorizationRequest(first.program, second.casePackage)).toThrow("not bound");
  });
});
