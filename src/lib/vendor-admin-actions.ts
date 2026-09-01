import type { Call } from "starknet";
import { ec, num } from "starknet";
import { z } from "zod";

const felt = z.string().max(66).regex(/^0x[0-9a-f]+$/i).refine((value) => {
  const parsed = BigInt(value);
  return parsed > 0n && parsed < BigInt(ec.starkCurve.MAX_VALUE);
}, "Expected a non-zero Stark field element.");

function unsigned(bits: number) {
  const maximum = 1n << BigInt(bits);
  return z.union([z.string().regex(/^(?:0x[0-9a-f]+|[0-9]+)$/i), z.bigint()]).transform(BigInt)
    .refine((value) => value > 0n && value < maximum, `Expected a positive u${bits}.`);
}

const u64 = unsigned(64);
const u128 = unsigned(128);

const contractTarget = z.object({ contract: felt });
const caseTarget = contractTarget.extend({ programId: felt, caseId: felt });
const programInput = contractTarget.extend({
  programId: felt,
  encryptionKeyCommitment: felt,
  policyCommitment: felt,
  acknowledgementSla: u64,
  remediationSla: u64,
  token: felt,
  tier1: u128,
  tier2: u128,
  tier3: u128,
}).superRefine((value, context) => {
  if (value.remediationSla <= value.acknowledgementSla) {
    context.addIssue({ code: "custom", path: ["remediationSla"], message: "Remediation SLA must exceed acknowledgement SLA." });
  }
  if (!(value.tier1 < value.tier2 && value.tier2 < value.tier3)) {
    context.addIssue({ code: "custom", path: ["tier2"], message: "Reward tiers must be strictly increasing." });
  }
});
const fundingInput = contractTarget.extend({ programId: felt, token: felt, amount: u128 });
const clarificationRequest = caseTarget.extend({ requestCommitment: felt });
const authorizationInput = caseTarget.extend({ tier: z.union([z.literal(1), z.literal(2), z.literal(3)]), claimCommitment: felt, expiry: u64 });

function feltHex(value: bigint): string { return num.toHex(value); }
function call(contractAddress: string, entrypoint: string, calldata: string[]): Call {
  return { contractAddress, entrypoint, calldata };
}

export function buildCreateProgramCall(rawInput: z.input<typeof programInput>): Call {
  const input = programInput.parse(rawInput);
  return call(input.contract, "create_program", [
    input.programId,
    input.encryptionKeyCommitment,
    input.policyCommitment,
    feltHex(input.acknowledgementSla),
    feltHex(input.remediationSla),
    input.token,
    feltHex(input.tier1),
    feltHex(input.tier2),
    feltHex(input.tier3),
  ]);
}

export function buildFundProgramCalls(rawInput: z.input<typeof fundingInput>): Call[] {
  const input = fundingInput.parse(rawInput);
  return [
    call(input.token, "approve", [input.contract, feltHex(input.amount), "0x0"]),
    call(input.contract, "fund_program", [input.programId, feltHex(input.amount)]),
  ];
}

export function buildSetProgramActiveCall(rawInput: z.input<typeof contractTarget> & { programId: string; active: boolean }): Call {
  const input = contractTarget.extend({ programId: felt, active: z.boolean() }).parse(rawInput);
  return call(input.contract, "set_program_active", [input.programId, input.active ? "0x1" : "0x0"]);
}

export function buildAcknowledgeCall(rawInput: z.input<typeof caseTarget>): Call {
  const input = caseTarget.parse(rawInput);
  return call(input.contract, "acknowledge", [input.programId, input.caseId]);
}

export function buildRequestClarificationCall(rawInput: z.input<typeof clarificationRequest>): Call {
  const input = clarificationRequest.parse(rawInput);
  return call(input.contract, "request_clarification", [input.programId, input.caseId, input.requestCommitment]);
}

export function buildDecisionCall(rawInput: z.input<typeof caseTarget> & { accepted: boolean }): Call {
  const input = caseTarget.extend({ accepted: z.boolean() }).parse(rawInput);
  return call(input.contract, "decide", [input.programId, input.caseId, input.accepted ? "0x1" : "0x0"]);
}

export function buildAuthorizeRewardCall(rawInput: z.input<typeof authorizationInput>, currentBlockTimestamp: bigint): Call {
  const input = authorizationInput.parse(rawInput);
  if (currentBlockTimestamp < 0n || input.expiry <= currentBlockTimestamp) {
    throw new Error("Reward authorization expiry must exceed the current block timestamp.");
  }
  return call(input.contract, "authorize_reward", [
    input.programId,
    input.caseId,
    feltHex(BigInt(input.tier)),
    input.claimCommitment,
    feltHex(input.expiry),
  ]);
}

export function buildReleaseExpiredRewardCall(rawInput: z.input<typeof caseTarget>): Call {
  const input = caseTarget.parse(rawInput);
  return call(input.contract, "release_expired_reward", [input.programId, input.caseId]);
}
