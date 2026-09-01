# Reward authorization request

The researcher exports a strict, public JSON artifact after creating a case under a committed program manifest. It contains:

- program and case identifiers;
- a Poseidon commitment to the locally retained one-time claim secret;
- the case signing public and verification keys;
- a case-key signature over `VZ_REWARD_REQ_V1`, program, case, and claim commitment;
- version, kind, and message hash.

It never contains the claim secret, case signing private key, report plaintext, local encryption key, or recovery witness. Unknown fields fail schema validation, and browser imports are capped at 32 KiB.

The vendor import verifies the full public key, Stark signature, message hash, program binding, case binding, and equality with the public key committed by case submission. The verified signature is included in `authorize_reward`. Cairo independently recomputes the same Poseidon hash and verifies it against the case key stored on submission before locking reserve. Vendor claim-commitment substitution and cross-program replay therefore fail on-chain with `BAD_SIGNATURE`.

The vendor still chooses a fixed program tier and a future expiry according to its public policy. Those choices, the resulting amount, commitment, expiry, transaction time, and authorization event are public. The artifact proves that the case owner authorized the one-time claim commitment; it does not prove that the vendor chose a fair tier or expiry, funded enough reserve, or submitted the transaction.
