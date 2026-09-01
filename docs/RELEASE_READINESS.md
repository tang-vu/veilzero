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
