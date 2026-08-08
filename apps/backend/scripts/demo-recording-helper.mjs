#!/usr/bin/env node
/**
 * Demo Recording Helper Script.
 *
 * Runs a predictable party run on devnet / ER for recording the 40-second submission video.
 * Sets up a party with code `DEMO`, fills CPU bots, and controls step-by-step progress.
 */
import { Keypair, PublicKey } from '@solana/web3.js';
import { Wallet } from '@coral-xyz/anchor';
import {
  normalizeCode,
  runKey,
  TrustFallProgram,
  baseConnection,
  getDelegationStatus,
} from '@trust-fall/chain-client';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CODE = process.argv[2] ?? 'DEMO';
const MINT_STR = process.env.TF_MINT ?? '6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy';

function loadHost() {
  const path = process.env.TF_HOST_KEYPAIR ?? join(homedir(), '.config', 'solana', 'id.json');
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, 'utf8'))));
}

async function main() {
  console.log(`[demo-helper] Preparing demo run code=${CODE}`);
  const host = loadHost();
  const mint = new PublicKey(MINT_STR);
  const tf = new TrustFallProgram(mint, new Wallet(host));
  const runPda = runKey(normalizeCode(CODE));

  console.log(`[demo-helper] Host pubkey: ${host.publicKey.toBase58()}`);
  console.log(`[demo-helper] Run PDA: ${runPda.toBase58()}`);

  try {
    await tf.createParty(host.publicKey, CODE, 0, 1000000n);
    console.log('[demo-helper] Party created on base layer');
  } catch (e) {
    console.log('[demo-helper] Party already exists or created');
  }

  const fillRes = await fetch(`http://localhost:4000/api/runs/${CODE}/bots/fill`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count: 3 }),
  });
  console.log(`[demo-helper] Bot fill status: ${fillRes.status}`);

  await tf.ready(host.publicKey, runPda);
  console.log('[demo-helper] Host ready signed');

  const validator = new PublicKey('MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e');
  await tf.delegate(host.publicKey, CODE, validator);
  console.log('[demo-helper] Delegated to MagicBlock ER (EU)');

  console.log('[demo-helper] Ready for recording! Open http://localhost:3000 in two windows.');
}

main().catch(console.error);
