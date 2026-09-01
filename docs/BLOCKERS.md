# Blockers

## Active

- Human browser-wallet signatures are required for every Sepolia/mainnet declaration, deployment, funding and qualifying transaction.
- A current organizer-approved proving/discovery endpoint has not been verified; none is configured.
- Upstream issue #978 documents an anonymizer return-ABI mismatch between current `main` and the live Sepolia pool. Pool/contract compatibility must be proven before deployment.
- The implemented Wallet API 0.10.3 estimation-preview/sign/re-prepare adapter has local drift, proof-completeness and transaction-version tests, but still requires a compatible live wallet and pool to validate marker visibility and stable note resolution before deployment can be called ready.

## Cleared

- GitHub authentication is active as `tang-vu`.
- Product collision audit did not require a pivot.
- No authenticated Vercel CLI was present; GitHub Pages deployed successfully instead.
