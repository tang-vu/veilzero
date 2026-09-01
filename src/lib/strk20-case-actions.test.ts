import type { WALLET_API } from "@starknet-io/types-js";
import { ec } from "starknet";
import { describe, expect, it, vi } from "vitest";
import { clarificationMessageHash } from "./protocol-auth";
import {
  buildCaseClarificationActions,
  buildCaseSubmissionActions,
  prepareCaseClarification,
  prepareCaseSubmission,
} from "./strk20-case-actions";

const privateKey = "0x12345";
const common = {
  contract: "0x111",
  programId: "0x222",
  caseId: "0x333",
  reportCommitment: "0x444",
  ciphertextHash: "0x555",
  payloadSize: 128,
};

function completePrepared(): WALLET_API.STRK20_CALL_AND_PROOF {
  return {
    call: { contract_address: "0x1", entry_point: "0x2", calldata: [] },
    proof: { data: "0x1", output: ["0x2"], proof_facts: ["0x3"] },
  } as WALLET_API.STRK20_CALL_AND_PROOF;
}

describe("STRK20 case actions", () => {
  it("builds an exact submit action with no transfer and zeroed unused fields", () => {
    const actions = buildCaseSubmissionActions({ ...common, caseSigningPublicKey: ec.starkCurve.getStarkKey(privateKey) });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({ type: "invoke", contract: common.contract });
    expect((actions[0] as { calldata: string[] }).calldata).toEqual([
      "0x0", "0x222", "0x333", "0x444", "0x555", "0x80",
      ec.starkCurve.getStarkKey(privateKey), "0x0", "0x0", "0x0", "0x0",
    ]);
  });

  it("binds a clarification signature to program, case, commitments and payload size", () => {
    const actions = buildCaseClarificationActions({ ...common, caseSigningPrivateKey: privateKey });
    const calldata = (actions[0] as { calldata: string[] }).calldata;
    expect(calldata.slice(0, 6)).toEqual(["0x1", "0x222", "0x333", "0x444", "0x555", "0x80"]);
    expect(ec.starkCurve.verify(
      new ec.starkCurve.Signature(BigInt(calldata[6]), BigInt(calldata[7])),
      clarificationMessageHash(common),
      ec.starkCurve.getPublicKey(privateKey),
    )).toBe(true);
    expect(calldata.slice(8)).toEqual(["0x0", "0x0", "0x0"]);
  });

  it("rejects oversized payloads and zero commitments before wallet preparation", () => {
    expect(() => buildCaseSubmissionActions({ ...common, payloadSize: 16_401, caseSigningPublicKey: "0x1" })).toThrow();
    expect(() => buildCaseSubmissionActions({ ...common, reportCommitment: "0x0", caseSigningPublicKey: "0x1" })).toThrow();
  });

  it("prepares submit and clarification without simulation and preserves the actions", async () => {
    const prepare = vi.fn().mockResolvedValue(completePrepared());
    const submit = await prepareCaseSubmission({ ...common, caseSigningPublicKey: "0x1" }, prepare);
    const clarify = await prepareCaseClarification({ ...common, caseSigningPrivateKey: privateKey }, prepare);
    expect(prepare).toHaveBeenCalledTimes(2);
    expect(prepare.mock.calls.every((call) => call[1] === false)).toBe(true);
    expect(submit.actions[0]).toEqual(prepare.mock.calls[0][0][0]);
    expect(clarify.actions[0]).toEqual(prepare.mock.calls[1][0][0]);
  });

  it("fails closed when the wallet omits any proof component", async () => {
    const incomplete = completePrepared();
    incomplete.proof.proof_facts = [];
    await expect(prepareCaseSubmission(
      { ...common, caseSigningPublicKey: "0x1" },
      vi.fn().mockResolvedValue(incomplete),
    )).rejects.toThrow("incomplete STRK20 proof");
  });
});
