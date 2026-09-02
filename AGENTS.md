# VeilZero agent guide

Mission: ship an honest, working STRK20 Private Sprint entry before 2026-09-07 23:59 UTC. Official sources are `starkience/strk20-hackathon`, `strk20.starknet.io`, `starkware-libs/starknet-privacy`, and the linked starter/skills repositories.

Architecture: Next.js local-first client in `src`; Cairo stateful anonymizer in `contracts`; evidence verifiers in `scripts`; append-only significant decisions in `docs/DECISIONS.md`.

Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm verify:strk20`, `pnpm verify:artifact`, `pnpm probe:pool`, `pnpm prepare:deployment`, `pnpm scan:secrets`; from `contracts`, `scarb fmt --check`, `scarb build`, `scarb test`.

Security rules: never request/read/store a seed phrase or private key. Never log plaintext, viewing keys, case secrets or recovery packages. Never fabricate evidence. Never trust `msg.sender` as the end user inside `privacy_invoke`; the configured pool is the caller. Inputs must be bounded and domain-separated. No backend-held wallet or unknown prover/discovery endpoint.

Mainnet human gate: agents may prepare and estimate, but only a human signs in a browser wallet. Reconcile ambiguous writes before retry. Total projected plus actual spend must stay below 100 STRK.

Git: conventional commits, no force pushes, no rewritten evidence, no broken main. After each verified update, commit and push it so the public build log, hub and Pages can advance; skip either step only when the user explicitly asks. Update this file and blockers after status changes.

Tests: positive and negative protocol paths, encryption nonce uniqueness, no fake success, rejected/failed/ambiguous wallet states, replay/nullifier/cross-program defenses, builds from a clean clone. The public Cairo workflow must remain checksum-pinned and pass all 42 current contract tests plus artifact identity verification.

Current status: public repository, accepted registration and GitHub Pages demo are live; a secret-free committed vendor manifest, X25519 vendor encryption, public case envelopes, selective authorship evidence, case-signed reward requests, read-only Wallet API diagnostics plus connected-account-bound non-submitting action previews, private submission/clarification preparation, bounded vendor lifecycle previews, reload-safe reconciliation, and destination-bound claim preparation pass local checks. A browser prepare-only validation harness now rechecks mainnet, account and Wallet API 0.10.3, rejects wrong-pool calls, submittable estimation previews, note drift and incomplete proofs, then discards the proof without submitting. At source commit `0515c66`, public Cairo workflow `33595234362` passed all 42 tests and artifact identity, Pages workflow `33595234361` passed the frozen/script-disabled application and release gates and deployed, and the public demo returned HTTP 200 with the new no-submit harness. The contract verifies the researcher reward-request signature before authorization, case-locks reserve, rejects cross-program replay and cross-case overcommit, releases only expired locks, and lets a paused program administrator recover only available funds. The newest release-candidate artifact identity is pinned. A fresh mainnet probe at block `14235618` reconfirmed the pool class, compatible ABI and 6 STRK fee; an address-free readiness run at block `14235648` reconfirmed artifact/pool/UDC identity and found the current class undeclared without using a dummy address. The generator adds the unique UDC plan only when given the dedicated wallet's public address; it never estimates, signs or submits. Nothing is declared or deployed. Known blockers: the public deployer address plus human wallet estimates/signatures, live Ready/Xverse execution of the prepare-only validation harness after the helper and an authorized case exist, qualifying transactions and video. Highest-value next task: obtain the dedicated wallet's public address, generate the exact plan, complete the human browser deployment gate, then run the prepare-only adapter validation before any claim submission.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
