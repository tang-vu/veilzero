# Mainnet runbook

No agent signs or submits a mainnet write. Before each browser-wallet action: verify chain ID, pool address and ABI from current official sources; read the live pool fee; estimate network fee; update the cost ledger; ensure cumulative actual+projected cost is below 100 STRK; simulate; present the human gate; reconcile the receipt before another action.

Current read-only candidate: pool `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`, observed class `0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d` and fee 6 STRK at block `14205166`. These are observations, not permanent configuration. Run `pnpm probe:pool` against a current mainnet RPC before every gate and stop on any mismatch or unknown surface.

Qualification sequence: private case submission through pool→VeilZero, private case clarification through pool→VeilZero, and reward claim through pool→VeilZero returning an open note. Shield/funding/administrator calls are supporting evidence only.

Authorization never publishes the raw claim secret. The vendor stores `Poseidon(VZ_CLAIM_AUTH_V1, program, case, secret)`. The final claim reveals the one-time secret and passes a case-key signature over `Poseidon(VZ_CLAIM_MSG_V1, program, case, secret, note_id)`. Do not sign a claim until the wallet has produced the exact destination note identifier used by the invocation.

Deployment gate: `prepareDestinationBoundClaim` first calls `wallet_strk20PrepareInvoke(..., true)`. The contract accepts its zero signature only at transaction version `2^128 + 3`; two contract-checked markers surround the resolved note ID. The client signs that ID, calls `wallet_strk20PrepareInvoke(..., false)`, then rejects note drift or an incomplete proof. Before enabling a claim, validate this implementation with the chosen live wallet and pool. Never log or persist either prepared proof.

Ambiguous receipt means stop. Never retry until transaction lookup and case/nullifier state prove the first attempt absent or failed.

The release-candidate build identity is recorded in `docs/evidence/contract-artifact.md` and checked with `pnpm verify:artifact`. A matching class hash proves only artifact identity. It does not prove declaration, deployment, pool compatibility, or transaction execution. Before any declaration, rebuild from the exact release commit and rerun the verifier; any source or dependency change requires recording new hashes.

After obtaining only the dedicated browser wallet's public address, generate a block-pinned declaration/deployment bundle with `pnpm prepare:deployment`. The required process-scoped inputs are `STARKNET_RPC_URL`, `STRK20_POOL_ADDRESS`, and `VEILZERO_DEPLOYER_ADDRESS`. Review the declared/not-declared result, expected unique UDC address and constructor pool binding. This command is read-only and deliberately does not estimate fees; obtain fresh wallet estimates before presenting either human signing gate.
