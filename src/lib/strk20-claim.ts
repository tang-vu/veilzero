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
  pool: felt,
  token: felt,
  recipient: felt,
  contract: felt,
  programId: felt,
  caseId: felt,
  claimSecret: felt,
  caseSigningPrivateKey: felt,
});
const walletPrepared = z.object({
  call: z.object({
    contract_address: z.string().max(66),
    entry_point: z.string().max(66),
    calldata: z.array(z.string().max(66)).max(100_000).optional(),
  }),
  proof: z.object({
    data: z.string().max(16 * 1024 * 1024),
    output: z.array(z.string().max(66)).max(4_096),
    proof_facts: z.array(z.string().max(66)).max(4_096),
  }),
});

export type DestinationBoundClaimInput = z.input<typeof claimInput>;
export type ClaimPreparationErrorCode =
  | "INVALID_INPUT"
  | "INVALID_WALLET_RESPONSE"
  | "MISSING_NOTE_BINDING"
  | "POOL_MISMATCH"
  | "SUBMITTABLE_PREVIEW"
  | "NOTE_DRIFT"
  | "INCOMPLETE_PROOF"
  | "UNSUPPORTED_API"
  | "NETWORK_MISMATCH"
  | "ACCOUNT_MISMATCH"
  | "PROGRAM_MISMATCH";
export class ClaimPreparationError extends Error {
  constructor(readonly code: ClaimPreparationErrorCode, message: string) {
    super(message);
    this.name = "ClaimPreparationError";
  }
}
export type PrepareStrk20Invoke = (
  actions: WALLET_API.STRK20_ACTION[],
  simulate: boolean,
) => Promise<WALLET_API.STRK20_CALL_AND_PROOF>;
export type PreparedDestinationBoundClaim = {
  prepared: WALLET_API.STRK20_CALL_AND_PROOF;
  noteId: string;
  pool: string;
  actions: WALLET_API.STRK20_ACTION[];
};

function equalFelt(left: string, right: string): boolean {
  try { return BigInt(left) === BigInt(right); } catch { return false; }
}

function parseWalletPrepared(raw: unknown): WALLET_API.STRK20_CALL_AND_PROOF {
  const parsed = walletPrepared.safeParse(raw);
  if (!parsed.success) {
    throw new ClaimPreparationError("INVALID_WALLET_RESPONSE", "Wallet returned a malformed or oversized STRK20 preparation response.");
  }
  return parsed.data;
}

export function extractResolvedNoteId(call: WALLET_API.Call): string {
  const calldata = call.calldata ?? [];
  const matches: string[] = [];
  for (let index = 0; index + 2 < calldata.length; index += 1) {
    if (equalFelt(String(calldata[index]), NOTE_MARKER_BEFORE) && equalFelt(String(calldata[index + 2]), NOTE_MARKER_AFTER)) {
      try {
        const normalized = num.toHex(String(calldata[index + 1]));
        if (felt.safeParse(normalized).success) matches.push(normalized);
      } catch { /* An untrusted wallet response is not a valid binding. */ }
    }
  }
  if (matches.length !== 1) {
    throw new ClaimPreparationError("MISSING_NOTE_BINDING", `Expected one resolved VeilZero note binding; found ${matches.length}.`);
  }
  return matches[0];
}

function assertPoolTarget(call: WALLET_API.Call, expectedPool: string): void {
  if (!equalFelt(call.contract_address, expectedPool)) {
    throw new ClaimPreparationError("POOL_MISMATCH", "Wallet prepared a call for a different privacy pool; discard it.");
  }
}

function isEmptyProof(prepared: WALLET_API.STRK20_CALL_AND_PROOF): boolean {
  return prepared.proof.data === "" && prepared.proof.output.length === 0 && prepared.proof.proof_facts.length === 0;
}

function assertCompleteProof(prepared: WALLET_API.STRK20_CALL_AND_PROOF): void {
  if (!prepared.proof.data || prepared.proof.output.length === 0 || prepared.proof.proof_facts.length === 0) {
    throw new ClaimPreparationError("INCOMPLETE_PROOF", "Wallet returned an empty or incomplete STRK20 proof; nothing can be submitted.");
  }
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
): Promise<PreparedDestinationBoundClaim> {
  const parsed = claimInput.safeParse(rawInput);
  if (!parsed.success) throw new ClaimPreparationError("INVALID_INPUT", "Claim preparation input failed validation.");
  const input = parsed.data;
  const preview = parseWalletPrepared(await prepare(claimActions(input, { r: "0x0", s: "0x0" }), true));
  assertPoolTarget(preview.call, input.pool);
  if (!isEmptyProof(preview)) {
    throw new ClaimPreparationError("SUBMITTABLE_PREVIEW", "Wallet returned proof material for an estimation preview; discard it.");
  }
  const candidateNoteId = extractResolvedNoteId(preview.call);
  const signature = signClaim(
    { programId: input.programId, caseId: input.caseId, claimSecret: input.claimSecret, noteId: candidateNoteId },
    input.caseSigningPrivateKey,
  );
  const actions = claimActions(input, signature);
  const prepared = parseWalletPrepared(await prepare(actions, false));
  assertPoolTarget(prepared.call, input.pool);
  const finalNoteId = extractResolvedNoteId(prepared.call);
  if (!equalFelt(candidateNoteId, finalNoteId)) {
    throw new ClaimPreparationError("NOTE_DRIFT", "Wallet resolved a different note ID after signing; discard the proof and reconcile wallet state.");
  }
  assertCompleteProof(prepared);
  return { prepared, noteId: finalNoteId, pool: input.pool, actions };
}

export async function submitPreparedClaim(
  claim: PreparedDestinationBoundClaim,
  submit: (params: WALLET_API.AddInvokeTransactionParameters) => Promise<WALLET_API.AddInvokeTransactionResult>,
): Promise<WALLET_API.AddInvokeTransactionResult> {
  const prepared = parseWalletPrepared(claim.prepared);
  assertPoolTarget(prepared.call, claim.pool);
  const resolvedNoteId = extractResolvedNoteId(prepared.call);
  if (!equalFelt(resolvedNoteId, claim.noteId)) {
    throw new ClaimPreparationError("NOTE_DRIFT", "Prepared claim note binding changed before submission; discard it.");
  }
  assertCompleteProof(prepared);
  return submit({ calls: [prepared.call], proof: prepared.proof });
}
