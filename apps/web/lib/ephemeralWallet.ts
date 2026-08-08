import { Keypair, Connection, LAMPORTS_PER_SOL, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import type { AnchorWallet } from '@trust-fall/chain-client';

const SESSION_KEY = 'tf_guest_keypair';

function createWalletAdapter(kp: Keypair): AnchorWallet {
  return {
    publicKey: kp.publicKey,
    payer: kp,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if ('partialSign' in tx) {
        (tx as Transaction).partialSign(kp);
      } else {
        (tx as VersionedTransaction).sign([kp]);
      }
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
      return Promise.all(txs.map((tx) => this.signTransaction(tx)));
    },
  };
}

export function getOrCreateEphemeralWallet(): { keypair: Keypair; wallet: AnchorWallet } {
  if (typeof window === 'undefined') {
    const kp = Keypair.generate();
    return { keypair: kp, wallet: createWalletAdapter(kp) };
  }

  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) {
    try {
      const secret = Uint8Array.from(JSON.parse(stored));
      const kp = Keypair.fromSecretKey(secret);
      return { keypair: kp, wallet: createWalletAdapter(kp) };
    } catch {
      // Fallback if parsing fails
    }
  }

  const kp = Keypair.generate();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(kp.secretKey)));
  return { keypair: kp, wallet: createWalletAdapter(kp) };
}

export function createFreshEphemeralWallet(): { keypair: Keypair; wallet: AnchorWallet } {
  const kp = Keypair.generate();
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(Array.from(kp.secretKey)));
  }
  return { keypair: kp, wallet: createWalletAdapter(kp) };
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
