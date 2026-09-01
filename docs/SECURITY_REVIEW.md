# Security review

Review opened 2026-09-01; unresolved findings are retained.

| Finding | Severity | Status | Resolution/evidence |
|---|---|---|---|
| Diagnostic package contains local key/secret | High operational | Open by design | Explicit warning, ignored filename, download only; replace with password-wrapped export |
| Symmetric key is not vendor envelope encryption | High product | Open | UI/README do not claim vendor readability |
| Pool ABI mismatch (#978) | High | Blocked upstream validation | No deployment until class/ABI match |
| `privacy_invoke` caller confusion | Critical | Fixed in source | Pin configured pool; vendor calls are separate |
| Duplicate settlement/nullifier reuse | Critical | Fixed in source | status 4→5 + used-nullifier map before approval |
| Oversized/empty ciphertext | Medium | Fixed | 1..16384 contract bounds and tests |
| Ambiguous transaction retry | High | Fixed in diagnostic model | Ambiguous state cannot resubmit |
| Pool/admin caller confusion | Critical | Fixed + deployed-contract tested | `privacy_invoke` accepts only the pinned pool; lifecycle calls accept only program admin |
| Duplicate settlement/nullifier misuse | Critical | Fixed + deployed-contract tested | State changes before external approval; wrong/repeated claims revert |
| Plaintext logging/storage | High | No instance found | No logger/localStorage/backend; field cleared after encrypt |
| XSS/URL injection | Medium | No dynamic HTML | React text escaping; fixed external URLs |
| Dependency vulnerability | High | Fixed | Next 16.0.8 rejected; pinned 16.3.4; audit pending |

The project has not received an independent audit.
