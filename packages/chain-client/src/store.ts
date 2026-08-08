import { create } from 'zustand'
import type { ClueSlotAccount, RunAccount, VaultAccount } from './program'

/**
 * Client-side mirror of on-chain party state. Written by subscribe.ts from
 * `onAccountChange` callbacks on the ER websocket. Nothing here is optimistic:
 * phase/floor/door/clue mirrors what the chain said, nothing else.
 */
interface RunState {
  code: string | null
  run: RunAccount | null
  clueSlots: (ClueSlotAccount | null)[]
  vault: VaultAccount | null
  online: boolean
  stale: boolean
}

interface TrustFallStore extends RunState {
  setRun(run: RunAccount | null, code: string | null): void
  setClueSlot(seat: number, slot: ClueSlotAccount | null): void
  setVault(vault: VaultAccount | null): void
  setOnline(online: boolean): void
  setStale(stale: boolean): void
  reset(): void
}

export const useTrustFallStore = create<TrustFallStore>((set) => ({
  code: null,
  run: null,
  clueSlots: [null, null, null, null],
  vault: null,
  online: false,
  stale: false,

  setRun: (run, code) => set({ run, code }),
  setClueSlot: (seat, slot) =>
    set((s) => {
      const clueSlots = s.clueSlots.slice()
      clueSlots[seat] = slot
      return { clueSlots }
    }),
  setVault: (vault) => set({ vault }),
  setOnline: (online) => set({ online }),
  setStale: (stale) => set({ stale }),
  reset: () =>
    set({ code: null, run: null, clueSlots: [null, null, null, null], vault: null, online: false, stale: false }),
}))

export function useRun(): RunAccount | null {
  return useTrustFallStore((s) => s.run)
}

export function useClueSlot(seat: number): ClueSlotAccount | null {
  return useTrustFallStore((s) => s.clueSlots[seat])
}

export function useOnline(): boolean {
  return useTrustFallStore((s) => s.online)
}