import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  doorBits,
  eliminatedSet,
  candidates,
  isBoardResolved,
  resolvedDoor,
  panicDoor,
  bankChoice,
  clueSentence,
} from '../dist/bots/bot-decide.js'

// Mirrors docs/technical/GAME-LOGIC.md section 7 and the program's doors
// math (state.rs doors_for). Doors widen to n+1 for an n player party, so a
// full 4-player DEEP floor can reach 6 doors.

test('doorBits masks exactly its door count', () => {
  assert.equal(doorBits(3), 0b111)
  assert.equal(doorBits(4), 0b1111)
  assert.equal(doorBits(6), 0b111111)
})

test('eliminatedSet composes own mask with every member mark', () => {
  const eliminated = eliminatedSet({ ownMask: 0b0011, memberMarks: [0b0100, 0b1000] })
  assert.equal(eliminated, 0b1111)
})

test('a board with one survivor is resolved exactly once', () => {
  // own mask kills doors 0,1; the member mark kills door 2; door 3 survives
  const eliminated = eliminatedSet({ ownMask: 0b0011, memberMarks: [0b0100] })
  assert.equal(eliminated, 0b0111)
  assert.equal(isBoardResolved(eliminated, 4), true)
  assert.equal(resolvedDoor(eliminated, 4), 3)
  assert.deepEqual(candidates(eliminated, 4), [3])
})

test('candidates respect the door count, never bleed outside it', () => {
  // Bit 4 is beyond a 4-door game: masking it must not free any door.
  assert.deepEqual(candidates(0b010000, 4), [0, 1, 2, 3])
  // Doors 0..2 cold leaves the top door; a 5th door widens the survivors.
  assert.deepEqual(candidates(0b000111, 4), [3])
  assert.deepEqual(candidates(0b000111, 5), [3, 4])
})

test('an impossible board resolves nothing', () => {
  // every door eliminated by marks alone: contradiction, no door survives
  assert.equal(resolvedDoor(0b111111, 6), null)
  assert.equal(panicDoor(0b111111, 6), null)
})

test('panicDoor picks the lowest survivor even when the board is not unanimous', () => {
  assert.equal(panicDoor(0b001100, 6), 0)
  assert.equal(panicDoor(0b000010, 6), 0) // bits 2 (door 3) etc trimmed; lowest is door 1
})

test('every sentence fits the program chat cap and its charset', () => {
  // CHAT_BODY is 28; valid chars are A-Z 0-9 space . , ? ! - (rules.rs).
  // Round-robin deals cap a real clue at ceil(doors/2) cold doors, but the
  // guard must hold for any mask, because a regression here breaks a vote.
  for (let doors = 2; doors <= 8; doors++) {
    for (let mask = 0; mask < 1 << doors; mask++) {
      const s = clueSentence(mask, doors)
      if (mask === 0) continue // empty mask posts nothing
      assert.ok(s.length > 0 && s.length <= 28, `len ${s.length}: '${s}' (doors=${doors})`)
      assert.match(s, /^[A-Z0-9 .,?!-]*$/, `bad charset: ${s}`)
    }
  }
})