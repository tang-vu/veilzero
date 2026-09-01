# STRK20 wallet diagnostics

The developer diagnostic surface has fixed-action builders for:

- shield/deposit to self;
- private fixed-amount transfer;
- private fixed-amount self-transfer;
- unshield/withdraw to an explicit public recipient.

Token amounts are parsed from plain decimal strings into integer base units without JavaScript floating point. Zero, exponent notation, excessive precision, invalid decimals, field overflow and zero addresses fail before wallet interaction. Diagnostics never substitute `OPEN`; only VeilZero's destination-bound settlement path may request an open note.

These builders do not submit. Before enabling a diagnostic button, the app must confirm network and Wallet API capability, show the public token/recipient and exact base-unit amount, read the live pool fee, obtain a wallet network-fee estimate, apply the 100 STRK budget gate, require the human signature, and record/reconcile the returned transaction hash.

The public developer panel now exposes a safe intermediate step: after the read-only probe connects an account, it builds and renders the three account-bound action arrays locally. The preview makes no second wallet request and is explicitly not a fee estimate, proof, signature, submission, or transaction evidence. Its button remains disabled without a connected account.
