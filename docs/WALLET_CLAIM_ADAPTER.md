# Destination-bound Wallet API claim adapter

`src/lib/strk20-claim.ts` resolves the conflict between a wallet-created open note and a case-key signature that must bind that note.

1. Build an open-note transfer plus VeilZero claim invoke with literal `${openNoteIds[0]}`, fixed before/after markers and zero signature fields.
2. Call `wallet_strk20PrepareInvoke(actions, true)`. The proof is deliberately empty and cannot be submitted.
3. VeilZero permits the zero signature only when `get_tx_info().version == 2^128 + 3`, Starknet's estimation transaction version.
4. Extract exactly one felt between the two markers in the wallet-resolved call.
5. Sign `Poseidon(VZ_CLAIM_MSG_V1, program, case, claim_secret, note_id)` with the case-scoped Stark key.
6. Rebuild the actions and call `wallet_strk20PrepareInvoke(actions, false)`.
7. Extract the final note ID and require equality with the signed candidate. Require non-empty proof data, output and proof facts.
8. Only then may the browser call `wallet_addInvokeTransaction({ calls: [call], proof })`, which presents the human wallet signature prompt.

The adapter never persists or logs the proof or case private key. Any missing/duplicate marker, zero/non-field note, note drift, or incomplete proof stops before submission. Contract tests prove that canonical transactions reject the preview signature and that marker substitution fails. TypeScript tests prove extraction, signing, drift rejection, proof rejection and guarded submission.

This is not yet live evidence. Before deployment, verify against the selected Wallet API 0.10.3 implementation that simulation executes with the estimation version, marker-delimited calldata remains visible in the returned call, the second preparation preserves the note ID, and the live pool accepts the deployed helper ABI.
