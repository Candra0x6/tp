# TECH-STACK

Pinned versions and the reason for each. Versions verified against the registries
on **5 August 2026**, not from memory. Re-verify before pinning anything new.

---

## 1. Repo shape: pnpm, no monorepo tooling

**No Turborepo. No pnpm workspaces. One `package.json`.**

The instinct to reach for a monorepo comes from seeing two build systems in one
folder. But `program/` and `app/` are two *toolchains*, not two Node packages.
Anchor already creates a Cargo workspace for the Rust side and Cargo has never
heard of Turbo. On the Node side there is exactly one package.

Turborepo exists to schedule and cache builds across many Node packages. Pointed
at one package it adds a config file, a tool the team has to learn this week, and
a new way for `pnpm build` to fail on Sunday, in exchange for nothing.

```
trust-fall/
├── program/          cargo workspace   (anchor build, anchor test)
├── app/              one node package  (pnpm dev, pnpm build)
└── docs/
```

`pnpm` is still the package manager: fast, strict about phantom dependencies, and
already what MONADBOY uses so the muscle memory carries over.

**Add workspaces when, and only when,** a second Node package genuinely appears,
which realistically means extracting the typed program client so something other
than `app/` consumes it. Converting a single package to a workspace later is a ten
minute job. Doing it now costs four days of small frictions.

## 2. Program

| Thing | Version | Why |
| --- | --- | --- |
| `anchor-lang` | 1.1.2 | current max stable. Gate below. |
| `ephemeral-rollups-sdk` | 0.16.2 | current stable, and the exact snapshot the `magicblock` skill is verified against |
| features | `["anchor", "vrf"]` | `anchor` selects the Anchor 1.x range. `anchor-compat` is for 0.28 to 0.x and is not us. |
| `magicblock-magic-program-api` | 0.10.1 | cranks only, and cranks are the day 3 upgrade |
| Solana CLI | 3.1.9 | the version MagicBlock's quickstart is written against |
| Rust | 1.89.0 | same |

**Day 0 gate on Anchor.** MagicBlock's own docs verify against Anchor 1.0.2, and
1.1.2 is newer than anything they have published a snapshot for. First task of the
build is a hello-world program that delegates and commits. If `anchor-lang` 1.1.2
does not compile against the SDK's `anchor` feature, **drop to 1.0.2 immediately
and do not spend an hour on it.** Being one minor behind costs nothing. Debugging
a macro expansion mismatch on Thursday costs the hackathon.

VRF needs no separate `ephemeral-vrf-sdk` dependency. SDK 0.16.2 re-exports it, so
a direct dependency is a stale pattern.

## 3. App

| Thing | Version | Why |
| --- | --- | --- |
| React | 19.2.8 | current stable |
| Vite | 8.2.0 | current stable |
| `@tanstack/react-router` | 1.170.20 | file based routing without SSR |
| Tailwind | 4.3.3 | v4 reads `@theme` from `tokens.css`, which is how the ported design system works at all |
| Zustand | 5.0.14 | one store, no provider tree, no ceremony |
| `@tanstack/react-query` | 5.101.4 | base layer reads only. Gameplay is websocket push, not query. |
| `@solana/web3.js` | 1.98.4 | see 3.1 |
| `@coral-xyz/anchor` | 0.32.1 | the TS client. Note the numbering. |
| `@solana/wallet-adapter-react` | 0.15.39 | Phantom, Backpack, Solflare |
| Vitest | 4.1.10 | already the harness the ported components are tested with |
| TypeScript | 7.0.2 | gate below |
| Node | 24.x | |

**The Anchor numbering trap.** The Rust crate `anchor-lang` is at 1.1.2 and the npm
client `@coral-xyz/anchor` is at 0.32.1. They version independently. Nobody should
"fix" the npm version to match the crate, and if an agent suggests it, that is the
tell it is guessing.

**Day 0 gate on TypeScript.** 7.0.2 is stable and is the newest, so it is the
default per the standing rule. But it is a fresh major of the type checker and
Anchor's generated IDL types are exactly the kind of thing a new checker trips
over. Run `pnpm typecheck` against the generated types on day 0. If it is not
clean in fifteen minutes, pin `typescript@5` and move on. The build plan has this
as an explicit gate rather than a hope.

### 3.1 Two deliberate refusals

**Vite SPA, not TanStack Start.** No page here benefits from server rendering, and
wallet adapters plus hydration is a known multi-hour sink. A static build also
means the deploy is files on a CDN, which is the least breakable thing available
on submission night.

**web3.js v1 and Anchor, not `@solana/kit`.** Kit is the newer surface and it is
better. Every MagicBlock example, the quickstart, and the `magicblock` skill's
snippets are written in v1 with Anchor. In a four day build, matching the examples
is worth more than being current, because the failure mode of diverging is that
nobody's copy-pasteable answer applies to your code. Revisit after the hackathon.

## 4. Realtime

There is no realtime library. Gameplay state arrives through
`connection.onAccountChange(runPda, cb)` on the ER websocket, which is a plain
Solana account subscription over the endpoint the router names.

No Socket.io, no Colyseus, no Ably, no Supabase realtime, no serverless function.
This is not minimalism for its own sake, it is the claim: **there is no backend in
this repo**, and it is checkable by reading the dependency list.

CPU players are web workers in the same bundle, so they add no infrastructure and
cannot be an outage.

## 5. Deploy

| Thing | Where |
| --- | --- |
| app | Vercel, static output, no serverless functions |
| program | Solana devnet |
| ER | whichever validator the router returns, never hardcoded |
| USDC | devnet SPL mint, vault seeded at deploy |

## 6. Ported from MONADBOY

`console/`, `ui/`, `design/palette.ts`, `styles/tokens.css`, the fit scale hook,
the D-pad intent model. They are plain React driven by CSS custom properties, so
they carry across frameworks untouched and a reskin of `tokens.css` reskins all of
them at once.

Departure Mono ships self-hosted, SIL OFL, 22KB woff2, `font-display: block`. A
pixel font that swaps mid render breaks the illusion worse than a blank frame.

Confirmed glyphs in the file: `†` U+2020, `◄` U+25C4, `►` U+25BA, `▲` U+25B2,
`█ ░ ▓`, `→`, `★`. **Not present:** `☠ ◀ ▶ ✓`. Check any new non-ASCII character
against the font before it reaches a screen. This has bitten the previous project
twice.

## 7. Versions to re-verify before Sunday

Registries move. These are the ones where being stale actually hurts:

```
cargo add ephemeral-rollups-sdk --features anchor,vrf     # was 0.16.2
npm view @coral-xyz/anchor version                        # was 0.32.1
curl https://status.magicblock.app/api/services            # devnet er + vrf_oracle
```

A version bump on submission morning is not a fix, it is a new risk. Verify to
confirm, not to upgrade.
