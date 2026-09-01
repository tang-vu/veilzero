# Blockers

## Active

- Human browser-wallet signatures are required for every Sepolia/mainnet declaration, deployment, funding and qualifying transaction.
- The implemented Wallet API 0.10.3 estimation-preview/sign/re-prepare adapter has local drift, proof-completeness and transaction-version tests, but still requires a compatible live wallet and pool to validate marker visibility and stable note resolution before deployment can be called ready.
- A real three-minute video requires the human-signed deployed flow and remains unrecorded.

## Exact continuation

After a Ready/Xverse-compatible wallet confirms the live prepare/sign/re-prepare behavior, rebuild and re-verify the unchanged release candidate:

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

Immediately before any deployment/signing gate, set a current process-scoped RPC and rerun `pnpm probe:pool`; compare its address, class hash, ABI surface and fee with `docs/evidence/live-pool-probe.md`.

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
- The official helper documentation and the live mainnet pool ABI both require the single `Span<OpenNoteDeposit>` return VeilZero implements. The mainnet pool observation is recorded in `docs/evidence/live-pool-probe.md`; upstream issue #978 remains relevant only as an upgrade/version warning.
- The primary dapp route does not need an application-configured prover or discovery URL: current official Wallet API guidance assigns keys, notes, discovery and proving to the connected privacy wallet. No endpoint is guessed or added to VeilZero.
