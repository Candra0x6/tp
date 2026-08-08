# TRUST FALL

A virtual handheld console, **BLOCKBOY**, running one cartridge: **TRUST FALL**.  
Built for **MagicBlock Blitz v7**, theme **collaboration**.

> Three of us each see a different clue. None of us can solve the floor alone.
> The chain will not show me yours. So we talk, we vote, and the door opens.

Every floor has several doors and exactly one is safe. Each player is privately dealt a clue that only they can read, constructed so that **no player can solve a floor alone and the whole party together always can**.

Blind, a party clears the tower once in 2,400 runs. Talking to each other, every time.

---

## Live Deployment & Verified On-Chain State

- **Deployed Program ID**: `7JhuY8EbFKruHcUT1dp7DCXmuvu8NkAfuP4NbGdKs2SR`
- **Base Network**: Solana Devnet (`https://api.devnet.solana.com`)
- **Ephemeral Rollup**: MagicBlock Devnet (`devnet-eu.magicblock.app`)
- **Privacy Rung**: Rung 1 (Public Ephemeral Rollup with on-chain VRF & deterministic clue elimination)
- **Gate Status**: **GATE G1 PASSED** (6/6 Rust unit tests), **GATE G2 PASSED** (Devnet end-to-end driver pass with vault reconciliation)

---

## 1-Click Quick Play (For Hackathon Judges)

A judge opening the link alone can play immediately without any wallet setup:

1. Open the application.
2. Select **QUICK PLAY** on the BLOCKBOY screen.
3. The browser generates a real guest keypair, auto-funds it, creates an on-chain party, auto-fills 3 CPU bot seats via the backend, and delegates state to the MagicBlock ER in under 15 seconds.
4. Interact with the live floor (vote on doors, inspect your private clue, chat with CPU teammates).

---

## Verification Command

To verify the end-to-end on-chain flow (party creation, bot join, delegation, VRF deal, floor resolution, ER final settle, auto-undelegate, base payout settle, and vault reconciliation):

```bash
# 1. Install dependencies & build
pnpm install
pnpm build

# 2. Run NestJS backend with bot seed
cd apps/backend
TF_MINT=6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy TF_BOT_SEED=GazkSw3yhO6GiC5K+reE3Pyek6OkD/47 node dist/main.js &

# 3. Run live devnet verification gate
TF_MINT=6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy TF_BOT_SEED=GazkSw3yhO6GiC5K+reE3Pyek6OkD/47 TF_VALIDATOR=MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e node scripts/live-run.mjs TEST1
```

Expected output:
```
[live-run] delegated fqdn=https://devnet-eu.magicblock.app/
[live-run] party in dealing phase
[live-run] deal #1 requested
[live-run] run DONE outcome=FELL floors=0
[live-run] final settle committed
[live-run] waiting for undelegate…
[live-run] run back on base
[live-run] payout settle sent
[live-run] vault ledger balance=508 seeded=500 falls=8 payouts=0 ata=508
[live-run] reconcile seeded+falls-payouts==balance: OK
```

---

## Project Architecture

```
trust-fall/
├── contracts/               Anchor program (`trust_fall`) on Solana & MagicBlock ER
├── packages/
│   ├── chain-client/        `TrustFallProgram` SDK, IDL, PDA derivation, ER router
│   ├── types/               Shared game types & domain models
│   └── ui/                  BLOCKBOY handheld console shell & LANTERN design system
├── apps/
│   ├── web/                 Next.js 15 web application with DOM/CSS 480x320 viewport
│   └── backend/             NestJS backend for CPU bot auto-fill & relay state
└── docs/                    Technical documentation & specifications
```

---

## Licence

MIT.
