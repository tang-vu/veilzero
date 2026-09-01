# Contract artifact identity

Status: **built and tested locally; not declared or deployed**.

These values identify the deterministic post-overcommit-fix release candidate. They are not a declaration transaction, deployed contract address, or mainnet evidence, and they must not be copied into `strk20.json` as either. The exact source commit is recorded in release readiness after this candidate is pushed.

| Artifact | SHA-256 | Starknet class hash |
| --- | --- | --- |
| Sierra `veilzero_protocol_VeilZero.contract_class.json` | `7227a982ed374637214f9c73902af5b50b768494e885b3a148f84d5265fc221e` | `0x02450ec72f2e622888a3ab378cf4978dcdd717f2e2365b6fea6e70e7f785d269` |
| CASM `veilzero_protocol_VeilZero.compiled_contract_class.json` | `145b57ddad7e4fef1a90d2ab4825f4b008b755b6a19ae66b46727443f3d32397` | `0x00008f826a0adefdf8e4455df7013d07fd12c3a63a77062cd5e52eb1b03fbfeb` |

Reproduce after the documented Scarb build:

```powershell
pnpm verify:artifact
```

The Sierra class hash was also cross-checked with Starknet Foundry 0.63.0:

```text
sncast utils class-hash --sierra-file veilzero_protocol_VeilZero.contract_class.json
Class Hash: 0x02450ec72f2e622888a3ab378cf4978dcdd717f2e2365b6fea6e70e7f785d269
```

Leading zeroes do not change a felt value; the verifier normalizes both hashes to 64 hexadecimal digits.
