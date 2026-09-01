# Transaction reconciliation

VeilZero records only the minimum public metadata needed to prevent ambiguous retries across a browser reload: transaction hash, network, fixed action label, optional public contract address, and submission timestamp. It never stores calldata, proofs, case material, keys, or plaintext.

Before recording a second hash, the previous entry must reach a terminal receipt. Reconciliation requires:

- a syntactically valid receipt transaction hash matching the recorded hash;
- `execution_status: SUCCEEDED` and an accepted finality status for success; or
- `execution_status: REVERTED` for terminal failure.

Timeouts, missing receipts, malformed or mismatched hashes, incomplete status fields, and RPC errors remain `ambiguous`. The pending journal is preserved and resubmission remains disabled. Malformed local journal data is discarded rather than used as authorization or evidence.

The journal is operational retry protection, not hackathon evidence. A transaction enters `strk20.json` only after the independent mainnet evidence verifier confirms the pool, VeilZero contract, event and state transition.
