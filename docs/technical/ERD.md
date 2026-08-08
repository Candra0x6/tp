# ERD

Accounts, sizes, seeds, and above all **what is public and what is not**. The
public column is not documentation, it is the security model.

Owns: state shape. Does not own: the rules that mutate it (`GAME-LOGIC.md`) or
the delegation lifecycle (`MAGICBLOCK.md`).

---

## 1. The map

```
                    base layer (Solana)
   ┌──────────┐   ┌──────────┐   ┌──────────────┐
   │  Vault   │   │  Escrow  │   │   Run PDA    │
   │  (PDA)   │   │  (token) │   │              │
   └──────────┘   └──────────┘   └──────┬───────┘
                                        │ delegate
                    ephemeral rollup    ▼
                              ┌──────────────────┐
                              │   Run  (public)  │
                              └────────┬─────────┘
                                       │
              ┌────────────┬───────────┼───────────┬────────────┐
              ▼            ▼           ▼           ▼
        ClueSlot 0   ClueSlot 1  ClueSlot 2  ClueSlot 3
        seat 0 only  seat 1 only  ...         ...
        ── each gated to exactly one member on the TEE ──
```

## 2. Accounts

### 2.1 `Run` — public, delegated

The shared board. Everything here is meant to be seen by everyone, including
people who are not playing. Never put a secret in this account.

| Field | Type | Bytes | Notes |
| --- | --- | --- | --- |
| discriminator | | 8 | |
| `bump` | u8 | 1 | |
| `code` | [u8; 4] | 4 | join code, uppercase A-Z0-9 |
| `host` | Pubkey | 32 | |
| `players` | [Pubkey; 4] | 128 | seat order is fixed for the run |
| `player_count` | u8 | 1 | 2 to 4 |
| `bot_mask` | u8 | 1 | bit per seat, 1 = CPU |
| `depth` | u8 | 1 | 0 QUICK, 1 DEEP |
| `stake` | u64 | 8 | per player, USDC base units |
| `phase` | u8 | 1 | lobby, dealing, floor, resolve, bank, done |
| `floor` | u8 | 1 | zero indexed |
| `doors` | u8 | 1 | N for this floor, after party widening |
| `deadline_ts` | i64 | 8 | unix seconds, the whole timer |
| `votes` | [u8; 4] | 4 | door index + 1, zero means no vote |
| `marks` | [u8; 4] | 4 | public per seat mask of doors called cold |
| `vrf_nonce` | u64 | 8 | binds one request to one callback |
| `vrf_state` | u8 | 1 | idle, requested, dealt |
| `revealed_door` | u8 | 1 | `0xFF` until resolve, then the answer |
| `cleared` | u8 | 1 | floors cleared so far |
| `outcome` | u8 | 1 | running, banked, cleared, fell |
| `chat_head` | u8 | 1 | ring buffer cursor |
| `chat` | [ChatMsg; 24] | 720 | |
| **total** | | **936** | |

```
ChatMsg { author: u8, len: u8, body: [u8; 28] }     // 30 bytes
```

`marks` is public on purpose. It is the party's shared scratchpad, and the whole
point is that everyone sees it. `votes` is public for the same reason: a vote you
cannot see is not a vote you can argue with.

`revealed_door` holds `0xFF` and not the answer. **The safe door is never stored
before resolve**, because a public account that knows the answer is a public
answer. See section 4.

### 2.2 `ClueSlot` — private, delegated, one per seat

| Field | Type | Bytes | Notes |
| --- | --- | --- | --- |
| discriminator | | 8 | |
| `bump` | u8 | 1 | |
| `run` | Pubkey | 32 | |
| `player` | Pubkey | 32 | the only permitted reader |
| `seat` | u8 | 1 | |
| `floor` | u8 | 1 | which floor this mask is for |
| `mask` | u8 | 1 | **the secret.** doors this player can eliminate |
| `dealt` | bool | 1 | |
| **total** | | **77** | |

Pre-fund with permission rent before the create CPI, roughly 32 lamports per byte
of `EphemeralPermission`.

One byte carries the entire game. That is worth saying out loud, because it means
the privacy problem is small enough to solve properly rather than approximate.

### 2.3 `Vault` — public, base layer only

| Field | Type | Bytes |
| --- | --- | --- |
| discriminator | | 8 |
| `bump` | u8 | 1 |
| `authority` | Pubkey | 32 |
| `mint` | Pubkey | 32 |
| `balance` | u64 | 8 |
| `seeded` | u64 | 8 |
| `total_falls` | u64 | 8 |
| `total_payouts` | u64 | 8 |
| **total** | | **105** |

`seeded`, `total_falls` and `total_payouts` exist so the claim in `GAME-LOGIC.md`
6.1 is checkable rather than asserted. A judge can read this account and confirm
that payouts came from falls and the seed, and from nowhere else.

`total_falls` and `total_payouts` are **exact sums in base units**, not counts:
every fall adds the fallen pot to `total_falls`, every payout beyond the pot adds
the vault portion to `total_payouts`. So `balance == seeded + total_falls -
total_payouts` always holds, and the ledger reconciles against the token account
balances with no rounding drift.

### 2.4 `Escrow` — token account, base layer only

A plain SPL token account owned by the run PDA. Holds `stake * player_count` for
the duration. Never delegated, never touched from the ER. Released by the plain
base-layer `settle` handler, which runs after `final_settle` returns the Run to
base.

## 3. Seeds

```
Run        ["run",    code]
ClueSlot   ["clue",   run_pubkey, seat]
Vault      ["vault",  mint]
Escrow     ["escrow", code]
```

Seeds must match exactly between the `delegate` call and the account definition.
A mismatch here produces a delegation that looks fine on base and is invisible on
the ER, which is the single most expensive hour anyone loses to this stack.

## 4. Why the answer is not stored

`GAME-LOGIC.md` 3.2 proves that the safe door is exactly the door no clue
eliminates. So a `safe_door` field would be a second copy of a secret that
already exists, and it would have to be hidden just as carefully.

Instead the program recomputes it when it needs it:

```rust
let eliminated = clue_slots.iter().fold(0u8, |acc, s| acc | s.mask);
let safe = (!eliminated) & ((1u8 << doors) - 1);   // exactly one bit, by property E
```

The program reads every `ClueSlot` inside the enclave, which it is allowed to do
because the TEE gate is at RPC ingress and not at execution. Outside, nobody can
assemble the union.

This removes an entire class of bug. There is no commitment scheme to get wrong,
no nonce to leak, and no window where the answer sits in memory next to a field
somebody might make public in a later commit.

## 5. Public vs private, the whole table

| Account | Field | Who can read | If this leaks |
| --- | --- | --- | --- |
| Run | everything | anyone | nothing, all of it is meant to be seen |
| ClueSlot | `mask` | that player only | **the game is over.** union of masks is the answer |
| ClueSlot | everything else | that player only | harmless, but gated with it |
| Vault | everything | anyone | nothing, it is the honesty receipt |
| Escrow | balance | anyone | nothing |

One row in this table is load bearing. Any change that adds a field to `Run` gets
checked against it before it is written.

## 6. Lifecycle

| Phase | Where | Writes |
| --- | --- | --- |
| create, join, ready | base | Run, Escrow |
| delegate | base | Run and all ClueSlots to the delegation program |
| deal | ER | vrf request, then callback writes every ClueSlot mask and `vrf_state` |
| floor | ER | votes, marks, chat |
| resolve | ER | `revealed_door`, `cleared`, `phase`, commit |
| bank or climb | ER | `phase`, next floor setup, next vrf request |
| settle | ER then base | `final_settle` does `commit_and_undelegate`, then the base `settle` handler moves Escrow and Vault using the player ATAs in `remaining_accounts` |

Commits happen **once per floor**, not per action. A DEEP run is 5 commits plus
one undelegate, inside the 10 commit sponsorship cap with room to spare.
