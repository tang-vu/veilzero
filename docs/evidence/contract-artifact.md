# Contract artifact identity

Status: **built and tested locally; not declared or deployed**.

These values identify the deterministic reserve-custody release candidate at source commit `ee59b49`. They are not a declaration transaction, deployed contract address, or mainnet evidence, and they must not be copied into `strk20.json` as either.

| Artifact | SHA-256 | Starknet class hash |
| --- | --- | --- |
| Sierra `veilzero_protocol_VeilZero.contract_class.json` | `b13014c00ee0e65831e50a2c46611c3f3d9e6ece41236117c7eef0bb1a2d852b` | `0x06b410a4ce4494e79a34998957952d1502eb803fb2e15589021eaf0178b5cb56` |
| CASM `veilzero_protocol_VeilZero.compiled_contract_class.json` | `8abe0cc92302c14b6e48069cb2f6956d6e84f03df82131d6fad4f16b73d1ec53` | `0x0264bccfb4ff096e2de7b087ffec2a89fbd77c73ac360100bbe724a51cfabeed` |

Reproduce after the documented Scarb build:

```powershell
pnpm verify:artifact
```

The Sierra class hash was also cross-checked with Starknet Foundry 0.63.0:

```text
sncast utils class-hash --sierra-file veilzero_protocol_VeilZero.contract_class.json
Class Hash: 0x06b410a4ce4494e79a34998957952d1502eb803fb2e15589021eaf0178b5cb56
```

Leading zeroes do not change a felt value; the verifier normalizes both hashes to 64 hexadecimal digits.
