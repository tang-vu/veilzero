import { ec, hash, num, shortString } from "starknet";
import { z } from "zod";

const felt = z.string().regex(/^0x[0-9a-f]+$/i).refine((value) => {
  const parsed = BigInt(value);
  return parsed > 0n && parsed < BigInt(ec.starkCurve.MAX_VALUE);
}, "Expected a non-zero Stark field element");

const clarification = z.object({
  programId: felt,
  caseId: felt,
  reportCommitment: felt,
  ciphertextHash: felt,
  payloadSize: z.number().int().positive().max(16_400),
});

const claim = z.object({ programId: felt, caseId: felt, claimSecret: felt, noteId: felt });

function poseidon(domain: "VZ_CLARIFY_V1" | "VZ_CLAIM_AUTH_V1" | "VZ_CLAIM_MSG_V1", values: string[]) {
  return hash.computePoseidonHashOnElements([shortString.encodeShortString(domain), ...values]);
}

export type ProtocolSignature = { r: string; s: string; messageHash: string };

export function clarificationMessageHash(raw: z.input<typeof clarification>): string {
  const input = clarification.parse(raw);
  return poseidon("VZ_CLARIFY_V1", [
    input.programId,
    input.caseId,
    input.reportCommitment,
    input.ciphertextHash,
    num.toHex(input.payloadSize),
  ]);
}

export function signClarification(
  input: z.input<typeof clarification>,
  caseSigningPrivateKey: string,
): ProtocolSignature {
  felt.parse(caseSigningPrivateKey);
  const messageHash = clarificationMessageHash(input);
  const signature = ec.starkCurve.sign(messageHash, caseSigningPrivateKey);
  return { r: num.toHex(signature.r), s: num.toHex(signature.s), messageHash };
}

export function claimAuthorizationCommitment(raw: Omit<z.input<typeof claim>, "noteId">): string {
  const input = claim.omit({ noteId: true }).parse(raw);
  return poseidon("VZ_CLAIM_AUTH_V1", [input.programId, input.caseId, input.claimSecret]);
}

export function claimMessageHash(raw: z.input<typeof claim>): string {
  const input = claim.parse(raw);
  return poseidon("VZ_CLAIM_MSG_V1", [input.programId, input.caseId, input.claimSecret, input.noteId]);
}

export function signClaim(
  input: z.input<typeof claim>,
  caseSigningPrivateKey: string,
): ProtocolSignature {
  felt.parse(caseSigningPrivateKey);
  const messageHash = claimMessageHash(input);
  const signature = ec.starkCurve.sign(messageHash, caseSigningPrivateKey);
  return { r: num.toHex(signature.r), s: num.toHex(signature.s), messageHash };
}
