import { useState } from "react";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import type { CasePackage } from "@/lib/case-crypto";
import type { PublicProgramManifest } from "@/lib/program-manifest";
import { CLAIM_WALLET_API_VERSION, validateLiveClaimPreparation } from "@/lib/claim-preparation-validation";
import { ClaimPreparationError } from "@/lib/strk20-claim";
import { safeWalletError, type NetworkClassification } from "@/lib/wallet-diagnostics";

type Props = {
  wallet: WalletWithStarknetFeatures | null;
  account: string;
  network: NetworkClassification | null;
  walletApis: readonly string[];
  program: PublicProgramManifest | null;
  casePackage: CasePackage | null;
};

export function ClaimPreparationValidation({ wallet, account, network, walletApis, program, casePackage }: Props) {
  const [pool, setPool] = useState("");
  const [contract, setContract] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Not run. No proof has been requested.");
  const [error, setError] = useState("");
  const supported = walletApis.includes(CLAIM_WALLET_API_VERSION);
  const ready = Boolean(wallet && account && pool && contract && program && casePackage && confirmed && supported && network === "mainnet");

  async function runValidation() {
    if (!wallet || !program || !casePackage || busy) return;
    setBusy(true);
    setError("");
    setStatus("Wallet is preparing an estimation preview and one real proof. Nothing will be submitted.");
    try {
      await validateLiveClaimPreparation({
        pool,
        token: program.token,
        contract,
        programId: program.programId,
        caseId: casePackage.caseCommitment,
        claimSecret: casePackage.claimSecret,
        caseSigningPrivateKey: casePackage.caseSigningPrivateKey,
        connectedAccount: account,
        supportedWalletApis: walletApis,
        caseProgramKeyBinding: casePackage.programKeyBinding,
        programEncryptionKeyCommitment: program.encryptionKeyCommitment,
      }, wallet.features["starknet:walletApi"].request);
      setStatus("Passed: pool target, marker visibility, note stability, and proof completeness matched. The proof was discarded; no transaction was submitted.");
    } catch (cause) {
      setStatus("Validation did not pass. No transaction was submitted.");
      setError(cause instanceof ClaimPreparationError ? cause.message : safeWalletError(cause));
    } finally {
      setBusy(false);
    }
  }

  function invalidate() {
    setStatus("Not run. No proof has been requested.");
    setError("");
  }

  return (
    <div className="liveValidation">
      <h3>Live prepare/sign/re-prepare validation</h3>
      <p>This prepare-only harness is for an already deployed helper and authorized case. It rechecks mainnet and the connected account, pins Wallet API {CLAIM_WALLET_API_VERSION}, requires the wallet&apos;s assembled call to target the freshly verified pool, and never calls a submission method.</p>
      <label htmlFor="validation-pool">Freshly verified privacy pool address</label>
      <input id="validation-pool" value={pool} placeholder="0x…" autoComplete="off" onChange={(event) => { setPool(event.target.value); invalidate(); }} />
      <label htmlFor="validation-contract">Deployed VeilZero helper address</label>
      <input id="validation-contract" value={contract} placeholder="0x…" autoComplete="off" onChange={(event) => { setContract(event.target.value); invalidate(); }} />
      <label className="confirmation" htmlFor="validation-confirmed">
        <input id="validation-confirmed" type="checkbox" checked={confirmed} onChange={(event) => { setConfirmed(event.target.checked); invalidate(); }} />
        I confirmed the pool, helper deployment, authorized case, and current account. I understand proof generation may contact wallet-managed proving/discovery services.
      </label>
      <button className="button" disabled={!ready || busy} onClick={() => void runValidation()}>{busy ? "Preparing proof…" : "Run prepare-only validation"}</button>
      {!wallet && <p className="warning">Connect through the wallet probe before running this validation.</p>}
      {wallet && network !== "mainnet" && <p className="warning">This release-candidate check requires Starknet mainnet.</p>}
      {wallet && !supported && <p className="warning">The selected wallet did not advertise Wallet API {CLAIM_WALLET_API_VERSION}.</p>}
      {(!program || !casePackage) && <p className="warning">Generate a bound program manifest and local case in this browser before preparing its claim.</p>}
      {error && <p className="error" role="alert">{error}</p>}
      <p className="mono" aria-live="polite">{status}</p>
      <p className="warning">A passing prepare test is not a transaction, receipt, fee estimate, or claim. It intentionally discards the proof and does not expose the resolved note ID.</p>
    </div>
  );
}
