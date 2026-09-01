# Mainnet evidence plan

| # | Action | Entrypoint | Expected state/event | Privacy and leakage | Qualification |
|---|---|---|---|---|---|
| 1 | Submit bounded encrypted case | `privacy_invoke` action 0 | status 1; `CaseSubmitted` | plaintext hidden; time, size, commitments public/correlatable | Pool and project path |
| 2 | Commit clarification | `privacy_invoke` action 1 | `ClarificationCommitted` | content hidden; action/time public | Pool and project path |
| 3 | Claim fixed tier | `privacy_invoke` action 2 | status 5; nullifier used; `RewardSettled`; open note | recipient linkage intended shielded; tier/time public or correlatable | Pool and project path |

For each action, the human wallet, token amount, live network estimate, live pool fee, contract address, calldata, expected event, recovery and reconciliation command must be filled immediately before signing. No placeholder hash enters `strk20.json`.
