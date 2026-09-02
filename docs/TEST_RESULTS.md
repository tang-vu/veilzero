# Test results — 2026-09-02

| Gate | Result |
|---|---|
| ESLint | Pass, zero warnings |
| TypeScript `--noEmit` | Pass |
| Vitest | 69 passed, 0 failed |
| Next.js 16.3.4 production build | Pass; static `/` |
| Playwright Chromium | 3 passed, 0 failed |
| `pnpm audit --audit-level high` | No known vulnerabilities |
| `strk20.json` structural validation | Pass; intentionally incomplete |
| Scarb format/build | Pass |
| Contract artifact identity | Pass; Sierra/CASM SHA-256 and class hashes match the pinned release candidate |
| Live pool probe | Pass on mainnet v2.0 and Sepolia v2.1; both legacy-global-screening surfaces |
| Read-only deployment plan | Generator and new artifact pins pass; last live pool/UDC/declaration run was the prior reserve-custody candidate at mainnet block `14208014`, so the new class still requires a fresh address-specific read |
| Cairo pure invariant tests under Foundry | 7 passed, 0 failed |
| Starknet Foundry deployed-contract tests | 35 passed, 0 failed; 42 total with invariants |
| Public Cairo CI | Pass; checksum-pinned workflow run `33595234362` reproduced build, 42 tests, artifact hashes and Sierra class hash at `0515c66` |
| Tracked-file secret scan | Pass across 112 tracked files, including the live validation harness, signed request implementation and documentation |
| Current-head clean clone | Pass at `65ba82d`: frozen install, lint, typecheck, 66 unit tests, build, 3 browser flows, link/manifest/encoding/secret/audit gates, Scarb build, and artifact identities |
| Current public source CI | Pass at `0515c66`: frozen/script-disabled install, lint, typecheck, 69 unit tests, build, release gates, 42 Cairo tests, artifact identity and Pages deployment |

Pinned Scarb 2.20.1 formatted and built the contract locally; Starknet Foundry has no native Windows release, so official 0.63.0 Linux artifacts ran in an isolated Docker container. Public workflow `33540591730` independently repeated those gates on Linux using checksum-pinned official tool archives. Deployment tests cover program/case collisions, configuration, program binding, pool/admin authorization, case-signed reward requests, vendor commitment substitution, cross-program replay, clarification signatures and requests, payload bounds, event shape, case reserve locking, overcommit rejection, expiry release/reauthorize, paused withdrawal limited to available reserve, note return, wrong/zero nullifiers, tier/destination substitution and duplicate settlement. Live pool behavior still requires a supported network deployment.

The 69-test local suite adds prepare-only live-adapter coverage for mainnet/account/API revalidation, correct two-stage simulation/proving requests, absence of any submission call, expected-pool binding, empty estimation proof enforcement and malformed wallet responses. No compatible live wallet was available in this automated run, so the result is implementation evidence rather than live Wallet API evidence.
