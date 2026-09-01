# Blockers

## Active

- Human browser-wallet signatures are required for every Sepolia/mainnet declaration, deployment, funding and qualifying transaction.
- A current organizer-approved proving/discovery endpoint has not been verified; none is configured.
- Upstream issue #978 documents an anonymizer return-ABI mismatch between current `main` and the live Sepolia pool. Pool/contract compatibility must be proven before deployment.
- The implemented Wallet API 0.10.3 estimation-preview/sign/re-prepare adapter has local drift, proof-completeness and transaction-version tests, but still requires a compatible live wallet and pool to validate marker visibility and stable note resolution before deployment can be called ready.

## Exact continuation

After an organizer-approved prover/discovery route and compatible pool ABI are confirmed, rebuild and re-verify the unchanged release candidate:

```powershell
pnpm install --frozen-lockfile --ignore-scripts
pnpm check
pnpm test:e2e
Set-Location contracts
scarb fmt --check
scarb build
scarb test
Set-Location ..
pnpm verify:artifact
pnpm scan:secrets
pnpm verify:strk20
```

After human-signed qualifying transactions have final accepted receipts, place the three candidate hashes and deployed address into the local `strk20.json`, then set the evidence variables and reconcile before committing that file:

```powershell
$env:STARKNET_RPC_URL = '<verified-mainnet-rpc>'
$env:STRK20_POOL_ADDRESS = '<verified-live-pool>'
$env:VEILZERO_CONTRACT_ADDRESS = '<human-deployed-address>'
$env:VEILZERO_PROGRAM_ID = '<created-program-id>'
$env:VEILZERO_CASE_ID = '<submitted-case-id>'
pnpm verify:evidence
pnpm verify:strk20
```

Values in angle brackets are deliberately unresolved external evidence, not defaults. Never place an RPC secret in a tracked file or shell history; use a temporary process-scoped environment value and clear it after verification.

## Cleared

- GitHub authentication is active as `tang-vu`.
- Product collision audit did not require a pivot.
- No authenticated Vercel CLI was present; GitHub Pages deployed successfully instead.
