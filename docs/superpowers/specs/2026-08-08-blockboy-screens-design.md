# BLOCKBOY Screen Components & State Manager Specification

**Date**: 2026-08-08  
**Status**: Approved  
**Target Lane**: Lane C (Console, Screens, UI Integration)  
**Related Documents**: `docs/DESIGN-SYSTEM.md`, `docs/technical/SCREEN-DETAIL.md`, `docs/technical/BUILD-PLAN.md`

---

## 1. Overview

This design replaces the legacy HTML5 2D canvas placeholder (`apps/web/components/GameViewport.tsx`) with a React DOM & CSS screen system on a fixed logical grid of **480 × 320**. Everything adheres strictly to the **LANTERN** design system and the screen layout budgets detailed in `docs/technical/SCREEN-DETAIL.md`.

No canvas engine is used. Every screen component renders pure HTML/CSS elements styled via LANTERN design tokens (`--color-screen`, `--color-panel`, `--color-sunk`, `--color-edge`, `--color-ink`, `--color-accent`, `--color-gain`, `--color-loss`, `--color-warn`, `--color-cold`).

---

## 2. Architecture & Component Hierarchy

```
apps/web/components/
├── ConsoleShell.tsx              (Console frame & hardware toolbar)
└── viewport/
    ├── ScreenManager.tsx         (Active screen router, controller input, & simulator mode)
    ├── useOverflowWarning.ts     (Dev-only height overrun detector)
    ├── FooterBand.tsx            (Fixed 20px bottom legend: "A SELECT · B BACK")
    └── screens/
        ├── S0Boot.tsx            (Boot animation & network status probe)
        ├── S1Connect.tsx         (Wallet selection & Privacy Rung badge)
        ├── S2Lobby.tsx           (Quick Play, Create Party, Join Code)
        ├── S3Party.tsx           (Roster, Ready status, Depth & Stake options)
        ├── S4Deal.tsx            (VRF pending animation with 10s retry trigger)
        ├── S5Floor.tsx           (Doors, Lantern clue card, The Line chat, warning timer)
        ├── S6Resolve.tsx         (Door opening reveal & post-mortem attribution)
        ├── S7BankOrClimb.tsx     (Vault-clamped payout choice overlay)
        └── S8Results.tsx         (Run outcome, stats, "PAID FROM PARTIES THAT FELL. RAKE 0.")
```

---

## 3. Screen Specifications & Layout Budgets

Each screen maintains a total height of exactly **320px** inside the **480px** wide viewport. Exactly one element per screen receives `flex-1 min-h-0` to absorb vertical remainder, avoiding overflow issues.

### S0 BOOT
- **Content**: BLOCKBOY logo, TRUST FALL cartridge label, MagicBlock mark, "CHECKING TOWER..." status probe.
- **Flexible Block**: Cartridge art container.
- **Behavior**: Auto-advances to S1 in 1.5s or instantly on any key press.

### S1 CONNECT
- **Content**: Memory card slot wallet selector (Phantom, Backpack, Solflare), USDC balance readout, Privacy Rung badge (`PUBLIC ER` / `PRIVATE ER`).
- **Flexible Block**: Wallet list container.
- **Behavior**: Connects active wallet via Freighter / Solana wallet adapter or enters demo/guest mode.

### S2 LOBBY
- **Content**: Mode options (`QUICK PLAY` as default focus, `CREATE PARTY`, `JOIN BY CODE`), prize vault readout.
- **Flexible Block**: Mode list container.

### S3 PARTY
- **Content**: Party code, 4-player seat roster with host badge and READY indicators, depth selector (`QUICK` 3 floors vs `DEEP` 5 floors), stake & pot calculation, blind odds readout.
- **Flexible Block**: Roster table.

### S4 DEAL
- **Content**: Stepped 8-frame dealing animation, "VRF REQUESTED / WAITING FOR THE ORACLE", 10s retry button trigger.
- **Flexible Block**: Dealing animation box.

### S5 FLOOR (The Core Screen)
- **Content**: Floor header (e.g. `FLOOR 3 / 5`), countdown timer (<10s uses `--color-warn`), Door grid (1..N) with party marks & vote pips, Lantern clue box displaying player's private `ClueSlot`, The Line chat log, and footer actions (`A VOTE`, `B MARK`, `SELECT TALK`).
- **Flexible Block**: **THE LINE** chat log container (`flex-1 min-h-0`).
- **Chat Modal**: Pressing `SELECT` toggles inline text input mode, rewriting footer to `⏎ SEND  ESC CANCEL`.

### S6 RESOLVE
- **Content**: Door opening animation, safe door revealed or fall outcome (`GAIN` / `LOSS` colors), post-mortem clue attribution ("P2 HELD THE ANSWER").
- **Flexible Block**: Door reveal animation area.

### S7 BANK OR CLIMB
- **Content**: Modal overlay over S6. Displays vault-clamped payouts for Bank vs Climb, live member vote pips, 14s auto-climb countdown.
- **Flexible Block**: Spacer between decision cards and vote pips.

### S8 RESULTS
- **Content**: Final status banner (`BANKED` / `FELL` / `CLEARED`), payout summary, floors cleared, messages sent stat, blind odds, prize vault balance after run, and required line `PAID FROM PARTIES THAT FELL. RAKE 0.`.
- **Flexible Block**: Stat list container.

---

## 4. State Integration & Simulator Mode

1. **Live Chain Client Mode**:
   - `ScreenManager` listens to `tf.fetchRunEr()` / `tf.fetchRunBase()` to automatically drive screen transitions as the run phase changes (`LOBBY` -> `DEALING` -> `FLOOR` -> `DONE`).
2. **Dev / Simulator Mode**:
   - Pressing `Shift+S` or using the customizer drawer in `ConsoleShell` opens a simulator toolbar allowing developers/designers to immediately preview and test any screen state (S0 through S8) with mock data.

---

## 5. Self-Review & Verification Plan

1. **Layout & Overflow Check**:
   - `useOverflowWarning` monitors viewport `scrollHeight` vs `clientHeight` (320px) and logs dev warnings if any screen overruns.
2. **Typography & Colors**:
   - Uses Departure Mono 8px bitmap font (`font-pixel`) and LANTERN CSS tokens.
3. **Build & Typecheck Verification**:
   - `pnpm --filter @trust-fall/web build` and `tsc --noEmit` must pass with zero errors.
