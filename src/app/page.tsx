"use client";

import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { WalletWithStarknetFeatures } from "@starknet-io/get-starknet-wallet-standard/features";
import {
  createCasePackage,
  decryptCaseForVendor,
  generateVendorKeyPackage,
  parsePublicCaseEnvelope,
  toPublicCaseEnvelope,
  type CasePackage,
  type PublicCaseEnvelope,
  type VendorKeyPackage,
} from "@/lib/case-crypto";
import { createAuthorshipEvidence } from "@/lib/authorship-evidence";
import { privacyBoundary } from "@/lib/privacy-boundary";
import { classifyChainId, safeWalletError } from "@/lib/wallet-diagnostics";

const phases = ["Submitted", "Acknowledged", "Accepted", "Reward authorized", "Settled"] as const;

export default function Home() {
  const [report, setReport] = useState("");
  const [programKey, setProgramKey] = useState("");
  const [casePackage, setCasePackage] = useState<CasePackage | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [wallets, setWallets] = useState<readonly WalletWithStarknetFeatures[]>([]);
  const [walletStatus, setWalletStatus] = useState("Discovery starts in this browser; no account is connected.");
  const [walletBusy, setWalletBusy] = useState("");
  const [vendorKeys, setVendorKeys] = useState<VendorKeyPackage | null>(null);
  const [vendorPlaintext, setVendorPlaintext] = useState("");
  const [importedEnvelope, setImportedEnvelope] = useState<PublicCaseEnvelope | null>(null);
  const [vendorBusy, setVendorBusy] = useState(false);
  const ready = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const payloadLabel = useMemo(() => casePackage ? `${casePackage.ciphertext.length} encoded characters · ${casePackage.sizeClass}` : "Nothing has left this browser", [casePackage]);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;
    void import("@starknet-io/get-starknet-discovery").then(({ createStore }) => {
      if (!active) return;
      const store = createStore({ eip1193Adapters: [] });
      const update = (next: readonly WalletWithStarknetFeatures[]) => setWallets(next);
      update(store.getWallets());
      unsubscribe = store.subscribe(update);
      store._refreshInjectedWallets();
    });
    return () => { active = false; unsubscribe(); };
  }, []);

  async function probeWallet(wallet: WalletWithStarknetFeatures) {
    if (walletBusy) return;
    setWalletBusy(wallet.name); setWalletStatus("Waiting for wallet approval…");
    try {
      const connection = await wallet.features["standard:connect"].connect();
      if (connection.accounts.length === 0) throw { code: "NO_AUTHORIZED_ACCOUNT" };
      const request = wallet.features["starknet:walletApi"].request;
      const [chainId, specs, walletApis] = await Promise.all([
        request({ type: "wallet_requestChainId" }),
        request({ type: "wallet_supportedSpecs" }),
        request({ type: "wallet_supportedWalletApi" }),
      ]);
      const network = classifyChainId(String(chainId));
      let strk20 = "unavailable";
      try {
        await request({ type: "wallet_strk20Balances", params: { tokens: [] } });
        strk20 = "available; private balance query succeeded";
      } catch { strk20 = "not confirmed (unsupported, unregistered, or declined)"; }
      setWalletStatus(`${wallet.name}: ${network}; Wallet API ${walletApis.join(", ") || "unknown"}; RPC specs ${specs.join(", ") || "unknown"}; STRK20 ${strk20}. No transaction was submitted.`);
    } catch (error) { setWalletStatus(safeWalletError(error)); }
    finally { setWalletBusy(""); }
  }

  async function encrypt(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { setCasePackage(await createCasePackage({ report, programEncryptionKey: programKey || undefined })); setReport(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Encryption failed safely."); }
    finally { setBusy(false); }
  }

  function downloadJson(value: unknown, filename: string) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url;
    anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  }

  function downloadRecovery() {
    if (!casePackage) return;
    downloadJson(casePackage, `veilzero-recovery-${casePackage.caseCommitment.slice(0, 12)}.json`);
  }

  function downloadPublicEnvelope() {
    if (!casePackage || casePackage.algorithm !== "X25519-HKDF-SHA256+A256GCM") return;
    const envelope = toPublicCaseEnvelope(casePackage);
    downloadJson(envelope, `veilzero-case-envelope-${envelope.caseCommitment.slice(0, 12)}.json`);
  }

  function downloadAuthorshipEvidence() {
    if (!casePackage) return;
    const proof = createAuthorshipEvidence(casePackage, `VeilZero public authorship receipt ${casePackage.caseCommitment}`);
    downloadJson(proof, `veilzero-authorship-${casePackage.caseCommitment.slice(0, 12)}.json`);
  }

  async function generateVendorKeys() {
    if (vendorBusy) return;
    setVendorBusy(true); setError(""); setVendorPlaintext("");
    try {
      const generated = await generateVendorKeyPackage();
      setVendorKeys(generated); setProgramKey(generated.publicKey);
    } catch { setError("This browser does not provide the required X25519 WebCrypto support."); }
    finally { setVendorBusy(false); }
  }

  async function decryptAsVendor() {
    const envelope = importedEnvelope ?? (casePackage?.algorithm === "X25519-HKDF-SHA256+A256GCM" ? toPublicCaseEnvelope(casePackage) : null);
    if (!envelope || !vendorKeys || vendorBusy) return;
    setVendorBusy(true); setError("");
    try { setVendorPlaintext(await decryptCaseForVendor(envelope, vendorKeys)); }
    catch { setError("Vendor decryption failed safely. Check that the case used this program key."); }
    finally { setVendorBusy(false); }
  }

  async function importEnvelope(file: File | undefined) {
    if (!file) return;
    setError(""); setVendorPlaintext("");
    try {
      if (file.size > 64 * 1024) throw new Error("Envelope exceeds the 64 KiB import limit.");
      setImportedEnvelope(parsePublicCaseEnvelope(JSON.parse(await file.text())));
    } catch { setImportedEnvelope(null); setError("Encrypted case import failed validation."); }
  }

  return (
    <main>
      <nav><span className="brand"><i /> VEILZERO</span><span className="network"><b /> READ-ONLY DEMO · NO WALLET</span></nav>
      <section className="hero">
        <p className="eyebrow">COORDINATED DISCLOSURE, WITHOUT THE IDENTITY LEAK</p>
        <h1>Report the critical bug.<br /><em>Keep the researcher out of the blast radius.</em></h1>
        <p className="lede">Encrypted reports. Cryptographic authorship. Deadlines a vendor cannot quietly rewrite. Fixed-tier rewards settled through STRK20.</p>
        <div className="heroActions"><a className="button primary" href="#submit">Create encrypted case</a><a className="button" href="#boundary">Inspect privacy boundary</a></div>
        <div className="statusline"><span>IMPLEMENTED <strong>Browser encryption</strong></span><span>TESTED <strong>Destination-bound claims</strong></span><span>BLOCKED <strong>Live wallet validation</strong></span></div>
      </section>

      <section className="workflow" id="vendor-program">
        <div className="panel casePanel">
          <header><span>VENDOR PROGRAM</span><span>LOCAL KEY CONTROL</span></header>
          <h2>Publish a key without giving VeilZero the private half.</h2>
          <p>Generate an X25519 program key in this browser. Only the public key is copied into the researcher form; the private package is downloaded directly and never persisted.</p>
          <div className="heroActions">
            <button className="button primary" disabled={vendorBusy} onClick={() => void generateVendorKeys()}>{vendorBusy ? "Working…" : "Generate program key"}</button>
            <button className="button" disabled={!vendorKeys} onClick={() => vendorKeys && downloadJson(vendorKeys, `veilzero-vendor-key-${Date.now()}.json`)}>Download private key package</button>
          </div>
          <p className="mono">{vendorKeys?.publicKey ?? "No program key generated."}</p>
          <p className="warning">The vendor key package decrypts every report for this program. Store it offline; never commit or share it.</p>
        </div>
        <aside className="panel receiptPanel">
          <header><span>VENDOR DECRYPTION</span><span>{vendorPlaintext ? "DECRYPTED LOCALLY" : "WAITING"}</span></header>
          <p>Import a researcher&apos;s public encrypted envelope, or use the one created below. Parsing, key agreement, and decryption stay in this browser.</p>
          <label htmlFor="case-envelope">Encrypted case envelope <small>JSON, maximum 64 KiB</small></label>
          <input id="case-envelope" type="file" accept="application/json,.json" onChange={(event) => void importEnvelope(event.target.files?.[0])} />
          <p className="mono">{importedEnvelope ? `Parsed ${importedEnvelope.caseCommitment}; commitment is checked before decryption.` : "No imported envelope."}</p>
          <button className="button" disabled={(!importedEnvelope && (!casePackage || casePackage.algorithm !== "X25519-HKDF-SHA256+A256GCM")) || !vendorKeys || vendorBusy} onClick={() => void decryptAsVendor()}>Decrypt encrypted case</button>
          <p className="mono" aria-live="polite">{vendorPlaintext || "No plaintext displayed."}</p>
        </aside>
      </section>

      <section className="workflow" id="submit">
        <div className="panel casePanel">
          <header><span>RESEARCHER CONSOLE</span><span>LOCAL-FIRST</span></header>
          <h2>Open a case without opening your identity.</h2>
          <p>The plaintext below is encrypted locally. This public demo does not submit a transaction and never reports a fake success.</p>
          <form onSubmit={encrypt}>
            <label htmlFor="program-key">Program encryption public key <small>Optional in diagnostic demo</small></label>
            <input id="program-key" value={programKey} onChange={(event) => setProgramKey(event.target.value)} placeholder="age/X25519 key published by vendor" autoComplete="off" />
            <label htmlFor="report">Vulnerability report <small>Never logged or persisted</small></label>
            <textarea id="report" value={report} onChange={(event) => setReport(event.target.value)} placeholder="Impact, affected component, reproduction, recommended fix…" required minLength={20} maxLength={16384} />
            <button className="button primary" disabled={busy || !ready}>{busy ? "Encrypting…" : "Encrypt and bind case"}</button>
            {error && <p className="error" role="alert">{error}</p>}
          </form>
        </div>
        <aside className="panel receiptPanel">
          <header><span>CASE RECEIPT</span><span>{casePackage ? "GENERATED" : "WAITING"}</span></header>
          <dl>
            <div><dt>Payload</dt><dd>{payloadLabel}</dd></div>
            <div><dt>Case commitment</dt><dd className="mono">{casePackage?.caseCommitment ?? "—"}</dd></div>
            <div><dt>Report commitment</dt><dd className="mono">{casePackage?.reportCommitment ?? "—"}</dd></div>
            <div><dt>Ciphertext commitment</dt><dd className="mono">{casePackage?.ciphertextCommitment ?? "—"}</dd></div>
            <div><dt>Case signing key</dt><dd className="mono">{casePackage?.caseSigningPublicKey ?? "—"}</dd></div>
            <div><dt>Network state</dt><dd>Not submitted</dd></div>
          </dl>
          <button className="button" disabled={!casePackage} onClick={downloadRecovery}>Export recovery package</button>
          <button className="button" disabled={!casePackage || casePackage.algorithm !== "X25519-HKDF-SHA256+A256GCM"} onClick={downloadPublicEnvelope}>Export encrypted case</button>
          <button className="button" disabled={!casePackage} onClick={downloadAuthorshipEvidence}>Export public authorship proof</button>
          <p className="warning">The recovery package contains secret material. Store it offline; never send it to the vendor or commit it.</p>
        </aside>
      </section>

      <section className="lifecycle">
        <p className="eyebrow">ON-CHAIN CASE LIFECYCLE</p><h2>Commitments force the process into daylight.<br />The report stays in the dark.</h2>
        <div className="steps">{phases.map((phase, index) => <div className={index === 0 ? "step active" : "step"} key={phase}><span>0{index + 1}</span><strong>{phase}</strong><small>{index === 0 ? "Report + ciphertext commitments" : index === 1 ? "Acknowledgement clock stops" : index === 2 ? "Fixed reward tier is bound" : index === 3 ? "One-time nullifier issued" : "Shielded note returned"}</small></div>)}</div>
      </section>

      <section className="boundary" id="wallet-diagnostics">
        <p className="eyebrow">DEVELOPER DIAGNOSTIC · READ ONLY</p><h2>Probe the wallet before trusting a transaction path.</h2>
        <div className="panel receiptPanel">
          <p>Discovery follows the current Wallet Standard. A probe may request account permission, then reads chain, supported API versions, and STRK20 balance capability. It never signs or submits.</p>
          <div className="heroActions">
            {wallets.length === 0 ? <span>No compatible Starknet wallet detected.</span> : wallets.map((wallet) => <button className="button" key={wallet.name} disabled={Boolean(walletBusy)} onClick={() => void probeWallet(wallet)}>{walletBusy === wallet.name ? "Probing…" : `Probe ${wallet.name}`}</button>)}
          </div>
          <p className="mono" aria-live="polite">{walletStatus}</p>
        </div>
      </section>

      <section className="boundary" id="boundary">
        <p className="eyebrow">PRIVACY BOUNDARY</p><h2>Precise claims, not privacy theatre.</h2>
        <div className="boundaryGrid">{privacyBoundary.map((group) => <article className={`panel ${group.kind}`} key={group.title}><h3>{group.title}</h3><ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul></article>)}</div>
        <p className="boundaryNote">Timing, amount patterns, browser/network metadata, and low anonymity-set activity can still correlate actions. Shield deposits are public. VeilZero is unaudited experimental software.</p>
      </section>

      <footer><span className="brand"><i /> VEILZERO</span><span>Apache-2.0 · Built in public for STRK20 Private Sprint</span><a href="https://github.com/tang-vu/veilzero">Source & evidence ↗</a></footer>
    </main>
  );
}
