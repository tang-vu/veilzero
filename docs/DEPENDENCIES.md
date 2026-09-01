# Dependency inventory

| Package/tool | Exact version/source | Purpose | Sensitive material |
|---|---|---|---|
| Next.js | 16.3.4 | Web application | No intended secrets |
| React | 19.2.1 | UI | No |
| starknet | 10.4.0 | Wallet/API types and calls | Wallet prompts only; no keys |
| get-starknet discovery/standard | 6.0.2 | Wallet discovery | Public wallet metadata |
| types-js | 0.10.3 | Wallet API types | No |
| Zod | 4.1.5 | Runtime bounds | Validates plaintext locally |
| Cairo/Starknet | 2.18.0 | Contract | Public state only |
| STRK20 starter | commit 187fe789… | ABI/reference only | No |
| starknet-privacy | commit 4db755b… / 0.14.3 RC line | Pool/ABI reference | SDK would handle viewing material; not wired |

All JavaScript versions are exact. Lockfile integrity is mandatory.
