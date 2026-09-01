# Test results — 2026-09-01

| Gate | Result |
|---|---|
| ESLint | Pass, zero warnings |
| TypeScript `--noEmit` | Pass |
| Vitest | 22 passed, 0 failed |
| Next.js 16.3.4 production build | Pass; static `/` |
| Playwright Chromium | 1 passed, 0 failed |
| `pnpm audit --audit-level high` | No known vulnerabilities |
| `strk20.json` structural validation | Pass; intentionally incomplete |
| Scarb format/build | Pass |
| Cairo pure invariant tests under Foundry | 7 passed, 0 failed |
| Starknet Foundry deployed-contract tests | 24 passed, 0 failed; 31 total with invariants |
| Tracked-file secret scan | Pass across 71 tracked files, including the staged change set |

Starknet Foundry is unavailable on native Windows, so official 0.63.0 Linux artifacts ran in an isolated Docker container. Deployment tests cover program/case collisions, configuration, program binding, pool/admin authorization, clarification signatures and requests, payload bounds, event shape, reserve-backed note return, wrong/zero nullifiers, expiry, tier substitution, destination substitution and duplicate settlement. Live pool ABI behavior still requires a supported network deployment.
