# 01 Program Architecture

How the Anchor program is built: versions, accounts, seeds, instructions, the
VRF deal, and the exact macros each context needs. This file is Lane A's
starting point. The authoritative shapes are `docs/technical/ERD.md` and
`docs/technical/GAME-LOGIC.md`; this file adds the verified MagicBlock layer.

## 1. Version pins (re-verify before first build)

```toml
[workspace.dependencies]
anchor-lang = { version = "1.1.2", features = ["init-if-needed"] }   # Gate 0.3: drop to "1.0.2" if the SDK anchor feature does not compile
anchor-spl  = { version = "1.1.2" }                                  # matches anchor-lang
ephemeral-rollups-sdk = { version = "0.16.2", features = ["anchor", "vrf", "access-control"] }
session-keys = { version = "=3.1.1", features = ["no-entrypoint"] }
```

- The SDK `anchor` feature selects the Anchor 1.x range. `anchor-compat` is for
  Anchor 0.28 to 1.0 and is not us.
- VRF is re-exported by the SDK `vrf` feature. No direct `ephemeral-vrf-sdk`.
- `access-control` is required for the private `ClueSlot` permissions.
- `session-keys` needs `no-entrypoint` and is verified against the
  `binary-prediction/anchor` example (SessionTokenV2).
- Crates.io confirmed `ephemeral-rollups-sdk` 0.16.2 and `anchor-lang` 1.1.2
  on 7 Aug 2026. The skill's verified example snapshot uses `anchor-lang`
  `=1.0.2`. **Gate 0.3 is real: build hello-world-delegates before writing
  game logic.**

Anchor 1.x API notes that bite:

- `CpiContext::new` takes the program **key**, not an account info:
  `CpiContext::new(ctx.accounts.token_program.key(), cpi_accounts)`.
- `init-if-needed` feature is on so account init with `init` constraints works
  on retried ER transactions.

## 2. Required macros on the program module

```rust
use ephemeral_rollups_sdk::anchor::{commit, delegate, ephemeral};
use ephemeral_rollups_sdk::anchor::{vrf, vrf_callback};
use ephemeral_rollups_sdk::cpi::DelegateConfig;
use ephemeral_rollups_sdk::ephem::{CallHandler, FoldableIntentBuilder, MagicIntentBundleBuilder};
use ephemeral_rollups_sdk::{ActionArgs, ShortAccountMeta};

#[ephemeral]   // REQUIRED, before #[program]. Injects process_undelegation + intent builders.
#[program]
pub mod trust_fall { /* ... */ }
```

`#[ephemeral]` injects `FoldableIntentBuilder` inside the module. Native Rust
call sites would need `use ...::FoldableIntentBuilder;` explicitly; inside the
Anchor module it is automatic.

## 3. Accounts, seeds, and where each lives

Seeds must match **exactly** between the `delegate_<field>` call and the
account definition. A mismatch is a delegation that looks fine on base and is
invisible on the ER.

| Account | Discriminator seed | Lives on | Delegated? | Public? |
| --- | --- | --- | --- | --- |
| `Run` | `["run", code]` | base then ER | yes | public (everything on it is meant to be seen) |
| `ClueSlot` | `["clue", run, seat]` | base then ER | yes | **private, the whole game** |
| `Vault` | `["vault", mint]` | base only | no | public, the honesty receipt |
| `Escrow` | `["escrow", run]` | base only | no | public balance |

Exact layouts and byte sizes are in `docs/technical/ERD.md` sections 2.1 to
2.4. The totals are what matter for rent and for the `space` argument.

### The one byte that is the game

```rust
// docs/technical/ERD.md 2.2
pub struct ClueSlot {
    pub bump: u8,
    pub run: Pubkey,       // 32
    pub player: Pubkey,    // 32, the only permitted reader
    pub seat: u8,
    pub floor: u8,
    pub mask: u8,          // THE secret. doors this player can eliminate.
    pub dealt: bool,
}
```

`Run` never stores the safe door. The program recomputes it on demand:

```rust
let eliminated = clue_slots.iter().fold(0u8, |acc, s| acc | s.mask);
let safe = (!eliminated) & ((1u8 << doors) - 1); // exactly one bit, by property E
```

## 4. The clue algorithm, pure and testable

`docs/technical/GAME-LOGIC.md` section 3 is the spec. It is ~20 lines, pure
Rust with no Anchor types, and it must live in its own module (`clue.rs`) so
`tests/clue.rs` can import it without a validator.

```rust
pub fn deal(n: u8, p: u8, r: &[u8; 32]) -> (u8, [u8; 4]) {
    let safe = r[0] % n;
    let mut wrong: Vec<u8> = (0..n).filter(|d| *d != safe).collect();
    // Fisher-Yates seeded from r[1..], splitmix64 or similar deterministic prng
    // then round robin: clues[i % p] |= 1 << wrong[i]
}
```

The three properties, each a test over 10k seeds and every N, P:

- `clue_truth`      : `clues[i] & (1 << safe) == 0` for all i
- `clue_exact`      : `OR(clues) == all_doors \ {safe}`
- `clue_necessary`  : any P-1 clues leave >= 2 candidates

The widening rule `N = max(base_doors[floor], party_size + 1)` keeps
`N >= P + 1`, which is what makes `clue_necessary` hold.

## 5. Instruction surface, split by layer

```
BASE  initialize_vault   admin seeds Vault, one-time
BASE  create_party       host, Run + Escrow, lock host USDC into Escrow
BASE  join_party         player, lock USDC, seat fills in order
BASE  ready              any player, flips a ready bit
BASE  delegate           host (or any member), delegates Run + all ClueSlots

ER    request_deal       #[vrf], fires VRF for the current floor
ER    callback_deal      #[vrf_callback], writes every ClueSlot.mask, sets vrf_state
ER    vote               session-enabled, door index + 1, freely changeable
ER    mark               session-enabled, writes a bit into the party mask
ER    chat               session-enabled, charset-validated, ring buffer
ER    resolve            close the vote by deadline or by majority, reveal, commit
ER    resolve_expired    any client/bot, validated against Clock::unix_timestamp
ER    bank_or_climb      majority vote, advances phase, fires next floor's VRF
ER    commit_floor       commit Run + ClueSlots, once per floor
ER    final_settle       commit_and_undelegate + Magic Action payout (bank/clear/fall)

BASE  settle             #[action] target, run-PDA signer, distributes escrow + vault
```

The docs commit **once per floor**, not per action: a DEEP run is 5 commits
plus one undelegate, inside the 10 free commits per delegation.

## 6. VRF: the deal

Request and callback are two executions. `docs/technical/MAGICBLOCK.md`
section 5 covers the design; here is the mechanical shape.

Request context gets `#[vrf]`, which injects `program_identity`, `vrf_program`,
`slot_hashes`, `system_program` and `invoke_signed_vrf`. Without it the
program does not compile.

```rust
pub fn request_deal(ctx: Context<RequestDeal>, floor: u8) -> Result<()> {
    let run = &mut ctx.accounts.run;
    require!(run.vrf_state == VrfState::Idle, ErrorCode::VrfBusy);
    let ix = create_request_scoped_randomness_ix(RequestRandomnessParams {
        payer: ctx.accounts.payer.key(),
        oracle_queue: ctx.accounts.oracle_queue.key(),
        callback_program_id: ID,
        callback_discriminator: instruction::CallbackDeal::DISCRIMINATOR.to_vec(),
        caller_seed: [0u8; 32], // could bind to run nonce
        accounts_metas: Some(vec![SerializableAccountMeta {
            pubkey: ctx.accounts.run.key(),
            is_signer: false,
            is_writable: true,
        }]),
        callback_args: Some(vec![run.floor]),
        ..Default::default()
    });
    ctx.accounts.invoke_signed_vrf(&ctx.accounts.payer.to_account_info(), &ix)?;
    run.vrf_state = VrfState::Requested;
    run.vrf_nonce += 1;
    Ok(())
}

#[vrf]
#[derive(Accounts)]
pub struct RequestDeal<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(mut, seeds = [b"run", run.code.as_slice()], bump)]
    pub run: Account<'info, Run>,
    #[account(
        mut,
        constraint = oracle_queue.key() == vrf::consts::DEFAULT_EPHEMERAL_QUEUE
            || oracle_queue.key() == vrf::consts::DEFAULT_EPHEMERAL_TEST_QUEUE
    )]
    pub oracle_queue: UncheckedAccount<'info>,
}
```

**The queue constant decides the failure.** Requesting from inside the ER
requires `DEFAULT_EPHEMERAL_QUEUE` (`5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc`).
The base layer uses `DEFAULT_QUEUE`. Wrong queue for the runtime is the most
common VRF failure.

Callback context gets `#[vrf_callback]`, which injects the scoped VRF identity
signer check. **A missing `#[vrf_callback]` compiles and accepts randomness
from anybody.** It is the difference between a fair deal and a rigged one.

```rust
pub fn callback_deal(ctx: Context<CallbackDeal>, randomness: [u8; 32], floor: u8) -> Result<()> {
    // idempotent: if run.floor != floor, or vrf_state == Dealt, return early.
    // Also guard on vrf_state == Requested, so a duplicate callback cannot deal twice.
    let (safe, clues) = deal(ctx.accounts.run.doors, ctx.accounts.run.player_count, &randomness);
    for (seat, slot) in ctx.accounts.slots.iter_mut().enumerate() {
        slot.mask = clues[seat];
        slot.floor = ctx.accounts.run.floor;
        slot.dealt = true;
    }
    // do not store `safe`. recomputed from the union when resolving.
    ctx.accounts.run.vrf_state = VrfState::Dealt;
    Ok(())
}

#[vrf_callback]
#[derive(Accounts)]
pub struct CallbackDeal<'info> {
    #[account(mut, seeds = [b"run", run.code.as_slice()], bump)]
    pub run: Account<'info, Run>,
    #[account(
        mut,
        seeds = [b"clue", run.key().as_ref(), seat.to_le_bytes().as_slice()],
        bump
    )]
    pub slots: Vec<Account<'info, ClueSlot>>, // all four seats; the safe door is computed from the union
}
```

### State machine and recovery

- `idle -> requested(nonce) -> dealt` on `Run.vrf_state`.
- Callback is bound to `(run, floor)` and idempotent.
- 10s timeout with no callback: client calls `request_deal` again with a new
  nonce. The old callback is rejected because `vrf_state != Requested` or the
  floor advanced.
- Fire the next floor's request the moment the previous floor resolves, so the
  deal for `f+1` is in flight during the bank vote.

## 7. Floor mechanics

### Vote

- `votes: [u8; 4]`, value is `door + 1`, 0 means no vote.
- Threshold `needed = player_count / 2 + 1` (2 of 2, 2 of 3, 3 of 4).
- Any player may change their vote while the timer runs. The floor resolves
  the instant `needed` players agree on one door.
- On deadline with no majority: plurality wins, ties take lowest index, zero
  votes is a fall. Enforce in `resolve_expired` and `resolve`.

### Marks

- `marks: [u8; 4]`, one byte per seat, a bit per door called cold. Public on
  purpose. The board shows the union. Never a secret.

### Chat

- 24-entry ring buffer of 30-byte `ChatMsg { author: u8, len: u8, body: [u8; 28] }`.
- **Charset is validated in the program.** Allowed: `A-Z`, `0-9`, space,
  `. , ? ! -`. Reject lowercase and control bytes rather than folding them.
  Rejection fails the transaction. This is a trust boundary, not a UI rule.

## 8. Payout decision (see `04-economy-and-settlement.md`)

`bank_or_climb` never moves tokens. It flips `Run.outcome`, then the client
triggers `final_settle`, which attaches a Magic Action that runs the base-layer
`settle` instruction. The settle target is marked `#[action]` and signs with
the run PDA seeds via `build_and_invoke_signed`.

## 9. What Lane A verifies before handing off

```
cargo test                      # clue_necessary must be green, 10k seeds
anchor build                    # SDK 0.16.2 anchor feature compiles (Gate 0.3)
# then the three-way delegation check, docs/technical/MAGICBLOCK.md 3
```
