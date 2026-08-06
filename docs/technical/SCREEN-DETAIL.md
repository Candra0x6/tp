# SCREEN-DETAIL

Every screen, its content, and **which block absorbs the vertical remainder**.

The wireframes below are authoritative about content and never about exact
stacking. The 480x320 viewport is `overflow: hidden`, so a screen that overruns
produces no error, no warning, and no seam, only a missing footer. jsdom performs
no layout, so no test catches it either.

**The rule, on every screen: one block gets `flex-1 min-h-0` plus a `minHeight`
floor, every other block keeps its natural height.** The flexible block is named
in each section below. Never defend a layout with a hand-summed column of token
line heights. That arithmetic has been optimistic by 10 to 20px every time it has
been tried, because it is a guess about how a font actually renders.

---

## Global frame

```
┌─────────────────────────────────────────────────┐
│                  black shell                    │
│   ┌─────────────────────────────────────────┐   │
│   │  bezel 4px                              │   │
│   │  ┌───────────────────────────────────┐  │   │
│   │  │  480 x 320 screen, safe inset 12  │  │   │
│   │  └───────────────────────────────────┘  │   │
│   └─────────────────────────────────────────┘   │
│              ▶ MagicBlock                       │
│                                                 │
│      ▲          ┌────┐                          │
│    ◄   ►        │ B  │  │ A  │      SELECT      │
│      ▼          └────┘  └────┘       key: ⏎     │
│   key: arrows    key: x  key: z                  │
└─────────────────────────────────────────────────┘
```

**The key legend lives on the shell, once, and never on a screen.** Screens name
the button (`A VOTE`), the hardware names the key (`z`). The previous project
shipped `A INSPECT` on nine screens while `a` was bound to LEFT, so players
pressed A, the cursor slid sideways, and a fully built feature looked broken.

Footer band is 20px, always present, always the last row, never inside the
flexible block.

---

## S0 BOOT

```
                    BLOCKBOY
              ┌──────────────┐
              │  TRUST FALL  │        cartridge label
              └──────────────┘
              ▶ MagicBlock

              CHECKING TOWER...        ← router + status probe
```

Under two seconds, skippable on any key. Resolves the router and the service
status here so S1 already knows which privacy rung is live.

Flexible block: the cartridge art.

## S1 CONNECT

```
  INSERT MEMORY CARD
  ┌───────────────────────────────────────┐
  │  ▸ PHANTOM                            │
  │    BACKPACK                           │
  │    SOLFLARE                           │
  └───────────────────────────────────────┘
  BALANCE   12.00 USDC        devnet
  PRIVACY   PRIVATE ER                     ← or PUBLIC ER, honestly
  ─────────────────────────────────────────
  A CONNECT                                B BACK
```

If the balance is zero, the row becomes a faucet link rather than an error. A
judge with an empty wallet must never hit a dead end.

The PRIVACY row is not decoration. It reads what the deployment actually
resolved to, and it is the one line that stops the product overclaiming.

Flexible block: the wallet list.

## S2 LOBBY

```
  ┌───────────────────────────────────────┐
  │  ▸ QUICK PLAY        fills with CPU   │  ← default focus
  │    CREATE PARTY                       │
  │    JOIN BY CODE      [ _ _ _ _ ]      │
  └───────────────────────────────────────┘
  PRIZE VAULT   104.00 USDC
  ─────────────────────────────────────────
  A SELECT                                 B BACK
```

**QUICK PLAY is the default focus and the top row.** That is the path a solo
judge takes, and every extra keystroke between the link and a live clue costs
submission quality.

Flexible block: the mode list.

## S3 PARTY

```
  PARTY  A7K2                     3 / 4
  ┌───────────────────────────────────────┐
  │ ● P1  7xKq..3f   HOST         READY   │
  │ ● P2  Bd91..az                READY   │
  │ ● P3  CPU                     READY   │
  │ ○ P4  ---                     EMPTY   │
  └───────────────────────────────────────┘
  DEPTH    ▸ QUICK ◂   DEEP
           3 FLOORS  ·  4 4 5 DOORS
           BLIND ODDS 1 IN 80
  STAKE    1.00 USDC EACH   ·   POT 3.00
  ─────────────────────────────────────────
  A READY                                B BACK
```

Blind odds are shown before the run, not after, because the whole pitch is the
gap between that number and what a talking party achieves.

Depth chips carry cursor and applied as two separate states. A chip the D-pad has
landed on but not chosen shows an ink outline, a chosen chip shows the accent
fill, and applied wins when both are true.

Flexible block: the roster.

## S4 DEAL

```
              THE TOWER IS DEALING

              ░░▓▓██▓▓░░               ← stepped, 8 frames

              VRF REQUESTED
              WAITING FOR THE ORACLE

                                      9s
```

An honest pending screen, not a spinner over a result already in hand. Request
acceptance is not fulfilment. After 10 seconds it offers a retry with a fresh
nonce, and the old nonce is invalidated so a late callback cannot deal twice.

Flexible block: the dealing animation.

## S5 FLOOR

The screen that matters. Everything else in the product exists to get here.

```
  FLOOR 3 / 5          ████████░░░░  0:28      ← warn colour under 0:10
  ┌────┬────┬────┬────┬────┐
  │ 1  │ 2  │ 3  │ 4  │ 5  │
  │    │ ░░ │    │ ░░ │    │                    ← party marks, union
  └────┴────┴────┴────┴────┘
    ●●   ·    ●    ·    ·                       ← vote pips per door
  ┌ YOUR LANTERN ────────────────────────┐      ← accent border, only one
  │  ░░ on 2 and 4                       │
  │  DOORS 2 AND 4 ARE COLD              │
  │  YOU CAN RULE OUT 2 OF 5             │
  └──────────────────────────────────────┘
  ┌ THE LINE ────────────────────────────┐
  │ P2 > 4 IS COLD FOR ME                │
  │ CPU> DOOR 2 IS COLD                  │      ← CPU dim, never ink
  │ P1 > SO ITS 1 OR 3                   │
  └──────────────────────────────────────┘
  ─────────────────────────────────────────
  A VOTE      B MARK              SELECT TALK
```

**Flexible block: THE LINE.** Its exact height carries no information, it simply
shows as many recent messages as fit. The doors, the lantern, the timer and the
footer all keep their natural height, so none of them can be pushed off.

Three things this screen must never get wrong:

- **Cursor and vote are different fills.** A door the D-pad is on shows a 2px
  accent outline. A door you voted shows an accent fill. Both at once, fill wins.
- **`SELECT TALK` opens the chat input.** While it is open the D-pad is text
  entry, so the footer rewrites itself to `⏎ SEND  ESC CANCEL`. A key that means
  two things is only allowed when a visible label names the current meaning.
- **The timer is the only element that changes colour on state.** Under 10
  seconds it goes `warn`. Nothing else on the screen competes with that.

## S6 RESOLVE

```
              DOOR 3
         ┌──────────────┐
         │  ███  ███    │              ← the door opening, real easing
         └──────────────┘
              SAFE                     ← gain, hero
         FLOOR 3 CLEARED
         POT  3.00  ▸  7.80

  P2 HELD THE ANSWER                   ← who ruled out the last wrong door
```

On a fall the same layout inverts: `loss` colour, the safe door revealed, and the
same "who held it" line. **The loss has to teach**, so the post mortem names
whose clue contained the answer and what the party missed.

Flexible block: the door art.

## S7 BANK OR CLIMB

Overlay on S6, not a separate route.

```
  ┌───────────────────────────────────────┐
  │           BANK OR CLIMB               │
  │                                       │
  │   BANK NOW        7.80   2.60 EACH    │
  │   CLIMB           11.40 IF YOU CLEAR  │
  │                                       │
  │   NEXT FLOOR   6 DOORS   0:30         │
  │                                       │
  │   ▸ BANK        CLIMB                 │
  │     ● ○ ○                             │  ← live vote pips
  │                                       │
  │   DEFAULTS TO CLIMB IN 14s            │
  └───────────────────────────────────────┘
```

Both numbers are clamped to the vault and shown as the real payable amount. Never
render an aspirational multiplier.

Flexible block: the spacer between the options and the vote pips.

## S8 RESULTS

```
              BANKED
              7.80 USDC
              2.60 EACH

  FLOORS CLEARED       3 / 5
  MESSAGES SENT        24
  BLIND ODDS           1 IN 2400          ← for the depth actually played
  PRIZE VAULT          96.20 USDC         ← after this run

  PAID FROM PARTIES THAT FELL. RAKE 0.

  ─────────────────────────────────────────
  A RUN IT BACK                    B DISKS
```

`PAID FROM PARTIES THAT FELL. RAKE 0.` is a required line, not copy. It is the
sentence that makes the economy honest instead of implied.

`MESSAGES SENT` is there because it is the only stat that measures the thing the
game is actually about.

Flexible block: the stat list.

---

## Budget discipline, restated

The previous project clipped its footer twice, both times defended by arithmetic
that summed token line heights. Two things caused it:

- A `Value` component defaults to a 20px line, not the 12px micro line the row
  looked like it was. Budget from the **component's default role**, never from
  the role the row resembles.
- `overflow: hidden` at exactly 320px never warns, and the failure looks like a
  design choice rather than a bug.

`useOverflowWarning` in the console shell warns in dev when a screen's scroll
height exceeds 320. Keep it. It is the only automated signal available, because
no test environment in this stack performs layout.

Check every screen at 412px wide on a real phone before calling it finished, and
say plainly when a layout was reasoned rather than seen.
