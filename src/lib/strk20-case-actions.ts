import type { WALLET_API } from "@starknet-io/types-js";
import { ec, num } from "starknet";
import { z } from "zod";
import { signClarification } from "./protocol-auth";
import type { PrepareStrk20Invoke } from "./strk20-claim";

const felt = z.string().max(66).regex(/^0x[0-9a-f]+$/i).refine((value) => {
  const parsed = BigInt(value);
  return parsed > 0n && parsed < BigInt(ec.starkCurve.MAX_VALUE);
}, "Expected a non-zero Stark field element.");

const baseAction = z.object({
  contract: felt,
  programId: felt,
  caseId: felt,
  reportCommitment: felt,
  ciphertextHash: felt,
  payloadSize: z.number().int().positive().max(16_400),
});

const submissionInput = baseAction.extend({ caseSigningPublicKey: felt });
const clarificationInput = baseAction.extend({ caseSigningPrivateKey: felt });

export type CaseSubmissionInput = z.input<typeof submissionInput>;
export type CaseClarificationInput = z.input<typeof clarificationInput>;

function invokeAction(contract: string, calldata: string[]): WALLET_API.STRK20_ACTION {
  return { type: "invoke", contract, calldata };
}

export function buildCaseSubmissionActions(rawInput: CaseSubmissionInput): WALLET_API.STRK20_ACTION[] {
  const input = submissionInput.parse(rawInput);
  return [invokeAction(input.contract, [
    "0x0",
    input.programId,
    input.caseId,
    input.reportCommitment,
    input.ciphertextHash,
    num.toHex(input.payloadSize),
    input.caseSigningPublicKey,
    "0x0",
    "0x0",
    "0x0",
    "0x0",
  ])];
}

export function buildCaseClarificationActions(rawInput: CaseClarificationInput): WALLET_API.STRK20_ACTION[] {
  const input = clarificationInput.parse(rawInput);
  const signature = signClarification(input, input.caseSigningPrivateKey);
  return [invokeAction(input.contract, [
    "0x1",
    input.programId,
    input.caseId,
    input.reportCommitment,
    input.ciphertextHash,
    num.toHex(input.payloadSize),
    signature.r,
    signature.s,
    "0x0",
    "0x0",
    "0x0",
  ])];
}

function assertCompleteProof(prepared: WALLET_API.STRK20_CALL_AND_PROOF): void {
  if (!prepared.proof.data || prepared.proof.output.length === 0 || prepared.proof.proof_facts.length === 0) {
    throw new Error("Wallet returned an empty or incomplete STRK20 proof; nothing can be submitted.");
  }
}

export async function prepareCaseSubmission(
  input: CaseSubmissionInput,
  prepare: PrepareStrk20Invoke,
): Promise<{ actions: WALLET_API.STRK20_ACTION[]; prepared: WALLET_API.STRK20_CALL_AND_PROOF }> {
  const actions = buildCaseSubmissionActions(input);
  const prepared = await prepare(actions, false);
  assertCompleteProof(prepared);
  return { actions, prepared };
}

export async function prepareCaseClarification(
  input: CaseClarificationInput,
  prepare: PrepareStrk20Invoke,
): Promise<{ actions: WALLET_API.STRK20_ACTION[]; prepared: WALLET_API.STRK20_CALL_AND_PROOF }> {
  const actions = buildCaseClarificationActions(input);
  const prepared = await prepare(actions, false);
  assertCompleteProof(prepared);
  return { actions, prepared };
}
