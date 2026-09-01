# Read-only deployment readiness

VeilZero has a deterministic deployment-plan generator. It verifies the pinned Sierra/CASM class hashes, block-pins the mainnet pool and UDC reads, checks the pool ABI surface, reads the current pool fee, checks declaration state, and derives one unique UDC deployment call bound to the live pool and a supplied **public** deployer address.

It never asks for a private key, contacts a wallet, estimates a fee, signs, or submits.

## Latest diagnostic

On 2026-09-01, the reserve-custody release candidate was checked in a read-only run against Starknet mainnet block `14208014`, which observed:

- chain ID `SN_MAIN`;
- compatible `legacy-global-screening` pool surface;
- pool fee `6 STRK`;
- pinned VeilZero class not yet declared;
- canonical UDC `0x02ceed65a4bd731034c01113685c831b01c15d7d432f71afb1cf1634b53a2125`.

The run used dummy deployer address `0x123`. Its predicted contract address is a test fixture, not a deployment address or evidence, and is intentionally excluded from `strk20.json`.

The current case-signed reward-authorization class hash is `0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503`. Its artifact identity and deployment generator pass, but it has not been checked against live declaration state with the dedicated wallet's public address. The prior block-pinned run is historical compatibility evidence, not a deployment plan for the new class.

## Generate an address-specific plan

Build and verify the release artifact first, then use a current process-scoped RPC and the dedicated browser wallet's public account address:

```powershell
Set-Location contracts
scarb build
Set-Location ..
pnpm verify:artifact
$env:STARKNET_RPC_URL = '<current-mainnet-rpc>'
$env:STRK20_POOL_ADDRESS = '<freshly-verified-live-pool>'
$env:VEILZERO_DEPLOYER_ADDRESS = '<dedicated-wallet-public-address>'
pnpm prepare:deployment
```

The output is a plan, not authorization. Immediately before a human gate, the browser wallet must estimate declaration/deployment network fees, the live pool fee must be re-read, and projected plus actual cost must remain below 100 STRK.
