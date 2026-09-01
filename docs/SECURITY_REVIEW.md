# Security review

Review opened 2026-09-01; unresolved findings are retained.

| Finding | Severity | Status | Resolution/evidence |
|---|---|---|---|
| Multiple authorizations overcommit one reserve | Critical | Fixed + deployed-contract tested | Authorization debits available reserve into an immutable case amount; settlement spends the lock without a second debit; only expired locks can be released and reauthorized |
| Diagnostic package contains local key/secret | High operational | Open by design | Explicit warning, ignored filename, download only; replace with password-wrapped export |
| Symmetric key was not vendor envelope encryption | High product | Fixed | Ephemeral X25519 + HKDF-SHA256 derives AES-GCM envelope keys; vendor decrypt round-trip and wrong-key tests pass |
| Published program key/policy substitution | High integrity | Fixed locally | Canonical public manifest binds X25519 key, policy, deadlines, token and ordered tiers; researcher packages reuse the identical key commitment |
| Pool ABI mismatch (#978) | High | Current live path validated; recheck required | Block-pinned mainnet ABI exposes the legacy single-span return VeilZero implements; the upgradeable pool is re-probed before each gate |
| `privacy_invoke` caller confusion | Critical | Fixed in source | Pin configured pool; vendor calls are separate |
| Duplicate settlement/nullifier reuse | Critical | Fixed + deployed-contract tested | status 4→5 + used-nullifier map before approval |
| Public raw claim nullifier allowed destination theft | Critical | Fixed + adversarially tested | Authorization stores only a secret commitment; claim requires case-key signature over destination note |
| Wallet resolves destination note after action construction | High integration | Mitigated locally / live validation blocks deployment | Estimation-version-only zero-signature preview, contract-checked markers, case signing, note-drift abort and proof-completeness checks pass; validate with live Wallet API 0.10.3 |
| Estimation preview accidentally submittable | Critical | Fixed + contract tested | Zero-signature preview requires exact Starknet estimation version `2^128 + 3`; canonical transaction version rejects it |
| Stored case-auth commitment was unused | Critical | Fixed + adversarially tested | Clarifications verify Stark ECDSA over domain/program/case/message/size |
| Private action calldata drift or incomplete wallet proof | High | Fixed locally / live validation pending | Submission and clarification builders map all eleven fields explicitly, zero unused fields, sign clarification context, and reject any empty proof component |
| Overbroad reserve allowance or malformed administrator call | High | Fixed locally / live validation pending | Funding approves exactly one deposit amount; typed builders fix entrypoints and enforce u64/u128, SLA, tier and expiry bounds before wallet interaction |
| Decimal/STRK conversion or accidental open-note diagnostic | High | Fixed locally | Plain-string integer conversion rejects exponent/excess precision/zero/overflow; diagnostic transfer paths cannot use `OPEN` |
| Oversized/empty ciphertext | Medium | Fixed | 1..16400 ciphertext-byte contract bounds (16 KiB UTF-8 plaintext plus GCM tag) and tests |
| Ambiguous transaction retry | High | Fixed locally / live validation pending | A strict secret-free pending journal survives reload; timeouts, malformed/mismatched receipts and incomplete status remain ambiguous and block a second hash |
| Plaintext logging/storage | High | No instance found | No logger/localStorage/backend; field cleared after encrypt |
| Secret recovery package used as vendor transport | Critical operational | Fixed | Separate public envelope excludes case secret, local key, signing key and claim secret; schema, length and ciphertext commitment are checked before decryption; files over 64 KiB are rejected |
| Selective-proof parser accepts secret-bearing extensions | High operational | Fixed + browser tested | Strict nested schema rejects unknown fields; 32 KiB import cap; UI displays only a verdict and never imported JSON |
| Ambiguous commitment serialization / envelope field substitution | High integrity | Fixed | SHA-256 commitment parts are length-framed and bind ciphertext, AEAD parameters, program binding, case/report commitments and case public key; substitution tests fail closed |
| XSS/URL injection | Medium | No dynamic HTML | React text escaping; fixed external URLs |
| Dependency vulnerability | High | Fixed | Next 16.0.8 rejected; pinned 16.3.4; `pnpm audit` reports no known vulnerabilities |
| Mutable CI action tags / incomplete deploy gate | High supply chain | Fixed | Pages actions are pinned to resolved immutable commits; CI runs secret scan, `strk20.json` validation and dependency audit before artifact upload |

The project has not received an independent audit.
