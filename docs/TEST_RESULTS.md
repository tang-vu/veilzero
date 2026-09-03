# Test results — 2026-09-03

| Gate | Result |
|---|---|
| ESLint | Pass, zero warnings |
| TypeScript `--noEmit` | Pass |
| Vitest | 79 passed, 0 failed |
| Next.js 16.3.4 production build | Pass; static `/` |
| Playwright Chromium | 4 passed, 0 failed |
| `pnpm audit --audit-level high` | No known vulnerabilities |
| `strk20.json` structural validation | Pass; intentionally incomplete |
| Scarb format/build | Pass |
| Contract artifact identity | Pass; Sierra/CASM SHA-256 and class hashes match the pinned release candidate |
| Mainnet budget verifier | Pass; immutable 15-item inventory counts 18 STRK known, bounds maximum exposure to 86 STRK with 14 STRK headroom, and requires the current action's estimate for its signing gate |
| Live pool probe | Pass; mainnet v2.0/class/ABI/6 STRK fee reconfirmed at block `14285500`; prior Sepolia v2.1 probe has the same legacy-global-screening surface |
| Read-only deployment readiness | Pass at mainnet block `14285506`; current artifact/pool/UDC verified and current class undeclared; exact unique address still requires the public deployer |
| Cairo pure invariant tests under Foundry | 7 passed, 0 failed |
| Starknet Foundry deployed-contract tests | 35 passed, 0 failed; 42 total with invariants |
| Public Cairo CI | Pass; checksum-pinned workflow run `33718705771` reproduced build, 42 tests, artifact hashes and Sierra class hash at `ddde26e` |
| Tracked-file secret scan | Pass across 117 tracked files, including the recovery importers, live validation harness, signed request implementation, budget gate and documentation |
| Current-head clean clone | Pass at `65ba82d`: frozen install, lint, typecheck, 66 unit tests, build, 3 browser flows, link/manifest/encoding/secret/audit gates, Scarb build, and artifact identities |
| Current public source CI | Pass at `ddde26e`: frozen/script-disabled install, lint, typecheck, 77 unit tests, build, budget/release gates, 42 Cairo tests, artifact identity and Pages deployment |

Pinned Scarb 2.20.1 formatted and built the contract locally; Starknet Foundry has no native Windows release, so official 0.63.0 Linux artifacts ran in an isolated Docker container. Public workflow `33540591730` independently repeated those gates on Linux using checksum-pinned official tool archives. Deployment tests cover program/case collisions, configuration, program binding, pool/admin authorization, case-signed reward requests, vendor commitment substitution, cross-program replay, clarification signatures and requests, payload bounds, event shape, case reserve locking, overcommit rejection, expiry release/reauthorize, paused withdrawal limited to available reserve, note return, wrong/zero nullifiers, tier/destination substitution and duplicate settlement. Live pool behavior still requires a supported network deployment.

The 79-test local suite includes prepare-only live-adapter coverage for mainnet/account/API revalidation, correct two-stage simulation/proving requests, absence of any submission call, expected-pool binding, empty estimation proof enforcement and malformed wallet responses. It also verifies exact decimal budget arithmetic, fixed cost inventory, per-action missing-estimate blocking, item caps, maximum-exposure enforcement, recovery v3 round trips, diagnostic and vendor-encrypted packages, vendor X25519 key-pair agreement, strict unknown-field rejection, and tampering of secrets, keys, ciphertext, timestamps and program binding. Four browser flows include a full download, reload, bounded import, cross-artifact verification and local decryption sequence. No compatible live wallet was available in this automated run, so the wallet result remains implementation evidence rather than live Wallet API evidence.
