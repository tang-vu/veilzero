# Read-only deployment readiness

VeilZero has a deterministic deployment-plan generator. It verifies the pinned Sierra/CASM class hashes, block-pins the mainnet pool and UDC reads, checks the pool ABI surface, reads the current pool fee and checks declaration state without requiring an account. When supplied a **public** deployer address, the same run additionally derives one unique UDC deployment call bound to that address and the live pool.

It never asks for a private key, contacts a wallet, estimates a fee, signs, or submits.

## Latest diagnostic

On 2026-09-01, the reserve-custody release candidate was checked in a read-only run against Starknet mainnet block `14208014`, which observed:

- chain ID `SN_MAIN`;
- compatible `legacy-global-screening` pool surface;
- pool fee `6 STRK`;
- pinned VeilZero class not yet declared;
- canonical UDC `0x02ceed65a4bd731034c01113685c831b01c15d7d432f71afb1cf1634b53a2125`.

The run used dummy deployer address `0x123`. Its predicted contract address is a test fixture, not a deployment address or evidence, and is intentionally excluded from `strk20.json`.

The current case-signed reward-authorization class hash is `0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503`. Its artifact identity and deployment generator pass.

On 2026-09-02, an address-free readiness run at mainnet block `14235648` (`0x038d40ac072e0e2df1efb4cf7543fa12c329360c77346d36c68e5870361ff7e8`, timestamp `2026-09-02T05:40:21Z`) reconfirmed the compatible pool and 6 STRK fee, read canonical UDC class `0x01b2df6d8861670d4a8ca4670433b2418d78169c2947f46dc614e69f333745c8`, and found the current VeilZero class **undeclared**. No dummy deployer was used and `deployment` was explicitly `null`. This clears current artifact/pool/UDC/declaration discovery; it is not an address-specific plan or authorization.

On 2026-09-03, the address-free readiness check repeated at mainnet block `14285506` (`0x06312707dfc168092a14c1af386e449bd7a9312e4cecaef2dd93e1ecff712a66`, timestamp `2026-09-03T05:14:18Z`). It reproduced the pinned artifact hashes, compatible pool/class and 6 STRK fee, canonical UDC class, and undeclared VeilZero class. Output again contained `deployerAddressRequired: true` and `deployment: null`; no address, estimate, signature or transaction was fabricated.

To repeat readiness without an account, omit `VEILZERO_DEPLOYER_ADDRESS`. The output status is `READ_ONLY_DEPLOYMENT_READINESS`, includes `deployerAddressRequired: true`, and contains no predicted deployment address.

## Generate an address-specific plan

Build and verify the release artifact first, then use a current process-scoped RPC and the dedicated browser wallet's public account address:

```powershell
Set-Location contracts
scarb build
Set-Location ..
pnpm verify:artifact
$env:STARKNET_RPC_URL = '<current-mainnet-rpc>'
$env:STRK20_POOL_ADDRESS = '<freshly-verified-live-pool>'
pnpm prepare:deployment
```

Then set the dedicated browser wallet's public address and repeat only when deriving the exact plan:

```powershell
$env:VEILZERO_DEPLOYER_ADDRESS = '<dedicated-wallet-public-address>'
pnpm prepare:deployment
```

The output is a plan, not authorization. Immediately before a human gate, the browser wallet must estimate declaration/deployment network fees, the live pool fee must be re-read, and projected plus actual cost must remain below 100 STRK.
