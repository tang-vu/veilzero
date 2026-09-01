# Release readiness

## Fresh-clone verification — 2026-09-01

- Public source: `https://github.com/tang-vu/veilzero`
- Verified commit: `7da3acb036790baf37ded52f8b28bcdca5b42a46`
- Clean clone: `D:\ytb_tool_temp\veilzero-release-7da3acb`
- Package install: `pnpm install --frozen-lockfile` passed with the committed noninteractive build policy; no secret or local configuration was required.
- ESLint: passed with zero warnings.
- TypeScript: passed in strict no-emit mode.
- Unit tests: 26 passed, 0 failed.
- Production build: passed; `/` and the not-found page were statically generated.
- Playwright: 1 passed, 0 failed in Chromium; local encryption remained explicitly unsubmitted.
- `strk20.json`: structurally valid with zero transactions, zero contracts, verified public demo URL and empty video URL.
- Cairo: `scarb fmt --check` and `scarb build` passed. Foundry 0.63.0 ran 7 pure and 27 deployed-contract tests, for 34 passed and 0 failed.
- Dependency audit: no known vulnerabilities.
- Secret scan: passed across all 74 tracked files; no private-key block, assigned seed/private/viewing/API/RPC secret, or credential-bearing RPC URL pattern was found.
- Required-file check: all documented source and configuration files came from Git. Build tools marked generated `next-env.d.ts` and `Scarb.lock` dirty across Windows/Linux generation (the lockfile had no content diff); no required untracked file appeared.

The repository is reproducible for its implemented read-only app and Cairo build. GitHub Pages deployment run `33507533923` succeeded for the verified clean-clone commit; later workflow `33523877185` also passed and deployed. The anonymous URL returned HTTP 200. A block-pinned read-only probe now verifies the published mainnet pool address, compatible legacy ABI surface and observed fee. Release is not mainnet-complete: live Wallet API note-ID binding, human-signed deployment, three qualifying transactions and a real demo video remain explicitly blocked/deferred.

## Current-head verification — `e17c60f`

- GitHub Actions run `33525442160` checked out the exact public commit, completed a fresh frozen/script-disabled pnpm install, full ESLint, strict TypeScript, 29 unit tests, production Turbopack build, tracked-file secret scan, manifest validation and dependency audit, then deployed successfully.
- The unauthenticated public URL returned HTTP 200 and contained the read-only mainnet evidence panel, observed 6 STRK fee and explicit `Contract not deployed · transactions 0/3` boundary.
- A new local detached checkout passed ESLint, strict TypeScript and all 29 tests using the unchanged lockfile's previously verified dependency tree. Scarb format/build and both pinned Sierra/CASM artifact identities passed from that checkout. There is no contract-tree change from the fully Foundry-tested `7da3acb` commit.
- Three local attempts to materialize a new pnpm virtual store were terminated by the command host during NTFS package linking with exit `-1`, empty stderr and no pnpm error. Hard-link and copy modes were both tried. An external `node_modules` junction was used only to test clean source; Turbopack correctly rejected that out-of-root junction, so it is not counted as a local production-build pass.
- Consequently, exact-head fresh installation and production build are proven by public Linux CI; the last fully local fresh install/build remains `7da3acb`, whose lockfile is byte-identical to `e17c60f`. This limitation is recorded rather than hidden.

## Deployment-handoff verification — 2026-09-01

- The release artifact remains byte-for-byte/class-hash identical to the pinned candidate.
- A read-only mainnet run at block `14206318` verified the compatible pool surface, current 6 STRK pool fee, canonical UDC presence and that the VeilZero class was not declared.
- Three new unit tests verify deterministic pool-bound deployment, deployer-bound unique addressing and invalid-address rejection; the full Vitest suite is now 32 passed.
- The test run used dummy public deployer `0x123`; its predicted address is explicitly not deployment evidence.
- ESLint, strict TypeScript, production build, Playwright, manifest validation, dependency audit, artifact verification, diff whitespace checks and tracked-file secret scan passed. Cairo sources and dependencies are unchanged from the 34/34 contract-tested artifact; native Windows still has no `scarb` executable, so the existing verified artifact was rehashed rather than rebuilt in this change.
- Public workflow `33528216431` checked out exact commit `0b2cd7b`, performed a fresh frozen/script-disabled install, passed the 32-test application suite and all configured release checks, and deployed Pages. The unauthenticated URL returned HTTP 200 with the explicit undeployed boundary.

## Corrected escrow release candidate — 2026-09-01

- Exact contract-bearing source commit: `46a46f6d5cc3e20329bda32bc063c8bdf3ad9e14`.
- Security re-audit found that balance-only authorization could overcommit one reserve across multiple cases. The corrected contract locks the exact tier per case at authorization, settles from the lock, and permits administrator release only strictly after expiry.
- Pinned Scarb 2.20.1 formatting/build passed. Foundry 0.63.0 ran 30 deployed-contract and 7 pure tests: 37 passed, 0 failed. New tests cover cross-case overcommit rejection, lock accounting, expiry release and safe reauthorization.
- Corrected Sierra SHA-256/class hash: `7227a982ed374637214f9c73902af5b50b768494e885b3a148f84d5265fc221e` / `0x02450ec72f2e622888a3ab378cf4978dcdd717f2e2365b6fea6e70e7f785d269`.
- Corrected CASM SHA-256/class hash: `145b57ddad7e4fef1a90d2ab4825f4b008b755b6a19ae66b46727443f3d32397` / `0x00008f826a0adefdf8e4455df7013d07fd12c3a63a77062cd5e52eb1b03fbfeb`.
- Starknet.js and `sncast` independently produced the same Sierra class hash. A block-pinned mainnet read at block `14207687` found the corrected class undeclared and the current pool surface compatible with a 6 STRK fee.
- Public workflow `33531982603` performed a fresh frozen/script-disabled install at exact commit `46a46f6`, passed 62 application tests plus configured release checks, and deployed Pages successfully. Cairo/Foundry evidence is the separate local 37-test run recorded above because the Pages workflow does not execute Foundry.
