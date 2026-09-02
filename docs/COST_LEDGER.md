# STRK cost ledger

Safety ceiling: 100 STRK total actual plus projected. This is a buffer, not a target.

| Date | Action | Network | Network fee | Pool fee | Actual | Status |
|---|---|---|---:|---:|---:|---|
| 2026-09-01 | Local research/build/test | Off-chain | 0 | 0 | 0 | Complete |
| 2026-09-01 | Three qualifying VeilZero pool actions | Mainnet projection | Unknown until wallet estimation | 18 STRK at observed 6 STRK/action | 0 | Projected only; re-read before signing |

Current actual: **0 STRK**. Known projected pool fees for the three qualifying actions: **18 STRK**, based on the read-only mainnet observation at block `14205166` and reconfirmed for the current release candidate at block `14235648` on 2026-09-02. Declaration, deployment, funding, vendor lifecycle calls and network fees remain unestimated; therefore the total projection is not yet gate-ready. Unknown is never treated as zero, and the live fee must be re-read immediately before each signature.
