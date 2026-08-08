# Quick Play & Live Chain Integration Specification

**Date**: 2026-08-08  
**Status**: Approved  
**Target Lanes**: Lane B (Chain Client & Bots) & Lane C (Console & Web UI)  
**Related Documents**: `docs/PRD.md`, `docs/technical/BUILD-PLAN.md`, `docs/technical/SCREEN-DETAIL.md`

---

## 1. Overview

This design delivers **1-Click Quick Play** and live chain-client state binding for the BLOCKBOY web application. It enables a solo hackathon judge to open the app, click **QUICK PLAY**, and be inside a live party on MagicBlock Ephemeral Rollups (ER) with VRF-dealt clues and CPU bot teammates in under 15 seconds.

All game transactions (`createParty`, `ready`, `delegate`, `requestDeal`, `vote`, `finalSettle`, `settle`) execute on-chain on Solana devnet and the MagicBlock ER. If no wallet extension (Phantom/Backpack) is connected, an ephemeral browser keypair is auto-generated and funded, eliminating wallet popups while preserving 100% on-chain proof of VRF and state delegation.

---

## 2. Architecture & Modules

```
apps/web/
├── lib/
│   ├── ephemeralWallet.ts       (Browser keypair manager & auto-funder)
│   └── runObserver.ts           (Sub-second board state poller using /api/runs/:code)
└── components/
    └── viewport/
        ├── QuickPlayRunner.ts   (Orchestrator: create -> fill bots -> ready -> delegate -> deal)
        └── ScreenManager.tsx    (Wired to live run state & hardware controller inputs)
```

### 2.1 Ephemeral Wallet (`ephemeralWallet.ts`)
- Automatically checks for a connected wallet or retrieves a cached keypair from `sessionStorage`.
- If no wallet exists, generates a fresh `Keypair` and ensures it holds SOL on base layer (airdrop or transfer) to pay transaction fees.

### 2.2 Quick Play Runner (`QuickPlayRunner.ts`)
- Generates a random 4-char code (e.g. `QP88`).
- Calls `tf.createParty(hostPubkey, code, 0, 1000000)` on base layer.
- Calls NestJS backend `POST /api/runs/:code/bots/fill` `{ count: 3 }` to join and ready 3 CPU seats automatically.
- Calls `tf.ready(hostPubkey, runKey(code))` on base layer.
- Calls `tf.delegate(hostPubkey, code, EU_VALIDATOR)` to delegate accounts to MagicBlock ER.
- Advances viewport screen to `S4 DEAL`.
- Calls `tf.requestDeal(hostPubkey, code)` on ER when delegated.

### 2.3 Run Observer (`runObserver.ts`)
- Polls `/api/runs/:code?seat=0` every 800ms.
- Extracts `run.phase`, `run.floor`, `run.vrfState`, `run.cleared`, `run.outcome`, `ownClueMask`, and `players`.
- Auto-advances `ScreenManager` screen:
  - `phase === 0 (LOBBY)` -> `S3 PARTY`
  - `phase === 1 (DEALING)` -> `S4 DEAL`
  - `phase === 2 (FLOOR)` -> `S5 FLOOR`
  - `phase === 3 (BANK)` -> `S7 BANK OR CLIMB`
  - `phase === 4 (DONE)` -> `S8 RESULTS`

### 2.4 User Action Handlers (D-Pad & Buttons)
- **S5 FLOOR**:
  - D-Pad Left/Right or `A`: Calls `tf.vote(player, code, doorIndex)` on ER.
  - `SELECT`: Toggles chat input; typing + `⏎` posts message to backend chat endpoint.
- **S7 BANK OR CLIMB**:
  - `A`: Votes BANK (`tf.bankVote(player, code, 1)`).
  - `B`: Votes CLIMB (`tf.bankVote(player, code, 2)`).
- **S8 RESULTS**:
  - `A`: Restarts flow (`S2 LOBBY`).

---

## 3. Screen State Mapping

| On-Chain State | Screen Component | Rendered Data |
| --- | --- | --- |
| Not started | `S0 BOOT` -> `S1 CONNECT` -> `S2 LOBBY` | Wallet balance, Privacy rung badge |
| Lobby creating | `S3 PARTY` | Code, 4 seats (Host + 3 CPUs), Ready mask |
| VRF in flight | `S4 DEAL` | Stepped animation, seconds counter, retry trigger |
| Floor active | `S5 FLOOR` | Floor #, doors 1..N, own clue mask, chat messages, timer |
| Door opened | `S6 RESOLVE` | Safe/Loss reveal, post-mortem attribution |
| Bank decision | `S7 BANK OR CLIMB` | Bank vs Climb payouts, live vote pips |
| Run complete | `S8 RESULTS` | Payout summary, stats, `PAID FROM PARTIES THAT FELL. RAKE 0.` |

---

## 4. Verification Plan

1. **Typecheck & Build**:
   - `pnpm --filter @trust-fall/web build` must compile cleanly with zero TypeScript errors.
2. **End-to-End Quick Play Test**:
   - Click Quick Play in browser -> verify party creation, bot fill, delegation, VRF deal, floor 0 rendered with private clue, vote submission, and results screen.
