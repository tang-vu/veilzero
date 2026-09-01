# Privacy boundary

Hidden intent, public facts and correlation surfaces are listed in the README and visible application panel. The implemented vendor path uses ephemeral X25519 ECDH, HKDF-SHA256 and AES-256-GCM entirely in the browser. The program publishes only its X25519 public key; its private package and decrypted plaintext never leave browser memory unless the vendor explicitly downloads the key package. Researchers can export a public encrypted envelope that omits recovery, signing, claim and local encryption secrets. Its out-of-band carrier still sees file size, timing and endpoints. With no program key, the app clearly labels its locally generated AES key as a diagnostic-only fallback.

The pool/prover/discovery route may see requests, timing, sizes and wallet/network metadata depending on the selected official deployment. OHTTP can hide payloads from a relay but not timing/size, and trust-on-first-use is not equivalent to pinning. No service URL is guessed or configured.

The reward authorization request is intentionally public and contains program ID, case ID, claim commitment, case public key, signature, message hash, and creation time. It excludes the claim secret and every private key. Its program/case association is therefore visible, while the secret needed to claim remains only in the researcher recovery package until settlement calldata reveals it.

Shield deposits are public. The one-time claim secret and case signature become public in successful settlement calldata; their unrelated recovery material remains hidden. Fixed tiers reduce, but do not remove, amount fingerprinting. `privacy_invoke` call shape, contract, timing, lifecycle and arguments are public/correlatable. The software makes no absolute-anonymity or compliance claim.
