# Live STRK20 pool probe

Status: **read-only mainnet evidence; no transaction was signed or submitted**.

The official build page identifies the STRK20 pool as live on Starknet mainnet and directs private dapps to the Starknet Wallet API. The official STRK20-by-Example helper documentation requires exactly one `Span<OpenNoteDeposit>` return with no trailing data. AVNU SDK 4.2.0, which that documentation names for the live private-swap path, exports these pool constants:

- Mainnet: `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`
- Sepolia: `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`

Sources inspected on 2026-09-01:

- https://strk20.starknet.io/build
- https://strk20-by-example.org/helpers/privacy-invoke
- https://strk20-by-example.org/starknet-wallet-api/overview
- `@avnu/avnu-sdk@4.2.0` published `dist/index.d.ts`

## Mainnet observation

At Starknet block `14205166` (`0xd10e0199f92914cd0158663568498d5dfeacd4507e5a2f6058445a205399dd`, timestamp `2026-09-01T15:14:28Z`), a read-only RPC probe returned:

| Field | Value |
| --- | --- |
| Chain | `SN_MAIN` |
| Pool class hash | `0x067dddd89d80fedadc06b6f160798f94800a4a70164e5a24301cd0d6076b554d` |
| Pool version | `2.0` |
| `apply_actions` screening surface | Global `Option<ScreeningAttestation>` |
| Protocol fee | `6000000000000000000` wei = **6 STRK** |
| Fee collector | `0x0d79041634625e5288296fbc648088788710ba44903a3a49468a66567749e77` |
| Proof-validity window | 450 blocks |

The on-chain ABI is on the legacy global-screening side described by upstream issue #978. That surface and the official helper documentation both match VeilZero's single `Span<OpenNoteDeposit>` return. This clears the previously suspected return-shape incompatibility for the observed mainnet pool, but the pool is upgradeable: rerun the probe immediately before declaration and every human signing gate.

```powershell
$env:STARKNET_RPC_URL = '<current-mainnet-rpc>'
$env:STRK20_POOL_ADDRESS = '0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a'
pnpm probe:pool
```

The RPC URL is process-scoped and never printed. A changed class hash, unknown ABI classification, changed fee, wrong chain, or failed view is a stop condition.

## Sepolia observation

The same probe at Sepolia block `14393017` (`0x3a72dc3faf88eb949b9f10910deb42ee951f4678f390b2210e029f2c51f8d07`, timestamp `2026-09-01T15:20:14Z`) identified pool v2.1, class `0x07e2bbd7ccc1e68b2695caef70aeb2a3be6cd017b5d5159278ba08f2d8de33f`, the same legacy global-screening surface, and a 2 STRK fee. No Sepolia transaction was submitted. This supports ABI compatibility but does not replace a wallet-produced proof and accepted receipt.
