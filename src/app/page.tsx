"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";
import { createCasePackage, type CasePackage } from "@/lib/case-crypto";
import { privacyBoundary } from "@/lib/privacy-boundary";

const phases = ["Submitted", "Acknowledged", "Accepted", "Reward authorized", "Settled"] as const;

export default function Home() {
  const [report, setReport] = useState("");
  const [programKey, setProgramKey] = useState("");
  const [casePackage, setCasePackage] = useState<CasePackage | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const payloadLabel = useMemo(() => casePackage ? `${casePackage.ciphertext.length} encoded characters · ${casePackage.sizeClass}` : "Nothing has left this browser", [casePackage]);

  async function encrypt(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { setCasePackage(await createCasePackage({ report, programEncryptionKey: programKey || undefined })); setReport(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Encryption failed safely."); }
    finally { setBusy(false); }
  }

  function downloadRecovery() {
    if (!casePackage) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(casePackage, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a"); anchor.href = url;
    anchor.download = `veilzero-recovery-${casePackage.caseCommitment.slice(0, 12)}.json`; anchor.click(); URL.revokeObjectURL(url);
  }

  return (
    <main>
      <nav><span className="brand"><i /> VEILZERO</span><span className="network"><b /> READ-ONLY DEMO · NO WALLET</span></nav>
      <section className="hero">
        <p className="eyebrow">COORDINATED DISCLOSURE, WITHOUT THE IDENTITY LEAK</p>
        <h1>Report the critical bug.<br /><em>Keep the researcher out of the blast radius.</em></h1>
        <p className="lede">Encrypted reports. Cryptographic authorship. Deadlines a vendor cannot quietly rewrite. Fixed-tier rewards settled through STRK20.</p>
        <div className="heroActions"><a className="button primary" href="#submit">Create encrypted case</a><a className="button" href="#boundary">Inspect privacy boundary</a></div>
        <div className="statusline"><span>IMPLEMENTED <strong>Browser encryption</strong></span><span>TESTED <strong>Case commitments</strong></span><span>BLOCKED <strong>Mainnet wallet signature</strong></span></div>
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
            <div><dt>Network state</dt><dd>Not submitted</dd></div>
          </dl>
          <button className="button" disabled={!casePackage} onClick={downloadRecovery}>Export recovery package</button>
          <p className="warning">The recovery package contains secret material. Store it offline; never send it to the vendor or commit it.</p>
        </aside>
      </section>

      <section className="lifecycle">
        <p className="eyebrow">ON-CHAIN CASE LIFECYCLE</p><h2>Commitments force the process into daylight.<br />The report stays in the dark.</h2>
        <div className="steps">{phases.map((phase, index) => <div className={index === 0 ? "step active" : "step"} key={phase}><span>0{index + 1}</span><strong>{phase}</strong><small>{index === 0 ? "Report hash + bounded ciphertext" : index === 1 ? "Acknowledgement clock stops" : index === 2 ? "Fixed reward tier is bound" : index === 3 ? "One-time nullifier issued" : "Shielded note returned"}</small></div>)}</div>
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
