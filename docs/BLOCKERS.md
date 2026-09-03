# Blockers

## Active

- The accepted upstream registry still contains the wrong Telegram contact. Official issue `starkience/strk20-hackathon#272` requests the maintainer-only in-place correction to `hanhgia2212`; do not claim it is fixed until upstream `main` changes.
- Human browser-wallet signatures are required for every Sepolia/mainnet declaration, deployment, funding and qualifying transaction.
- The implemented Wallet API 0.10.3 estimation-preview/sign/re-prepare adapter and browser harness have local API/account/network, pool-target, empty-preview, marker, drift, proof-completeness and transaction-version tests. Live validation still requires a compatible wallet, deployed helper and authorized case. This blocks claim submission, not the initial helper deployment that makes the validation executable.
- The current case-signed reward-authorization class is built and identity-pinned; a fresh address-free read at mainnet block `14285506` reconfirmed the pool/UDC and found the class undeclared. The exact unique UDC address and wallet fee estimates still require the dedicated wallet's public address. No dummy address is promoted to evidence.
- The machine budget inventory currently has 18 STRK of known pool fees and 12 explicit `awaiting-wallet-estimate` entries. `pnpm verify:budget` passes the honest incomplete ledger, while `pnpm gate:budget` blocks every signing gate until all costs are explicit and the total remains below 100 STRK.
- A real three-minute video requires the human-signed deployed flow and remains unrecorded.

## Exact continuation

Before the initial human deployment gate, rebuild and re-verify the unchanged release candidate:

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

The address-free readiness check can be repeated with only the first two variables. With the dedicated wallet's public address, generate the exact read-only declaration/deployment plan:

```powershell
$env:STARKNET_RPC_URL = '<verified-mainnet-rpc>'
$env:STRK20_POOL_ADDRESS = '<verified-live-pool>'
$env:VEILZERO_DEPLOYER_ADDRESS = '<dedicated-wallet-public-address>'
pnpm prepare:deployment
```

Do not treat the predicted address as deployed evidence. Fee estimation and both signatures remain browser-wallet human gates.

After the helper is deployed and a matching program/case/reward authorization exists, use the browser diagnostic panel to run **Run prepare-only validation**. Enter only the freshly verified public pool and deployed helper addresses. The harness must report stable marker resolution and complete proof output while retaining no proof and submitting no transaction. A pass is a prerequisite for the separate claim signing gate, not transaction evidence.

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
- Reload no longer strands the local vendor/researcher flow: bounded strict importers restore and cross-check public manifests, vendor X25519 key pairs and authenticated recovery v3 packages in browser memory. Secret-file loss or theft remains an explicit operational risk, not an implementation blocker.
