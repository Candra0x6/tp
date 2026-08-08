import type { RunAccount } from '@trust-fall/chain-client'

/**
 * Pure bot decisions, mirroring docs/technical/GAME-LOGIC.md section 7. No
 * chain calls in this file: it answers "what would I do given this board".
 *
 * A bot is a cooperative teammate: it posts its own clue in plain form, marks
 * its own cold doors, and votes the board once the shared marks leave one
 * candidate. It never votes an opinion it has no information for.
 */

/** The doors this floor has, as bits. */
export function doorBits(count: number): number {
  return (1 << count) - 1
}

/**
 * The public board after the marks of `allVoters` are pushed. Returns the
 * eliminated set. Two bolts of information compose: the bot's own mask and
 * every member's shared marks. The safe door is the bit that survives.
 */
export function eliminatedSet(args: {
  ownMask: number
  /** Bitmask per player, in seat order, from the public Run.marks. */
  memberMarks: number[]
}): number {
  let eliminated = args.ownMask
  for (const m of args.memberMarks) eliminated |= m
  return eliminated
}

/** Doors still standing after the eliminated set, within `doors` doors. */
export function candidates(eliminated: number, doors: number): number[] {
  const out: number[] = []
  const all = doorBits(doors)
  const safe = (~eliminated) & all
  for (let d = 0; d < doors; d++) {
    if ((safe >> d) & 1) out.push(d)
  }
  return out
}

/** A resolved board returns exactly one candidate. Nothing else votes. */
export function isBoardResolved(eliminated: number, doors: number): boolean {
  const c = candidates(eliminated, doors)
  return c.length === 1
}

export function resolvedDoor(eliminated: number, doors: number): number | null {
  const c = candidates(eliminated, doors)
  return c.length === 1 ? c[0] : null
}

/**
 * The 10s panic: votes the lowest candidate still on the board even when not
 * unanimous, because silence is a fall. This deliberately prefers the bot's
 * own eliminations (it can say what it just knew) before panicked guesses.
 */
export function panicDoor(eliminated: number, doors: number): number | null {
  const c = candidates(eliminated, doors)
  if (c.length === 0) return null
  return c[0]
}

/** The bank decision: climb unless we are on the final floor. */
export function bankChoice(run: Pick<RunAccount, 'floor' | 'depth'>): 'climb' | 'bank' {
  const floors = run.depth === 1 ? 5 : 3
  const onLastFloor = run.floor >= floors - 1
  return onLastFloor ? 'bank' : 'climb'
}

/**
 * The chat sentence for a clue mask, plain text, ALL CAPS, restricted to the
 * program's charset (GAME-LOGIC.md section 4). "DOORS 2 AND 4 ARE COLD".
 */
export function clueSentence(mask: number, doors: number): string {
  const cold: number[] = []
  for (let d = 0; d < doors; d++) {
    if ((mask >> d) & 1) cold.push(d + 1)
  }
  if (cold.length === 0) return ''
  if (cold.length === 1) return `DOOR ${cold[0]} IS COLD`
  const lead = cold.slice(0, -1).join(', ')
  return `DOORS ${lead} AND ${cold[cold.length - 1]} ARE COLD`
}