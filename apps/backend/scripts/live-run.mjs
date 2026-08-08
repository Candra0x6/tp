#!/usr/bin/env node
/**
 * Live devnet run gate (BUILD-PLAN 2.9).
 *
 * Creates a party with the deployer wallet as host, funds three CPU seats,
 * fills them through the backend HTTP surface, delegates, then drives the
 * state machine: request a VRF deal whenever the run is dealing, and let the
 * bots resolve every floor. Ends by final-settling, paying out, and
 * reconciling the vault ledger. Never assumes a payout landed.
 *
 * Run from the backend package with a configured .env and the backend running:
 *   TF_MINT=… TF_BOT_SEED=… node scripts/live-run.mjs [CODE]
 *
 * Exit codes: 0 success, 1 config, 2 network, 3 game, 4 reconcile.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js'
import { getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token'
import { Wallet } from '@coral-xyz/anchor'
import {
  normalizeCode,
  runKey,
  playerAtaKey,
  vaultAtaKey,
  vaultKey,
  TrustFallProgram,
  getDelegationStatus,
  baseConnection,
} from '@trust-fall/chain-client'
import { botOf, botWallet } from '../dist/bots/bot-wallet.js'

const CODE = process.argv[2] ?? 'RUN1'
const DEPTH_QUICK = 0
const STAKE = 1_000_000n
const CPU_COUNT = 3
const MARGIN = 50_000n
const DEALING = 1
const DONE = 4

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function die(code, msg) {
  console.error(`[live-run] ${msg}`)
  process.exit(code)
}

function loadHost() {
  const path = process.env.TF_HOST_KEYPAIR ?? join(homedir(), '.config', 'solana', 'id.json')
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path, 'utf8'))))
}

const MINT_STR = process.env.TF_MINT
if (!MINT_STR) die(1, 'TF_MINT is not set')
const SEED = process.env.TF_BOT_SEED
if (!SEED) die(1, 'TF_BOT_SEED is not set')

const HOST = loadHost()
const MINT = new PublicKey(MINT_STR)
const base = baseConnection()
const tf = new TrustFallProgram(MINT, new Wallet(HOST))
const PORT = process.env.TF_BACKEND_PORT ?? 4000

async function fundSeat(seat) {
  const kp = botOf(SEED, CODE, seat)
  const pub = kp.publicKey
  const lamports = await base.getBalance(pub)
  if (lamports < 5_000_000) {
    try {
      await base.requestAirdrop(pub, 10_000_000)
      await sleep(1500)
    } catch {
      const blockhash = await base.getLatestBlockhash()
      const tx = new Transaction({ feePayer: HOST.publicKey, recentBlockhash: blockhash.blockhash })
        .add(SystemProgram.transfer({ fromPubkey: HOST.publicKey, toPubkey: pub, lamports: 5_000_000 }))
      await base.sendTransaction(tx, [HOST])
      await sleep(1500)
    }
  }
  const ata = playerAtaKey(pub, MINT)
  await getOrCreateAssociatedTokenAccount(base, HOST, MINT, pub, false, 'confirmed')
  const bal = await base.getTokenAccountBalance(ata).catch(() => null)
  const held = bal ? BigInt(bal.value.amount) : 0n
  if (held < STAKE + MARGIN) {
    await mintTo(base, HOST, MINT, ata, HOST, STAKE + MARGIN)
  }
  return pub
}

async function pollRun() {
  try {
    return await tf.fetchRunEr(CODE)
  } catch {
    try {
      return await tf.fetchRunBase(CODE)
    } catch {
      return null
    }
  }
}

async function run() {
  console.log(`[live-run] host=${HOST.publicKey.toBase58()} mint=${MINT.toBase58()} code=${CODE}`)

  await tf.createParty(HOST.publicKey, CODE, DEPTH_QUICK, STAKE)
  console.log('[live-run] party created')

  for (let seat = 1; seat <= CPU_COUNT; seat++) {
    const pub = await fundSeat(seat)
    console.log(`[live-run] cpu#${seat} ${pub.toBase58()}`)
  }

  const res = await fetch(`http://localhost:${PORT}/api/runs/${CODE}/bots/fill`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ count: CPU_COUNT }),
  })
  if (!res.ok) die(3, `fill failed: ${res.status} ${await res.text()}`)
  const fill = await res.json()
  console.log(`[live-run] fill ok bots=${(fill.bots ?? []).length}`)

  // Every seat must be ready on base before the first delegation: the run
  // leaves LOBBY only when the ready mask is full.
  await tf.ready(HOST.publicKey, runKey(normalizeCode(CODE)))
  console.log('[live-run] host ready')

  const validator = process.env.TF_VALIDATOR
    ? new PublicKey(process.env.TF_VALIDATOR)
    : null
  await tf.delegate(HOST.publicKey, CODE, validator)
  console.log('[live-run] delegate sent, waiting for router…')
  const delegated = await waitDelegated()
  console.log(`[live-run] delegated fqdn=${delegated.fqdn}`)

  await drive(DEALING, 60_000)
  console.log('[live-run] party in dealing phase')

  // Continuous state machine until the run is done.
  const timeoutAt = Date.now() + 10 * 60_000
  let deals = 0
  while (Date.now() < timeoutAt) {
    const run = await pollRun()
    if (!run) { await sleep(1200); continue }
    if (run.phase === DEALING) {
      await tf.requestDeal(HOST.publicKey, CODE)
      deals += 1
      console.log(`[live-run] deal #${deals} requested`)
      await sleep(2500)
      continue
    }
    if (run.phase === DONE) {
      await finalize(run)
      return
    }
    await sleep(1200)
  }
  die(3, 'timed out before the run reached DONE')
}

async function waitDelegated(timeoutMs = 30_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const s = await getDelegationStatus(runKey(normalizeCode(CODE)))
    if (s.isDelegated && s.fqdn) return s
    await sleep(1500)
  }
  die(2, 'delegation did not land')
}

async function drive(phase, timeoutMs) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const run = await pollRun()
    if (run && run.phase === phase) return run
    await sleep(1200)
  }
  die(3, `never reached phase ${phase}`)
}

async function finalize(run) {
  const outcomeName = ['RUNNING', 'BANKED', 'CLEARED', 'FELL'][run.outcome] ?? run.outcome
  console.log(`[live-run] run DONE outcome=${outcomeName} floors=${run.cleared}`)

  await tf.finalSettle(HOST.publicKey, CODE)
  console.log('[live-run] final settle committed')

  console.log('[live-run] waiting for undelegate…')
  const undelegateTimeout = Date.now() + 60_000
  while (Date.now() < undelegateTimeout) {
    const s = await getDelegationStatus(runKey(normalizeCode(CODE)))
    if (!s.isDelegated) break
    await sleep(2000)
  }
  console.log('[live-run] run back on base')

  const players = run.players.slice(0, run.playerCount ?? run.player_count).map((p) => new PublicKey(p))
  await tf.settle(HOST.publicKey, CODE, players)
  console.log('[live-run] payout settle sent')

  await reconcile()
}

async function reconcile() {
  const vpda = vaultKey(MINT)
  const vAta = vaultAtaKey(vpda, MINT)
  const vault = await tf.fetchVault()
  const ata = await base.getTokenAccountBalance(vAta).catch(() => null)

  const num = (v, d = '?') => (v == null ? d : Number(v) / 1e6)
  const bal = num(vault?.balance)
  const seeded = num(vault?.seeded)
  const falls = num(vault?.totalFalls ?? vault?.total_falls)
  const pays = num(vault?.totalPayouts ?? vault?.total_payouts)
  const ataBal = num(ata?.value?.amount)
  const ok = seeded !== '?' && bal !== '?'
  console.log(`[live-run] vault ledger balance=${bal} seeded=${seeded} falls=${falls} payouts=${pays} ata=${ataBal}`)
  console.log(`[live-run] reconcile seeded+falls-payouts==balance: ${ok ? (seeded + falls - pays === bal ? 'OK' : 'FAIL') : 'SKIP (no vault)'}`)
  if (ok && seeded + falls - pays !== bal) process.exitCode = 4
}

run().catch((err) => die(2, err.stack ?? err.message ?? String(err)))