# Vendor administrator call adapter

`src/lib/vendor-admin-actions.ts` constructs the public Starknet account calls for the vendor lifecycle:

- create a program with bounded, strictly ordered configuration;
- approve exactly the requested token amount and fund the contract reserve in one multicall;
- pause or resume a program;
- acknowledge a case;
- commit a clarification request;
- accept or reject a case;
- authorize one of the three fixed reward tiers with a future block-time expiry.

The builder accepts no arbitrary entrypoint, rejects zero/out-of-field identifiers and commitments, bounds SLA and expiry values to `u64`, bounds rewards/funding to `u128`, and checks ordering before a wallet is involved. Exact approval avoids leaving a larger ERC-20 allowance than the reserve deposit requires.

These are call plans only. The connected account must match the program administrator, read current state and block time, estimate the network fee, present a human signature, and reconcile the receipt. VeilZero never holds or requests the account key.
