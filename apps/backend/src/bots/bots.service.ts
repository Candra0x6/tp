import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import {
  normalizeCode,
  runKey,
  TrustFallProgram,
  baseConnection,
  getDelegationStatus,
  type RunAccount,
  type ClueSlotAccount,
} from '@trust-fall/chain-client';
import { config } from '../config';
import { botOf, botWallet } from './bot-wallet';
import {
  resolvedDoor,
  panicDoor,
  bankChoice,
  clueSentence,
} from './bot-decide';

interface SeatState {
  seat: number
  program: TrustFallProgram
  voted: boolean
  marked: boolean
  chatted: boolean
  lastFloor: number
  lastPhase: number
}

export interface BotFill {
  code: string
  seat: number
  pubkey: string
  isCpu: true
}

/**
 * The bot engine. One poll loop per active run code. Bots read the same
 * account streams a human client reads, run the pure decisions from
 * GAME-LOGIC.md section 7, and post marks, chat and votes with their own
 * wallets. No optimistic action: every branch waits for onchain state.
 */
@Injectable()
export class BotsService {
  private readonly logger = new Logger('Bots')
  private readonly loops = new Map<string, NodeJS.Timeout>()
  private readonly stops = new Map<string, boolean>()
  private readonly seats = new Map<string, SeatState[]>()

  constructor() {
    if (!config.botSeed) {
      this.logger.warn('TF_BOT_SEED unset: bot pool is empty, fill will 400.')
    }
  }

  private mint(): PublicKey {
    if (!config.mint) throw new BadRequestException('MINT_UNSET')
    return new PublicKey(config.mint)
  }

  /** A bot program is one TrustFallProgram in its own wallet, per seat. */
  private programFor(code: string, seat: number): TrustFallProgram {
    const kp = botOf(config.botSeed, code, seat)
    return new TrustFallProgram(this.mint(), botWallet(kp))
  }

  /**
   * Fill a lobby's empty seats with CPU players. The web app calls this after
   * the host creates the party; the bots join and ready like any member.
   */
  async fill(code: string, count: number): Promise<BotFill[]> {
    if (!config.botSeed) throw new BadRequestException('BOT_SEED_UNSET')
    const hostProbe = this.programFor(code, 0)
    const runAcct = await hostProbe.fetchRunBase(code)
    if (!runAcct) throw new NotFoundException(`RUN_MISSING ${code}`)

    const taken = runAcct.playerCount
    const room = 4 - taken
    if (count > room) throw new BadRequestException(`FULL_OR_TOO_MANY seats_left=${room}`)

    const created: BotFill[] = []
    for (let i = 0; i < count; i++) {
      const seat = taken + i
      const program = this.programFor(code, seat)
      await this.fundIfNeeded(program.publicKey)
      await program.joinParty(program.publicKey, runKey(normalizeCode(code)), normalizeCode(code))
      await program.ready(program.publicKey, runKey(normalizeCode(code)))
      created.push({ code, seat, pubkey: program.publicKey.toBase58(), isCpu: true })
    }
    return created
  }

  private async fundIfNeeded(pubkey: PublicKey): Promise<void> {
    if (!config.devnetAirdrop) return
    const base = baseConnection()
    const lamports = await base.getBalance(pubkey).catch(() => 0)
    if (lamports < LAMPORTS_PER_SOL) {
      await base.requestAirdrop(pubkey, LAMPORTS_PER_SOL).catch((err) => {
        this.logger.warn(`airdrop ${pubkey.toBase58()}: ${err instanceof Error ? err.message : err}`)
      })
    }
  }

  /** Toggle a bot's participation so its fills join the loop. */
  activate(code: string, created: BotFill[]): void {
    const c = normalizeCode(code)
    const runPda = runKey(c)
    const state: SeatState[] = created.map((f) => ({
      seat: f.seat,
      program: this.programFor(code, f.seat),
      voted: false,
      marked: false,
      chatted: false,
      lastFloor: -1,
      lastPhase: -1,
    }))
    this.seats.set(code, state)
    void this.spin(code, runPda, state)
    this.logger.log(`bots active on code='${code}' n=${state.length}`)
  }

  private async spin(code: string, runPda: PublicKey, state: SeatState[]): Promise<void> {
    if (this.stops.get(code)) return
    try {
      const status = await getDelegationStatus(runPda)
      if (!status.isDelegated || !status.fqdn) {
        // Not delegated yet: retry quickly, the host delegates from the web app.
        setTimeout(() => void this.spin(code, runPda, state), 2000)
        return
      }
      await this.runLoop(code, state, runPda)
    } catch (err) {
      this.logger.warn(`bot loop ${code}: ${err instanceof Error ? err.message : err}`)
      setTimeout(() => void this.spin(code, runPda, state), 3000)
    }
  }

  private async runLoop(code: string, state: SeatState[], runPda: PublicKey): Promise<void> {
    while (!this.stops.get(code)) {
      try {
        const program = state[0].program
        const run = await program.fetchRunEr(code)
        if (!run) {
          await sleep(1000)
          continue
        }
        for (const s of state) {
          await this.act(s, code, run)
        }
        await sleep(1200)
      } catch (err) {
        this.logger.warn(`loop ${code}: ${err instanceof Error ? err.message : err}`)
        await sleep(2500)
      }
    }
  }

  /**
   * One step for one seat against the live run. Decisions come from
   * GAME-LOGIC.md section 7 and never commit to an untimely action.
   */
  private async act(seat: SeatState, code: string, run: RunAccount): Promise<void> {
    // Advance to a new floor or phase: reset the per-floor decision flags.
    if (run.floor !== seat.lastFloor || run.phase !== seat.lastPhase) {
      seat.voted = false
      seat.marked = false
      seat.chatted = false
      seat.lastFloor = run.floor
      seat.lastPhase = run.phase
    }

    if (run.phase === 0 || run.phase === 1 || run.phase === 4) return // lobby/dealing/done

    const slot =
      (await seat.program.fetchClueSlot(runKey(normalizeCode(code)), seat.seat)) ?? null
    const floorIsNow = slot != null && slot.dealt && slot.floor === run.floor

    if (run.phase === 2) {
      // PHASE_FLOOR
      if (!floorIsNow) return // not dealt yet

      if (!seat.marked) {
        // 1. post the clue and mark own cold doors, once per floor.
        await this.postClue(seat, code, slot, run.doors)
        seat.marked = true
        seat.chatted = true
      }

      // The shared board is Run.marks plus the seat's own private mask.
      let eliminated = slot!.mask
      for (let m = 0; m < run.playerCount; m++) eliminated |= run.marks[m]
      const resolved = resolvedDoor(eliminated, run.doors)

      if (!seat.voted && resolved !== null) {
        // 2. the board leaves one candidate: vote it.
        await seat.program.vote(seat.program.publicKey, code, resolved)
        seat.voted = true
        return
      }
      const now = Math.floor(Date.now() / 1000)
      if (!seat.voted && Number(run.deadlineTs) - now <= 10) {
        // 3. panic at 10s remaining.
        const door = panicDoor(eliminated, run.doors)
        if (door !== null) {
          await seat.program.vote(seat.program.publicKey, code, door)
          seat.voted = true
        }
      }
      return
    }

    if (run.phase === 3 && !seat.voted) {
      // PHASE_BANK: climb unless final floor.
      const choice = bankChoice(run) === 'climb' ? 1 : 2
      await seat.program.bankVote(seat.program.publicKey, code, choice)
      seat.voted = true
    }
  }

  private async postClue(
    seat: SeatState,
    code: string,
    slot: ClueSlotAccount,
    doors: number,
  ): Promise<void> {
    const mask = slot.mask
    for (let d = 0; d < doors; d++) {
      if ((mask >> d) & 1) {
        await seat.program.mark(seat.program.publicKey, code, d, true)
      }
    }
    const sentence = clueSentence(mask, doors)
    if (sentence) {
      const len = Math.min(sentence.length, 28)
      const body = sentence.slice(0, len).split('').map((ch) => ch.charCodeAt(0))
      await seat.program.chat(seat.program.publicKey, code, body, len)
    }
  }

  /** Detach a bot from its run. Kept public for an admin endpoint. */
  async stop(code: string): Promise<void> {
    this.stops.set(code, true)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}