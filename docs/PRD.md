# PRD: TRUST FALL

Owns the product: what it is, who it is for, the loop, the screens, scope, and
what we are not building. Rules and pointers live in `CLAUDE.md`. The maths lives
in `technical/GAME-LOGIC.md`.

---

## 1. One paragraph

**TRUST FALL** is a co-op climbing game for 2 to 4 players, played on a virtual
handheld called **BLOCKBOY**. A party stakes together and climbs a tower. Every
floor has several doors and exactly one is safe. Each player is privately dealt a
clue that only they can read, and the clues are built so that no player can solve
a floor alone and the whole party together always can. To climb, you have to talk
to each other, out loud, against a clock. After every cleared floor the party
votes: bank the pot, or go higher. The privacy is not a UI trick, it is a Private
Ephemeral Rollup running in a hardware enclave, which is what makes "I know
something you do not" a fact about the chain rather than a promise from us.

## 2. Naming

| Token | Value | Why |
| --- | --- | --- |
| `CONSOLE_NAME` | BLOCKBOY | the handheld. Black shell, MagicBlock mark. |
| `CARTRIDGE_01` | TRUST FALL | the game. Two readings, both correct. |
| `PARTY_UNIT` | PARTY | the 2 to 4 players in one run |
| `CLUE_UNIT` | LANTERN | the private clue. A light only you carry. |
| `CHAT_UNIT` | THE LINE | the onchain chat log |
| `VAULT_UNIT` | PRIZE VAULT | where fallen pots go, and payouts come from |
| `FAIL_EVENT` | THE FALL | a wrong door. The run ends. |

Every one of these lives in `components/config/brand.ts` and nowhere else.

## 3. The problem

Onchain multiplayer is nearly always the same game wearing different art: players
act in parallel on shared public state, faster or cheaper than before. Everyone
sees everything, so nobody needs anybody. The result is a leaderboard with extra
steps, and it is why "multiplayer onchain game" reads as a genre rather than a
reason.

The missing ingredient is not speed. It is **asymmetric information**. Every game
that has ever made people lean across a table and argue, from Hanabi to Keep
Talking and Nobody Explodes to a good heist, works because you can see something
I cannot, and the only channel between us is language.

That has been effectively impossible to build honestly onchain. Public state
means public everything. The usual workaround is to hold the secret on a server,
at which point the trustlessness is decorative and the game is a web2 game with a
wallet button.

## 4. The bet

A Private Ephemeral Rollup makes hidden state a property of the deployment rather
than a promise. The clue in your hand is gated at the enclave ingress: the RPC
will not serve it to anyone but you, and the program can still read all of it to
resolve the floor.

So the bet is: **the moment hidden state becomes real onchain, the interesting
multiplayer genre is not competition, it is conversation.** TRUST FALL is the
smallest complete game that proves it. One mechanic, four days, and a claim a
judge can check by opening a terminal and failing to read someone else's lantern.

## 5. Who this is for

The hackathon judge first, and honestly. Blitz is peer judged by builders who
open a link, spend about ninety seconds, and vote for what they understood
immediately and could verify. Everything in scope serves that.

Behind them, the actual audience is groups who already play together on voice:
three friends in a Discord call who want ten minutes of something with real
stakes. Not traders. Not degens hunting yield. People who would otherwise be
playing a party game.

## 6. The loop, and the ten second pitch

The pitch has to survive being said once, fast:

> Three of us each see a different clue. None of us can solve the floor alone.
> The chain will not show me yours. So we talk, we vote, and the door opens.

Then the number that proves it: **blind, a party clears the deep tower once in
2400 runs. Talking to each other, every time.**

The loop itself is in `technical/GAME-LOGIC.md` section 1.

## 7. Features by screen

Full layouts and 320px budgets are in `technical/SCREEN-DETAIL.md`.

### S0 BOOT
Console powers on, MagicBlock mark on the shell, cartridge label reads TRUST
FALL. Under two seconds, skippable on any key. Also the moment the app resolves
the router and reports which rung of the deployment ladder is live.

### S1 CONNECT
Wallet connect, framed as inserting a memory card. Shows the devnet USDC balance
and, if it is zero, a working faucet link. A judge with an empty wallet must not
hit a dead end.

### S2 LOBBY
Create a party or join by four character code. Also `QUICK PLAY`, which creates a
party and fills it with CPU players immediately. **Quick play is the default
focus**, because that is the path a solo judge takes.

### S3 PARTY
Roster of 2 to 4 seats, CPU seats labelled. Depth select, QUICK or DEEP, with the
floor table and the blind odds shown. Stake per player. Live PRIZE VAULT balance.
Ready toggles. Start requires every seat ready.

### S4 DEAL
The VRF pending screen. The tower deals. Explicit and visible, never faked with a
spinner over a result we already have, because request acceptance is not
fulfilment. Shows a timeout state and a retry if the callback does not land.

### S5 FLOOR
The main screen and the only one that matters.
- The doors, numbered, with the union of all party marks
- **YOUR LANTERN**, the private clue, hatched tiles plus a sentence plus a count
- **THE LINE**, the chat log, newest at the bottom
- The timer, and the vote tally per door
- Footer: `A VOTE`, `B MARK`, `SELECT TALK`

### S6 RESOLVE
The door opens. Right, the party climbs and the multiplier ticks up. Wrong, THE
FALL, and the correct door is revealed along with whose clue held it, because the
post mortem is where players learn to communicate better.

### S7 BANK OR CLIMB
Overlay on S6 after a cleared floor. Current payout if banked, next multiplier if
climbed, next floor's door count and timer, live vote tally. 20 second default to
climb.

### S8 RESULTS
Floors cleared, payout, split per player, new vault balance. The honesty block:
blind odds for the depth just played, and the run's chat log length. Buttons to
run it back or share.

### Global
The shell is always present: black body, MagicBlock mark, D-pad and A/B/SELECT.
The key legend lives on the hardware, once, never on individual screens. Screens
name the button, the hardware names the key.

## 8. Non-negotiable product rules

1. **The clues are never generated by a model.** Deterministic, onchain, from VRF.
2. **Never claim more privacy than the live deployment provides.** The screen and
   the README both name the rung. See `technical/MAGICBLOCK.md` section 4.
3. **Never show a payout the vault cannot pay.** Clamped, with the balance visible.
4. **Rake is zero**, and the UI says where the money came from in words.
5. **A solo judge is never in an empty lobby.** Bots fill seats, labelled CPU.
6. **Pending is a state, never a spinner over an assumed result.** VRF, cranks and
   commits are all asynchronous and all get a visible pending, timeout and retry.
7. **The reveal always names whose clue held the answer.** The loss has to teach.
8. **No em-dashes in user-facing copy.**

## 9. Known ceilings, stated rather than hidden

These are real and we are shipping anyway, with them written down.

| Ceiling | Why it is acceptable on Sunday |
| --- | --- |
| Vault drains against skilled parties (`GAME-LOGIC.md` 6.3) | seeded devnet, clamped payouts, visible balance |
| Chat has no blocklist, 28 chars | devnet, named wallets, ephemeral log |
| Bots play honestly on a fixed delay | they demonstrate the mechanic, they are not opponents |
| Only English clue phrasing | fixed phrase table, translation is a data change |
| Party is capped at 4 | clue necessity needs `N >= P + 1`, and 5 doors on floor 1 is already a lot to say out loud |

## 10. Open questions

- **Q1.** Does the bank vote need a per-player veto? Currently pure majority, so a
  minority can be dragged into a fall. That tension may be the point, or it may
  feel unfair on the first play. Decide from the first real 3 player session.
- **Q2.** Should the reveal show every clue after a fall, or only the decisive
  one? Showing all is more instructive and slower.
- **Q3.** Is 20 seconds the right default on the bank vote, or does it need to
  scale with party size?

## 11. Success criteria for Sunday

In priority order. Anything below the line is cut before anything above it.

1. A judge opens the link alone and is holding a private clue inside 20 seconds.
2. A second browser proves the clue is different, and a terminal proves it is
   unreadable. **This is the submission.**
3. A full DEEP run completes end to end and pays out, live, on devnet.
4. The 40 second video shows two screens side by side with different lanterns.
5. README states the deployment rung plainly, with the program ID and a verify
   command a judge can paste.

## 12. Roadmap

### v1.0, Sunday 9 August
Everything in section 11. QUICK and DEEP, 2 to 4 players, bots, devnet USDC.

### v1.1, the week after
Real 3 player sessions on voice, then answer Q1 to Q3. Chat blocklist. Vault
telemetry so the economy in 6.3 stops being a guess.

### v1.2
Difficulty tuned against observed clear rate, which is the honest fix for the
draining vault. Spectator mode, because watching a party argue is the actual
content.

### v2.0
Clue vocabulary beyond elimination: adjacency, parity, counts. That is where the
puzzle gets deep enough to sustain a session rather than a demo.

### Out of scope, permanently
Any mode where the private clue can be false. It converts a game about trusting
each other into a game about suspecting each other, which is a different product
and the wrong one for this theme.
