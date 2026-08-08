import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'

import idl from './idl/trust_fall.json'
import type { TrustFall } from './idl/trust_fall'
import { clueSlotKey, normalizeCode, runKey } from './program'
import { useTrustFallStore } from './store'
import { resolveEr } from './connection'

/**
 * Subscribe to a run's on-chain state over the ER websocket and feed it into
 * the Zustand store. Resolves the connection from the router fqdn for the run
 * (never a hardcoded endpoint). Returns an unsubscribe function.
 */
export async function subscribeRun(
  wallet: Wallet,
  code: string | number[] | Uint8Array,
): Promise<() => void> {
  const c = normalizeCode(code)
  const codeKey = JSON.stringify(c)
  const run = runKey(c)
  const connection = await resolveEr(run)
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' })
  const program = new Program<TrustFall>(idl as TrustFall, provider)

  const runId = connection.onAccountChange(run, (info) => {
    try {
      const decoded = program.coder.accounts.decode('run', info.data) as never
      useTrustFallStore.getState().setRun(decoded, codeKey)
      useTrustFallStore.getState().setOnline(true)
      useTrustFallStore.getState().setStale(false)
    } catch {
      useTrustFallStore.getState().setStale(true)
    }
  }, 'confirmed')

  const slotIds: number[] = []
  for (let seat = 0; seat < 4; seat++) {
    const slotKey = clueSlotKey(run, seat)
    const id = connection.onAccountChange(slotKey, (info) => {
      try {
        const decoded = program.coder.accounts.decode('clueSlot', info.data) as never
        useTrustFallStore.getState().setClueSlot(seat, decoded)
      } catch {
        useTrustFallStore.getState().setClueSlot(seat, null)
      }
    }, 'confirmed')
    slotIds.push(id)
  }

  // Initial hydration so the store is never blank before the first change.
  const [runAccount, slots] = await Promise.all([
    program.account.run.fetchNullable(run, 'confirmed'),
    Promise.all([0, 1, 2, 3].map((s) => program.account.clueSlot.fetchNullable(clueSlotKey(run, s), 'confirmed'))),
  ])
  useTrustFallStore.getState().setRun(runAccount as never, codeKey)
  useTrustFallStore.getState().setOnline(true)
  slots.forEach((slot, seat) => useTrustFallStore.getState().setClueSlot(seat, slot as never))

  return () => {
    connection.removeAccountChangeListener(runId)
    slotIds.forEach((id) => connection.removeAccountChangeListener(id))
  }
}
