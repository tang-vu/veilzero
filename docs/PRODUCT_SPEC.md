# Product specification

VeilZero serves security programs and pseudonymous researchers. The MVP supports one vendor-created program, bounded encrypted case commitments, acknowledgement, accept/reject, a fixed-tier reserve-backed authorization, pool-mediated settlement and narrow evidence export.

States: absent → submitted → acknowledged → accepted or rejected → reward authorized → settled. Rejected and settled are terminal. Submission binds program, case, report, ciphertext and case-auth commitments. Authorization binds program, case, fixed tier, nullifier and expiry.

Success means a judge can create/read a program, encrypt locally, observe honest receipt state, inspect the on-chain contract, and verify pool plus project-contract involvement. A frontend animation is never evidence.
