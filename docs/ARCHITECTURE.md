# Architecture

The browser owns report plaintext, random case secret and recovery package. It builds domain-separated commitments and ciphertext before any network operation. A Ready-compatible wallet is intended to prove and submit STRK20 actions. The live pool calls the pool-pinned VeilZero anonymizer. The vendor uses a public administrator account for policy and lifecycle actions.

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

No database or key-holding backend is used. Hosted proving/discovery remain unconfigured until an official endpoint and its visibility are verified.
