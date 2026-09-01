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
| Cairo tests | 7 passed, 0 failed |
| Assignment-like secret scan | No matches |

Starknet Foundry is unavailable on native Windows in the inspected release assets. Scarb's bundled Cairo test runner is deprecated but passed; contract-level deployment tests remain required before any deployment.
