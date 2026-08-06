/**
 * LANTERN palette, mirrored from styles/tokens.css.
 *
 * This exists so contrast can be asserted in a test. jsdom performs no layout
 * and cannot cheaply read a stylesheet's computed colours, so without this
 * mirror there is no way to fail a build when a palette tweak quietly makes the
 * timer unreadable.
 *
 * palette.test.ts fails if this file and tokens.css disagree, so the mirror
 * cannot silently rot.
 */

/** The console body. The only place MagicBlock identity appears. */
export const shell = {
  body: '#000000',
  raised: '#141419',
  sunk: '#0a0a0d',
  edge: '#4a4a58',
  ink: '#ffffff',
  inkDim: '#84848f',
} as const

/** The screen. A warm dark field with an ember light in it. */
export const lantern = {
  screen: '#0f0e13',
  panel: '#1a1922',
  sunk: '#08070b',

  ink: '#f2efe6',
  inkDim: '#8b8698',
  inkInvert: '#0f0e13',

  edge: '#6b6580',

  accent: '#ff5219',
  accentInk: '#0f0e13',

  gain: '#00ff94',
  loss: '#ff3b4e',
  warn: '#ffb020',

  cold: '#4a4757',
} as const

export type LanternColor = keyof typeof lantern
export type ShellColor = keyof typeof shell

/** The CSS custom property name for each screen entry. */
export const cssVar: Record<LanternColor, string> = {
  screen: '--color-screen',
  panel: '--color-panel',
  sunk: '--color-sunk',
  ink: '--color-ink',
  inkDim: '--color-ink-dim',
  inkInvert: '--color-ink-invert',
  edge: '--color-edge',
  accent: '--color-accent',
  accentInk: '--color-accent-ink',
  gain: '--color-gain',
  loss: '--color-loss',
  warn: '--color-warn',
  cold: '--color-cold',
}

export const shellCssVar: Record<ShellColor, string> = {
  body: '--color-shell-body',
  raised: '--color-shell-raised',
  sunk: '--color-shell-sunk',
  edge: '--color-shell-edge',
  ink: '--color-shell-ink',
  inkDim: '--color-shell-ink-dim',
}

/**
 * Every colour pair the product actually renders, with the floor it must clear.
 *
 * `text` pairs carry words. Body copy is 8px, which is small enough that AA's
 * 4.5:1 is not comfortable, so text on the field clears 4.5 and the pairs a
 * player reads under time pressure are held higher in `criticalText`.
 *
 * `object` pairs are borders, fills, and bars that carry meaning without words,
 * and clear 3:1.
 *
 * Measured values in the comments were computed from the hex above. Recompute
 * rather than guess if you change a colour.
 */
export const contrastContract: Array<{
  fg: LanternColor
  bg: LanternColor
  kind: 'text' | 'object'
  where: string
}> = [
  // text -----------------------------------------------------------------
  { fg: 'ink', bg: 'screen', kind: 'text', where: 'all body copy' }, // 16.72
  { fg: 'ink', bg: 'panel', kind: 'text', where: 'panel copy, THE LINE' }, // 15.14
  { fg: 'inkDim', bg: 'screen', kind: 'text', where: 'labels, units, meta' }, // 5.46
  { fg: 'inkDim', bg: 'panel', kind: 'text', where: 'CPU authors in chat' }, // 4.94
  { fg: 'gain', bg: 'screen', kind: 'text', where: 'payout, cleared floors' }, // 14.40
  { fg: 'gain', bg: 'panel', kind: 'text', where: 'results panel payout' }, // 13.04
  { fg: 'loss', bg: 'screen', kind: 'text', where: 'THE FALL' }, //  5.48
  { fg: 'loss', bg: 'panel', kind: 'text', where: 'results panel loss' }, //  4.96
  { fg: 'warn', bg: 'screen', kind: 'text', where: 'timer under 10s' }, // 10.51
  { fg: 'accent', bg: 'screen', kind: 'text', where: 'YOUR LANTERN label' }, //  5.92
  { fg: 'accentInk', bg: 'accent', kind: 'text', where: 'the selected row' }, //  5.92
  { fg: 'inkInvert', bg: 'gain', kind: 'text', where: 'safe door reveal' }, // 14.40

  // object ---------------------------------------------------------------
  { fg: 'edge', bg: 'screen', kind: 'object', where: 'panel borders' }, //  3.48
  { fg: 'edge', bg: 'panel', kind: 'object', where: 'door tile borders' }, //  3.15
  { fg: 'accent', bg: 'screen', kind: 'object', where: 'cursor outline' }, //  5.92
  { fg: 'accent', bg: 'sunk', kind: 'object', where: 'timer bar on track' }, //  6.19
]

/** Shell pairs. Separate contract because the shell is a separate palette. */
export const shellContrastContract: Array<{
  fg: ShellColor
  bg: ShellColor
  kind: 'text' | 'object'
  where: string
}> = [
  { fg: 'ink', bg: 'body', kind: 'text', where: 'the MagicBlock mark, A/B' }, // 21.00
  { fg: 'inkDim', bg: 'body', kind: 'text', where: 'the key legend' }, //  5.68
]

/**
 * Pairs that do not meet a floor, on purpose. Each must be paired with a
 * second, non-colour signal so nothing depends on the colour alone.
 */
export const decorative: Array<{
  pair: string
  measured: string
  why: string
}> = [
  {
    pair: 'cold on screen',
    measured: '2.13:1',
    why: 'a door somebody ruled out. The LOSS of contrast is the message, and the tile also carries a ░ hatch so the state survives without colour. Never carries text.',
  },
  {
    pair: 'shell-edge on shell-body',
    measured: '2.41:1',
    why: 'moulding lines between planes of black plastic. Decorative depth only. The screen bezel is 4px wide, so it reads as a shape rather than as a hairline.',
  },
  {
    pair: 'panel on screen',
    measured: '1.10:1',
    why: 'panels are separated by their 1px edge border, which clears 3:1, not by their fill. Fill alone is never the boundary of a control.',
  },
  {
    pair: 'screen on shell-body',
    measured: '1.09:1',
    why: 'a dark screen inside a black shell. This is exactly why --bezel-w exists and why removing it destroys the console illusion.',
  },
]

export const CONTRAST_FLOOR = { text: 4.5, object: 3 } as const

/**
 * The pairs a player reads under a running clock. Held above the AA floor
 * because 8px type plus 30 seconds of time pressure is not the condition AA
 * was measured for.
 */
export const criticalText: Array<{ fg: LanternColor; bg: LanternColor }> = [
  { fg: 'ink', bg: 'screen' },
  { fg: 'ink', bg: 'panel' },
  { fg: 'gain', bg: 'screen' },
  { fg: 'warn', bg: 'screen' },
]

export const CRITICAL_TEXT_FLOOR = 7 as const
