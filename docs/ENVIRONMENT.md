# Environment snapshot — 2026-09-01

Windows PowerShell; git 2.53.0.windows.2; gh 2.89.0 authenticated as `tang-vu`; Node 24.14.1; npm 11.11.0; pnpm 11.24.0; corepack 0.34.6; Rust/Cargo 1.96.0; Docker 29.5.3; jq 1.8.1; curl 8.13.0; Python 3.14.4. Vercel CLI was missing. Parent workspace was not a Git repository.

Scarb 2.20.1 was downloaded from its official GitHub release into ignored project-local `.tools`, verified against SHA-256 `beb1a86275771fd6c84297c75b0a3f4f97f24262804d5f2627fe350a1bc2eb6b`; bundled Cairo is 2.20.0. Contract dependency remains pinned to Starknet 2.18.0 for starter compatibility.

Starknet Foundry has no native Windows release. Official Linux artifacts run in Docker: Foundry 0.63.0 (`A861C13238FE0686E921820B9606065CF07B1CCC6CC22D95CD299CD78B37A869`), Linux Scarb 2.20.1 (`6795B268DA13C8FF397A0F5E4B7A63F4B2B313D8A5E41FFF36626087279C4804`) and Universal Sierra Compiler 2.10.0 (`EAFA433885C32947FBE640937A12543D468A0E2905B62C177F0FD8099285C1B9`).

The public Cairo workflow downloads those same exact official release assets and verifies the recorded SHA-256 values before executing anything. It does not use a mutable composite setup action.
