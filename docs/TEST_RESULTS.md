# Test results — 2026-09-01

| Gate | Result |
|---|---|
| ESLint | Pass, zero warnings |
| TypeScript `--noEmit` | Pass |
| Vitest | 13 passed, 0 failed |
| Next.js 16.3.4 production build | Pass; static `/` |
| Playwright Chromium | 1 passed, 0 failed |
| `pnpm audit --audit-level high` | No known vulnerabilities |
| `strk20.json` structural validation | Pass; intentionally incomplete |
| Scarb format/build | Pass |
| Cairo pure invariant tests under Foundry | 7 passed, 0 failed |
| Starknet Foundry deployed-contract tests | 11 passed, 0 failed; 18 total with invariants |
| Assignment-like secret scan | No matches |

Starknet Foundry is unavailable on native Windows, so official 0.63.0 Linux artifacts ran in an isolated Docker container. Deployment tests cover program/case collisions, program binding, pool/admin authorization, payload bounds, reserve-backed note return, wrong nullifiers and duplicate settlement. Live pool ABI behavior still requires a supported network deployment.
