# Mainnet runbook

No agent signs or submits a mainnet write. Before each browser-wallet action: verify chain ID, pool address and ABI from current official sources; read the live pool fee; estimate network fee; update the cost ledger; ensure cumulative actual+projected cost is below 100 STRK; simulate; present the human gate; reconcile the receipt before another action.

Qualification sequence: private case submission through pool→VeilZero, private case clarification through pool→VeilZero, and reward claim through pool→VeilZero returning an open note. Shield/funding/administrator calls are supporting evidence only.

Authorization never publishes the raw claim secret. The vendor stores `Poseidon(VZ_CLAIM_AUTH_V1, program, case, secret)`. The final claim reveals the one-time secret and passes a case-key signature over `Poseidon(VZ_CLAIM_MSG_V1, program, case, secret, note_id)`. Do not sign a claim until the wallet has produced the exact destination note identifier used by the invocation.

Deployment gate: `prepareDestinationBoundClaim` first calls `wallet_strk20PrepareInvoke(..., true)`. The contract accepts its zero signature only at transaction version `2^128 + 3`; two contract-checked markers surround the resolved note ID. The client signs that ID, calls `wallet_strk20PrepareInvoke(..., false)`, then rejects note drift or an incomplete proof. Before enabling a claim, validate this implementation with the chosen live wallet and pool. Never log or persist either prepared proof.

Ambiguous receipt means stop. Never retry until transaction lookup and case/nullifier state prove the first attempt absent or failed.
