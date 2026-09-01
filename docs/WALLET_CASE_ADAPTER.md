# STRK20 case-action adapter

`src/lib/strk20-case-actions.ts` builds the two researcher-originated case actions that do not create an open note:

- submission maps to `privacy_invoke` action `0` and binds program, case, report commitment, ciphertext commitment, bounded payload size, and the case-scoped Stark public key;
- clarification maps to action `1` and supplies a Stark signature over `Poseidon(VZ_CLARIFY_V1, program, case, message commitment, ciphertext commitment, payload size)`.

Each path supplies all eleven fields expected by VeilZero's `privacy_invoke`, zeros fields that are invalid for that action, asks the wallet to prepare a real proof with simulation disabled, and rejects missing proof data, output, or proof facts. Neither action transfers value by itself. The live pool separately charges its current fee.

The adapter only prepares a call and proof. It does not call `wallet_addInvokeTransaction`, persist proof material, or present a successful state. Browser submission remains gated on a compatible wallet, deployed contract, current pool probe, fee estimate, explicit human signature, and receipt reconciliation.
