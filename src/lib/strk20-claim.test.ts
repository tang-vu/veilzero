import { describe, expect, it, vi } from "vitest";
import type { WALLET_API } from "@starknet-io/types-js";
import { ec } from "starknet";
import {
  extractResolvedNoteId,
  NOTE_MARKER_AFTER,
  NOTE_MARKER_BEFORE,
  prepareDestinationBoundClaim,
  submitPreparedClaim,
} from "./strk20-claim";
import { claimMessageHash } from "./protocol-auth";

const input = {
  pool: "0x999",
  token: "0x10",
  recipient: "0x20",
  contract: "0x30",
  programId: "0x111",
  caseId: "0x222",
  claimSecret: "0x555",
  caseSigningPrivateKey: "0x123456789",
};

function prepared(noteId: string, complete: boolean): WALLET_API.STRK20_CALL_AND_PROOF {
  return {
    call: { contract_address: "0x999", entry_point: "0x1", calldata: ["0xaa", NOTE_MARKER_BEFORE, noteId, NOTE_MARKER_AFTER, "0xbb"] },
    proof: complete ? { data: "proof", output: ["0x1"], proof_facts: ["0x2"] } : { data: "", output: [], proof_facts: [] },
  };
}

describe("destination-bound STRK20 claim preparation", () => {
  it("extracts exactly one wallet-resolved note between contract markers", () => {
    expect(extractResolvedNoteId(prepared("0x777", true).call)).toBe("0x777");
    expect(() => extractResolvedNoteId({ ...prepared("0x777", true).call, calldata: [NOTE_MARKER_BEFORE, "0x1", NOTE_MARKER_AFTER, NOTE_MARKER_BEFORE, "0x2", NOTE_MARKER_AFTER] })).toThrow(/found 2/);
    expect(() => extractResolvedNoteId({ ...prepared("0x777", true).call, calldata: [NOTE_MARKER_BEFORE, "not-a-felt", NOTE_MARKER_AFTER] })).toThrow(/found 0/);
  });

  it("previews, signs the resolved note, then produces a complete stable proof", async () => {
    const prepare = vi.fn()
      .mockResolvedValueOnce(prepared("0x777", false))
      .mockResolvedValueOnce(prepared("0x777", true));
    const result = await prepareDestinationBoundClaim(input, prepare);
    expect(result.noteId).toBe("0x777");
    expect(prepare).toHaveBeenNthCalledWith(1, expect.any(Array), true);
    expect(prepare).toHaveBeenNthCalledWith(2, expect.any(Array), false);
    const finalInvoke = prepare.mock.calls[1][0][1] as WALLET_API.STRK20_INVOKE_ACTION;
    expect(finalInvoke.calldata[3]).not.toBe("0x0");
    expect(finalInvoke.calldata[4]).not.toBe("0x0");
    const signature = new ec.starkCurve.Signature(BigInt(String(finalInvoke.calldata[3])), BigInt(String(finalInvoke.calldata[4])));
    expect(ec.starkCurve.verify(signature, claimMessageHash({ programId: input.programId, caseId: input.caseId, claimSecret: input.claimSecret, noteId: "0x777" }), ec.starkCurve.getPublicKey(input.caseSigningPrivateKey))).toBe(true);
  });

  it("fails closed if the note drifts or the final proof is incomplete", async () => {
    await expect(prepareDestinationBoundClaim(input, vi.fn()
      .mockResolvedValueOnce(prepared("0x777", false))
      .mockResolvedValueOnce(prepared("0x778", true)))).rejects.toThrow(/different note ID/);
    await expect(prepareDestinationBoundClaim(input, vi.fn()
      .mockResolvedValueOnce(prepared("0x777", false))
      .mockResolvedValueOnce(prepared("0x777", false)))).rejects.toThrow(/incomplete/);
  });

  it("rejects a wrong pool target or proof material in the estimation preview", async () => {
    await expect(prepareDestinationBoundClaim(input, vi.fn()
      .mockResolvedValueOnce({ ...prepared("0x777", false), call: { ...prepared("0x777", false).call, contract_address: "0x998" } })))
      .rejects.toThrow(/different privacy pool/);
    await expect(prepareDestinationBoundClaim(input, vi.fn()
      .mockResolvedValueOnce(prepared("0x777", true))))
      .rejects.toThrow(/estimation preview/);
    await expect(prepareDestinationBoundClaim(input, vi.fn()
      .mockResolvedValueOnce({ call: null, proof: null })))
      .rejects.toThrow(/malformed/);
  });

  it("submits only a complete prepared proof", async () => {
    const submit = vi.fn().mockResolvedValue({ transaction_hash: "0xabc" });
    const complete = { prepared: prepared("0x777", true), noteId: "0x777", pool: input.pool, actions: [] };
    await expect(submitPreparedClaim(complete, submit)).resolves.toEqual({ transaction_hash: "0xabc" });
    expect(submit).toHaveBeenCalledWith({ calls: [prepared("0x777", true).call], proof: prepared("0x777", true).proof });
    await expect(submitPreparedClaim({ ...complete, prepared: prepared("0x777", false) }, submit)).rejects.toThrow(/incomplete/);
    await expect(submitPreparedClaim({ ...complete, noteId: "0x778" }, submit)).rejects.toThrow(/changed before submission/);
  });
});
