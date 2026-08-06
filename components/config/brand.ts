/**
 * EVERY product name lives here and nowhere else.
 *
 * CLAUDE.md rule 8: names are tokens, never literals. A rename must be a one
 * line edit in this file. If a name appears as a string anywhere else in the
 * app, that is a bug.
 */

export const brand = {
  /** The virtual handheld. Black shell, MagicBlock mark. */
  CONSOLE_NAME: 'BLOCKBOY',
  /** The game. Two readings, both correct. */
  CARTRIDGE_01: 'TRUST FALL',
  /** The 2 to 4 players in one run. */
  PARTY_UNIT: 'PARTY',
  /** The private clue. A light only you carry. */
  CLUE_UNIT: 'LANTERN',
  /** The onchain chat log. */
  CHAT_UNIT: 'THE LINE',
  /** Where fallen pots go, and where payouts come from. */
  VAULT_UNIT: 'PRIZE VAULT',
  /** A wrong door. The run ends. */
  FAIL_EVENT: 'THE FALL',
  /** A cleared floor. */
  CLEAR_EVENT: 'CLIMB',
  /** The wallet, in console language. */
  WALLET_UNIT: 'MEMORY CARD',
} as const

/** Run length, chosen in the lobby. See docs/technical/GAME-LOGIC.md section 2. */
export const depths = {
  quick: { label: 'QUICK', floors: 3, baseDoors: [4, 4, 5], timers: [60, 60, 45] },
  deep: {
    label: 'DEEP',
    floors: 5,
    baseDoors: [4, 4, 5, 5, 6],
    timers: [60, 60, 45, 45, 30],
  },
} as const

export type DepthId = keyof typeof depths

/**
 * Doors are widened for large parties, because the clue construction needs at
 * least one wrong door per player. See GAME-LOGIC.md 3.1, property N.
 *
 * This is duplicated from the program on purpose: the program is authoritative
 * and the client only needs it to render the lobby preview before a run exists.
 */
export const doorsForFloor = (
  depth: DepthId,
  floor: number,
  partySize: number,
): number => Math.max(depths[depth].baseDoors[floor], partySize + 1)

/** Multiplier on the pot per floor cleared. GAME-LOGIC.md 6.2. */
export const MULTIPLIERS = [1.0, 1.3, 1.8, 2.6, 3.8, 6.0] as const

/** Seat labels. Index is the seat, not the player. */
export const seats = ['P1', 'P2', 'P3', 'P4'] as const

/** A bot is never presented as a person. */
export const CPU_LABEL = 'CPU' as const

export const PARTY_MIN = 2
export const PARTY_MAX = 4

/** Strictly more than half. 2 of 2, 2 of 3, 3 of 4. GAME-LOGIC.md 5. */
export const votesNeeded = (partySize: number) =>
  Math.floor(partySize / 2) + 1
