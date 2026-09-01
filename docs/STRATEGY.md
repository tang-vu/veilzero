# Strategy and live audit

Audit performed 2026-09-01 before repository creation against `starkience/strk20-hackathon` commit `60bf23088648fa88b462069c4b94f90ae996878d` (184 registry rows, 183 generated projects), starter commit `187fe789dd4f5de14ccb0953abfdb49a26643664`, skills commit `55fbd345dcc3f09db09ceb7e336f4da08dcd1a18`, and privacy commit `4db755b9512f00b540126737b605472ea2275e15`.

## Competitive matrix

| Project | Core user/product | Mainnet evidence | Own Cairo | Demo | Integration | Difference / gap | Collision |
|---|---|---:|---:|---:|---|---|---|
| GhostBounty | Researcher disclosure + reward | 0 | No implementation | No | Planned | One architecture commit; empty contracts/evidence | High concept, low shipped |
| QuietProof | Protected-source campaign funding | 0 | Campaign registry | No | Starter diagnostics | README labels core product shell/mock | Medium |
| Deadletter | Encrypted messages/reports | 3 | No registered contract | Yes | Pool transfers | No disclosure deadlines/reserve protocol | Medium-low |
| Aver | Selective balance proofs | 0 | 2 contracts | No | Gating anonymizer | General proof tool, not disclosure | Low |
| Cordon | Policy-gated shielded value | 3 | 4 contracts | Yes | Deep anonymizer | Compliance/policy infrastructure | Low |
| VeilZero | Deadline-bound disclosure + fixed-tier reserve | 0 | Yes, local | Local only | Stateful anonymizer | Committed SLA, reserve, one-time settlement, evidence receipts | — |

GhostBounty was inspected beyond copy: its head `b5fd15f570f26aabaeb72578c0c90a93cfc1d73e` contains README-only placeholders under contracts, crypto, SDK and web; `strk20.json` is empty. QuietProof head `ffd88bdfa7c9148180568d3143ec9bde47bf4fb1` implements a different campaign registry and admits campaign/claim/audit/indexer screens are mock/not live.

## Weighted decision

| Criterion | Weight | VeilZero score |
|---|---:|---:|
| Realistic mainnet completion | 25 | 17 |
| STRK20 integration depth | 20 | 18 |
| Differentiation | 20 | 16 |
| Judge-visible demo clarity | 15 | 14 |
| Open-source reuse | 10 | 9 |
| Post-sprint potential | 10 | 8 |
| **Total** | **100** | **82** |

No pivot condition was met. A direct conceptual competitor exists but has not shipped a complete product, mainnet evidence, contract or demo. VeilZero stays, with scope constrained to commitments, deadlines, fixed tiers, reserve accounting and pool-mediated claim.

## Technical feasibility and risks

- Official rules require three successful mainnet transactions touching the live pool and the project's contract path when contracts are declared.
- Starter pins Starknet.js 10.4.0, Wallet API types 0.10.3 and Cairo 2.18.0.
- Privacy SDK release line is 0.14.3 RC; matching services are mandatory.
- Upstream issue #978 documents a deployed-Sepolia/current-main anonymizer return-signature mismatch. Issue #956 asks how third-party clients reach a prover; #718 flags smart-wallet signing behavior. These block claims of end-to-end readiness, not local protocol work.
- The project will not guess hosted endpoints or deploy against an unverified pool ABI.
