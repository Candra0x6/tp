# ARCHITECTURE

Repo layout, boundaries, data flow, and who owns which files. Read this before
the first commit of the day so three people do not edit the same file.

---

## 1. There is no backend

Worth stating first because it is the strongest technical claim in the
submission, and because it changes how everything else is laid out.

```
browser  ──ws──▶  ephemeral rollup   (10ms shared state, all gameplay)
   │                    │
   │                    ├── commit ──▶  Solana devnet  (settlement, escrow, vault)
   │                    └── VRF oracle
   │
   └── CPU players run here too, in web workers
```

Realtime is `connection.onAccountChange(runPda, cb)` against the ER websocket,
which is a plain Solana account subscription. No Socket.io, no Colyseus, no game
server, no Supabase realtime, no serverless functions. The deploy is static files
on Vercel plus one program on devnet.

Two consequences that are easy to miss. **The client is never authoritative**, so
a modified client can lie about what it renders and cannot lie about what
happened. And **the bots are just clients**, so they need no hosting and cannot be
a Sunday outage.

## 2. Layout

```
trust-fall/
├── program/                       Anchor workspace, Lane A
│   ├── programs/trust-fall/src/
│   │   ├── lib.rs                 #[ephemeral] then #[program]
│   │   ├── state.rs               Run, ClueSlot, Vault
│   │   ├── clue.rs                the algorithm. pure, no Anchor types.
│   │   ├── economy.rs             multipliers, clamping, split
│   │   ├── errors.rs
│   │   └── instructions/
│   │       ├── lobby.rs           create, join, ready, stake
│   │       ├── delegate.rs        delegate + permissions
│   │       ├── deal.rs            vrf request + callback
│   │       ├── floor.rs           vote, mark, chat, resolve, resolve_expired
│   │       └── settle.rs          bank, fall, commit_and_undelegate, payout
│   └── tests/
│       ├── clue.rs                the three properties, 10k seeds
│       └── e2e.ts                 full run against a local validator
│
├── app/                           Vite SPA, Lanes B and C
│   └── src/
│       ├── chain/                 Lane B owns
│       │   ├── connection.ts      base, router, and ER fqdn resolution
│       │   ├── program.ts         Anchor client, typed instruction wrappers
│       │   ├── subscribe.ts       onAccountChange plumbing to the store
│       │   ├── session.ts         session key issue, scope, revoke
│       │   └── tee.ts             attestation check, auth token, gated reads
│       ├── game/
│       │   ├── store.ts           Zustand. the only place chain state lands.
│       │   ├── bots.ts            CPU players, Lane B
│       │   ├── clue.ts            mask -> sentence + tiles. render only.
│       │   └── screens/           S0 to S8, Lane C
│       ├── console/               shell, D-pad, fit scale     ported
│       ├── ui/                    text, surface, select, data ported
│       ├── design/palette.ts      mirror of tokens.css        ported
│       ├── styles/tokens.css      LANTERN                     ported, reskinned
│       ├── config/brand.ts        every product name
│       └── routes/
│
├── components/                    the ported primitives as delivered.
│                                  reference copy. app/src is what builds.
├── docs/
└── .claude/skills/                magicblock, solana-dev, craft skills
```

## 3. Boundaries

Four of them, and each one has exactly one crossing point.

| Boundary | Crossing point | Rule |
| --- | --- | --- |
| chain to app | `chain/subscribe.ts` writes `game/store.ts` | no component ever calls a connection directly |
| app to chain | `chain/program.ts` typed wrappers | no component builds a transaction inline |
| secret to screen | `game/clue.ts` | takes a `u8`, returns tiles and a sentence. Never fetches. |
| tokens to pixels | `styles/tokens.css` | `design/palette.ts` mirrors it, a test fails if they drift |

The first two exist so that when the ER endpoint moves, or the SDK renames
something, exactly one file changes. That has already happened once in this
stack's history and it will happen again.

## 4. Data flow, one floor

```
 player presses A
      │
      ▼
 chain/program.ts  vote(door)          ──▶ ER  (session key signs, no popup)
                                            │
                                            │ Run account mutates
                                            ▼
 chain/subscribe.ts  onAccountChange   ◀── ws push, ~10 to 50ms
      │
      ▼
 game/store.ts   setRun(decoded)
      │
      ├──▶ S5 FLOOR   re-renders votes, marks, chat
      └──▶ bots.ts    reconsider, maybe vote
```

Every client in the party runs that same path off the same push. Nobody is
authoritative, nobody polls, and there is no reconciliation step because there is
only one copy of the state.

The private half never takes that path. `ClueSlot` is read once per floor,
through the TEE endpoint with an auth token, straight into the store, and it is
never broadcast anywhere.

## 5. Lane ownership

Three people, four days, so file collisions are the main scheduling risk. These
sets are disjoint on purpose.

| Lane | Owner | Files | Never touches |
| --- | --- | --- | --- |
| **A** program | contract dev | `program/**` | `app/**` |
| **B** chain client | dev | `app/src/chain/**`, `game/store.ts`, `game/bots.ts` | `game/screens/**`, `styles/**` |
| **C** console | product | `game/screens/**`, `console/**`, `ui/**`, `styles/**`, `config/**` | `chain/**`, `program/**` |

Three shared files, and each has a single owner who merges changes:

- `program/target/idl/trust_fall.json` and its generated types. **Lane A only.**
  Lane B consumes, never edits.
- `game/store.ts` shape. **Lane B owns**, Lane C reads. Lane C asks for fields
  rather than adding them.
- `docs/technical/BUILD-PLAN.md`. Everyone writes, in the same commit as the work.

The generated route tree is regenerated once, centrally, at the end. Casts added
locally to work around a missing tree make the generator refuse the file outright,
which cost a day on the previous project.

## 6. What is shared with MONADBOY, and what is not

Ported unchanged, because they are token driven and framework agnostic:
`console/` in full, `ui/` in full, `design/palette.ts`, the 480x320 fit scale, the
D-pad intent model, the overflow warning hook.

Reskinned: `styles/tokens.css` becomes LANTERN, dark, with the shell black. Every
ported component follows automatically, which is the entire reason the token
layer exists.

Rewritten: `config/brand.ts`, all screens, all game logic. Nothing about liquidity
provision survives, and no Monad code, chain config, or contract address may
appear anywhere in this repo.

## 7. Environments

| Env | Base | Router | Program |
| --- | --- | --- | --- |
| local | `solana-test-validator` | localhost:7799 | freshly deployed |
| devnet | `rpc.magicblock.app/devnet` | `devnet-router.magicblock.app` | the submitted program |

Local first for the clue tests and the instruction surface, because a failing
assertion in half a second beats a devnet round trip. Devnet from Friday, because
local never reproduces routing, TEE auth, or a validator that has moved.
