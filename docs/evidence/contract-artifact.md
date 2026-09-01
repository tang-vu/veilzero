# Contract artifact identity

Status: **built and tested locally; not declared or deployed**.

These values identify the deterministic local build at source commit `cc5a092`. They are not a declaration transaction, deployed contract address, or mainnet evidence, and they must not be copied into `strk20.json` as either.

| Artifact | SHA-256 | Starknet class hash |
| --- | --- | --- |
| Sierra `veilzero_protocol_VeilZero.contract_class.json` | `b7550ab59ac4e3adacf4e51cf3555659ffd906853cf7e410d5a357e40c760040` | `0x00fd7a15f456de5ea026ef7464d5c60ac75712f1e3e3f3da455798c0b0156d27` |
| CASM `veilzero_protocol_VeilZero.compiled_contract_class.json` | `5e0a2e3a040f422c63838f7720fc301ae42b1ec2202a2458a9ba772f61525dc2` | `0x03006f14cdb03f79ff816465a5a18311df4b5177cadf7df3453b87038b188076` |

Reproduce after the documented Scarb build:

```powershell
pnpm verify:artifact
```

The Sierra class hash was also cross-checked with Starknet Foundry 0.63.0:

```text
sncast utils class-hash --sierra-file veilzero_protocol_VeilZero.contract_class.json
Class Hash: 0x00fd7a15f456de5ea026ef7464d5c60ac75712f1e3e3f3da455798c0b0156d27
```

Leading zeroes do not change a felt value; the verifier normalizes both hashes to 64 hexadecimal digits.
