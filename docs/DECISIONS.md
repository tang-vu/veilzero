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

## 2026-09-01 — Bind case messages and claims to a case-scoped Stark key

The initial contract stored an unused case-auth commitment and publicly emitted a raw reward nullifier. That allowed message injection and made payout redirection possible. The corrected protocol stores a case Stark public key, verifies clarification signatures, stores only a domain-separated commitment to the claim secret, and verifies a case-key signature over the eventual destination note. A copied claim can only credit the already signed note.

## 2026-09-01 — Use browser-native X25519 envelope encryption

Vendor programs generate X25519 keys locally. Researchers use ephemeral X25519 ECDH, HKDF-SHA256 and AES-256-GCM; vendors decrypt with their downloaded private package. No backend receives a private key or plaintext. The local AES-only path remains available solely as a visibly diagnostic fallback.

## 2026-09-01 — Keep claim destination binding despite Wallet API orchestration gap

Wallet API 0.10.3 resolves `${openNoteIds[0]}` during call preparation, after application actions are described. The VeilZero case key must sign the resolved note ID to prevent payout redirection. The contract invariant remains mandatory; deployment is blocked until a live compatible wallet validates a safe prepare/sign/re-prepare adapter with an explicit mismatch abort.

## 2026-09-01 — Separate public ciphertext transport from recovery material

The contract stores ciphertext commitments and size, not report bytes. The MVP therefore exports a schema-validated public encrypted envelope for out-of-band delivery. It excludes the case secret, local encryption key, case signing private key and claim secret. The recovery package remains researcher-only.

## 2026-09-01 — Resolve note binding with an estimation-only preview

The adapter now performs an estimation prepare with a zero claim signature. The contract permits that signature only when the transaction version is Starknet's non-submittable estimation version (`2^128 + 3`) and requires fixed markers around the wallet-resolved note ID. The browser signs the extracted ID, prepares a real proof, and aborts if the marker is ambiguous, the note changes, or proof fields are empty. This keeps destination binding intact while retaining wallet-held STRK20 state. Live wallet/pool behavior remains a deployment gate.
