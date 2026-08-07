# Research

Live findings that feed the contracts and the backend. The authoritative specs
live in `docs/`; this folder records what was verified against the actual
stack (registries, endpoints, SDK source, live services) and the concrete
patterns to use. If a research note and a `docs/` file disagree, the
`magicblock` skill and this folder are the evidence trail and the docs file is
what needs fixing.

Read order for someone building the program and the chain client:

| File | Question it answers | Feeds |
| --- | --- | --- |
| `01-program-architecture.md` | How the Anchor program is shaped: accounts, seeds, instructions, VRF, the exact macros | Lane A, `program/**` |
| `02-er-lifecycle-and-routing.md` | Delegation, commit, undelegate, Magic Actions, endpoints, commit budget | Lanes A + B |
| `03-per-privacy-and-tee.md` | Private ER, permission lifecycle, TEE auth, the privacy ladder | Lanes A + B, the submission |
| `04-economy-and-settlement.md` | Devnet USDC, escrow, vault, multipliers, the settle action, session keys | Lanes A + B |
| `05-chain-client-and-bots.md` | The TypeScript client, subscription model, bot engine, failure ladder | Lane B |

## Verification ledger

Everything below was checked live on **7 August 2026**, not recalled.

| Check | Result |
| --- | --- |
| `status.magicblock.app/api/services` devnet | `er`, `rpc_router`, `pricing_oracle`, `vrf_oracle` all `true`. TEE region present: `devnet-tee-as.magicblock.app`. |
| crates.io `ephemeral-rollups-sdk` | `0.16.2` (updated 2026-07-22) |
| crates.io `anchor-lang` | `1.1.2` (latest). Skill examples pinned to `1.0.2`. Gate 0.3 applies. |
| npm `@magicblock-labs/ephemeral-rollups-sdk` | `0.16.2` |
| Router `getDelegationStatus` | JSON-RPC POST to `devnet-router.magicblock.app`, returns `{ isDelegated: false }` for a non-delegated account, `fqdn` once delegated. |
| Devnet USDC mint | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`, 6 decimals (confirmed by MagicBlock docs default). |
| Devnet TEE validator identity | `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo` (`getIdentity` on `devnet-tee-as.magicblock.app`) |
| Devnet plain ER validator identity | `MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57` (`getIdentity` on `devnet-as.magicblock.app`) |
| SDK TEE auth exports | `getAuthToken(rpcUrl, publicKey, signMessage)` (uses `/auth/challenge` + `/auth/login`) and `verifyTeeRpcIntegrity(rpcUrl)` (uses `/quote` + `@phala/dcap-qvl` TDX verification), both in `@magicblock-labs/ephemeral-rollups-sdk@0.16.2`. |
| PER member flags | `AUTHORITY_FLAG`, `TX_LOGS_FLAG`, `TX_BALANCES_FLAG`, `TX_MESSAGE_FLAG`, `ACCOUNT_SIGNATURES_FLAG` in the SDK `Member` type. |
| Session keys example | `binary-prediction/anchor` from `magicblock-engine-examples` pins `session-keys = "=3.1.1"`, uses `#[session_auth_or]` + `#[derive(Accounts, Session)]`. |
| NPM Anchor client | `@coral-xyz/anchor` `0.32.1` (unchanged even when the program builds with Anchor 1.x). |

Re-verify the two rows marked "Gate" in `01-program-architecture.md` before
pinning, and re-run the `docs/technical/TECH-STACK.md` section 7 list on Sunday
morning. Verification confirms, it does not upgrade.
