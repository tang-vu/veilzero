# Destination-bound Wallet API claim adapter

`src/lib/strk20-claim.ts` resolves the conflict between a wallet-created open note and a case-key signature that must bind that note.

1. Build an open-note transfer plus VeilZero claim invoke with literal `${openNoteIds[0]}`, fixed before/after markers and zero signature fields.
2. Call `wallet_strk20PrepareInvoke(actions, true)`. Require all proof fields to be empty and the assembled call target to equal the freshly verified pool.
3. VeilZero permits the zero signature only when `get_tx_info().version == 2^128 + 3`, Starknet's estimation transaction version.
4. Extract exactly one felt between the two markers in the wallet-resolved call.
5. Sign `Poseidon(VZ_CLAIM_MSG_V1, program, case, claim_secret, note_id)` with the case-scoped Stark key.
6. Rebuild the actions and call `wallet_strk20PrepareInvoke(actions, false)`.
7. Require the final call to target the same verified pool. Extract its note ID and require equality with the signed candidate. Require non-empty proof data, output and proof facts.
8. Revalidate the pool target, note marker and proof immediately before any future submission call. Only then may a separate human signing gate call `wallet_addInvokeTransaction({ calls: [call], proof })`.

The adapter never persists or logs the proof or case private key. Any malformed/oversized wallet response, wrong pool, non-empty preview proof, missing/duplicate marker, zero/non-field note, note drift, or incomplete final proof stops before submission. Contract tests prove that canonical transactions reject the preview signature and that marker substitution fails. TypeScript tests prove extraction, signing, pool binding, preview/proof rejection, drift rejection and guarded submission.

The public browser panel now provides a prepare-only harness. It requires Wallet API 0.10.3, rechecks mainnet and the connected account, binds the reward destination to that account, runs both preparations, retains only a pass/fail verdict, and never invokes `wallet_addInvokeTransaction`. This is not yet live evidence. After the helper and an authorized case exist, use the selected compatible wallet to verify that simulation executes with the estimation version, marker-delimited calldata remains visible, the second preparation preserves the note ID, and the live pool accepts the deployed helper ABI. The harness necessarily follows initial deployment because an undeployed helper cannot be simulated.
