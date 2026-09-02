import { describe, expect, it, vi } from "vitest";
import type { RequestFn, WALLET_API } from "@starknet-io/types-js";
import { NOTE_MARKER_AFTER, NOTE_MARKER_BEFORE } from "./strk20-claim";
import { CLAIM_WALLET_API_VERSION, validateLiveClaimPreparation } from "./claim-preparation-validation";

const input = {
  pool: "0x999",
  token: "0x10",
  contract: "0x30",
  programId: "0x111",
  caseId: "0x222",
  claimSecret: "0x555",
  caseSigningPrivateKey: "0x123456789",
  connectedAccount: "0x20",
  supportedWalletApis: [CLAIM_WALLET_API_VERSION],
  caseProgramKeyBinding: "0xabc",
  programEncryptionKeyCommitment: "0xabc",
};

function prepared(complete: boolean): WALLET_API.STRK20_CALL_AND_PROOF {
  return {
    call: { contract_address: input.pool, entry_point: "0x1", calldata: [NOTE_MARKER_BEFORE, "0x777", NOTE_MARKER_AFTER] },
    proof: complete ? { data: "proof", output: ["0x1"], proof_facts: ["0x2"] } : { data: "", output: [], proof_facts: [] },
  };
}

function walletRequest(overrides: { chainId?: string; accounts?: string[] } = {}) {
  const prepare = vi.fn()
    .mockResolvedValueOnce(prepared(false))
    .mockResolvedValueOnce(prepared(true));
  const request = vi.fn(async (call: { type: string; params?: { simulate?: boolean } }) => {
    if (call.type === "wallet_requestChainId") return overrides.chainId ?? "SN_MAIN";
    if (call.type === "wallet_requestAccounts") return overrides.accounts ?? [input.connectedAccount];
    if (call.type === "wallet_strk20PrepareInvoke") return prepare(call.params?.simulate);
    throw new Error("unexpected method");
  }) as unknown as RequestFn;
  return { request, prepare };
}

describe("live claim preparation validation", () => {
  it("rechecks mainnet and account, then prepares twice without submitting", async () => {
    const { request, prepare } = walletRequest();
    await expect(validateLiveClaimPreparation(input, request)).resolves.toEqual({ passed: true });
    expect(prepare).toHaveBeenNthCalledWith(1, true);
    expect(prepare).toHaveBeenNthCalledWith(2, false);
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ type: "wallet_addInvokeTransaction" }));
    expect(request).toHaveBeenCalledWith(expect.objectContaining({
      type: "wallet_strk20PrepareInvoke",
      params: expect.objectContaining({ api_version: CLAIM_WALLET_API_VERSION }),
    }));
  });

  it("stops before proving when capability, program, network, or account changed", async () => {
    const unsupported = walletRequest();
    await expect(validateLiveClaimPreparation({ ...input, supportedWalletApis: ["0.10.2"] }, unsupported.request)).rejects.toThrow(/not advertised/);
    expect(unsupported.request).not.toHaveBeenCalled();

    const wrongProgram = walletRequest();
    await expect(validateLiveClaimPreparation({ ...input, caseProgramKeyBinding: "0xdef" }, wrongProgram.request)).rejects.toThrow(/not bound/);
    expect(wrongProgram.request).not.toHaveBeenCalled();

    const wrongNetwork = walletRequest({ chainId: "SN_SEPOLIA" });
    await expect(validateLiveClaimPreparation(input, wrongNetwork.request)).rejects.toThrow(/no longer on Starknet mainnet/);
    expect(wrongNetwork.prepare).not.toHaveBeenCalled();

    const wrongAccount = walletRequest({ accounts: ["0x21"] });
    await expect(validateLiveClaimPreparation(input, wrongAccount.request)).rejects.toThrow(/account changed/);
    expect(wrongAccount.prepare).not.toHaveBeenCalled();
  });
});
