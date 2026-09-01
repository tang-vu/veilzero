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

## 2026-09-01 — Pin public deployment actions

Every external GitHub Action in the Pages workflow is pinned to the commit resolved from its documented major-version tag on this date. The deployment build also runs the tracked-file secret scanner, evidence-manifest validator and dependency audit before uploading the static artifact.

## 2026-09-01 — Pin the release-candidate contract artifact identity

The release candidate records SHA-256 digests plus normalized Sierra and CASM class hashes. A tracked verifier recomputes all four values after a Scarb build. These identifiers are deliberately kept out of `strk20.json`: they prove deterministic artifact identity, not declaration, deployment or mainnet execution.

## 2026-09-01 — Use the wallet-managed proving route and live legacy pool surface

Current official Wallet API guidance assigns viewing keys, note discovery and proof generation to the connected Ready/Xverse-compatible wallet, so VeilZero does not configure an application prover or indexer. AVNU SDK 4.2.0 supplies the documented mainnet pool constant. A block-pinned read-only ABI probe confirms that pool remains on the global-screening surface compatible with VeilZero's single `Span<OpenNoteDeposit>` return. Because the pool is upgradeable, compatibility and fees must be re-probed before every signing gate.

## 2026-09-01 — Derive deployment through the canonical unique UDC path

The release deployment uses Starknet.js's canonical UDC with `unique: true`, constructor calldata containing the freshly verified pool, and a deterministic Poseidon salt domain-separated by `VEILZERO_DEPLOY_V1`, class hash and pool. The expected address is additionally bound to the dedicated wallet's public deployer address. A read-only generator verifies artifact identity, pool compatibility, UDC presence and declaration state; its output is planning data and never deployment evidence.

## 2026-09-01 — Prepare researcher case actions as explicit eleven-field invokes

Submission and clarification use a single STRK20 invoke action and never synthesize a frontend success. The client maps every `privacy_invoke` field explicitly, zeros action-inapplicable fields, signs clarification context with the case key, requests a non-simulated proof, and fails closed if any proof component is absent. Actual `wallet_addInvokeTransaction` remains behind live-wallet validation and a human signature.

## 2026-09-01 — Constrain vendor administration to typed call builders

Vendor calls are public account transactions but still fail closed before wallet interaction. Builders expose only the protocol's fixed entrypoints, validate Cairo-compatible numeric bounds and ordering, require reward expiry beyond a supplied current block timestamp, and approve exactly the reserve funding amount rather than an unlimited allowance.

## 2026-09-01 — Persist only public pending-transaction metadata

Reload reconciliation stores a strict hash/network/action/contract/timestamp record and no call, proof or secret material. Any timeout, missing or mismatched hash, incomplete status or RPC failure remains ambiguous and prevents another hash from being recorded. Terminal accepted or reverted receipts clear the pending lock; separate evidence verification remains mandatory.

## 2026-09-01 — Keep wallet diagnostics fixed-value and decimal-exact

Shield, transfer, self-transfer and unshield diagnostics parse plain decimal strings to integer units without floating point and reject zero, exponent notation, excess precision and overflow. These paths cannot request `OPEN`; open-note creation is reserved for the destination-bound reward claim. Builders remain non-submitting until the live wallet gate.

## 2026-09-01 — Bind the vendor program in a secret-free public manifest

The browser emits a canonical manifest whose commitments cover the X25519 public key, policy, SLAs, token and strictly ordered reward tiers. Researcher packages derive the identical encryption-key commitment. The private vendor key remains a separate sensitive download, and the manifest is not treated as deployed evidence until a matching receipt exists.

## 2026-09-01 — Verify selective evidence with a strict local-only importer

The judge-facing verifier caps files at 32 KiB, rejects unknown top-level or signature fields, recomputes the message binding and verifies the Stark key/signature locally. It renders only a validity verdict and never echoes or persists imported JSON. This artifact proves scoped authorship but never substitutes for mainnet evidence.

## 2026-09-01 — Prove qualifying pool involvement from nested traces

Mainnet verification requires a successful execution trace where the configured live STRK20 pool is an ancestor of the declared VeilZero contract call. Receipt events still prove the project-specific transition, but pool events or unrelated sibling calls cannot stand in for execution through the protocol path.

## 2026-09-01 — Lock reserve per case at reward authorization

A balance check alone could overpromise one reserve across multiple accepted cases. Authorization now subtracts the exact fixed tier from available reserve and stores it as the case's immutable reward amount. Settlement consumes that lock without debiting again. Only the administrator, strictly after expiry, can release it back to available reserve and return the case to accepted state for a new authorization.

## 2026-09-01 — Return only paused, available reserve to the administrator

Permanent custody of unused funds is not acceptable. After pausing a program, its administrator may withdraw an exact amount of available reserve back to the administrator account. Case-locked rewards are excluded from available reserve, and accounting is debited before the external ERC-20 transfer so reentrancy cannot expose the same balance twice.

## 2026-09-01 — Run Cairo CI from checksum-pinned official binaries

The current Foundry setup action is composite and references another action by a mutable major tag. Instead, public CI downloads the exact official Scarb 2.20.1, Foundry 0.63.0 and Universal Sierra Compiler 2.10.0 Linux assets and verifies their release SHA-256 digests before execution. CI then enforces formatting, build, all contract tests and release artifact identity.

## 2026-09-02 — Remove runtime font-network dependency

The application uses system font stacks instead of `next/font/google`. A clean-clone browser run showed that an unavailable Google Fonts endpoint could delay the development server even though fonts are nonessential. System fallbacks keep the judge path self-contained, avoid a third-party request and remove that metadata leak; Playwright allows 120 seconds for first compilation on slow filesystems.

## 2026-09-02 — Fail CI on common text-encoding corruption

Judge-facing source contained five double-decoded punctuation sequences that browser tests had accidentally learned as expected output. The corrected strings use proper UTF-8. A tracked-file scanner now rejects the Unicode replacement character and common UTF-8-as-Windows-1252 signatures in every non-binary tracked file, and Pages CI enforces it.

## 2026-09-02 — Expose only non-submitting diagnostic action previews

The developer panel renders shield, private self-transfer and unshield action arrays only after a read-only wallet connection supplies the public account address. Preview construction is local and fixed-value; it does not prepare a proof, estimate, sign or submit. This makes the implemented Wallet API mapping inspectable without weakening the live-validation and human-mainnet gates.
