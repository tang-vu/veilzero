# Public program manifest

A vendor can now construct and download a public, secret-free program manifest in the demo. It binds:

- random public program identifier;
- program name and disclosure policy;
- X25519 encryption public key and its domain-separated commitment;
- acknowledgement and remediation SLAs;
- reward token address;
- three strictly increasing fixed reward tiers;
- creation timestamp.

The policy commitment hashes a canonical fixed-order representation under `VEILZERO_V1:PROGRAM_POLICY`. The encryption commitment is identical to the `programKeyBinding` placed in each researcher case package, so a case can prove which published encryption key it targeted. Verification recomputes both commitments and rejects key, policy, deadline, token or tier substitution.

The manifest contains no X25519 private key, case secret, claim secret or signing material. The separately downloaded vendor key package remains sensitive and must be stored offline. A manifest is not on-chain evidence until its identifiers and commitments match a successfully executed `create_program` transaction.
