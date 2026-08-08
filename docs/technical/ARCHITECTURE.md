# ARCHITECTURE

Repo layout, boundaries, data flow, and who owns which files. Read this before
the first commit of the day so three people do not edit the same file.

---

## 1. There is no game server, only bots

The gameplay loop is fully on-chain: a browser talks to the ephemeral rollup over
a plain Solana account subscription, and Solana settles to devnet. Realtime is
`connection.onAccountChange(runPda, cb)` against the ER websocket. No Socket.io,
no Colyseus, no authoritative game host, no Supabase realtime, no serverless
functions.

What there is, is **one NestJS backend that only hosts the CPU players and the
relay**:

```
browser  ──ws──▶  ephemeral rollup   (10ms shared state, all gameplay)
   │                    │
   │                    ├── commit ──▶  Solana devnet  (settlement, escrow, vault)
   │                    └── VRF oracle
   │
   └── HTTP ──▶  backend  ──ws──▶  same rollup   (CPU bots, read-only relay)
```

The backend never owns game state and never decides outcomes. It signs bot
transactions like any other client, and it answers read-only relay queries
(`GET /api/runs/:code`) so the web app does not need the anchor SDK loaded to
render a board. **The client is never authoritative**, so a modified client can
lie about what it renders and cannot lie about what happened. The bots are
clients too; the one thing they need hosting for is keeping deterministic seeded
keypairs running during a demo so a judge never assembles a party alone.

Two consequences that are easy to miss. A hostile or overloaded backend cannot
corrupt a run, only stop serving bots, and a run already in flight keeps going
without it. And the backend is replacable: point the web app at devnet plus a
locally-run bot process and the same game works.

## 2. Layout

```
trust-fall/
├── apps/                          Application targets
│   ├── web/                       Frontend Web App (Next.js / Vite SPA)
│   │   ├── app/                   Screens, pages, routing
│   │   ├── components/            Web-specific UI components
│   │   └── hooks/                 Custom hooks & game loop
│   └── backend/                   NestJS Bots + Relay engine
│       ├── src/main.ts            Bootstrap, global /api prefix, CORS, port
│       ├── src/config.ts          TF_* env: mint, bot seed, devnet airdrop
│       ├── src/bots/              CPU bot runners, seeded per-run wallets
│       └── src/relay/             Read-only run state over HTTP for the web app
│
├── contracts/                     Anchor Smart Contracts Workspace
│   ├── programs/trust-fall/src/   Rust program instructions & state
│   ├── tests/                     E2E validator tests
│   └── Anchor.toml                Anchor network & build config
│
├── packages/                      Shared Workspace Libraries
│   ├── chain-client/              RPC subscriber, Anchor client wrappers
│   ├── types/                     Shared TypeScript interface definitions & DTOs
│   ├── ui/                        LANTERN tokens, Console Shell, UI primitives
│   └── config/                    Shared tsconfig base & linter rules
│
├── docs/                          System specs, PRDs, and architecture
├── pnpm-workspace.yaml            pnpm monorepo workspace definition
├── turbo.json                     Turborepo pipeline config
└── package.json                   Root monorepo scripts
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

Every client in the party runs that same path off the same push, including the
backend's bots, which are ordinary clients with seeded keypairs. Nobody is
authoritative, nobody polls on the gameplay path, and there is no reconciliation
step because there is only one copy of the state.

The backend relay path is separate and read-only:

```
 web app  ──HTTP──▶  backend  GET /api/runs/:code
                        │
                        └── router getDelegationStatus + fetchRun → run JSON
```

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
