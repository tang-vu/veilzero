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

## Reserve custody release candidate — 2026-09-01

- Exact contract-bearing source commit: `ee59b4974f5431d87fa691a94e276a098bc2fbb4`.
- The reserve model now permits a paused program administrator to recover only available funds. Active programs cannot withdraw, case-locked rewards are excluded, and reserve accounting is debited before the ERC-20 transfer.
- Pinned Scarb 2.20.1 formatting/build passed. Foundry 0.63.0 ran 33 deployed-contract and 7 pure tests: 40 passed, 0 failed. New tests cover active-program rejection, available withdrawal, and inability to consume a case lock.
- Sierra SHA-256/class hash: `b13014c00ee0e65831e50a2c46611c3f3d9e6ece41236117c7eef0bb1a2d852b` / `0x06b410a4ce4494e79a34998957952d1502eb803fb2e15589021eaf0178b5cb56`.
- CASM SHA-256/class hash: `8abe0cc92302c14b6e48069cb2f6956d6e84f03df82131d6fad4f16b73d1ec53` / `0x0264bccfb4ff096e2de7b087ffec2a89fbd77c73ac360100bbe724a51cfabeed`.
- Starknet.js and `sncast` independently produced the same Sierra class hash. At mainnet block `14208014`, the class remained undeclared and the current compatible pool fee remained 6 STRK.
- Public workflow `33532857013` performed a fresh frozen/script-disabled install at exact commit `ee59b49`, passed 62 application tests plus configured release checks, and deployed Pages successfully. The unauthenticated demo returned HTTP 200 with the case-lock explanation and explicit undeployed boundary. Cairo/Foundry evidence is the separate local 40-test run recorded above.

## Public checksum-pinned Cairo verification — 2026-09-01

- GitHub Actions run `33533436640` checked out exact public commit `7af5a27b439fe36e1fdbdba68ae19b3da8ef30ec` and completed successfully.
- The workflow downloaded the official Linux archives for Scarb 2.20.1, Starknet Foundry 0.63.0 and Universal Sierra Compiler 2.10.0, rejecting each archive unless its pinned official SHA-256 matched.
- `scarb fmt --check`, `scarb build` and all 40 Cairo tests passed on the public runner.
- The runner reproduced Sierra SHA-256 `b13014c00ee0e65831e50a2c46611c3f3d9e6ece41236117c7eef0bb1a2d852b`, CASM SHA-256 `8abe0cc92302c14b6e48069cb2f6956d6e84f03df82131d6fad4f16b73d1ec53` and Sierra class hash `0x06b410a4ce4494e79a34998957952d1502eb803fb2e15589021eaf0178b5cb56`.
- The companion Pages run `33533436651` also passed for the same exact commit. This makes the contract build/test evidence independently reproducible from the public repository rather than dependent only on the local Docker result.

## Offline clean-clone verification — 2026-09-02

- A new public clone at `D:\ytb_tool_temp\veilzero-release-9ced11c15b934aac83189b5b8f8136fb` installed the frozen lockfile with scripts disabled using pnpm 11.24.0. Windows package linking completed successfully in 18 minutes 29 seconds; no secret or local configuration was required.
- The clone was fast-forwarded from documentation commit `7a3ee8f` to exact source commit `ec594e0565994b2bb3668dc6bee9ce08db0a1afb`; the dependency manifest and lockfile were unchanged by that source-only fix.
- At `ec594e0`, ESLint, strict TypeScript, all 62 Vitest tests, production build, both Playwright flows, `strk20.json` validation, tracked-file secret scan and dependency audit passed in the isolated tree.
- The first browser attempt revealed a Google Fonts availability delay. The release fix removed `next/font/google`, added privacy-preserving system font stacks and extended only the slow-filesystem server timeout. The repeated clean-tree browser run passed in one minute without a font-network request.
- Generated `next-env.d.ts` was the only tracked dirty file after Next development/build commands; it contained the known generated dev-path switch and no required source. The ignored Cairo target was intentionally absent from the clone, so artifact identity remains verified by the exact-commit checksum-pinned Cairo workflow rather than by pretending generated artifacts ship in Git.
- Public Cairo workflow `33537038038` independently rebuilt the unchanged contract and passed all 40 tests plus artifact identity at exact commit `ec594e0`.
- Pages workflow `33537038062` completed a fresh frozen/script-disabled Linux install, all configured application/release gates and deployment at exact commit `ec594e0`. The unauthenticated demo returned HTTP 200 with the undeployed and exact-case-lock boundaries and no Google Fonts reference.

## Case-signed reward authorization release candidate — 2026-09-02

- Exact contract-bearing source commit: `8de77540320b99dea5dfafdc65dad03355c453fd`.
- A strict public reward request now signs the claim commitment under the submitted case key without exporting the claim secret or any private key. Vendor import binds it to the active manifest and encrypted case before constructing calls.
- Cairo `authorize_reward` independently verifies the request signature before reserve mutation. New deployed-contract tests reject vendor commitment substitution and cross-program replay.
- Pinned Scarb 2.20.1 formatting/build passed. Foundry 0.63.0 ran 35 deployed-contract and 7 pure tests: 42 passed, 0 failed. Vitest passed 66 tests and Playwright passed 3 end-to-end flows.
- Sierra SHA-256/class hash: `fd033dfe84634a1c46e6854ade449e5fbaf67f64a79409539cbc1c1819622ca8` / `0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503`.
- CASM SHA-256/class hash: `816fc781916a10d441c01fc2f90e2854f55cc94a0201bad982fd2c6d98afcbe9` / `0x006bea38144dd691e99894a0f603823c29f33d3c4013abecd2999c67a2391b78`.
- Starknet.js and Starknet Foundry 0.63.0 `sncast` independently produced the same Sierra class hash. The new class is not declared or deployed; live declaration state must be rechecked with the dedicated wallet address before signing.
- Public Cairo workflow `33540591730` rebuilt the exact public head with checksum-pinned tools, passed all 42 tests, matched both artifact digests, and reproduced Sierra class hash `0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503`.
- Pages workflow `33540591855` passed a fresh frozen/script-disabled install, 66 application tests, lint, strict typing, production build, manifest/link/encoding/secret/dependency gates, and deployment. The unauthenticated demo returned HTTP 200 with the signed reward-request/vendor handoff, explicit undeployed boundary, and no mojibake.

## Current-head clean-clone verification — 2026-09-02

- The independent public clone at `D:\ytb_tool_temp\veilzero-release-9ced11c15b934aac83189b5b8f8136fb` was restored to its tracked state, fast-forwarded to exact public commit `65ba82dcbaebc28c4d738cd6a344ceedc8910dcb`, and ran `pnpm install --frozen-lockfile --ignore-scripts` successfully. The lockfile dependency graph was unchanged and required no secret or local configuration.
- In that clone, ESLint, strict TypeScript, all 66 Vitest tests, production build, all 3 Playwright flows, 35-file local-link validation, `strk20.json` validation, 109-file encoding and secret scans, and dependency audit passed.
- Pinned Scarb 2.20.1 formatting/build reproduced the Sierra/CASM artifacts and all four recorded identities from the clean clone. The only tracked post-command changes were Next's generated development type paths and a line-ending-only `Scarb.lock` status with no content diff; no required untracked file appeared.
- Public Cairo workflow `33540994606` and Pages workflow `33540994696` both passed at the same exact commit. The public Foundry run retained 42/42 Cairo tests, and the unauthenticated demo remained deployable from a frozen/script-disabled install.
- A fresh unauthenticated request returned HTTP 200 with the signed-request handoff, vendor preview and undeployed boundary present and no mojibake signature. All six distinct external judge/documentation links tracked by the repository returned HTTP 200 on 2026-09-02.

## Prepare-only claim validation harness — 2026-09-02

- The browser now retains the selected Wallet Standard implementation only in memory after the explicit diagnostic connection and exposes a separate prepare-only claim check. It rechecks mainnet and the connected account, pins Wallet API 0.10.3, binds the destination to that account, and never invokes a submission method.
- The adapter now requires both wallet-prepared calls to target the freshly verified pool, requires an entirely empty estimation proof, bounds and validates the wallet response shape, preserves the marker-delimited note ID across signing, and revalidates pool/note/proof immediately before any future submission helper can run.
- Local `pnpm check` passed lint, strict typing, 69 Vitest tests and the static Next.js 16.3.4 production build. Three Chromium flows passed, including assertions that the new harness remains disabled without prerequisites and exposes neither case signing material nor the resolved note ID.
- Manifest, artifact identity, local-link, UTF-8, tracked-file secret and high-severity dependency gates passed. The three new untracked source candidates were separately scanned with the same secret patterns and were clean. The Cairo source tree is unchanged; the pinned Sierra/CASM identities still match. Native Windows has no Scarb executable, so Cairo tests were not redundantly rerun for this frontend-only worktree.
- This is implementation evidence, not live Wallet API or transaction evidence. The initial helper deployment must occur first; a compatible wallet, matching authorized case and current live pool are still required to execute the harness before claim submission is enabled.
- Source commit `0515c66c2c2160149c8063d1be4ce5ac51193984` was pushed to public `main`. Checksum-pinned Cairo workflow `33595234362` passed all 42 tests and artifact identity. Pages workflow `33595234361` passed its frozen/script-disabled install, 69 tests, build and release gates, then deployed successfully. The public demo returned HTTP 200 with the prepare-only harness and its no-submission boundary present.
- GitHub emitted a non-failing notice that several pinned actions still declare the deprecated Node.js 20 runtime and were forced onto Node.js 24. The workflows passed; this remains maintenance evidence rather than a release blocker.
