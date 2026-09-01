import { ec, hash, num, shortString } from "starknet";
import { z } from "zod";
import type { CasePackage } from "./case-crypto";

const hexFelt = z.string().regex(/^0x[0-9a-f]+$/i);
const evidenceSchema = z.object({
  version: z.literal(1),
  kind: z.literal("veilzero-authorship-proof"),
  caseCommitment: hexFelt,
  reportCommitment: hexFelt,
  caseSigningPublicKey: hexFelt,
  caseSigningVerificationKey: hexFelt,
  challenge: z.string().min(1).max(256),
  messageHash: hexFelt,
  signature: z.object({ r: hexFelt, s: hexFelt }),
  createdAt: z.string().datetime(),
});

export type AuthorshipEvidence = z.infer<typeof evidenceSchema>;

function challengeFelt(challenge: string): string {
  return num.toHex(hash.starknetKeccak(challenge));
}

function evidenceHash(caseCommitment: string, reportCommitment: string, challenge: string): string {
  return hash.computePoseidonHashOnElements([
    shortString.encodeShortString("VZ_AUTHOR_V1"),
    caseCommitment,
    reportCommitment,
    challengeFelt(challenge),
  ]);
}

export function createAuthorshipEvidence(casePackage: CasePackage, challenge: string): AuthorshipEvidence {
  const boundedChallenge = z.string().min(1).max(256).parse(challenge);
  const messageHash = evidenceHash(casePackage.caseCommitment, casePackage.reportCommitment, boundedChallenge);
  const signature = ec.starkCurve.sign(messageHash, casePackage.caseSigningPrivateKey);
  return {
    version: 1,
    kind: "veilzero-authorship-proof",
    caseCommitment: casePackage.caseCommitment,
    reportCommitment: casePackage.reportCommitment,
    caseSigningPublicKey: casePackage.caseSigningPublicKey,
    caseSigningVerificationKey: casePackage.caseSigningVerificationKey,
    challenge: boundedChallenge,
    messageHash,
    signature: { r: num.toHex(signature.r), s: num.toHex(signature.s) },
    createdAt: new Date().toISOString(),
  };
}

export function verifyAuthorshipEvidence(raw: unknown): boolean {
  const parsed = evidenceSchema.safeParse(raw);
  if (!parsed.success) return false;
  const evidence = parsed.data;
  if (evidence.messageHash !== evidenceHash(evidence.caseCommitment, evidence.reportCommitment, evidence.challenge)) return false;
  try {
    const verificationKey = evidence.caseSigningVerificationKey.slice(2);
    const point = ec.starkCurve.ProjectivePoint.fromHex(verificationKey);
    if (num.toHex(point.toAffine().x) !== num.toHex(evidence.caseSigningPublicKey)) return false;
    const signature = new ec.starkCurve.Signature(BigInt(evidence.signature.r), BigInt(evidence.signature.s));
    return ec.starkCurve.verify(signature, evidence.messageHash, verificationKey);
  } catch {
    return false;
  }
}
