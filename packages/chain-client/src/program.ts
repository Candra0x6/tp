import { AnchorProvider, BN, IdlAccounts, Program, Wallet } from '@coral-xyz/anchor'
import { Connection, PublicKey, SystemProgram, SYSVAR_SLOT_HASHES_PUBKEY } from '@solana/web3.js'
import type { TransactionSignature } from '@solana/web3.js'
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  DELEGATION_PROGRAM_ID,
  MAGIC_CONTEXT_ID,
  MAGIC_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  delegateBufferPdaFromDelegatedAccountAndOwnerProgram,
  delegationMetadataPdaFromDelegatedAccount,
  delegationRecordPdaFromDelegatedAccount,
} from '@magicblock-labs/ephemeral-rollups-sdk'

import idl from './idl/trust_fall.json'
import type { TrustFall } from './idl/trust_fall'
import { baseConnection, resolveEr } from './connection'

/** The deployed program id. Read from the IDL; override at deploy time. */
export const PROGRAM_ID = new PublicKey(idl.address)

export type RunAccount = IdlAccounts<TrustFall>['run']
export type ClueSlotAccount = IdlAccounts<TrustFall>['clueSlot']
export type VaultAccount = IdlAccounts<TrustFall>['vault']

/** Seeds shared with the program. Keep in lockstep with state.rs. */
const RUN_SEED = Uint8Array.from([114, 117, 110])
const CLUE_SEED = Uint8Array.from([99, 108, 117, 101])
const ESCROW_SEED = Uint8Array.from([101, 115, 99, 114, 111, 119])
const VAULT_SEED = Uint8Array.from([118, 97, 117, 108, 116])
const IDENTITY_SEED = Uint8Array.from([105, 100, 101, 110, 116, 105, 116, 121])

/**
 * The VRF program that answers entropy requests, and the delegated queue used
 * when requesting from inside the ephemeral rollup. From ephemeral-vrf-sdk
 * consts. Keep in lockstep with GAME-LOGIC.md.
 */
export const VRF_PROGRAM_ID = new PublicKey(
  'Vrf1RNUjXmQGjmQrQLvJHs9SNkvDJEsRVFPkfSQUwGz',
)
export const EPHEMERAL_ORACLE_QUEUE = new PublicKey(
  '5hBR571xnXppuCPveTrctfTU7tJLSN94nq7kv7FRK5Tc',
)

const SYSTEM_PROGRAM_ID = SystemProgram.programId

export function runKey(code: number[]): PublicKey {
  return PublicKey.findProgramAddressSync([RUN_SEED, Uint8Array.from(code)], PROGRAM_ID)[0]
}

export function clueSlotKey(run: PublicKey, seat: number): PublicKey {
  return PublicKey.findProgramAddressSync(
    [CLUE_SEED, run.toBuffer(), Uint8Array.from([seat])],
    PROGRAM_ID,
  )[0]
}

export function escrowKey(run: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([ESCROW_SEED, run.toBuffer()], PROGRAM_ID)[0]
}

export function vaultKey(mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync([VAULT_SEED, mint.toBuffer()], PROGRAM_ID)[0]
}

export function vaultAtaKey(vault: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [vault.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0]
}

export function playerAtaKey(player: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [player.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0]
}

/**
 * `program_identity`: the PDA that signs the VRF request. The `#[vrf]` macro
 * injects it with seeds `["identity"]` under our program; the SDK derives it
 * via `scoped_vrf_identity(callback_program_id)`.
 */
export function vrfIdentityKey(): PublicKey {
  return PublicKey.findProgramAddressSync([IDENTITY_SEED], PROGRAM_ID)[0]
}

function makeProgram(connection: Connection, wallet: Wallet): Program<TrustFall> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  })
  return new Program<TrustFall>(idl as TrustFall, provider)
}

/** Normalize a 4-byte run code. Returns the number[] the IDL expects. */
export function normalizeCode(code: string | number[] | Uint8Array): number[] {
  if (typeof code === 'string') {
    if (/^[0-9a-fA-F]{8}$/.test(code)) {
      return [...code].map((c) => Number.parseInt(c, 16))
    }
    const buf = new Array<number>(4).fill(0x20)
    for (let i = 0; i < Math.min(code.length, 4); i++) {
      buf[i] = code.charCodeAt(i)
    }
    return buf
  }
  const src = Array.from(code)
  if (src.length === 8) return src
  const buf = new Array<number>(4).fill(0x20)
  for (let i = 0; i < Math.min(src.length, 4); i++) {
    buf[i] = src[i]
  }
  return buf
}

const commitAccounts = (payer: PublicKey, run: PublicKey) => ({
  payer,
  run,
  slot0: clueSlotKey(run, 0),
  slot1: clueSlotKey(run, 1),
  slot2: clueSlotKey(run, 2),
  slot3: clueSlotKey(run, 3),
  magicProgram: MAGIC_PROGRAM_ID,
  magicContext: MAGIC_CONTEXT_ID,
})

const slotKeys = (run: PublicKey) => ({
  slot0: clueSlotKey(run, 0),
  slot1: clueSlotKey(run, 1),
  slot2: clueSlotKey(run, 2),
  slot3: clueSlotKey(run, 3),
})

/**
 * The clue slots a resolution needs to recompute the safe door. The program
 * reads them from `remaining_accounts`, never from the Run, so the caller must
 * supply the live slot accounts for every member. Dealt slots are the only
 * ones that exist, so the list is sized by the run's current player count.
 */
export async function slotMetas(
  program: Program<TrustFall>,
  run: PublicKey,
  playerCount: number,
): Promise<{ pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[]> {
  return Array.from({ length: playerCount }, (_, seat) => {
    const key = clueSlotKey(run, seat)
    return { pubkey: key, isWritable: true, isSigner: false }
  })
}

export type AnchorWallet = Wallet

/**
 * Typed wrapper over the Trust Fall IDL. All PDAs are derived here, never in
 * components. Base-layer methods run on the base connection; ephemeral methods
 * run on the connection resolved from the router for the run's fqdn.
 * `accountsStrict` is used throughout so no account is silently auto-resolved.
 */
export class TrustFallProgram {
  readonly mint: PublicKey
  readonly wallet: Wallet
  private erCache = new Map<string, Program<TrustFall>>()

  constructor(mint: PublicKey, wallet: Wallet) {
    this.mint = mint
    this.wallet = wallet
  }

  /** The wallet this instance signs with. Bots use this as their own seat. */
  get publicKey(): PublicKey {
    return this.wallet.publicKey
  }

  private base(): Program<TrustFall> {
    return makeProgram(baseConnection(), this.wallet)
  }

  private async er(run: PublicKey): Promise<Program<TrustFall>> {
    const key = run.toBase58()
    let program = this.erCache.get(key)
    if (!program) {
      program = makeProgram(await resolveEr(run), this.wallet)
      this.erCache.set(key, program)
    }
    return program
  }

  /* ---------------- Vault (base) ---------------- */

  async initializeVault(admin: PublicKey): Promise<TransactionSignature> {
    return this.base()
      .methods.initializeVault()
      .accountsStrict({
        vault: vaultKey(this.mint),
        admin,
        mint: this.mint,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .rpc()
  }

  async seedVault(admin: PublicKey, amount: bigint): Promise<TransactionSignature> {
    const vault = vaultKey(this.mint)
    return this.base()
      .methods.seedVault(new BN(amount.toString()))
      .accountsStrict({
        vault,
        admin,
        mint: this.mint,
        vaultAta: vaultAtaKey(vault, this.mint),
        adminAta: playerAtaKey(admin, this.mint),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()
  }

  async fetchVault(): Promise<VaultAccount | null> {
    return this.base().account.vault.fetchNullable(vaultKey(this.mint))
  }

  /**
   * The lobby copy of a run lives on base before delegation. Returns null when
   * the account does not exist yet, and throws when its data is not a Run
   * (e.g. a delegated account owned by the delegation program).
   */
  async fetchRunBase(code: string | number[] | Uint8Array): Promise<RunAccount | null> {
    const run = runKey(normalizeCode(code))
    return this.base().account.run.fetchNullable(run)
  }

  /**
   * The live copy of a run after delegation, resolved from the router fqdn.
   * Throws NOT_DELEGATED when the router has no fqdn for the run.
   */
  async fetchRunEr(code: string | number[] | Uint8Array): Promise<RunAccount | null> {
    const run = runKey(normalizeCode(code))
    return (await this.er(run)).account.run.fetchNullable(run)
  }

  /**
   * Read a single seat's ClueSlot on the ER. On the public rung every slot is
   * readable by RPC; on the private rung the caller must hold the permission.
   * Returns null when the slot has not been dealt for the current floor.
   */
  async fetchClueSlot(run: PublicKey, seat: number): Promise<ClueSlotAccount | null> {
    return (await this.er(run)).account.clueSlot.fetchNullable(clueSlotKey(run, seat))
  }

  /* ---------------- Party (base) ---------------- */

  async createParty(
    host: PublicKey,
    code: string | number[] | Uint8Array,
    depth: number,
    stake: bigint,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return this.base()
      .methods.createParty(c, depth, new BN(stake.toString()))
      .accountsStrict({
        host,
        run,
        escrow: escrowKey(run),
        hostAta: playerAtaKey(host, this.mint),
        mint: this.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .rpc()
  }

  async joinParty(player: PublicKey, run: PublicKey): Promise<TransactionSignature> {
    return this.base()
      .methods.joinParty()
      .accountsStrict({
        player,
        run,
        escrow: escrowKey(run),
        playerAta: playerAtaKey(player, this.mint),
        mint: this.mint,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc()
  }

  async ready(player: PublicKey, run: PublicKey): Promise<TransactionSignature> {
    return this.base().methods.ready().accountsStrict({ player, run }).rpc()
  }

  /* ---------------- Delegation (base) ---------------- */

  async delegate(
    host: PublicKey,
    code: string | number[] | Uint8Array,
    validator: PublicKey | null,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    const bufferOf = (acc: PublicKey) =>
      delegateBufferPdaFromDelegatedAccountAndOwnerProgram(acc, PROGRAM_ID)
    const slots = slotKeys(run)
    return this.base()
      .methods.delegate(c, validator)
      .accountsStrict({
        host,
        bufferRun: bufferOf(run),
        delegationRecordRun: delegationRecordPdaFromDelegatedAccount(run),
        delegationMetadataRun: delegationMetadataPdaFromDelegatedAccount(run),
        run,
        bufferSlot0: bufferOf(slots.slot0),
        delegationRecordSlot0: delegationRecordPdaFromDelegatedAccount(slots.slot0),
        delegationMetadataSlot0: delegationMetadataPdaFromDelegatedAccount(slots.slot0),
        slot0: slots.slot0,
        bufferSlot1: bufferOf(slots.slot1),
        delegationRecordSlot1: delegationRecordPdaFromDelegatedAccount(slots.slot1),
        delegationMetadataSlot1: delegationMetadataPdaFromDelegatedAccount(slots.slot1),
        slot1: slots.slot1,
        bufferSlot2: bufferOf(slots.slot2),
        delegationRecordSlot2: delegationRecordPdaFromDelegatedAccount(slots.slot2),
        delegationMetadataSlot2: delegationMetadataPdaFromDelegatedAccount(slots.slot2),
        slot2: slots.slot2,
        bufferSlot3: bufferOf(slots.slot3),
        delegationRecordSlot3: delegationRecordPdaFromDelegatedAccount(slots.slot3),
        delegationMetadataSlot3: delegationMetadataPdaFromDelegatedAccount(slots.slot3),
        slot3: slots.slot3,
        ownerProgram: PROGRAM_ID,
        delegationProgram: DELEGATION_PROGRAM_ID,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .rpc()
  }

  /* ---------------- Ephemeral rollup calls ---------------- */

  async requestDeal(
    payer: PublicKey,
    code: string | number[] | Uint8Array,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return (await this.er(run))
      .methods.requestDeal(c)
      .accountsStrict({
        payer,
        run,
        oracleQueue: EPHEMERAL_ORACLE_QUEUE,
        programIdentity: vrfIdentityKey(),
        vrfProgram: VRF_PROGRAM_ID,
        slotHashes: SYSVAR_SLOT_HASHES_PUBKEY,
        systemProgram: SYSTEM_PROGRAM_ID,
      })
      .rpc()
  }

  async vote(
    player: PublicKey,
    code: string | number[] | Uint8Array,
    door: number,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    const program = await this.er(run)
    const account = await program.account.run.fetch(run)
    const metas = await slotMetas(program, run, account.playerCount)
    return program.methods.vote(c, door).accountsStrict({ player, run }).remainingAccounts(metas).rpc()
  }

  async mark(
    player: PublicKey,
    code: string | number[] | Uint8Array,
    door: number,
    set: boolean,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return (await this.er(run))
      .methods.mark(c, door, set)
      .accountsStrict({ player, run })
      .rpc()
  }

  async chat(
    player: PublicKey,
    code: string | number[] | Uint8Array,
    body: number[],
    len: number,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return (await this.er(run)).methods.chat(c, body, len).accountsStrict({ player, run }).rpc()
  }

  async resolve(
    code: string | number[] | Uint8Array,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    const program = await this.er(run)
    const account = await program.account.run.fetch(run)
    const metas = await slotMetas(program, run, account.playerCount)
    return program.methods.resolve(c).accountsStrict({ run }).remainingAccounts(metas).rpc()
  }

  async resolveExpired(
    code: string | number[] | Uint8Array,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    const program = await this.er(run)
    const account = await program.account.run.fetch(run)
    const metas = await slotMetas(program, run, account.playerCount)
    return program.methods.resolveExpired(c).accountsStrict({ run }).remainingAccounts(metas).rpc()
  }

  async bankVote(
    player: PublicKey,
    code: string | number[] | Uint8Array,
    choice: number,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return (await this.er(run)).methods.bankVote(c, choice).accountsStrict({ player, run }).rpc()
  }

  async bankResolve(code: string | number[] | Uint8Array): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return (await this.er(run)).methods.bankResolve(c).accountsStrict({ run }).rpc()
  }

  /* ---------------- Commit / final settle (ephemeral) ---------------- */

  async commitFloor(
    payer: PublicKey,
    code: string | number[] | Uint8Array,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return (await this.er(run))
      .methods.commitFloor(c)
      .accountsStrict(commitAccounts(payer, run))
      .rpc()
  }

  async finalSettle(
    payer: PublicKey,
    code: string | number[] | Uint8Array,
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    return (await this.er(run))
      .methods.finalSettle(c)
      .accountsStrict(commitAccounts(payer, run))
      .rpc()
  }

  /* ---------------- Settle payouts (base) ---------------- */

  async settle(
    payer: PublicKey,
    code: string | number[] | Uint8Array,
    players: PublicKey[],
  ): Promise<TransactionSignature> {
    const c = normalizeCode(code)
    const run = runKey(c)
    const vault = vaultKey(this.mint)
    const builder = this.base()
      .methods.settle(c)
      .accountsStrict({
        payer,
        run,
        escrow: escrowKey(run),
        mint: this.mint,
        vault,
        vaultAta: vaultAtaKey(vault, this.mint),
        tokenProgram: TOKEN_PROGRAM_ID,
      })
    for (const p of players) {
      builder.remainingAccounts([{
        pubkey: playerAtaKey(p, this.mint),
        isWritable: true,
        isSigner: false,
      }])
    }
    return builder.rpc()
  }
}
