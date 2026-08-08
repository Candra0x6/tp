import { Injectable } from '@nestjs/common';
import { baseConnection } from '@trust-fall/chain-client';
import { config } from '../config';

/**
 * The failure ladder, row 1, on the relay side. Answers whether the base layer
 * and the router are reachable in this process, so the operator can tell a
 * dead RPC from a bug in the bot brain before a judge ever opens the link.
 * docs/technical/MAGICBLOCK.md section 8.
 */
@Injectable()
export class HealthService {
  async check() {
    const out = {
      service: 'trust-fall-backend',
      ts: Date.now(),
      rung: { mint: config.mint ? 'configured' : 'unset' },
      base: await this.probeBase(),
      router: await this.probeRouter(),
      mint: config.mint,
    }
    const ok = out.base.ok && out.router.ok
    return { ...out, ok }
  }

  private async probeBase(): Promise<{ ok: boolean; slot?: number; error?: string }> {
    try {
      const conn = baseConnection()
      const slot = await conn.getSlot()
      return { ok: true, slot }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }

  private async probeRouter(): Promise<{ ok: boolean; error?: string }> {
    try {
      // The router only answers RPC POSTs for delegation state; a bare GET is
      // not an endpoint. Reachability here means "the host answers", not
      // "the endpoint echoes ok".
      const res = await fetch(config.routerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
        signal: AbortSignal.timeout(5000),
      })
      const body = await res.text()
      const reachable = res.ok || res.status === 404
      return { ok: reachable, error: reachable ? undefined : truncate(body, 100) }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  }
}

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n)}...` : s
}