# BUILD-PLAN

The live status of the build. **CLAUDE.md rule 9: this file is updated in the
same commit as the work.** Task finished, gate passed or failed, scope cut,
question answered, flip the cell now. A build plan that lags the repo gets
consulted and believed, which makes it worse than not having one.

### Status legend

| Mark | Means |
| --- | --- |
| ⬜ | not started |
| 🔄 | in progress |
| ✅ | done and verified by the gate, not by the author's opinion |
| ⚠️ | done but with a known ceiling, written down |
| ❌ | cut. The reason goes in section 8. |

---

## 0. The clock

**Submission closes Sunday 9 August 2026, 23:00. Code freeze 18:00 that day.**

| Day | Date | Theme |
| --- | --- | --- |
| D0 | Wed 5 Aug, evening | foundation. Scaffolds and the delegate gate. |
| D1 | Thu 6 Aug | the program. Clue, floor, vote. |
| D2 | Fri 7 Aug | the wire. ER client, screens on real state. |
| D3 | Sat 8 Aug | privacy, bots, polish. |
| D4 | Sun 9 Aug | freeze 18:00, video, README, submit. |

The five hours between freeze and submission are not padding. They are the video,
the README, a clean-profile deploy check, and the one thing that will break.

## 1. Goals, in priority order

Anything lower is cut before anything higher.

1. A judge opens the link alone and holds a private clue inside 20 seconds.
2. A second browser holds a *different* clue, and a terminal cannot read either.
3. A full run completes and pays out on devnet.
4. A 40 second video shows two screens with two different lanterns.
5. README names the privacy rung, the program ID, and a paste-able verify command.
6. The console looks like a console, not a web page.

Goal 2 is the submission. Everything else is support.

## 2. The three lanes

| Lane | Owner | Owns | Never touches |
| --- | --- | --- | --- |
| **A** | contract dev | `program/**` | `app/**` |
| **B** | dev | `app/src/chain/**`, `game/store.ts`, `game/bots.ts`, `apps/backend/**` | `game/screens/**`, `styles/**` |
| **C** | product | `game/screens/**`, `console/**`, `ui/**`, `styles/**`, `config/**` | `chain/**`, `program/**` |

**The rule that keeps three lanes from colliding.** Lane A owns the IDL. Lane B
owns the store shape. Lane C asks Lane B for fields rather than adding them. All
three write to this file.

**The staffing risk, named.** Lane A is the critical path and it is one person.
If Lane A stalls on delegation for more than four hours, Lane B stops wiring and
pairs on it. A blocked program blocks everything, a half-wired client blocks
nothing.

## 3. Phases

### PHASE 0 · FOUNDATION ⬜  (D0, tonight)

The only goal tonight is to remove tomorrow's unknowns.

| # | Task | Lane | Status |
| --- | --- | --- | --- |
| 0.1 | `anchor init`, program skeleton, `#[ephemeral]` before `#[program]` | A | ⬜ |
| 0.2 | **Hello world delegate, commit, undelegate on devnet** | A | ⬜ |
| 0.3 | Anchor version gate: does `anchor-lang` 1.1.2 build against SDK 0.16.2 `anchor` feature? If not, drop to 1.0.2 and move on | A | ⬜ |
| 0.4 | `pnpm create vite`, React 19, Tailwind v4, TanStack Router | C | ⬜ |
| 0.5 | TypeScript gate: does 7.0.2 typecheck generated Anchor types in 15 min? If not pin `typescript@5` | C | ⬜ |
| 0.6 | Port `console/`, `ui/`, `design/`, `styles/`, `config/` from `components/` | C | ⬜ |
| 0.7 | Console shell reskinned black, MagicBlock mark, bezel visible | C | ⬜ |
| 0.8 | Wallet adapter connects on devnet, balance reads | B | ⬜ |
| 0.9 | Devnet USDC mint chosen, vault seeded, three team wallets funded | B | ⬜ |

> **GATE G0.** An account delegates on devnet, mutates on the ER, and commits
> back. Verified by the three-way ownership check in `MAGICBLOCK.md` section 3,
> not by "the transaction succeeded".
>
> **If G0 is not green by end of D0, that is the whole story of the hackathon.**
> Escalate immediately, do not build around it.

### PHASE 1 · THE PROGRAM ⬜  (D1)

| # | Task | Lane | Status |
| --- | --- | --- | --- |
| 1.1 | `state.rs`: Run, ClueSlot, Vault, exact sizes from `ERD.md` | A | ✅ |
| 1.2 | `clue.rs`: the algorithm, pure, no Anchor types | A | ✅ |
| 1.3 | **`clue.rs` in-module tests: truth, exactness, necessity. 10k seeds, every N and P** | A | ✅ |
| 1.4 | `lobby.rs`: create, join, ready, stake into escrow | A | ✅ |
| 1.5 | `delegate.rs`: delegate Run and every ClueSlot | A | ✅ |
| 1.6 | `deal.rs`: VRF request plus `#[vrf_callback]` writing every mask | A | ✅ |
| 1.7 | `floor.rs`: vote, mark, chat with charset validation, resolve | A | ✅ |
| 1.8 | `floor.rs`: `resolve_expired` against `Clock::unix_timestamp` | A | ✅ |
| 1.9 | `economy.rs`: multipliers, vault clamp, equal split | A | ✅ |
| 1.10 | Anchor client wrappers in `chain/program.ts` | B | ✅ |
| 1.11 | `chain/connection.ts`: router `getDelegationStatus`, never a hardcoded fqdn | B | ✅ |
| 1.12 | `chain/subscribe.ts`: `onAccountChange` into the Zustand store | B | ✅ |
| 1.13 | S0, S1, S2, S3 on fixtures | C | ⬜ |

> **GATE G1.** `cargo test` green, and `clue_necessary` in particular. That test
> is the theme encoded: if it fails, a player has become optional.
>
> **G1 status: PASSED** 6 tests green (clue_truth, clue_exact, clue_necessary,
> determinism, empty seats, test_id) on `cargo test`. Dated 2026-08-08.

### PHASE 2 · THE WIRE ⬜  (D2)

| # | Task | Lane | Status |
| --- | --- | --- | --- |
| 2.1 | Full run against `solana-test-validator` plus local ER, scripted | A | ⬜ |
| 2.1a | Root-cause `create_party` access violation; local repro passes end-to-end | A | ✅ |
| 2.2 | Session keys: one signature per run, no popup on vote or chat | B | ⬜ |
| 2.3 | Two browsers in one party, votes visible in both under 100ms | B | ⬜ |
| 2.4 | S5 FLOOR on real state: doors, marks, votes, timer | C | ⬜ |
| 2.5 | `Lantern` component reading a real `ClueSlot` | C | ⬜ |
| 2.6 | `TheLine` chat, send and render, uppercase client-side | C | ⬜ |
| 2.7 | S4 DEAL with real pending, timeout and retry | C | ⬜ |
| 2.8 | S6 RESOLVE, S7 BANK OR CLIMB, S8 RESULTS | C | ⬜ |
| 2.9 | Payout via base-layer `settle` after `commit_and_undelegate`, reconciled not assumed | A | ✅ |

> **GATE G2. PASSED.** Full devnet end-to-end run verified via `scripts/live-run.mjs GG07` against `devnet-eu.magicblock.app`. Party created, 3 CPU seats filled, base ready, base delegated to ER, VRF deal requested & fulfilled, floor resolved, run DONE (outcome=FELL), ER final settle committed, auto-undelegated to base, base payout settle executed, vault reconciled (`seeded=500 + falls=8 - payouts=0 == balance=508 OK`). Dated 2026-08-08.
>
> **2.1a crash root-caused.** `create_party` / `join_party` crashed with
> `Access violation in stack frame 5` reading 8 bytes at ~0x200005x20 inside
> `try_accounts`, before any CPI, at ~2238 CU. Reproduced on the local
> validator against a byte-for-byte identical deployed binary. Root cause:
> the generated `try_accounts` frame exceeded the VM stack limit because a
> 938-byte `Run` was held on the stack next to one or more `Account`-typed
> token/vault accounts, and the escrow `init` had both `token::authority` and
> seeds dereferencing `run.key()`. Fix, applied across every instruction
> context: `Box` every `Run`, `TokenAccount`, `Mint`, `Vault`, `ClueSlot`
> `Account` binding, and seed the escrow PDA from `code` instead of
> `run.key()` (all three sites: `lobby.rs` Create/Join, `economy.rs` Settle).
> Verified on local: create + join + ready all pass; escrow created, mint
> matches, `escrow.owner == run`, stake 2_000_000 held per player. Dated
> 2026-08-08.

### PHASE 3 · PRIVACY AND BOTS ⬜  (D3)

The day the submission gets its claim.

| # | Task | Lane | Status |
| --- | --- | --- | --- |
| 3.1 | Pre-fund ClueSlot PDAs for permission rent | A | ⬜ |
| 3.2 | `CreateEphemeralPermissionCpi`, single member per slot | A | ⬜ |
| 3.3 | `chain/tee.ts`: `verifyTeeRpcIntegrity`, `getAuthToken`, gated reads | B | ⬜ |
| 3.4 | **Prove denial: a terminal cannot read another seat's ClueSlot** | B | ⬜ |
| 3.5 | Bots: post clue, mark, vote, panic-vote at 10s | B | 🔄 |
| 3.6 | QUICK PLAY fills seats and starts with no human input | B | ⬜ |
| 3.7 | Privacy rung label wired to what actually resolved | C | ⬜ |
| 3.8 | Every screen checked at 412px on a real phone | C | ⬜ |
| 3.9 | Failure ladder: every row in `MAGICBLOCK.md` 8 has a visible state | B/C | ⬜ |

> **GATE G3.** Task 3.4 passes. This is the submission. If it does not pass by
> Saturday 20:00, **fall back to rung 1 and change the on-screen label**, do not
> keep pushing. An honest public-ER build ships. A broken private one does not.

**Bots live in a NestJS backend, not web workers.** Decided 2026-08-08 with the
console. Bots are seeded per-run serverside (`TF_BOT_SEED`), join and ready from
the backend after the host creates the party, then act per floor like any client
(honest, labelled `CPU`). A read-only `/api/runs/:code` relay gives the web app a
board view without loading the anchor SDK. The backend never owns game state,
never resolves, and can be replaced by a locally run process without touching the
game. See `docs/technical/ARCHITECTURE.md` §1.

### PHASE 4 · FREEZE AND SUBMIT ⬜  (D4)

| # | Task | Lane | Status |
| --- | --- | --- | --- |
| 4.1 | Deploy to Vercel, clean browser profile, phone check | C | ⬜ |
| 4.2 | Pre-submission verification, all 6 steps in `MAGICBLOCK.md` 9 | A/B | ⬜ |
| 4.3 | 40 second video, `DEMO-SCRIPT.md` | C | ⬜ |
| 4.4 | README: rung, program ID, verify command, no overclaim | all | ⬜ |
| 4.5 | Repo public, licence, no keys in history | B | ⬜ |
| 4.6 | Submit by 23:00 | — | ⬜ |

> **GATE G4. Code freeze 18:00.** After that the only permitted commits are
> README, video, and a one-line fix to something demonstrably broken.

## 4. What runs in parallel, and what cannot

```
D0   A: delegate gate ──────┐
     C: scaffold + shell    │  independent
     B: wallet + funding    │
                            ▼
D1   A: program ────────────────────────┐
     B: client wrappers (needs IDL) ◀───┘  BLOCKED until 1.1 lands
     C: S0-S3 on fixtures                  independent
                            ▼
D2   A+B: wire ────────────┐
     C: screens on state ◀─┘  BLOCKED until store shape is stable
                            ▼
D3   A: permissions ───┐
     B: TEE + bots ◀───┘  BLOCKED until 3.2 lands
     C: polish            independent
```

Lane C is independent on three of four days. That is deliberate: the person who
also owns the video and the submission must never be the bottleneck on Sunday.

## 5. Cut order

When time runs out, cut from the bottom. Decided now, in daylight, rather than at
2am on Saturday.

| Cut | Effect |
| --- | --- |
| 1. Crank timer | already the day-3 upgrade. Client `resolve_expired` works. |
| 2. DEEP depth | ship QUICK only. Three floors still proves the mechanic. |
| 3. Party of 4 | fix at 3. Fewer door-widening cases. |
| 4. S6 door animation | a state change instead of a transition |
| 5. Bank vote | auto-bank at the top. **Costs the best argument in the game.** |
| 6. Real USDC escrow | points only. **Costs the stakes and most of the tension.** |
| 7. Private ER | fall to rung 1 with an honest label. **Costs the submission's claim.** |

Cuts 5, 6 and 7 each remove a reason to vote for us. Cuts 1 to 4 remove nothing a
judge will notice.

## 6. Risk register

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Anchor 1.1.2 vs SDK 0.16.2 mismatch | medium | high | gate 0.3, drop to 1.0.2 within the hour |
| PER permissions do not land in time | medium | **critical** | rung 1 fallback with an honest label, decided Saturday 20:00 |
| VRF callback flaky on devnet | medium | high | prefetch next floor, 10s timeout, retry with new nonce |
| ER validator moves or degrades | low | high | never hardcode fqdn, status API in the boot check |
| Judge never assembles a party | **high if unmitigated** | critical | bots, QUICK PLAY as default focus |
| Lane A blocked, one person | medium | critical | Lane B pairs after 4 hours |
| Screens clip at 320px | high | medium | flex-1 rule, `useOverflowWarning`, phone check at 3.8 |
| Devnet faucet dry on Sunday | medium | medium | pre-fund wallets D0, zero-stake QUICK PLAY |
| Commit sponsorship cap hit | low | medium | commit per floor, not per action. 5 of 10 used. |

The top row of this table by impact is the judge who never plays. It is also the
cheapest to fix, which is why bots are in Phase 3 and not in the cut list.

## 7. Commands

```bash
# program
cd program
anchor build && anchor test          # clue properties must be green
anchor deploy --provider.cluster devnet

# app
cd app
pnpm dev
pnpm typecheck && pnpm test
pnpm build

# health, before every session and on Sunday morning
curl -s https://status.magicblock.app/api/services | jq '.environments.devnet'
```

## 8. Decision log

Scope changes and answered questions land here, dated, newest on top. An empty
section on Sunday means nobody was updating this file.

### 2026-08-05 · Free text chat over a glyph wheel
Chosen over a structured broadcast wheel. Costs 720 bytes in `Run`, program-side
charset validation, and a text input on a D-pad shell. Buys communication that
reads as real conversation, which is the theme. Marks were kept as a separate
4 byte shared scratchpad so the board stays legible without parsing chat.

### 2026-08-05 · Timer pressure as the only risk
No residual coin flip, no false clues. Perfect coordination always clears, and
the enemy is the clock. Makes the risk a test of the team rather than a dice
roll, and keeps the bank-or-climb vote meaningful. See `GAME-LOGIC.md` 5.2.

### 2026-08-05 · pnpm, no Turborepo, no workspaces
Two toolchains, one Node package. See `TECH-STACK.md` 1.
