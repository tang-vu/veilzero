# Mainnet runbook

No agent signs or submits a mainnet write. Before each browser-wallet action: verify chain ID, pool address and ABI from current official sources; read the live pool fee; estimate network fee; update the cost ledger; ensure cumulative actual+projected cost is below 100 STRK; simulate; present the human gate; reconcile the receipt before another action.

Qualification sequence: private case submission through pool→VeilZero, private case clarification through pool→VeilZero, and reward claim through pool→VeilZero returning an open note. Shield/funding/administrator calls are supporting evidence only.

Ambiguous receipt means stop. Never retry until transaction lookup and case/nullifier state prove the first attempt absent or failed.
