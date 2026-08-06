# GAME-LOGIC

The rules, the clue algorithm and why it is correct, and the money. Everything
here is deterministic and lives in the Anchor program. The client renders it and
generates nothing.

Owns: the clue construction, the floor table, the vote rules, the economy math.
Does not own: account layout (`ERD.md`), MagicBlock wiring (`MAGICBLOCK.md`).

---

## 1. The loop

```
LOBBY  ->  stake locked, depth chosen, seats filled
  |
  v
DEAL   ->  VRF picks the safe door and deals one private clue per player
  |
  v
FLOOR  ->  read your clue, tell the party, mark the board, vote a door
  |        timer running the whole time
  v
RESOLVE -> door opens.  wrong -> THE FALL, run over
  |                     right -> climb
  v
BANK OR CLIMB  ->  majority vote.  bank -> payout.  climb -> next DEAL
```

One door choice per floor. Not several. A floor already costs a full read, tell,
vote, resolve cycle, which is 30 to 60 seconds of human time. Repeating it inside
a floor multiplies run length without adding an idea.

## 2. The floor table

Depth is chosen in the lobby.

| Depth | Floors | Doors per floor | Timer per floor |
| --- | --- | --- | --- |
| QUICK | 3 | 4, 4, 5 | 60s, 60s, 45s |
| DEEP | 5 | 4, 4, 5, 5, 6 | 60s, 60s, 45s, 45s, 30s |

Doors are then widened for large parties, because the clue construction in
section 3 requires at least one wrong door per player:

```
N = max(base_doors[floor], party_size + 1)
```

So a 4 player QUICK run is 5, 5, 5 rather than 4, 4, 5.

**Blind clear probability, party of 3:** QUICK is 1 in 80. DEEP is 1 in 2400.
**Clear probability with complete clue sharing: 1.** That gap is the product, and
both numbers belong on the results screen.

## 3. The clue algorithm

A clue is a **bitmask of the doors it eliminates**. One `u8` covers up to 8
doors, which is more than any floor needs.

```
INPUT   N doors, P players, 32 VRF bytes r
OUTPUT  safe: u8,  clues: [u8; P]

1  safe  = r[0] % N
2  wrong = every door except safe                    // N-1 doors
3  shuffle wrong, Fisher-Yates seeded from r[1..]
4  clues = [0; P]
5  for i, d in wrong.enumerate():
       clues[i % P] |= 1 << d                        // round robin
```

That is the whole thing. No search, no retry loop, no scoring function, no
model. Roughly twenty lines of Rust and it is constant time.

### 3.1 Why it is correct

Three properties, each of which is a test in `tests/clue.rs`.

**T, truth.** A clue only ever names wrong doors, so `clues[i] & (1 << safe) == 0`
for every `i`. No clue can point away from the answer, so a player is never
punished for believing their own lantern.

**E, exactness.** Step 5 assigns every wrong door to exactly one player, so
`OR(clues) == all_doors \ {safe}`. The complement of the union is exactly the
safe door. **The party's shared knowledge always resolves the floor completely.**

**N, necessity.** Round robin over `N-1 >= P` items gives every player at least
one door. Remove any single player and the union misses at least one wrong door,
so at least two candidates survive. **No player at the table is redundant, and no
subset can solve the floor without everyone.**

Property E is why coordination always wins. Property N is why coordination is
required. Together they are the game, and they are enforced by construction
rather than by a rule someone has to obey.

The constraint `N >= P + 1` is what section 2's widening rule protects.

### 3.2 The one secret

The safe door is exactly the door that no clue eliminates. **Anyone who can read
every clue already knows the answer.** So there is one secret, not two, and
per-player clue privacy is the entire security model.

This has a hard consequence. On a public Ephemeral Rollup every account is
readable by any RPC client, so a player who opens a terminal can read all four
clues and win every floor alone. The Private ER is not a feature on top of the
game, it is the only thing that makes the game a game. See `MAGICBLOCK.md`
section 4 for the deployment ladder and what each rung honestly provides.

### 3.3 How a clue is shown

The client reads one `u8` and renders it three ways at once, because a bitmask is
not a sentence and the screen has to be readable in a hurry.

```
   YOUR LANTERN                          <- nobody else has this
   ┌────┬────┬────┬────┬────┐
   │ 1  │ 2  │ 3  │ 4  │ 5  │
   │    │ ░░ │    │ ░░ │    │            <- your eliminated doors, hatched
   └────┴────┴────┴────┴────┘
   DOORS 2 AND 4 ARE COLD
   YOU CAN RULE OUT 2 OF 5
```

Sentence forms are fixed: one door is `DOOR n IS COLD`, two is `DOORS a AND b ARE
COLD`, three or more is `DOORS a, b AND c ARE COLD`. The count line is always
present so a player knows how much of the floor they are carrying.

### 3.4 Marks, which are not chat

Chat carries nuance. **Marks carry state.** Any player can mark a door cold for
the whole party, which writes one bit into a public per-player mask. The shared
board then shows the union of all marks, so the party can see at a glance how
much of the floor has been eliminated without re-reading the log.

This is a shared scratchpad, not a second messaging system. It costs four bytes
and it is what makes a five door floor legible in thirty seconds.

## 4. Chat

Free text, onchain, in the public `Run` account. A 24 message ring buffer, 28
bytes of body each.

**The charset is validated in the program, not in the client.** Allowed bytes are
`A-Z`, `0-9`, space, and `. , ? ! -`. Lowercase is rejected rather than folded, so
the client uppercases before sending and there is exactly one representation.
Anything outside the set fails the transaction.

Two reasons this is a program concern and not a UI concern. It is a trust
boundary, and a client is not a trust boundary. And Departure Mono maps a
specific glyph set, so an unvalidated byte renders as tofu on the one screen a
judge is looking at.

Known ceiling: a 28 character message can still be abusive, and there is no
blocklist. Acceptable for a devnet demo with named wallets, not acceptable for
mainnet. Recorded in `PRD.md` section 8.

## 5. Votes

Both votes use the same threshold: **strictly more than half the party**.

```
needed = party_size / 2 + 1        // 2 of 2, 2 of 3, 3 of 4
```

### 5.1 The door vote

A player may change their vote freely while the timer runs. The floor resolves
the instant `needed` players agree on one door, which is usually well before the
deadline and is the moment the screen should feel fast.

On deadline with no majority:

| State at deadline | Outcome |
| --- | --- |
| One door leads on votes | Party is forced onto it |
| Two or more doors tie | Lowest door index among the tied |
| Nobody voted at all | THE FALL |

Forced movement is deliberate. The punishment for being slow is a decision made
for you, which is thematically exact and keeps the run moving. Doing nothing at
all ends the run, because a party that never spoke has not played.

### 5.2 The bank vote

Offered after every cleared floor, and after the last floor it is automatic. Same
threshold. If the vote does not reach `needed` within 20 seconds, the default is
**climb**, because the party that cannot agree to stop has agreed to continue.

This is the best argument in the game. One player wants to bank a 2.6x, another
believes they can take a six door floor in thirty seconds, and neither can act
alone. Protect it. Any change that makes the right answer obvious kills it.

## 6. The economy

### 6.1 Where the money comes from

**From parties that fell, and from the seed. There is no third source.**

Any game implying otherwise is lying, so the vault balance sits permanently on
the HUD and every payout offer is clamped to what the vault can actually pay. You
never display a number you cannot honour.

**Rake is zero.** Nothing goes to the developers. This is a deliberate reversal
of the original design, where a wrong guess paid the house, which reads to a room
of builders as a casino wearing a co-op costume.

### 6.2 The numbers

```
stake      1 USDC per player (devnet), set at lobby
pot        stake * party_size
vault      seeded at deploy, grows by the pot of every party that falls
```

| Floors cleared | Multiplier on the pot |
| --- | --- |
| 1 | 1.3x |
| 2 | 1.8x |
| 3 | 2.6x |
| 4 | 3.8x |
| 5 | 6.0x |

```
payout  = min( pot * M[cleared],  pot + vault )
split   = payout / party_size          // equal, always
on fall = pot -> vault, players get nothing
```

The split is equal and not weighted by contribution. Weighting by whose clue
mattered most would be trivially computable and would immediately teach players
to withhold information, which is the exact opposite of the point.

### 6.3 The hole in this, named

With timer-only risk, a genuinely skilled party clears DEEP nearly every time, so
the vault drains and never refills. **This economy is not sustainable and is not
claimed to be.** It is a seeded devnet demonstration with a visible balance and a
hard clamp, which is honest, and it is the correct scope for a four day build.

Production would need one of: a rake, a difficulty curve tuned against the
observed clear rate, or a multiplier table derived from live clear rates rather
than fixed. That is a roadmap item in `PRD.md` section 9, not a Sunday item.

## 7. Bots

Empty seats are filled by CPU players so a solo judge is never stuck in a lobby.
A bot is not an opponent, it is a **cooperative teammate that plays honestly**.

```
on floor start     wait 2 to 5s, then post its clue to chat in plain form
                   and mark its own cold doors
on board resolved  when marks leave exactly one candidate, vote it
on 10s remaining   vote the current best candidate regardless
on bank vote       climb, unless on the final floor
```

Bots run in the judge's own browser, so the deploy stays static and there is no
bot server to fall over. They are labelled `CPU` on the roster and in chat. Never
present a bot as a person.

Deliberate ceiling: a bot posts its clue on a fixed delay and never lies or
hesitates, so a fully botted party clears reliably. That is correct for a demo,
where the job is to show the mechanic, not to provide a challenge.

## 8. What is tested

One test file per claim, and these are the claims that matter.

| Test | Asserts |
| --- | --- |
| `clue_truth` | no clue ever eliminates the safe door, all N and P, 10k seeds |
| `clue_exact` | union of all clues leaves exactly one door, all N and P |
| `clue_necessary` | any P-1 clues leave at least two candidates |
| `doors_widen` | `N >= P + 1` holds for every depth and party size |
| `vote_threshold` | 2 of 2, 2 of 3, 3 of 4, and that 2 of 4 does not resolve |
| `deadline_forced` | plurality wins, ties take lowest index, zero votes falls |
| `payout_clamped` | payout never exceeds `pot + vault` |
| `chat_charset` | lowercase and control bytes are rejected, not folded |

`clue_necessary` is the one that encodes the theme. If it ever fails, a player
has become optional and the game has stopped being about collaboration.
