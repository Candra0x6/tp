import { BASE_RPC, ROUTER_URL, PROGRAM_ID } from '@trust-fall/chain-client';

/**
 * Runtime config for the backend. Endpoints and identities resolve at runtime
 * exactly like the browser client; the only constants are the base RPC and
 * router (docs/technical/MAGICBLOCK.md section 1). The mint is deployment
 * specific because it is chosen at deploy time (BUILD-PLAN 0.9).
 */
export const config = {
  baseRpc: BASE_RPC,
  routerUrl: ROUTER_URL,
  programId: PROGRAM_ID,
  mint: process.env.TF_MINT ?? '',
  port: Number(process.env.TF_BACKEND_PORT ?? 4000),
  /**
   * Root entropy for derived CPU wallets, read from the environment and never
   * committed. A missing seed makes the bot pool size zero: the relay still
   * answers run state, but fill requests fail with MINT_OR_SEED_UNSET instead
   * of silently minting a wallet out of a constant.
   */
  botSeed: process.env.TF_BOT_SEED ?? '',
  /** Devnet only: request lamports for bot wallets so they can pay fees. */
  devnetAirdrop: process.env.TF_DEVNET_AIRDROP === '1',
};