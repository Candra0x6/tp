import { createHash } from 'node:crypto';
import { Keypair } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

/**
 * A CPU wallet is a plain keypair derived from the backend seed, so a session
 * restart reproduces the same wallets and the party's roster does not wander.
 * All bot wallets share one derived sub-seed per run code; the run code is
 * bait entropy, the seed is the secret (environment, never the repo).
 *
 * Anchor's `Wallet` internally needs a signing Keypair; the anchor Wallet
 * class carries one, so Node and Nest can use the exact same wallet type the
 * browser client gets from an adapter.
 */
export function botOf(seed: string, runLabel: string, index: number): Keypair {
  const h = createHash('sha256')
    .update(`tf-bot\x01${seed}\x02${runLabel}\x03${index}`)
    .digest()
  return Keypair.fromSeed(h)
}

export function botWallet(keypair: Keypair): Wallet {
  return new Wallet(keypair)
}