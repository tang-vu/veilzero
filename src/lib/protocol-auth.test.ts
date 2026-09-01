import { describe, expect, it } from "vitest";
import { ec } from "starknet";
import {
  claimAuthorizationCommitment,
  signClaim,
  signClarification,
} from "./protocol-auth";

const privateKey = "0x123456789";
const publicKey = ec.starkCurve.getPublicKey(privateKey);
const base = {
  programId: "0x111",
  caseId: "0x222",
  reportCommitment: "0x333",
  ciphertextHash: "0x444",
  payloadSize: 128,
};

describe("protocol authorization", () => {
  it("signs a program- and case-bound clarification", () => {
    const signed = signClarification(base, privateKey);
    expect(ec.starkCurve.verify(new ec.starkCurve.Signature(BigInt(signed.r), BigInt(signed.s)), signed.messageHash, publicKey)).toBe(true);
    const changed = signClarification({ ...base, caseId: "0x223" }, privateKey);
    expect(changed.messageHash).not.toBe(signed.messageHash);
  });

  it("binds authorization to a secret without exposing the destination note", () => {
    const first = claimAuthorizationCommitment({ programId: "0x111", caseId: "0x222", claimSecret: "0x555" });
    const second = claimAuthorizationCommitment({ programId: "0x111", caseId: "0x223", claimSecret: "0x555" });
    expect(first).not.toBe(second);
  });

  it("signs the eventual claim destination", () => {
    const signed = signClaim({ programId: "0x111", caseId: "0x222", claimSecret: "0x555", noteId: "0x777" }, privateKey);
    expect(ec.starkCurve.verify(new ec.starkCurve.Signature(BigInt(signed.r), BigInt(signed.s)), signed.messageHash, publicKey)).toBe(true);
    const redirected = signClaim({ programId: "0x111", caseId: "0x222", claimSecret: "0x555", noteId: "0x778" }, privateKey);
    expect(redirected.messageHash).not.toBe(signed.messageHash);
  });
});
