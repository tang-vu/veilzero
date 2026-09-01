# Blockers

## Active

- Human browser-wallet signatures are required for every Sepolia/mainnet declaration, deployment, funding and qualifying transaction.
- A current organizer-approved proving/discovery endpoint has not been verified; none is configured.
- Upstream issue #978 documents an anonymizer return-ABI mismatch between current `main` and the live Sepolia pool. Pool/contract compatibility must be proven before deployment.
- Wallet API 0.10.3 resolves `${openNoteIds[0]}` only while preparing the STRK20 call. VeilZero must bind the case-key signature to that resolved destination. A compatible wallet must validate a safe prepare/sign/re-prepare sequence before the claim adapter or any deployment can be called ready.

## Cleared

- GitHub authentication is active as `tang-vu`.
- Product collision audit did not require a pivot.
- No authenticated Vercel CLI was present; GitHub Pages deployed successfully instead.
