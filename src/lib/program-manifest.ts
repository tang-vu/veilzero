import { ec } from "starknet";
import { z } from "zod";
import { deriveProgramEncryptionKeyCommitment } from "./case-crypto";

const felt = z.string().max(66).regex(/^0x[0-9a-f]+$/i).refine((value) => {
  const parsed = BigInt(value);
  return parsed > 0n && parsed < BigInt(ec.starkCurve.MAX_VALUE);
}, "Expected a non-zero Stark field element.");
const base64Key = z.string().min(1).max(64).regex(/^[A-Za-z0-9+/]+={0,2}$/);
const u128 = z.string().regex(/^(?:0x[0-9a-f]+|[1-9][0-9]*)$/i).refine((value) => {
  const parsed = BigInt(value);
  return parsed > 0n && parsed < (1n << 128n);
}, "Expected a positive u128 amount.");
const manifestCore = z.object({
  version: z.literal(1),
  programId: felt,
  name: z.string().trim().min(3).max(80),
  encryptionPublicKey: base64Key,
  policy: z.string().trim().min(20).max(4_096),
  acknowledgementSla: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  remediationSla: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  token: felt,
  rewardTiers: z.tuple([u128, u128, u128]),
}).superRefine((value, context) => {
  if (value.remediationSla <= value.acknowledgementSla) {
    context.addIssue({ code: "custom", path: ["remediationSla"], message: "Remediation SLA must exceed acknowledgement SLA." });
  }
  const [first, second, third] = value.rewardTiers.map(BigInt);
  if (!(first < second && second < third)) {
    context.addIssue({ code: "custom", path: ["rewardTiers"], message: "Reward tiers must be strictly increasing." });
  }
});
const publicManifest = manifestCore.safeExtend({
  encryptionKeyCommitment: felt,
  policyCommitment: felt,
  createdAt: z.iso.datetime(),
}).strict();

export type ProgramManifestInput = Omit<z.input<typeof manifestCore>, "version">;
export type PublicProgramManifest = z.infer<typeof publicManifest>;

function bytesToFelt(bytes: ArrayBuffer): string {
  const hex = [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
  return `0x${(BigInt(`0x${hex}`) & ((1n << 250n) - 1n)).toString(16)}`;
}

async function policyCommitment(core: z.output<typeof manifestCore>, encryptionKeyCommitment: string): Promise<string> {
  const canonical = JSON.stringify({
    domain: "VEILZERO_V1:PROGRAM_POLICY",
    programId: core.programId,
    name: core.name,
    encryptionKeyCommitment,
    policy: core.policy,
    acknowledgementSla: core.acknowledgementSla,
    remediationSla: core.remediationSla,
    token: core.token,
    rewardTiers: core.rewardTiers,
  });
  return bytesToFelt(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonical)));
}

export async function createPublicProgramManifest(rawInput: ProgramManifestInput): Promise<PublicProgramManifest> {
  const core = manifestCore.parse({ version: 1, ...rawInput });
  const encryptionKeyCommitment = await deriveProgramEncryptionKeyCommitment(core.encryptionPublicKey);
  return publicManifest.parse({
    ...core,
    encryptionKeyCommitment,
    policyCommitment: await policyCommitment(core, encryptionKeyCommitment),
    createdAt: new Date().toISOString(),
  });
}

export async function verifyPublicProgramManifest(rawManifest: unknown): Promise<PublicProgramManifest> {
  const manifest = publicManifest.parse(rawManifest);
  const core = manifestCore.parse(manifest);
  const encryptionKeyCommitment = await deriveProgramEncryptionKeyCommitment(core.encryptionPublicKey);
  const expectedPolicyCommitment = await policyCommitment(core, encryptionKeyCommitment);
  if (manifest.encryptionKeyCommitment !== encryptionKeyCommitment || manifest.policyCommitment !== expectedPolicyCommitment) {
    throw new Error("Program manifest commitment mismatch.");
  }
  return manifest;
}
