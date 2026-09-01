# Security review

Review opened 2026-09-01; unresolved findings are retained.

| Finding | Severity | Status | Resolution/evidence |
|---|---|---|---|
| Diagnostic package contains local key/secret | High operational | Open by design | Explicit warning, ignored filename, download only; replace with password-wrapped export |
| Symmetric key was not vendor envelope encryption | High product | Fixed | Ephemeral X25519 + HKDF-SHA256 derives AES-GCM envelope keys; vendor decrypt round-trip and wrong-key tests pass |
| Pool ABI mismatch (#978) | High | Blocked upstream validation | No deployment until class/ABI match |
| `privacy_invoke` caller confusion | Critical | Fixed in source | Pin configured pool; vendor calls are separate |
| Duplicate settlement/nullifier reuse | Critical | Fixed + deployed-contract tested | status 4→5 + used-nullifier map before approval |
| Public raw claim nullifier allowed destination theft | Critical | Fixed + adversarially tested | Authorization stores only a secret commitment; claim requires case-key signature over destination note |
| Wallet resolves destination note after action construction | High integration | Open / blocks deployment | Keep destination binding; validate prepare/sign/re-prepare with a live Wallet API 0.10.3 implementation and abort on any note-ID drift |
| Stored case-auth commitment was unused | Critical | Fixed + adversarially tested | Clarifications verify Stark ECDSA over domain/program/case/message/size |
| Oversized/empty ciphertext | Medium | Fixed | 1..16400 ciphertext-byte contract bounds (16 KiB UTF-8 plaintext plus GCM tag) and tests |
| Ambiguous transaction retry | High | Fixed in diagnostic model | Ambiguous state cannot resubmit |
| Plaintext logging/storage | High | No instance found | No logger/localStorage/backend; field cleared after encrypt |
| Secret recovery package used as vendor transport | Critical operational | Fixed | Separate public envelope excludes case secret, local key, signing key and claim secret; schema, length and ciphertext commitment are checked before decryption; files over 64 KiB are rejected |
| Ambiguous commitment serialization / envelope field substitution | High integrity | Fixed | SHA-256 commitment parts are length-framed and bind ciphertext, AEAD parameters, program binding, case/report commitments and case public key; substitution tests fail closed |
| XSS/URL injection | Medium | No dynamic HTML | React text escaping; fixed external URLs |
| Dependency vulnerability | High | Fixed | Next 16.0.8 rejected; pinned 16.3.4; `pnpm audit` reports no known vulnerabilities |

The project has not received an independent audit.
