# MAGICBLOCK

Every boundary we do not control, what we use it for, and what we do when it
fails. Lane A and Lane B both read this before writing anything.

**The `.claude/skills/magicblock` skill is the authority.** It ships a verified
SDK 0.16.2 snapshot. Where this document and the skill disagree, the skill wins
and this document is wrong and should be fixed. Nothing you or an agent remembers
about MagicBlock from before this repo is trustworthy: the SDK renamed the commit
functions, moved VRF into the main crate, and changed the recommended endpoints.

---

## 1. What we use, and what each one buys

| Product | What it buys TRUST FALL | Load bearing |
| --- | --- | --- |
| **Ephemeral Rollup** | 10ms shared state so votes, marks and chat feel instant, and zero fee so a run is hundreds of free actions | yes |
| **Private ER (TEE)** | the clue in your hand is unreadable to everyone else, at the RPC ingress | **yes, it is the game** |
| **VRF** | the safe door and the clue deal are provably not rigged by us | yes |
| **Crank** | the floor timer ticks with no server | no, see section 6 |
| **Session keys** | one signature per run instead of one per action | no, quality of life |
| **Magic Actions** | payout settles on Solana atomically with the final commit | yes at settlement |

Everything else MagicBlock offers is out of scope. Depth on the ones that matter
beats breadth across the catalogue, and the winner pattern across six Blitz
rounds is unambiguous about this.

## 2. Endpoints, and the one rule about them

```
base layer   https://rpc.magicblock.app/devnet
router       https://devnet-router.magicblock.app/
ephemeral    the `fqdn` returned by router getDelegationStatus
```

**Never hardcode an ER endpoint.** Ask the router for the account's status and use
the `fqdn` it returns. The region serving us in testing is not guaranteed to be
the region serving us on Sunday, and a hardcoded `devnet-as` is a demo that dies
silently when a validator moves.

Routing, which is the thing that breaks first for everyone:

| Transaction | Goes to |
| --- | --- |
| init accounts, delegate, USDC escrow | base layer |
| vote, mark, chat, tick, resolve floor | ephemeral rollup |
| commit, undelegate | ephemeral rollup |

Service status is at `https://status.magicblock.app/api/services`. Fetch it
live, never answer from memory. Keys are `mainnet` and `devnet`, regions are
`asia`, `europe`, `usa`, `tee`, services are `er`, `rpc_router`, `pricing_oracle`,
`vrf_oracle`.

## 3. Delegation lifecycle

```
1  base      init Run, ClueSlot[i], Vault PDAs, lock USDC
2  base      delegate Run and every ClueSlot
3  ER        the entire run: deal, vote, mark, chat, resolve, climb
4  ER        commit at the end of each floor
5  ER        commit_and_undelegate on bank, clear, or fall
6  base      Magic Action pays out atomically with the final commit
```

Required macros, and what breaks without each:

- `#[ephemeral]` on the program module, **before** `#[program]`. Injects the
  `process_undelegation` callback. Without it accounts delegate fine and can
  never come back.
- `#[delegate]` on the delegation context, `#[commit]` on commit contexts.
- `#[vrf]` on the VRF request context, `#[vrf_callback]` on the callback context.

Use `MagicIntentBundleBuilder` for commits. The free functions `commit_accounts`
and `commit_and_undelegate_accounts` are deprecated and any agent that suggests
them is working from stale memory.

**Commit sponsorship is 10 free commits per delegation.** A DEEP run commits once
per floor, so 5, plus one final undelegate. That fits, with four to spare. It
would not fit if we committed per action, which is exactly why we do not. If the
cap is ever hit, re-delegating refreshes the quota.

**The delegation debugging invariant.** A correctly delegated account looks owned
by the delegation program on base, owned by our program on the ER endpoint the
router names, and reports `delegated=true` in the ER. Any bug report that does not
include all three observations is not yet a bug report.

## 4. The privacy ladder, and what each rung honestly provides

This is the most important table in the repo. `GAME-LOGIC.md` 3.2 proves that
reading every clue is the same as knowing the answer, so the rung we deploy on is
the difference between a game and a demonstration of a game.

| Rung | What a player with a terminal can do | Ship it? |
| --- | --- | --- |
| **0. Public ER** | read every clue with one `getAccountInfo`, win every floor alone | only as a scaffold, never as the submission |
| **1. Public ER, honest** | same, but the screen and README say so plainly | acceptable fallback if rung 2 fails |
| **2. Private ER** | read only their own clue, blocked at the enclave ingress | **the target** |

Rung 2 is the plan, rung 1 is the parachute, and rung 0 never reaches a judge. If
Sunday arrives on rung 1, the README says "the clue accounts are not yet gated,
so this build is cheatable by design inspection" in those words. A privacy
literate room will check, and being caught overclaiming loses harder than
shipping less.

### 4.1 How rung 2 is built

One `ClueSlot` PDA per player per run. Each is delegated on the base layer, then
given an ER-local `EphemeralPermission` whose single member is that player, with
`TX_LOGS_FLAG | TX_MESSAGE_FLAG | TX_BALANCES_FLAG`.

```rust
use ephemeral_rollups_sdk::access_control::{
    instructions::{CreateEphemeralPermissionCpi, UpdateEphemeralPermissionCpi},
    structs::{Member, TX_BALANCES_FLAG, TX_LOGS_FLAG, TX_MESSAGE_FLAG},
};
```

Three things that are easy to get wrong:

- **Delegate only the data account on base.** Do not create or delegate a separate
  base-layer permission account. The permission is ER-local.
- **The PDA must be pre-funded for permission rent**, roughly 32 lamports per
  byte, before the create CPI.
- **The gate is at RPC ingress, not at execution.** The program still reads every
  clue inside the enclave, which is what lets it resolve the floor. This is the
  property the whole design rests on.

Clients hitting the TEE need an auth token and should verify the enclave first:

```ts
const ok    = await verifyTeeRpcIntegrity(EPHEMERAL_RPC_URL)
const token = await getAuthToken(EPHEMERAL_RPC_URL, wallet.publicKey, signFn)
// then: `${EPHEMERAL_RPC_URL}?token=${token}`
```

`Run` stays public and ungated. Floor number, timer, votes, marks, chat and pot
are meant to be seen. Only `ClueSlot` is private.

## 5. VRF

Request and callback are **two separate executions**. A successful request means
the oracle accepted work. The result exists only after the authenticated callback
lands. S4 DEAL exists to make that visible rather than pretend it away.

```rust
ephemeral-rollups-sdk = { version = "0.16.2", features = ["anchor", "vrf"] }
```

- Request from inside the ER, so use `vrf::consts::DEFAULT_EPHEMERAL_QUEUE`
  (`5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc`). The base layer queue is
  `DEFAULT_QUEUE` and using the wrong one for where the transaction runs is the
  most common VRF failure.
- `#[vrf]` injects `program_identity`, `vrf_program`, `slot_hashes`,
  `system_program` and `invoke_signed_vrf`. Without it the program does not
  compile, which is a friendly failure.
- **`#[vrf_callback]` is the unfriendly one.** Without it the struct still
  compiles and the callback accepts randomness from anybody. A missing
  `#[vrf_callback]` is a game where any player can choose the safe door.
- Prefer the `consts` over hardcoded addresses.

### 5.1 Hiding the latency

VRF is roughly 100ms inside an ER and 1 to 5 seconds on base. One request per
floor, **fired the moment the previous floor resolves**, so the deal for floor
`f+1` is already in flight while the party is arguing about banking. Floor 1 is
requested during the lobby ready check.

State machine on the `Run`: `idle -> requested(nonce) -> dealt`. The callback is
bound to the run and the floor index, and is idempotent, so a duplicate or late
callback cannot deal a floor twice. If no callback lands within 10 seconds, S4
shows a retry rather than hanging.

## 6. The timer: deadline first, crank second

Two ways to run the floor clock, and we build the boring one first.

**Primary, ship this.** The floor stores `deadline_ts`. Clients count down
locally from it. When it passes, any client, including a bot, submits
`resolve_expired`, which the program validates against `Clock::unix_timestamp` and
applies the section 5.1 rules from `GAME-LOGIC.md`. Zero infrastructure, no
scheduler to observe, works on day one.

**Upgrade, if Saturday has room.** A crank removes the client dependency, so the
clock ticks even if every browser closes. It is the better story and it is
genuinely more robust, but it is not free:

```toml
magicblock-magic-program-api = { version = "0.10.1", default-features = false }
```

```rust
pub struct ScheduleTaskArgs {
    pub task_id: i64,
    pub execution_interval_millis: i64,
    pub iterations: i64,
    pub instructions: Vec<Instruction>,
}
```

Four things the crank will punish:

- **`task_id` is validator-global**, not scoped to us. Derive it from the run PDA,
  never from a UI counter, or we collide with a stranger's task.
- **Scheduling is asynchronous.** Transaction success means the request was
  stashed. Observe the registration before depending on it.
- **Scheduled instructions must be idempotent or monotonic.** `tick_floor` must be
  "advance to the next unprocessed deadline", never "decrement blindly".
- **Only the derived `crank_signer_pda(task_authority)` may be a signer** in the
  inner instruction, read-only. Validate it in the handler.

Cancel the task before undelegating the run, or every remaining iteration fails
against an account that is no longer there.

## 7. Session keys

One signature at run start authorising a scoped temporary key, then every vote,
mark and chat message is silent. Without this a DEEP run is roughly forty wallet
popups and the game is unplayable, so it feels optional right up to the first
real playtest.

Program: `KeyspM2ssCJbqUhQ4k7sveSiY4WjnYsrXkC8oDbwde5`.

Session validity is **not** token authority. The session key may act on the run.
It may not move USDC. The stake is locked on the base layer before delegation and
released by a Magic Action at settlement, and no session key is ever in that
path. Scope, expiry, and revocation are all set at the contract level.

## 8. Failure ladder

What we do when each boundary fails, decided now rather than on Sunday.

| Failure | Detection | Response |
| --- | --- | --- |
| Router returns no `fqdn` | delegation status call | retry twice, then S1 shows "TOWER OFFLINE" with the status URL. Never a blank screen. |
| VRF callback never lands | 10s timeout on `requested` | S4 offers retry with a new nonce, old nonce invalidated so a late callback cannot deal twice |
| ER validator unreachable mid run | websocket close plus RPC error | freeze the timer, show RECONNECTING, resume from committed state. Never resolve a floor a player could not see. |
| TEE auth token rejected | `getAuthToken` failure | fall back to rung 1, and **change the on screen privacy label**, never silently |
| Commit sponsorship exhausted | commit error at floor end | re-delegate to refresh quota, log it loudly, it means we are committing too often |
| Crank never registers | registration not observed in 5s | fall back to client `resolve_expired`, which is always live anyway |
| Magic Action fails at payout | reconcile after commit | scheduling success does not prove execution. Observe every action, and expose an unclaimed payout the player can settle manually. |
| Devnet USDC faucet dry | balance zero at S1 | pre-fund the demo wallets, and ship a QUICK PLAY that stakes zero |

The pattern in every row: **acceptance is not completion.** Every asynchronous
boundary gets a visible pending state, a timeout, and a path that does not lie to
the player.

## 9. Pre-submission verification

Run all of these on Sunday morning, from a clean browser profile.

```
1  status.magicblock.app/api/services         devnet er + vrf_oracle live
2  router getDelegationStatus on a live run   returns an fqdn
3  base getAccountInfo on Run                 owner = delegation program
4  ER  getAccountInfo on Run                  owner = our program, delegated=true
5  ER  getAccountInfo on someone else's slot  denied on rung 2, readable on rung 1
6  full DEEP run, two browsers, one terminal  clears and pays out
```

Step 5 is the submission. It is the only observation that separates this from a
game that merely says it is private, and it is what the video shows.
