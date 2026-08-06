# DEMO-SCRIPT

The video, the README, and the submission checklist. Owned by Lane C, started on
D0 and not on D4.

The research on six previous Blitz rounds is unambiguous about two things. Every
single placement shipped **a live clickable URL and a public repo**, no decks and
no video-only entries. And the videos are **short screen recordings, 20 seconds to
about 2 minutes**, not produced films. Polish means UI polish, never editing.

---

## 1. The one sentence

Everything below serves this. If a judge remembers nothing else:

> **Three of us each see a different clue. None of us can solve the floor alone.
> The chain will not show me yours. So we talk, we vote, and the door opens.**

And the number that proves it:

> **Blind, a party clears the deep tower once in 2400 runs. Talking to each
> other, every time.**

## 2. The video, 40 seconds

Two browser windows side by side, one terminal below. No voiceover needed, but
captions on every beat. Record at 2x window scale so the pixel font stays crisp.

| Time | Shot | Caption |
| --- | --- | --- |
| 0:00 | Console boots, cartridge label, MagicBlock mark | `TRUST FALL. A co-op tower on MagicBlock.` |
| 0:04 | QUICK PLAY, party fills, run starts | `2 to 4 players. Empty seats play as CPU.` |
| 0:08 | **Both windows visible, both lanterns on screen, clearly different** | `Every player gets a different private clue.` |
| 0:14 | Zoom each lantern: `DOORS 2 AND 4 ARE COLD` vs `DOOR 1 IS COLD` | `Neither one solves the floor.` |
| 0:18 | **Terminal: `getAccountInfo` on the other seat's ClueSlot, denied** | `And the chain will not show you mine.` |
| 0:24 | Chat flying, marks appearing on the board, timer at 0:12 | `So you talk. Onchain, in the rollup, 10ms.` |
| 0:30 | Votes converge, door opens, SAFE, multiplier ticks | `Majority moves the party.` |
| 0:34 | BANK OR CLIMB, vote split, someone banks | `Then argue about whether to stop.` |
| 0:38 | Results, `PAID FROM PARTIES THAT FELL. RAKE 0.` | `Rake zero. Ephemeral Rollups + VRF + TEE.` |

**Second 18 is the entire submission.** Everything before it is setup and
everything after is texture. If the recording is going long, cut from the middle,
never from that shot.

Shots to refuse, because they read as filler to builders: a logo animation, a
scrolling architecture diagram, a talking head, and anyone saying "revolutionary".

## 3. The README

Judges read it in about thirty seconds, in this order: the one-liner, the live
link, the GIF, then whether the claim is checkable.

Required structure:

```
# TRUST FALL
One sentence. Then the live link. Then a 6 second GIF of two lanterns.

## Try it in 20 seconds
Open the link. Press QUICK PLAY. You are holding a clue nobody else can read.

## Why this needs MagicBlock
ER      10ms shared state for votes, marks and chat. Zero fee.
PER     the clue accounts are gated in an Intel TDX enclave.
VRF     the safe door and the deal are provably not chosen by us.

## Verify the claim yourself
<the exact paste-able command, see section 4>

## What is honest about this build
<the ceilings, from PRD section 9>

## Program
Program ID, devnet, and the explorer link.
```

**The honesty section is not a weakness, it is the differentiator.** A room of
builders can smell an overclaim, and every hedge you write yourself is one they
do not get to find.

## 4. The verify command

The one thing that separates this from a game that merely says it is private. It
must be paste-able with no setup beyond the Solana CLI.

```bash
# your own clue: readable
solana account <YOUR_CLUE_SLOT> --url <TEE_FQDN>?token=<YOUR_TOKEN>

# someone else's clue: denied at the enclave ingress
solana account <THEIR_CLUE_SLOT> --url <TEE_FQDN>?token=<YOUR_TOKEN>
```

Put the actual pubkeys from a real completed run in the README, not placeholders.
A judge who has to construct the command will not run it.

If the build ships on rung 1 rather than rung 2, this section is **deleted and
replaced** with a plain statement that the clue accounts are not gated in this
deployment. Do not leave an aspirational verify command in a README.

## 5. Submission checklist

Run top to bottom on Sunday, after the 18:00 freeze.

```
[ ] Vercel deploy live, opened in a CLEAN browser profile with no wallet
[ ] QUICK PLAY reaches a live clue in under 20 seconds from a cold load
[ ] Checked on a real phone at 412px, not on the desktop it was built on
[ ] Full run completes and pays out, watched end to end, today
[ ] Verify command run from a fresh terminal, output pasted into the README
[ ] Privacy rung on screen matches the README matches reality
[ ] Repo public, no keypairs in git history, licence file present
[ ] Program ID in README matches the deployed program
[ ] Video under 60s, captions legible at phone size, no audio dependency
[ ] status.magicblock.app green for devnet er and vrf_oracle
[ ] Submitted before 23:00, not at 22:58
```

## 6. What to say if something is broken on stage

Say it plainly and move on. The winner pattern shows honest builds place and
overclaims do not. "The crank did not land so the timer is client-triggered, here
is the line of code" costs nothing. Being caught mid-demo with a claim that is not
true costs the vote.
