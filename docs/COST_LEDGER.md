# STRK cost ledger

Safety ceiling: 100 STRK total actual plus projected. This is a buffer, not a target.

| Date | Action | Network | Network fee | Pool fee | Actual | Status |
|---|---|---|---:|---:|---:|---|
| 2026-09-01 | Local research/build/test | Off-chain | 0 | 0 | 0 | Complete |
| 2026-09-03 | Three qualifying VeilZero pool actions | Mainnet projection | Unknown until wallet estimation | 18 STRK at observed 6 STRK/action | 0 | Projected only; re-read before signing |

Current actual: **0 STRK**. Known projected pool fees for the three qualifying actions: **18 STRK**, reconfirmed at mainnet block `14285500` on 2026-09-03. Account activation, declaration, deployment, reserve exposure, funding, vendor lifecycle and all network fees remain unestimated; therefore the total projection is not gate-ready. Unknown is never treated as zero.

`mainnet-budget.json` is the machine-readable source for the ceiling. `pnpm verify:budget` validates its exact 15-item inventory and reports the honest incomplete state. After every wallet estimate is entered as a plain decimal STRK amount with its evidence source, `pnpm gate:budget` must pass strictly below 100 STRK before a signature is presented. Accepted costs replace their projection with the actual amount and public transaction hash; they are never counted twice.
