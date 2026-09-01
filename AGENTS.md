# VeilZero agent guide

Mission: ship an honest, working STRK20 Private Sprint entry before 2026-09-07 23:59 UTC. Official sources are `starkience/strk20-hackathon`, `strk20.starknet.io`, `starkware-libs/starknet-privacy`, and the linked starter/skills repositories.

Architecture: Next.js local-first client in `src`; Cairo stateful anonymizer in `contracts`; evidence verifiers in `scripts`; append-only significant decisions in `docs/DECISIONS.md`.

Commands: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm test:e2e`, `pnpm verify:strk20`, `pnpm verify:artifact`, `pnpm probe:pool`, `pnpm prepare:deployment`, `pnpm scan:secrets`; from `contracts`, `scarb fmt --check`, `scarb build`, `scarb test`.

Security rules: never request/read/store a seed phrase or private key. Never log plaintext, viewing keys, case secrets or recovery packages. Never fabricate evidence. Never trust `msg.sender` as the end user inside `privacy_invoke`; the configured pool is the caller. Inputs must be bounded and domain-separated. No backend-held wallet or unknown prover/discovery endpoint.

Mainnet human gate: agents may prepare and estimate, but only a human signs in a browser wallet. Reconcile ambiguous writes before retry. Total projected plus actual spend must stay below 100 STRK.

Git: conventional commits, no force pushes, no rewritten evidence, no broken main. Update this file and blockers after status changes.

Tests: positive and negative protocol paths, encryption nonce uniqueness, no fake success, rejected/failed/ambiguous wallet states, replay/nullifier/cross-program defenses, builds from a clean clone.

Current status: public repository, accepted registration and GitHub Pages demo are live; a secret-free committed vendor manifest, X25519 vendor encryption, public case envelopes, selective authorship evidence, read-only Wallet API diagnostics plus fixed-value action builders, private submission/clarification preparation, bounded vendor lifecycle calls, reload-safe reconciliation, and destination-bound claim preparation pass local checks. The contract case-locks reserve at authorization, rejects cross-case overcommit, releases only expired locks, and lets a paused program administrator recover only available funds; 33 deployed plus 7 pure Cairo tests pass. The newest release-candidate artifact identity is pinned. AVNU SDK 4.2.0 plus a block-pinned probe identify the mainnet pool, compatible ABI and observed 6 STRK fee; rerun before signing because the pool is upgradeable. A read-only generator validates declaration state and builds a unique UDC plan from a dedicated wallet's public address; it never estimates, signs or submits. Nothing is declared or deployed. Known blockers: human wallet signatures, live Ready/Xverse validation of Wallet API note-ID preparation, qualifying transactions and video. Highest-value next task: validate the prepare/sign/re-prepare adapter with a compatible live wallet before a browser-signed deployment.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
