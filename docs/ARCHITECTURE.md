# Architecture

The browser owns report plaintext, vendor X25519 private key, random case secret, case-scoped Stark signing key and recovery package. A researcher derives an envelope key from an ephemeral X25519 key and the program public key, then builds domain-separated commitments before any network operation. A separate shareable JSON envelope contains ciphertext and public verification material but no recovery secrets. Its transport is out of band. A Ready-compatible wallet is intended to prove and submit STRK20 actions. The live pool calls the pool-pinned VeilZero anonymizer. The vendor uses a public administrator account for policy and lifecycle actions.

```mermaid
sequenceDiagram
  participant R as Researcher browser
  participant W as Privacy wallet
  participant P as STRK20 pool
  participant V as VeilZero
  participant A as Vendor
  R->>R: Encrypt report and derive commitments
  R->>W: Request private submit action
  W->>P: Proof-backed transaction
  P->>V: privacy_invoke(submit)
  A->>V: acknowledge / accept / authorize
  W->>P: Proof-backed claim
  P->>V: privacy_invoke(claim)
  V-->>P: OpenNoteDeposit(fixed tier)
  P-->>W: Shielded note
```

No database or key-holding backend is used. Hosted proving/discovery remain unconfigured until an official endpoint and its visibility are verified. The claim adapter is intentionally deferred: Wallet API 0.10.3 resolves an open-note placeholder during preparation, but the contract requires the exact resolved note ID in the case-key signature. A live compatible wallet must prove that prepare/sign/re-prepare preserves the binding before submission is enabled.
