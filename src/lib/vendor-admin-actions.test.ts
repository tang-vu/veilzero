import { describe, expect, it } from "vitest";
import {
  buildAcknowledgeCall,
  buildAuthorizeRewardCall,
  buildCreateProgramCall,
  buildDecisionCall,
  buildFundProgramCalls,
  buildRequestClarificationCall,
  buildReleaseExpiredRewardCall,
  buildSetProgramActiveCall,
} from "./vendor-admin-actions";

const target = { contract: "0x111", programId: "0x222", caseId: "0x333" };

describe("vendor administrator actions", () => {
  it("builds a bounded program configuration in contract order", () => {
    const result = buildCreateProgramCall({
      contract: target.contract,
      programId: target.programId,
      encryptionKeyCommitment: "0x444",
      policyCommitment: "0x555",
      acknowledgementSla: "3600",
      remediationSla: "86400",
      token: "0x666",
      tier1: "100",
      tier2: "200",
      tier3: "300",
    });
    expect(result).toEqual({
      contractAddress: "0x111",
      entrypoint: "create_program",
      calldata: ["0x222", "0x444", "0x555", "0xe10", "0x15180", "0x666", "0x64", "0xc8", "0x12c"],
    });
  });

  it("rejects inverted deadlines, tier substitution, and u128 overflow", () => {
    const base = {
      contract: "0x1", programId: "0x2", encryptionKeyCommitment: "0x3", policyCommitment: "0x4",
      acknowledgementSla: "100", remediationSla: "200", token: "0x5", tier1: "10", tier2: "20", tier3: "30",
    };
    expect(() => buildCreateProgramCall({ ...base, remediationSla: "100" })).toThrow("Remediation SLA");
    expect(() => buildCreateProgramCall({ ...base, tier2: "10" })).toThrow("strictly increasing");
    expect(() => buildCreateProgramCall({ ...base, tier3: 1n << 128n })).toThrow("u128");
  });

  it("approves exactly the funded amount then calls the reserve path", () => {
    expect(buildFundProgramCalls({ contract: "0x111", programId: "0x222", token: "0x666", amount: "1000" })).toEqual([
      { contractAddress: "0x666", entrypoint: "approve", calldata: ["0x111", "0x3e8", "0x0"] },
      { contractAddress: "0x111", entrypoint: "fund_program", calldata: ["0x222", "0x3e8"] },
    ]);
  });

  it("builds lifecycle calls without accepting arbitrary entrypoints", () => {
    expect(buildSetProgramActiveCall({ contract: "0x111", programId: "0x222", active: false }).calldata).toEqual(["0x222", "0x0"]);
    expect(buildAcknowledgeCall(target).entrypoint).toBe("acknowledge");
    expect(buildRequestClarificationCall({ ...target, requestCommitment: "0x777" }).calldata).toEqual(["0x222", "0x333", "0x777"]);
    expect(buildDecisionCall({ ...target, accepted: true }).calldata).toEqual(["0x222", "0x333", "0x1"]);
  });

  it("binds reward authorization and rejects stale expiry or invalid tiers", () => {
    expect(buildAuthorizeRewardCall({ ...target, tier: 2, claimCommitment: "0x888", expiry: "2000" }, 1000n)).toEqual({
      contractAddress: "0x111",
      entrypoint: "authorize_reward",
      calldata: ["0x222", "0x333", "0x2", "0x888", "0x7d0"],
    });
    expect(() => buildAuthorizeRewardCall({ ...target, tier: 2, claimCommitment: "0x888", expiry: "1000" }, 1000n)).toThrow("current block timestamp");
    expect(() => buildAuthorizeRewardCall({ ...target, tier: 4 as 3, claimCommitment: "0x888", expiry: "2000" }, 1000n)).toThrow();
    expect(buildReleaseExpiredRewardCall(target)).toEqual({
      contractAddress: "0x111", entrypoint: "release_expired_reward", calldata: ["0x222", "0x333"],
    });
  });
});
