import type { WALLET_API } from "@starknet-io/types-js";
import { ec, num, shortString } from "starknet";
import { z } from "zod";
import { signClaim } from "./protocol-auth";

export const NOTE_MARKER_BEFORE = num.toHex(shortString.encodeShortString("VZ_NOTE_BEGIN_V1"));
export const NOTE_MARKER_AFTER = num.toHex(shortString.encodeShortString("VZ_NOTE_END_V1"));
const OPEN_NOTE_PLACEHOLDER = "${openNoteIds[0]}";

const felt = z.string().max(66).regex(/^0x[0-9a-f]+$/i).refine((value) => {
  const parsed = BigInt(value);
  return parsed > 0n && parsed < BigInt(ec.starkCurve.MAX_VALUE);
}, "Expected a non-zero Stark field element.");
const claimInput = z.object({
  token: felt,
  recipient: felt,
  contract: felt,
  programId: felt,
  caseId: felt,
  claimSecret: felt,
  caseSigningPrivateKey: felt,
});

export type DestinationBoundClaimInput = z.input<typeof claimInput>;
export type PrepareStrk20Invoke = (
  actions: WALLET_API.STRK20_ACTION[],
  simulate: boolean,
) => Promise<WALLET_API.STRK20_CALL_AND_PROOF>;

function equalFelt(left: string, right: string): boolean {
  try { return BigInt(left) === BigInt(right); } catch { return false; }
}

export function extractResolvedNoteId(call: WALLET_API.Call): string {
  const calldata = call.calldata ?? [];
  const matches: string[] = [];
  for (let index = 0; index + 2 < calldata.length; index += 1) {
    if (equalFelt(String(calldata[index]), NOTE_MARKER_BEFORE) && equalFelt(String(calldata[index + 2]), NOTE_MARKER_AFTER)) {
      const candidate = String(calldata[index + 1]);
      const normalized = num.toHex(candidate);
      if (felt.safeParse(normalized).success) matches.push(normalized);
    }
  }
  if (matches.length !== 1) throw new Error(`Expected one resolved VeilZero note binding; found ${matches.length}.`);
  return matches[0];
}

function claimActions(
  input: z.output<typeof claimInput>,
  signature: { r: string; s: string },
): WALLET_API.STRK20_ACTION[] {
  return [
    { type: "transfer", token: input.token, amount: "OPEN", recipient: input.recipient },
    {
      type: "invoke",
      contract: input.contract,
      calldata: [
        "0x2",
        input.programId,
        input.caseId,
        signature.r,
        signature.s,
        "0x0",
        "0x0",
        input.claimSecret,
        NOTE_MARKER_BEFORE,
        OPEN_NOTE_PLACEHOLDER,
        NOTE_MARKER_AFTER,
      ],
    },
  ];
}

export async function prepareDestinationBoundClaim(
  rawInput: DestinationBoundClaimInput,
  prepare: PrepareStrk20Invoke,
): Promise<{ prepared: WALLET_API.STRK20_CALL_AND_PROOF; noteId: string; actions: WALLET_API.STRK20_ACTION[] }> {
  const input = claimInput.parse(rawInput);
  const preview = await prepare(claimActions(input, { r: "0x0", s: "0x0" }), true);
  const candidateNoteId = extractResolvedNoteId(preview.call);
  const signature = signClaim(
    { programId: input.programId, caseId: input.caseId, claimSecret: input.claimSecret, noteId: candidateNoteId },
    input.caseSigningPrivateKey,
  );
  const actions = claimActions(input, signature);
  const prepared = await prepare(actions, false);
  const finalNoteId = extractResolvedNoteId(prepared.call);
  if (!equalFelt(candidateNoteId, finalNoteId)) throw new Error("Wallet resolved a different note ID after signing; discard the proof and reconcile wallet state.");
  if (!prepared.proof.data || prepared.proof.output.length === 0 || prepared.proof.proof_facts.length === 0) {
    throw new Error("Wallet returned an empty or incomplete STRK20 proof; nothing can be submitted.");
  }
  return { prepared, noteId: finalNoteId, actions };
}

export async function submitPreparedClaim(
  prepared: WALLET_API.STRK20_CALL_AND_PROOF,
  submit: (params: WALLET_API.AddInvokeTransactionParameters) => Promise<WALLET_API.AddInvokeTransactionResult>,
): Promise<WALLET_API.AddInvokeTransactionResult> {
  if (!prepared.proof.data || prepared.proof.output.length === 0 || prepared.proof.proof_facts.length === 0) {
    throw new Error("Refusing to submit an incomplete STRK20 proof.");
  }
  return submit({ calls: [prepared.call], proof: prepared.proof });
}
