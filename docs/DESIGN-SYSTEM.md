# LANTERN

The design system for TRUST FALL. Named after the thing the game is about: a
light only you carry.

`app/src/styles/tokens.css` is the source of truth. `app/src/design/palette.ts`
mirrors it and a test fails if the two drift or if a meaningful colour pair drops
below its contrast floor.

---

## 1. The one idea

**Black plastic on the outside, a lit screen on the inside.**

The shell is the sponsor's object: true black, the MagicBlock mark, moulded
buttons. The screen is the game's object: a warm dark field with an ember light
in it. They are two different palettes on purpose, separated by a bezel, and
nothing crosses between them.

This is why the screen does not use the hackathon website's colours. That palette
is built for a marketing page in a browser at full brightness. Pasting it into a
480x320 game surface would put a sponsor's brand where the player's attention
belongs and would fight the black shell it sits inside.

## 2. The shell

| Token | Value | Use |
| --- | --- | --- |
| `--shell-body` | `#000000` | the console body. True black. |
| `--shell-raised` | `#141419` | button caps, D-pad, the raised plate |
| `--shell-sunk` | `#0a0a0d` | button wells, the screen recess |
| `--shell-edge` | `#4a4a58` | the moulding line between planes |
| `--shell-ink` | `#ffffff` | the MagicBlock mark, `A` `B` `SELECT` labels |
| `--shell-ink-dim` | `#84848f` | the key legend under each button |

`--shell-ink-dim` started at `#6e6e7a` and measured 4.17:1 on black, which misses
AA on the one piece of text that teaches a player which key is `A`. It was
lightened until it cleared, and it now measures 5.68:1.

The mark sits under the screen, centred, at 16px tall, white on black, and it is
the only piece of sponsor identity anywhere in the product. Everything else in
the frame is unbranded plastic.

The bezel is the load bearing detail. A black screen inside a black shell
disappears, so a 4px `--shell-edge` ring plus a 2px `--shell-sunk` inner shadow
makes the screen read as recessed glass. Without it the whole illusion collapses
and no amount of screen polish rescues it.

## 3. The screen: LANTERN

### 3.1 Surfaces

| Token | Value | Use |
| --- | --- | --- |
| `--color-screen` | `#0f0e13` | the field. Everything sits on this. |
| `--color-panel` | `#1a1922` | raised panels, rows, the chat log |
| `--color-sunk` | `#08070b` | wells, empty meter track, door recesses |
| `--color-edge` | `#6b6580` | hairlines, panel borders |

`--color-edge` is much lighter than the equivalent token in the light system this
was ported from, and that is not a taste decision. `panel` measures 1.10:1
against `screen`, so on a dark field **the border is the only thing separating a
panel from the background**. It is load bearing, so it clears 3:1. The first
draft used `#2e2c38`, which measured 1.40:1 and made every panel edge invisible.

### 3.2 Ink

| Token | Value | Use |
| --- | --- | --- |
| `--color-ink` | `#f2efe6` | all body text. Warm white, not pure white. |
| `--color-ink-dim` | `#8b8698` | labels, units, meta, timestamps |
| `--color-ink-invert` | `#0f0e13` | text on accent and on bright fills |

Warm white rather than `#ffffff` because pure white on near black at 8px vibrates,
and because the shell already owns pure white. Two whites in one frame is one too
many.

### 3.3 Meaning

| Token | Value | Use |
| --- | --- | --- |
| `--color-accent` | `#FF5219` | selection fill, **the lantern**, the cursor |
| `--color-accent-ink` | `#0f0e13` | text on accent. Never white. |
| `--color-gain` | `#00FF94` | payout, cleared floor, safe door revealed |
| `--color-loss` | `#FF3B4E` | THE FALL, the wrong door |
| `--color-warn` | `#FFB020` | timer under 10 seconds |
| `--color-cold` | `#4a4757` | a door somebody has ruled out |

`--color-accent` and `--color-gain` are MagicBlock's own ember and green. They are
here because they are genuinely good signal colours against a dark field, not as a
brand gesture, and they carry game meaning rather than sponsor meaning.

### 3.4 Contrast floors

Every pair below is measured by `palette.test.ts` against the value in
`tokens.css`. The test fails if a pair drops under its floor, so these numbers
are enforced rather than claimed.

| Pair | Floor | Measured | Role |
| --- | --- | --- | --- |
| `ink` on `screen` | 7:1 | **16.72:1** | all body copy |
| `ink` on `panel` | 7:1 | **15.14:1** | THE LINE, panel copy |
| `ink-dim` on `screen` | 4.5:1 | **5.46:1** | labels, units, meta |
| `ink-dim` on `panel` | 4.5:1 | **4.94:1** | CPU authors in chat |
| `gain` on `screen` | 7:1 | **14.40:1** | the payout number |
| `warn` on `screen` | 7:1 | **10.51:1** | timer under 10 seconds |
| `loss` on `screen` | 4.5:1 | **5.48:1** | THE FALL |
| `accent` on `screen` | 4.5:1 | **5.92:1** | the YOUR LANTERN label |
| `accent-ink` on `accent` | 4.5:1 | **5.92:1** | text inside a selection fill |
| `edge` on `screen` | 3:1 | **3.48:1** | panel borders, as objects |
| `edge` on `panel` | 3:1 | **3.15:1** | door tile borders |
| `cold` on `screen` | none | 2.13:1 | decorative, never carries text |
| `shell-ink` on `shell-body` | 4.5:1 | **21.00:1** | the mark, A/B/SELECT |
| `shell-ink-dim` on `shell-body` | 4.5:1 | **5.68:1** | the key legend |

Every measured value above was computed from the hex in `tokens.css`, not
estimated. Four pairs are held at 7:1 rather than AA's 4.5:1, because those are
the ones a player reads at 8px with a clock running, which is not the condition
AA was measured for.

`--color-cold` is deliberately below AA. It marks a door as ruled out and the
*reduction* in contrast is the message. It carries no text, and the tile also
takes a `░` hatch so the state survives without colour at all.

## 4. Type

Unchanged from the ported system, because it was right and re-deciding it costs a
day.

```
--font-pixel   'Departure Mono'
--text-micro   8px  / 12px    labels, units, footnotes
--text-body    8px  / 16px    chat, descriptions
--text-value  16px  / 20px    numbers that matter
--text-title  16px  / 24px    screen headers, uppercase
--text-hero   32px  / 40px    boot, results, the multiplier
```

Never 12px, never 20px, never 24px. A bitmap font at a non-integer multiple
resamples and the illusion dies in a way people feel without being able to name.

Confirmed present in the font file: `†` `◄` `►` `▲` `█` `░` `▓` `→` `★`.
**Absent: `☠` `◀` `▶` `✓`.** Check before use, this has cost the previous project
twice.

## 5. The three components this game invents

Everything else is ported. These three are new and they carry the whole product.

### 5.1 `DoorRow`

The doors, on every floor. Each door is a 32x32 tile with its number, and it
carries four independent states that must never collapse into one fill:

| State | Rendering | Means |
| --- | --- | --- |
| default | `panel` fill, `edge` border | nothing known |
| cold | `cold` fill, `░` hatch overlay | somebody marked it |
| cursor | 2px `accent` outline, no fill | your D-pad is here |
| voted | `accent` fill, seat pips below | you voted it |

Cursor and voted are two facts and one fill cannot say both. This is the exact
mistake the previous project shipped: a control that is focused but not chosen
showed nothing, so it looked unimplemented. **Anything the D-pad can land on gets
a cursor state distinct from its chosen state.**

Vote tally is seat pips under the tile, not a number. Four pips read instantly at
8px, `3/4` does not.

### 5.2 `Lantern`

The private clue. The single most important 96 pixels in the product.

```
   YOUR LANTERN                       ← accent, micro, always this exact phrase
   ┌────┬────┬────┬────┬────┐
   │ 1  │ 2  │ 3  │ 4  │ 5  │
   │    │ ░░ │    │ ░░ │    │         ← your cold doors, hatched
   └────┴────┴────┴────┴────┘
   DOORS 2 AND 4 ARE COLD             ← body, ink
   YOU CAN RULE OUT 2 OF 5            ← micro, ink-dim
```

Three redundant encodings of one byte: tiles, a sentence, a count. Redundant on
purpose, because a player has thirty seconds and will read whichever one their eye
lands on first.

It is bordered in `accent` and nothing else on the screen is, so "this is mine and
only mine" is a visual fact before it is a sentence.

### 5.3 `TheLine`

The chat log. `panel` fill, newest at the bottom, autoscrolled.

```
P2 > DOOR 4 COLD HERE
P3 > SAME PLUS 1
CPU> DOOR 2 IS COLD               ← CPU authors in ink-dim, never in ink
```

Seat colour is a pip before the name, not coloured text, because four coloured
text runs at 8px on a dark field is unreadable and looks like a christmas tree.

CPU authors render dim. A bot must never be mistakable for a person, in the log or
anywhere else.

## 6. Motion

Stepped for anything on the pixel grid, real curves only for full screen effects.

```
--ease-sprite-2 / -4 / -8    steps(n, end)
--ease-out-screen            cubic-bezier(0.23, 1, 0.32, 1)
```

No `--ease-in`. It delays the first movement, which is the exact moment the player
is watching, and it reads as lag.

Two transforms never share an element. A positioning transform and an animated
transform live on separate nested elements, always, because `transform` is one
property and the animation silently replaces the positioning.

The one moment worth real animation is the door opening on S6 RESOLVE. Everything
else is a state change, not a transition.

## 7. Layout discipline

Fixed 480x320, `overflow: hidden`, everything on a 4px grid.

**Every screen picks the one block whose exact height carries no information** and
gives it `flex-1 min-h-0` plus a `minHeight` floor. Fixed blocks keep their
natural size, the flexible one absorbs the remainder, and the footer cannot be
pushed off because nothing is pushing.

Never budget a screen by hand-summing token line heights. That arithmetic is a
guess about how a font actually renders, it has been optimistic by 10 to 20px
every time it has been tried, and `overflow: hidden` never warns. Keep the budget
comment as documentation, never as the guarantee.

On each screen the flexible block is named in `technical/SCREEN-DETAIL.md`.

## 8. Two rules that look like over-engineering

Written down so nobody deletes them in a cleanup.

**The `tokens.css` plus `palette.ts` mirror.** It looks like duplication. It is
the only way to assert contrast in a test, because jsdom performs no layout and
cannot read a stylesheet's computed colours. The test is the thing that stops a
palette tweak from quietly making the timer unreadable.

**Hand-built pixel primitives instead of a component library.** Every library
component assumes fractional spacing, system fonts, and border radius. Fighting
one out of a library costs more than the forty lines the primitive takes, and the
grid discipline test would fail on all of them anyway.
