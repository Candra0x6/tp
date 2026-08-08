import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';

const SESSION_KEY = 'tf_guest_keypair';

export function getOrCreateEphemeralWallet(): { keypair: Keypair; wallet: Wallet } {
  if (typeof window === 'undefined') {
    const kp = Keypair.generate();
    return { keypair: kp, wallet: new Wallet(kp) };
  }

  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const secret = Uint8Array.from(JSON.parse(stored));
      const kp = Keypair.fromSecretKey(secret);
      return { keypair: kp, wallet: new Wallet(kp) };
    } catch {
      // Fallback if parsing fails
    }
  }

  const kp = Keypair.generate();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(kp.secretKey)));
  return { keypair: kp, wallet: new Wallet(kp) };
}

export async function ensureWalletFunded(connection: Connection, pubkey: PublicKey): Promise<void> {
  try {
    const balance = await connection.getBalance(pubkey);
    if (balance < LAMPORTS_PER_SOL / 5) {
      const sig = await connection.requestAirdrop(pubkey, LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, 'confirmed');
    }
  } catch {
    // Ignore airdrop rate limit errors if already funded
  }
}
