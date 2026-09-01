"use client";

import { useState } from "react";
import type { PublicCaseEnvelope } from "@/lib/case-crypto";
import type { PublicProgramManifest } from "@/lib/program-manifest";
import { parseTokenAmount } from "@/lib/strk20-diagnostic-actions";
import {
  type RewardAuthorizationRequest,
  verifyRewardAuthorizationRequest,
} from "@/lib/reward-authorization-request";
import {
  buildAcknowledgeCall,
  buildAuthorizeRewardCall,
  buildCreateProgramCall,
  buildDecisionCall,
  buildFundProgramCalls,
  buildRequestClarificationCall,
} from "@/lib/vendor-admin-actions";

type Props = {
  program: PublicProgramManifest | null;
  caseEnvelope: PublicCaseEnvelope | null;
};

function assertRequestBinding(
  request: RewardAuthorizationRequest,
  program: PublicProgramManifest | null,
  caseEnvelope: PublicCaseEnvelope | null,
) {
  if (!program || !caseEnvelope) throw new Error("Bind a program manifest and encrypted case before importing a reward request.");
  if (request.programId !== program.programId || request.caseId !== caseEnvelope.caseCommitment) {
    throw new Error("Reward request is bound to a different program or case.");
  }
  if (request.caseSigningPublicKey !== caseEnvelope.caseSigningPublicKey) {
    throw new Error("Reward request signer does not match the encrypted case.");
  }
}

export function VendorTransactionPreview({ program, caseEnvelope }: Props) {
  const [request, setRequest] = useState<RewardAuthorizationRequest | null>(null);
  const [requestStatus, setRequestStatus] = useState("No reward authorization request imported.");
  const [contract, setContract] = useState("");
  const [reserveAmount, setReserveAmount] = useState("50");
  const [tier, setTier] = useState<1 | 2 | 3>(2);
  const [expiryHours, setExpiryHours] = useState("24");
  const [clarificationCommitment, setClarificationCommitment] = useState("");
  const [preview, setPreview] = useState<unknown[] | null>(null);
  const [error, setError] = useState("");

  async function importRequest(file: File | undefined) {
    setRequest(null); setPreview(null); setError("");
    if (!file) return;
    try {
      if (file.size > 32 * 1024) throw new Error("Reward request exceeds the 32 KiB import limit.");
      const verified = verifyRewardAuthorizationRequest(JSON.parse(await file.text()));
      assertRequestBinding(verified, program, caseEnvelope);
      setRequest(verified);
      setRequestStatus("Valid case-signed reward request. The claim secret is not present.");
    } catch (cause) {
      setRequestStatus("Invalid or mismatched reward authorization request.");
      setError(cause instanceof Error ? cause.message : "Reward request validation failed safely.");
    }
  }

  function buildPreview() {
    setPreview(null); setError("");
    try {
      if (!program || !caseEnvelope || !request) throw new Error("Program, encrypted case, and verified reward request are required.");
      assertRequestBinding(request, program, caseEnvelope);
      const now = BigInt(Math.floor(Date.now() / 1000));
      if (!/^[1-9][0-9]*$/.test(expiryHours)) throw new Error("Expiry hours must be a positive integer.");
      const expiry = now + BigInt(expiryHours) * 3_600n;
      const setup = buildCreateProgramCall({
        contract,
        programId: program.programId,
        encryptionKeyCommitment: program.encryptionKeyCommitment,
        policyCommitment: program.policyCommitment,
        acknowledgementSla: BigInt(program.acknowledgementSla),
        remediationSla: BigInt(program.remediationSla),
        token: program.token,
        tier1: program.rewardTiers[0],
        tier2: program.rewardTiers[1],
        tier3: program.rewardTiers[2],
      });
      const funding = buildFundProgramCalls({
        contract,
        programId: program.programId,
        token: program.token,
        amount: BigInt(parseTokenAmount(reserveAmount)),
      });
      const lifecycle = [
        buildAcknowledgeCall({ contract, programId: program.programId, caseId: request.caseId }),
        ...(clarificationCommitment ? [buildRequestClarificationCall({ contract, programId: program.programId, caseId: request.caseId, requestCommitment: clarificationCommitment })] : []),
        buildDecisionCall({ contract, programId: program.programId, caseId: request.caseId, accepted: true }),
        buildDecisionCall({ contract, programId: program.programId, caseId: request.caseId, accepted: false }),
        buildAuthorizeRewardCall({
          contract,
          programId: program.programId,
          caseId: request.caseId,
          tier,
          claimCommitment: request.claimCommitment,
          expiry,
          requestSignature: request.signature,
        }, now),
      ];
      setPreview([
        { label: "Create program (one-time)", calls: [setup] },
        { label: "Fund exact reserve", calls: funding },
        { label: "Lifecycle alternatives — do not batch", calls: lifecycle },
      ]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Vendor call validation failed safely.");
    }
  }

  return (
    <section className="boundary" id="vendor-transaction-preview">
      <p className="eyebrow">VENDOR TRANSACTION HANDOFF · PREVIEW ONLY</p>
      <h2>Verify the researcher&apos;s claim commitment.<br />Build bounded calls without signing them.</h2>
      <div className="panel receiptPanel">
        <p>Import the researcher&apos;s case-signed reward request. VeilZero verifies its program, case, public key, message binding, and signature before it can enter an authorization call.</p>
        <label htmlFor="reward-request">Reward authorization request <small>JSON, maximum 32 KiB</small></label>
        <input id="reward-request" type="file" accept="application/json,.json" onChange={(event) => void importRequest(event.target.files?.[0])} />
        <p className="mono" aria-live="polite">{requestStatus}</p>
        <label htmlFor="preview-contract">Undeployed VeilZero contract address</label>
        <input id="preview-contract" value={contract} placeholder="0x…" autoComplete="off" onChange={(event) => { setContract(event.target.value); setPreview(null); }} />
        <label htmlFor="preview-reserve">Reserve funding amount <small>18-decimal token units</small></label>
        <input id="preview-reserve" value={reserveAmount} inputMode="decimal" onChange={(event) => { setReserveAmount(event.target.value); setPreview(null); }} />
        <label htmlFor="preview-tier">Reward tier</label>
        <select id="preview-tier" value={tier} onChange={(event) => { setTier(Number(event.target.value) as 1 | 2 | 3); setPreview(null); }}>
          <option value={1}>Tier 1</option><option value={2}>Tier 2</option><option value={3}>Tier 3</option>
        </select>
        <label htmlFor="preview-expiry">Authorization expiry <small>hours from this local preview</small></label>
        <input id="preview-expiry" value={expiryHours} inputMode="numeric" onChange={(event) => { setExpiryHours(event.target.value); setPreview(null); }} />
        <label htmlFor="clarification-commitment">Optional clarification-request commitment</label>
        <input id="clarification-commitment" value={clarificationCommitment} placeholder="Leave empty to omit" autoComplete="off" onChange={(event) => { setClarificationCommitment(event.target.value); setPreview(null); }} />
        <button className="button" disabled={!request || !program || !caseEnvelope} onClick={buildPreview}>Build non-submitting vendor calls</button>
        {error && <p className="error" role="alert">{error}</p>}
        {preview && <pre className="actionPreview" aria-label="Vendor transaction call preview">{JSON.stringify(preview, null, 2)}</pre>}
        <p className="warning">These are mutually exclusive handoff calls, not an executable batch. The address is intentionally undeployed; current chain state, fee estimates, budget checks, wallet prompts, receipts, and event reconciliation are required before each separate human signature.</p>
      </div>
    </section>
  );
}
