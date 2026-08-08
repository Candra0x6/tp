import { PublicKey } from '@solana/web3.js';
import {
  TrustFallProgram,
  baseConnection,
  runKey as deriveRunKey,
  playerAtaKey,
  normalizeCode,
} from '@trust-fall/chain-client';
import { createFreshEphemeralWallet, ensureWalletFunded } from '../../lib/ephemeralWallet';

const DEVNET_MINT = '6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy';
const EU_VALIDATOR = 'MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export async function startQuickPlay(options?: { validator?: string }): Promise<{ code: string; runKey: string }> {
  const { wallet } = createFreshEphemeralWallet();
  const conn = baseConnection();

  await ensureWalletFunded(conn, wallet.publicKey);

  const mint = new PublicKey(DEVNET_MINT);
  const hostAta = playerAtaKey(wallet.publicKey, mint);

  // 0. Ensure host ATA exists and holds 2 USDC on devnet via backend faucet
  try {
    await fetch(`${BACKEND_URL}/api/runs/faucet`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pubkey: wallet.publicKey.toBase58() }),
    });
  } catch (err) {
    console.warn('Backend USDC faucet error:', err);
  }

  // Wait for browser RPC connection to observe hostAta on base layer
  for (let i = 0; i < 12; i++) {
    const ataInfo = await conn.getAccountInfo(hostAta).catch(() => null);
    if (ataInfo) break;
    await new Promise((r) => setTimeout(r, 800));
  }

  const tf = new TrustFallProgram(mint, wallet);
  const code = generateRandomCode();
  const runPda = deriveRunKey(normalizeCode(code));

  // 1. Create Party on Base
  await tf.createParty(wallet.publicKey, code, 0, BigInt(1000000));

  // 2. Fill 3 CPU Seats via Nest Backend
  const fillRes = await fetch(`${BACKEND_URL}/api/runs/${code}/bots/fill`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count: 3 }),
  });
  if (!fillRes.ok) {
    throw new Error(`Bot fill failed: ${fillRes.status}`);
  }

  // 3. Mark Host Ready on Base
  await tf.ready(wallet.publicKey, runPda);

  // 4. Delegate Party to MagicBlock ER
  const validator = new PublicKey(options?.validator ?? EU_VALIDATOR);
  await tf.delegate(wallet.publicKey, code, validator);

  return { code, runKey: runPda.toBase58() };
}
