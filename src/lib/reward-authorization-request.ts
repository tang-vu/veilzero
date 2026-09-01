import { ec, num } from "starknet";
import { z } from "zod";
import type { CasePackage } from "./case-crypto";
import type { PublicProgramManifest } from "./program-manifest";
import {
  claimAuthorizationCommitment,
  rewardAuthorizationRequestMessageHash,
  signRewardAuthorizationRequest,
} from "./protocol-auth";

const felt = z.string().max(66).regex(/^0x[0-9a-f]+$/i);
const verificationKey = z.string().max(134).regex(/^0x[0-9a-f]+$/i);
const requestSchema = z.object({
  version: z.literal(1),
  kind: z.literal("veilzero-reward-authorization-request"),
  programId: felt,
  caseId: felt,
  claimCommitment: felt,
  caseSigningPublicKey: felt,
  caseSigningVerificationKey: verificationKey,
  messageHash: felt,
  signature: z.object({ r: felt, s: felt }).strict(),
  createdAt: z.iso.datetime(),
}).strict();

export type RewardAuthorizationRequest = z.infer<typeof requestSchema>;

export function createRewardAuthorizationRequest(
  program: PublicProgramManifest,
  casePackage: CasePackage,
): RewardAuthorizationRequest {
  if (casePackage.programKeyBinding !== program.encryptionKeyCommitment) {
    throw new Error("Case encryption key is not bound to this program manifest.");
  }
  const core = {
    programId: program.programId,
    caseId: casePackage.caseCommitment,
    claimCommitment: claimAuthorizationCommitment({
      programId: program.programId,
      caseId: casePackage.caseCommitment,
      claimSecret: casePackage.claimSecret,
    }),
  };
  const signed = signRewardAuthorizationRequest(core, casePackage.caseSigningPrivateKey);
  return requestSchema.parse({
    version: 1,
    kind: "veilzero-reward-authorization-request",
    ...core,
    caseSigningPublicKey: casePackage.caseSigningPublicKey,
    caseSigningVerificationKey: casePackage.caseSigningVerificationKey,
    messageHash: signed.messageHash,
    signature: { r: signed.r, s: signed.s },
    createdAt: new Date().toISOString(),
  });
}

export function verifyRewardAuthorizationRequest(raw: unknown): RewardAuthorizationRequest {
  const request = requestSchema.parse(raw);
  const expectedHash = rewardAuthorizationRequestMessageHash(request);
  if (num.toHex(request.messageHash) !== num.toHex(expectedHash)) throw new Error("Reward request message binding mismatch.");
  try {
    const key = request.caseSigningVerificationKey.slice(2);
    const point = ec.starkCurve.ProjectivePoint.fromHex(key);
    if (num.toHex(point.toAffine().x) !== num.toHex(request.caseSigningPublicKey)) throw new Error("Case public key mismatch.");
    const signature = new ec.starkCurve.Signature(BigInt(request.signature.r), BigInt(request.signature.s));
    if (!ec.starkCurve.verify(signature, request.messageHash, key)) throw new Error("Invalid reward request signature.");
  } catch (cause) {
    if (cause instanceof Error && /mismatch|signature/i.test(cause.message)) throw cause;
    throw new Error("Invalid reward request signature.");
  }
  return request;
}
