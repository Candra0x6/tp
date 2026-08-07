# 04 Economy and Settlement

Where the money is, how it moves, and the one action that moves it at
settlement. Also: session keys, because a DEEP run is forty wallet popups
without them.

## 1. The devnet USDC mint

Verified live. The MagicBlock private payments docs default to this mint on
devnet, and it is the canonical devnet USDC used by the ecosystem.

```
DEVNET_USDC_MINT = 4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU   # 6 decimals
```

- All amounts in the program are base units (1 USDC = 1_000_000).
- The vault is seeded at deploy from this mint.
- The escrow, the player ATAs, and the vault token account all use it.
- Faucet: if devnet USDC is dry on Sunday, fall back to the zero-stake QUICK
  PLAY path already in `docs/technical/MAGICBLOCK.md` section 8. Pre-fund three
  team wallets on D0 and keep them topped up.

## 2. The three money accounts

| Account | Holds | Authority | Never |
| --- | --- | --- | --- |
| `Escrow` (token account) | `stake * player_count`, locked at lobby | run PDA (`["escrow", run]`) | delegated, touched from the ER |
| `Vault` (PDA) | seed + every fallen pot | vault PDA (`["vault", mint]`) | touched before settlement |
| Player ATAs | individual balances | players | moved except by the settle handler |

The economy math is fixed in `docs/technical/GAME-LOGIC.md` section 6:

```
stake      1 USDC per player
pot        stake * party_size
M          1.3, 1.8, 2.6, 3.8, 6.0 across floors cleared
payout     = min(pot * M[cleared], pot + vault.balance)
split      = payout / party_size           # equal, always
on fall    = pot -> vault, players get nothing
vault      = seeded + sum(fallen pots) - sum(payouts beyond pot)
```

`vault.seeded`, `vault.total_falls`, `vault.total_payouts` make the claim
"payouts come from falls and the seed" checkable by reading one account.

## 3. Locking the stake on base

Stake is locked on the base layer **before** delegation and is never touched
from the ER. `create_party` and `join_party` do a plain SPL transfer from the
player's ATA into the run-owned escrow token account. The run PDA signs the
transfer with its `["escrow", run]` seeds.

```rust
// base-layer instruction
pub fn join_party(ctx: Context<JoinParty>, seat: u8) -> Result<()> {
    require!(seat < ctx.accounts.run.player_count, ErrorCode::SeatTaken);
    token::transfer(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            SplTransfer {
                from: ctx.accounts.player_ata.to_account_info(),
                to: ctx.accounts.escrow.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        ctx.accounts.run.stake,
    )?;
    ctx.accounts.run.players[seat as usize] = ctx.accounts.payer.key();
    Ok(())
}
```

No session key is ever in this path. The stake path is wallet-only, base-only.

## 4. Settlement: one Magic commit, one plain base instruction

Per `docs/technical/ERD.md` section 6, settlement is "ER then base". The final
`final_settle` instruction is a bare `commit_and_undelegate` that carries **no
actions**. After it settles, a plain base-layer `settle` handler moves the money.

Why no Magic Action: an `#[action]` callback carries only a fixed declared
account set, and callbacks have no `remaining_accounts`. A 2-4 way split needs
2-4 player ATAs, which is variable length. The program would have to grow `Run`
with four pre-declared ATA fields and repeat the whole settlement in action
form. The plain handler is smaller, and its cost is not atomicity with the
commit: the client reconciles the deltas instead of assuming them.

The `settle` handler (run-PDA signed, base layer, plain `Context`) does, in
order:

1. Read the committed `Run` state: `outcome`, `cleared`, `player_count`,
   `stake`, `code`, and the four player seats.
2. Validate the 2-4 player ATAs in `remaining_accounts`: owner must equal the
   seat's player and the mint must equal the escrow's mint.
3. Fall: transfer the escrow balance to the vault token account; increment
   `vault.total_falls`.
4. Bank or clear: compute `payout = min(pot * M[cleared], pot + vault.balance)`;
   transfer `pot` back from escrow, split across player ATAs; if
   `payout > pot`, transfer the difference from the vault token account, split
   equally; increment `vault.total_payouts`; clamp stays in the vault (the
   `min` already enforces it).
5. Each transfer is an SPL token CPI with the run (escrow authority) or vault
   (vault authority) PDA seeds. `run.settled` is set last, so a mid-handler
   failure reverts everything and the run stays settleable.

Design decisions that keep this correct:

- **The clamp is inside the program.** `payout <= pot + vault.balance` is
  checked by construction, and the UI never shows a number the program did not
  clamp. Rule 3 of `CLAUDE.md`.
- **Equal split only.** No per-player weighting. Weighting by whose clue
  mattered teaches players to withhold information, the opposite of the game.
- **Idempotency.** `run.settled` guards the handler: a second `settle` call
  fails up front, and retrying `final_settle` after a failed commit does not pay
  twice.
- **Rake is zero.** The program transfers nothing to any team wallet. The only
  inflows to the vault are the seed and falls.

Sizing: a settle for 4 players is escrow -> N player ATAs plus vault -> N player
ATAs. That is 8 SPL transfers plus reads, well within one base instruction, but
it should be tested against a real 4-player run before Sunday.

## 5. Reconciliation is a real task

Scheduling success is not execution. `docs/technical/MAGICBLOCK.md` section 8
and the skill's Magic Actions reference both name this: observe the base-layer
effect before reporting settled, and expose an unclaimed payout the player can
settle manually.

Minimal reconciliation in the client:

1. After `final_settle`, extract the base signature with `GetCommitmentSignature`.
2. Confirm it on the base connection.
3. Read each player's ATA on the base connection and the vault account; assert
   the deltas match the split.
4. If the commit landed but `run.settled` is still false (state `outcome`
   terminal, no payout), surface "SETTLEMENT PENDING" and call the plain
   `settle` handler again. Never an optimistic "PAID".

This is also what the S8 RESULTS screen reads: new vault balance, split per
player, floors cleared, blind odds for the depth actually played.

## 6. Session keys (why a run is playable)

Without session keys, a DEEP run is roughly forty wallet popups. Session keys
make vote/mark/chat silent. The stake path and the settle path stay wallet-only
and base-only.

Verified against `binary-prediction/anchor` in `magicblock-engine-examples`:

```toml
session-keys = { version = "=3.1.1", features = ["no-entrypoint"] }
```

```rust
use session_keys::{session_auth_or, Session, SessionError, SessionTokenV2};

#[session_auth_or(
    ctx.accounts.payer.key() == ctx.accounts.player.key(),
    SessionError::InvalidToken
)]
pub fn vote(ctx: Context<Vote>, door: u8) -> Result<()> { /* ... */ }

#[derive(Accounts, Session)]
pub struct Vote<'info> {
    pub payer: Signer<'info>,
    pub player: UncheckedAccount<'info>, // user authority for the session token
    #[account(mut, seeds = [b"run", run.code.as_slice()], bump)]
    pub run: Account<'info, Run>,
    #[session(signer = payer, authority = player.key())]
    pub session_token: Option<Account<'info, SessionTokenV2>>,
}
```

Client side uses `@magicblock-labs/gum-sdk` to create the session
(`SessionTokenV2`) with an expiry and the program binding. Scope it:

- Session-enabled: `vote`, `mark`, `chat`.
- Wallet-only: `create_party`, `join_party`, `ready`, anything on base.
- Never session: nothing that touches USDC. The stake is locked before
  delegation and the payout is the plain base-layer `settle` handler signed by
  the run PDA.

The session signer must exist and be funded on the ER (or topped up with
`lamportsDelegatedTransferIx`). Revoke the session at run end. Session validity
is not token authority: the session key may act on the run, it may never move
USDC.

## 7. What Lane A + B verify before Sunday

```
1.  cargo test                        # clue math + vote + clamp + charset
2.  full QUICK run, two browsers       # both see votes under 100ms
3.  full DEEP run, live payout         # escrow -> ATAs, vault delta correct
4.  a 4-player settle                  # compute units hold, all 8 transfers land
5.  failed commit test                  # final_settle fails, run not settled, retry shown
6.  session key run                    # no wallet popup on vote/mark/chat
```
