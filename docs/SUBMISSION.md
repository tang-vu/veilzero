# Submission tracker

- Repository: https://github.com/tang-vu/veilzero (public)
- Registration PR: https://github.com/starkience/strk20-hackathon/pull/261 (official check passed; applied to upstream `main` as `0554021`; bot closed rather than merged by design). The original Telegram value was wrong; correction to `hanhgia2212` is requested in official issue https://github.com/starkience/strk20-hackathon/issues/272 and remains pending until a maintainer updates the registry.
- Demo: https://tang-vu.github.io/veilzero/ (deployment run `33718705688` succeeded at source commit `ddde26e`; fresh frozen/script-disabled install, 77 tests, static build, budget and release checks passed; HTTP 200 with block `14285500`, the honest incomplete budget state, prepare-only no-submit harness and explicit undeployed boundary)
- Public Cairo evidence: workflow run `33718705771` passed the checksum-pinned Scarb/Foundry/USC install, contract build, all 42 Cairo tests, artifact hashes, and Sierra class hash at source commit `ddde26e`.
- Video: pending
- Mainnet contract: pending
- Verified transactions: 0/3
- Deadline: 2026-09-07 23:59 UTC

The official rules were rechecked on 2026-09-02: the scored entry still requires a live demo, a three-minute video, and at least three successful mainnet hashes in `strk20.json` that touched the STRK20 pool. The official hub reads the public repository continuously. There is no final-submit button.
