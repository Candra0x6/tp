import { Connection, PublicKey } from '@solana/web3.js'
import {
  ConnectionMagicRouter,
  DELEGATION_PROGRAM_ID,
} from '@magicblock-labs/ephemeral-rollups-sdk'

/**
 * The base layer is the only constant in the codebase. The ER endpoint, the
 * validator, and the regions are resolved at runtime, because the region that
 * answers today is not guaranteed to be the region that answers on Sunday.
 * docs/technical/MAGICBLOCK.md section 1.
 */
export const BASE_RPC = 'https://rpc.magicblock.app/devnet'
export const ROUTER_URL = 'https://devnet-router.magicblock.app/'

const router = new ConnectionMagicRouter(ROUTER_URL)

/**
 * The router's reply. The SDK types it as only `{ isDelegated }` but the live
 * reply also carries the serving fqdn and the delegation record when it is
 * delegated. Keep the fqdn: it is the whole point of asking.
 */
export interface DelegationStatus {
  isDelegated: boolean
  fqdn?: string
  delegationRecord?: {
    authority: string
    owner: string
    delegationSlot: number
    lamports: number
  }
}

export function baseConnection(): Connection {
  return new Connection(BASE_RPC, 'confirmed')
}

/**
 * Never hardcode an ER endpoint. CLAUDE.md rule 10: the region serving us in
 * testing is not guaranteed to be the region serving us on Sunday, and a
 * hardcoded `devnet-as` is a demo that dies before a judge looks at it.
 */
export async function getDelegationStatus(
  account: PublicKey | string,
): Promise<DelegationStatus> {
  const status = await router.getDelegationStatus(account)
  return status as DelegationStatus
}

/**
 * Resolve the connection a delegated Run lives on. Throws NOT_DELEGATED when
 * the router has no fqdn for the account; the caller turns that into the
 * "TOWER OFFLINE" state, never a blank render.
 */
export async function resolveEr(runPda: PublicKey): Promise<Connection> {
  const status = await getDelegationStatus(runPda)
  if (!status.isDelegated || !status.fqdn) {
    throw new Error(`NOT_DELEGATED ${runPda.toBase58()}`)
  }
  return new Connection(status.fqdn, 'confirmed')
}

/** A properly delegated account is owned by the delegation program on base. */
export function baseOwnerShowsDelegated(owner: PublicKey): boolean {
  return owner.equals(DELEGATION_PROGRAM_ID)
}