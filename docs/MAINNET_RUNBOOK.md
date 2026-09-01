# Mainnet runbook

No agent signs or submits a mainnet write. Before each browser-wallet action: verify chain ID, pool address and ABI from current official sources; read the live pool fee; estimate network fee; update the cost ledger; ensure cumulative actual+projected cost is below 100 STRK; simulate; present the human gate; reconcile the receipt before another action.

Qualification sequence: private case submission through pool→VeilZero, private case clarification through pool→VeilZero, and reward claim through pool→VeilZero returning an open note. Shield/funding/administrator calls are supporting evidence only.

Authorization never publishes the raw claim secret. The vendor stores `Poseidon(VZ_CLAIM_AUTH_V1, program, case, secret)`. The final claim reveals the one-time secret and passes a case-key signature over `Poseidon(VZ_CLAIM_MSG_V1, program, case, secret, note_id)`. Do not sign a claim until the wallet has produced the exact destination note identifier used by the invocation.

Deployment gate: Wallet API 0.10.3 accepts `${openNoteIds[0]}` in application actions and returns a resolved call from `wallet_strk20PrepareInvoke`. Before enabling a claim, validate with the chosen wallet that a simulated prepare can expose the candidate ID and that a subsequent proof-producing prepare resolves the identical ID after the case-key signature is inserted. Abort and discard the proof on any mismatch. This adapter is not implemented or claimed working yet.

Ambiguous receipt means stop. Never retry until transaction lookup and case/nullifier state prove the first attempt absent or failed.
