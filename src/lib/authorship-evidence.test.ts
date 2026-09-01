import { describe, expect, it } from "vitest";
import { createCasePackage } from "./case-crypto";
import { createAuthorshipEvidence, verifyAuthorshipEvidence } from "./authorship-evidence";

describe("selective authorship evidence", () => {
  it("proves control of the case key without exporting private material", async () => {
    const pkg = await createCasePackage({ report: "A detailed report with reproducible security impact." });
    const proof = createAuthorshipEvidence(pkg, "vendor-resolution-2026-09-01");
    expect(verifyAuthorshipEvidence(proof)).toBe(true);
    expect(JSON.stringify(proof)).not.toContain(pkg.caseSigningPrivateKey);
    expect(JSON.stringify(proof)).not.toContain(pkg.claimSecret);
    expect(JSON.stringify(proof)).not.toContain(pkg.localEncryptionKey);
  });

  it("rejects altered report bindings and challenges", async () => {
    const pkg = await createCasePackage({ report: "A detailed report with reproducible security impact." });
    const proof = createAuthorshipEvidence(pkg, "original challenge");
    expect(verifyAuthorshipEvidence({ ...proof, reportCommitment: "0x123" })).toBe(false);
    expect(verifyAuthorshipEvidence({ ...proof, challenge: "different challenge" })).toBe(false);
  });
});
