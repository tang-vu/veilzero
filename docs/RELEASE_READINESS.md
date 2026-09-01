# Release readiness

## Fresh-clone verification — 2026-09-01

- Public source: `https://github.com/tang-vu/veilzero`
- Verified commit: `4723734df80498c9aa58b8da4067913b36923679`
- Clean clone: `%LOCALAPPDATA%\Temp\veilzero-release-4723734`
- Package install: `pnpm install --frozen-lockfile` passed with the committed noninteractive build policy; no secret or local configuration was required.
- ESLint: passed with zero warnings.
- TypeScript: passed in strict no-emit mode.
- Unit tests: 13 passed, 0 failed.
- Production build: passed; `/` and the not-found page were statically generated.
- Playwright: 1 passed, 0 failed in Chromium; local encryption remained explicitly unsubmitted.
- `strk20.json`: structurally valid with zero transactions, zero contracts, verified public demo URL and empty video URL.
- Cairo: `scarb fmt --check` and `scarb build` passed. Foundry 0.63.0 ran 7 pure and 11 deployed-contract tests, for 18 passed and 0 failed.
- Dependency audit: no known vulnerabilities.
- Secret scan: no assignment-like private-key, seed, mnemonic, RPC-key or viewing-key patterns.
- Required-file check: all documented source and configuration files came from Git. Build tools marked generated `next-env.d.ts` and `Scarb.lock` dirty across Windows/Linux generation (the lockfile had no content diff); no required untracked file appeared.

The repository is reproducible for its implemented read-only app and Cairo build. Release is not mainnet-complete: deployment, live pool ABI/prover validation, three qualifying transactions and a real demo video remain explicitly blocked/deferred.
