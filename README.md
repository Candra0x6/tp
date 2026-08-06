# TRUST FALL

A co-op climbing game for 2 to 4 players, on a virtual handheld called
**BLOCKBOY**. Built for **MagicBlock Blitz v7**, theme **collaboration**.

> Three of us each see a different clue. None of us can solve the floor alone.
> The chain will not show me yours. So we talk, we vote, and the door opens.

Every floor has several doors and exactly one is safe. Each player is privately
dealt a clue that only they can read, constructed so that **no player can solve a
floor alone and the whole party together always can**. The privacy is not a UI
trick. The clue accounts are gated inside an Intel TDX enclave by a Private
Ephemeral Rollup, so "I know something you do not" is a fact about the chain.

Blind, a party clears the deep tower once in 2400 runs. Talking to each other,
every time.

---

## Status

**Pre-build.** Docs and the ported design system are in place. The program, the
app, and the deployment do not exist yet. `docs/technical/BUILD-PLAN.md` is the
live status of everything.

Nothing in this README claims a working deployment until one exists. When it
does, the live link, the program ID, and a paste-able verify command go here.

## Where things are

```
trust-fall/
├── CLAUDE.md                    the rules that must hold in every session
├── docs/
│   ├── PRD.md                   the product, the loop, scope, roadmap
│   ├── DESIGN-SYSTEM.md         LANTERN. Black shell, lit screen.
│   └── technical/
│       ├── BUILD-PLAN.md        lanes, phases, gates, LIVE STATUS
│       ├── GAME-LOGIC.md        the clue algorithm and its proof, the economy
│       ├── MAGICBLOCK.md        ER, PER, VRF, cranks, endpoints, failure ladder
│       ├── ERD.md               accounts, and what is public
│       ├── ARCHITECTURE.md      repo layout, boundaries, lane ownership
│       ├── TECH-STACK.md        pinned versions, verified 5 Aug 2026
│       ├── SCREEN-DETAIL.md     every screen and its 320px budget
│       └── DEMO-SCRIPT.md       the video, the README, the checklist
├── components/                  ported primitives. console, ui, tokens, palette.
└── .claude/skills/              magicblock, solana-dev, and the craft skills
```

## Read in this order

New to the project, in about fifteen minutes:

1. `CLAUDE.md` for the rules.
2. `docs/PRD.md` sections 1 and 6 for what it is and the pitch.
3. `docs/technical/GAME-LOGIC.md` section 3 for the clue algorithm. This is the
   idea. If you only read one thing, read this.
4. `docs/technical/BUILD-PLAN.md` for what is actually done.

Before writing code, also read `docs/technical/MAGICBLOCK.md` and load the
`magicblock` skill. **The skill beats your memory.** The SDK moved to 0.16.2,
renamed the commit functions, and moved VRF into the main crate, so anything you
recall from before this repo is suspect.

## The claim, and how to check it

The whole submission rests on one observation: **you cannot read another player's
clue.** `docs/technical/MAGICBLOCK.md` section 4 has the privacy ladder and what
each rung honestly provides, and section 9 has the six pre-submission checks.

If this ships on a public Ephemeral Rollup rather than a private one, this README
will say so in those words, and the verify command will be deleted rather than
left aspirational.

## Licence

MIT.
