# Significant decisions (append-only)

## 2026-09-01 — Retain VeilZero

GhostBounty overlaps in concept but is architecture-only with no live evidence. VeilZero remains differentiated by committed SLAs, reserve-backed fixed tiers, one-time settlement and evidence receipts.

## 2026-09-01 — Apache-2.0

The project exposes reusable protocol infrastructure, not only an application. Apache-2.0 is compatible with the referenced Apache privacy monorepo and permissive MIT starter concepts.

## 2026-09-01 — No backend-held privacy wallet

The primary route is user-controlled browser wallet plus local encryption. No application server receives signing or viewing keys.

## 2026-09-01 — Pin pool caller; public vendor administration

Inside `privacy_invoke`, `msg.sender` is the pool. Researcher submission and settlement use the pool; vendor acknowledgement and authorization are intentionally public administrator calls.

## 2026-09-01 — Upgrade Next.js scaffold

The starter-era 16.0.8 release emitted a security warning. VeilZero pins patched 16.3.4 and exact dependencies.

## 2026-09-01 — Keep the public wallet diagnostic read-only

The browser discovers Wallet Standard implementations and probes chain, API versions and STRK20 balance capability only after an explicit click. It does not prepare, sign or submit. Unknown wallet errors are redacted rather than rendering extension-provided messages.

## 2026-09-01 — Deny the optional resolver build script

The pinned `unrs-resolver` package works through its platform binary without running its install script. The pnpm allowlist records `false` explicitly so fresh installs neither execute the script nor stop on an unresolved approval prompt.
