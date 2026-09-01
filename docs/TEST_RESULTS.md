# Test results — 2026-09-01

| Gate | Result |
|---|---|
| ESLint | Pass, zero warnings |
| TypeScript `--noEmit` | Pass |
| Vitest | 66 passed, 0 failed |
| Next.js 16.3.4 production build | Pass; static `/` |
| Playwright Chromium | 3 passed, 0 failed |
| `pnpm audit --audit-level high` | No known vulnerabilities |
| `strk20.json` structural validation | Pass; intentionally incomplete |
| Scarb format/build | Pass |
| Contract artifact identity | Pass; Sierra/CASM SHA-256 and class hashes match the pinned release candidate |
| Live pool probe | Pass on mainnet v2.0 and Sepolia v2.1; both legacy-global-screening surfaces |
| Read-only deployment plan | Pass; reserve-custody pinned artifacts, pool ABI/fee, UDC and declaration state verified at mainnet block `14208014` |
| Cairo pure invariant tests under Foundry | 7 passed, 0 failed |
| Starknet Foundry deployed-contract tests | 35 passed, 0 failed; 42 total with invariants |
| Public Cairo CI | Pass; checksum-pinned workflow run `33533436640` reproduced build, 40 tests, artifact hashes and Sierra class hash |
| Tracked-file secret scan | Pass across 109 tracked files, including the signed request implementation and documentation |

Pinned Scarb 2.20.1 formatted and built the contract locally; Starknet Foundry has no native Windows release, so official 0.63.0 Linux artifacts ran in an isolated Docker container. Public workflow `33533436640` independently repeated those gates on Linux using checksum-pinned official tool archives. Deployment tests cover program/case collisions, configuration, program binding, pool/admin authorization, clarification signatures and requests, payload bounds, event shape, case reserve locking, overcommit rejection, expiry release/reauthorize, paused withdrawal limited to available reserve, note return, wrong/zero nullifiers, tier/destination substitution and duplicate settlement. Live pool ABI behavior still requires a supported network deployment.
