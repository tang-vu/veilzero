# Contract artifact identity

Status: **built and tested locally; not declared or deployed**.

These values identify the deterministic case-signed reward-authorization release candidate at source commit `8de77540320b99dea5dfafdc65dad03355c453fd`. They are not a declaration transaction, deployed contract address, or mainnet evidence, and they must not be copied into `strk20.json` as either.

| Artifact | SHA-256 | Starknet class hash |
| --- | --- | --- |
| Sierra `veilzero_protocol_VeilZero.contract_class.json` | `fd033dfe84634a1c46e6854ade449e5fbaf67f64a79409539cbc1c1819622ca8` | `0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503` |
| CASM `veilzero_protocol_VeilZero.compiled_contract_class.json` | `816fc781916a10d441c01fc2f90e2854f55cc94a0201bad982fd2c6d98afcbe9` | `0x006bea38144dd691e99894a0f603823c29f33d3c4013abecd2999c67a2391b78` |

Reproduce after the documented Scarb build:

```powershell
pnpm verify:artifact
```

The Sierra class hash was also cross-checked with Starknet Foundry 0.63.0:

```text
sncast utils class-hash --sierra-file veilzero_protocol_VeilZero.contract_class.json
Class Hash: 0x01c4ddb21597feb40ad7d51da6749c1b8cd6b52b84b7ffe13ae4da9619920503
```

Leading zeroes do not change a felt value; the verifier normalizes both hashes to 64 hexadecimal digits.
