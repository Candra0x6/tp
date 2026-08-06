# components

Primitives ported from MONADBOY, plus the two files that were rewritten for this
project. **This folder is the reference copy.** `app/src/` is what actually
builds. Port from here once at Phase 0 task 0.6, then treat `app/src/` as the
living version and this folder as provenance.

## Ported unchanged

They are plain React driven by CSS custom properties, so they carry across
frameworks untouched and a reskin of `tokens.css` reskins all of them at once.

| Path | What |
| --- | --- |
| `console/Console.tsx` | the shell, the 480x320 viewport, the overflow warning |
| `console/Controls.tsx` | D-pad, A, B, SELECT |
| `console/useFitScale.ts` | integer-factor scaling to the visual viewport |
| `console/useConsoleInput.tsx` | keyboard to intent |
| `console/input-store.ts`, `intents.ts` | the input model |
| `console/console.css` | shell chrome |
| `ui/text.tsx` | Title, Value, Body, Micro |
| `ui/surface.tsx` | Panel, Well, Divider |
| `ui/select.tsx` | Chip, FocusCursor, Row |
| `ui/data.tsx` | Meter, Pip, StatRow |
| `ui/motion.tsx` | stepped sprite helpers |

Two behaviours in `useFitScale` that look like over-engineering and are not.
It measures a `position: fixed; inset: 0` box rather than the document, because
`min-height` on `html, body` lets the document outgrow the visual viewport and
produces a console that floats small on a real phone. And it re-measures on
`document.fonts.ready` and on `visualViewport` resize, because a webfont swap
changes the box after first paint and a retracting mobile URL bar fires nothing
else.

In `ui/select.tsx`, `FocusCursor` returns `null` when inactive rather than a
transparent spacer. A permanent 8px indent nobody chose is worse than a row that
steps forward to meet its cursor.

## Rewritten for TRUST FALL

| Path | What changed |
| --- | --- |
| `styles/tokens.css` | DAYLIGHT to **LANTERN**. Dark screen, black shell, measured contrast. |
| `design/palette.ts` | mirrors LANTERN, plus a separate shell contract |
| `config/brand.ts` | all new names, the depth table, the vote threshold |

## To be written

`DoorRow`, `Lantern`, and `TheLine` are new and are specified in
`docs/DESIGN-SYSTEM.md` section 5. They are the three components that carry the
product, so they are worth building carefully rather than fast.

## Two rules that survive the port

**Two transforms never share an element.** A positioning transform and an
animated transform live on separate nested elements. `transform` is one property,
so the animation silently replaces the positioning and the sprite drifts.

**Anything the D-pad can land on gets a cursor state distinct from its chosen
state.** Cursor is an outline, chosen is a fill, chosen wins when both are true.
The previous project shipped a control that was focusable but showed nothing when
focused, and it read as unimplemented.
