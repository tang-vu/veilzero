import { describe, expect, it } from "vitest";
import { createCasePackage, deriveProgramEncryptionKeyCommitment, generateVendorKeyPackage } from "./case-crypto";
import { createPublicProgramManifest, verifyPublicProgramManifest } from "./program-manifest";

async function fixture() {
  const keys = await generateVendorKeyPackage();
  return createPublicProgramManifest({
    programId: "0x123",
    name: "VeilZero Security Program",
    encryptionPublicKey: keys.publicKey,
    policy: "Acknowledge valid encrypted reports and remediate critical findings within the committed SLA.",
    acknowledgementSla: 86_400,
    remediationSla: 1_209_600,
    token: "0x456",
    rewardTiers: ["10000000000000000000", "25000000000000000000", "50000000000000000000"],
  });
}

describe("public program manifest", () => {
  it("binds the public key, policy, SLAs, token and ordered tiers", async () => {
    const manifest = await fixture();
    expect(await verifyPublicProgramManifest(manifest)).toEqual(manifest);
    expect(manifest.encryptionKeyCommitment).toBe(await deriveProgramEncryptionKeyCommitment(manifest.encryptionPublicKey));
  });

  it("uses the same key commitment in researcher case packages", async () => {
    const manifest = await fixture();
    const casePackage = await createCasePackage({
      report: "A sufficiently detailed private vulnerability report.",
      programEncryptionKey: manifest.encryptionPublicKey,
    });
    expect(casePackage.programKeyBinding).toBe(manifest.encryptionKeyCommitment);
  });

  it("detects policy, tier and key substitution", async () => {
    const manifest = await fixture();
    await expect(verifyPublicProgramManifest({ ...manifest, policy: `${manifest.policy} Changed.` })).rejects.toThrow("commitment mismatch");
    await expect(verifyPublicProgramManifest({ ...manifest, rewardTiers: ["1", "2", "3"] })).rejects.toThrow("commitment mismatch");
    const otherKeys = await generateVendorKeyPackage();
    await expect(verifyPublicProgramManifest({ ...manifest, encryptionPublicKey: otherKeys.publicKey })).rejects.toThrow("commitment mismatch");
  });

  it("rejects invalid SLA and reward ordering", async () => {
    const manifest = await fixture();
    await expect(createPublicProgramManifest({ ...manifest, remediationSla: manifest.acknowledgementSla })).rejects.toThrow("Remediation SLA");
    await expect(createPublicProgramManifest({ ...manifest, rewardTiers: ["10", "10", "30"] })).rejects.toThrow("strictly increasing");
  });
});
