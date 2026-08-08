import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Keypair, PublicKey } from '@solana/web3.js';
import {
  normalizeCode,
  runKey,
  TrustFallProgram,
  getDelegationStatus,
  type RunAccount,
  type ClueSlotAccount,
} from '@trust-fall/chain-client';
import { config } from '../config';
import { botWallet } from '../bots/bot-wallet';

/**
 * The relay: a read-only view of a run for clients that want the board without
 * opening their own RPC subscription. It is never authoritative; the chain is.
 * The probe wallet is ephemeral (throwaway keypair) and only exists to build a
 * client instance; the relay never signs anything, so it must not depend on
 * the bot seed.
 */
@Injectable()
export class RelayService {
  private readonly logger = new Logger('Relay')

  async state(code: string, forSeat: number | null): Promise<{
    code: string
    runKey: string
    delegated: boolean
    fqdn: string | null
    run: RunAccount
    ownClueMask: number | null
    players: string[]
    timestamp: number
  }> {
    const run = runKey(normalizeCode(code))
    const status = await getDelegationStatus(run)
    const probe = new TrustFallProgram(
      config.mint ? new PublicKey(config.mint) : PublicKey.default,
      botWallet(Keypair.generate()),
    )

    let runAcct: RunAccount | null = null
    try {
      runAcct = status.isDelegated && status.fqdn
        ? await probe.fetchRunEr(code)
        : await probe.fetchRunBase(code)
    } catch (err) {
      this.logger.warn(`relay ${code}: ${err instanceof Error ? err.message : err}`)
      runAcct = null
    }
    if (!runAcct) {
      throw new BadRequestException(`RUN_MISSING ${code}`)
    }

    let ownMask: number | null = null
    if (forSeat != null && forSeat >= 0 && forSeat < runAcct.playerCount) {
      const slot = await probe.fetchClueSlot(run, forSeat).catch((): ClueSlotAccount | null => null)
      if (slot && slot.dealt) ownMask = slot.mask
    }

    return {
      code,
      runKey: run.toBase58(),
      delegated: status.isDelegated,
      fqdn: status.fqdn ?? null,
      run: runAcct,
      ownClueMask: ownMask,
      players: Array.from(runAcct.players.slice(0, runAcct.playerCount)).map((p) => p.toBase58()),
      timestamp: Date.now(),
    }
  }
}