import type { RequestFn } from "@starknet-io/types-js";
import { ClaimPreparationError, prepareDestinationBoundClaim, type DestinationBoundClaimInput } from "./strk20-claim";
import { classifyChainId } from "./wallet-diagnostics";

export const CLAIM_WALLET_API_VERSION = "0.10.3" as const;

export type LiveClaimPreparationInput = Omit<DestinationBoundClaimInput, "recipient"> & {
  connectedAccount: string;
  supportedWalletApis: readonly string[];
  caseProgramKeyBinding: string;
  programEncryptionKeyCommitment: string;
};

function equalFelt(left: string, right: string): boolean {
  try { return BigInt(left) === BigInt(right); } catch { return false; }
}

export async function validateLiveClaimPreparation(
  input: LiveClaimPreparationInput,
  request: RequestFn,
): Promise<{ passed: true }> {
  if (!input.supportedWalletApis.includes(CLAIM_WALLET_API_VERSION)) {
    throw new ClaimPreparationError("UNSUPPORTED_API", `Wallet API ${CLAIM_WALLET_API_VERSION} was not advertised; preparation was not attempted.`);
  }
  if (!equalFelt(input.caseProgramKeyBinding, input.programEncryptionKeyCommitment)) {
    throw new ClaimPreparationError("PROGRAM_MISMATCH", "The local case is not bound to this program manifest; preparation was not attempted.");
  }

  const [chainId, accounts] = await Promise.all([
    request({ type: "wallet_requestChainId", params: { api_version: CLAIM_WALLET_API_VERSION } }),
    request({ type: "wallet_requestAccounts", params: { silent_mode: true, api_version: CLAIM_WALLET_API_VERSION } }),
  ]);
  if (classifyChainId(String(chainId)) !== "mainnet") {
    throw new ClaimPreparationError("NETWORK_MISMATCH", "Wallet is no longer on Starknet mainnet; preparation was not attempted.");
  }
  if (!accounts.some((account) => equalFelt(String(account), input.connectedAccount))) {
    throw new ClaimPreparationError("ACCOUNT_MISMATCH", "The connected wallet account changed; run the wallet probe again.");
  }

  await prepareDestinationBoundClaim(
    { ...input, recipient: input.connectedAccount },
    (actions, simulate) => request({
      type: "wallet_strk20PrepareInvoke",
      params: { actions, simulate, api_version: CLAIM_WALLET_API_VERSION },
    }),
  );
  return { passed: true };
}
