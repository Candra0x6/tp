# 02 ER Lifecycle and Routing

The delegation lifecycle, the dual-connection rule, commits, and Magic
Actions. This is the layer that has already renamed itself once in this
project's history, so everything here is taken from the verified SDK snapshot
and the `magicblock` skill, never from memory.

## 1. The one rule that governs all routing

**Never hardcode an ER endpoint.** Ask the router for the account's status and
use the `fqdn` it returns. The region serving us today is not guaranteed to
serve us on Sunday.

```
base layer   https://rpc.magicblock.app/devnet
router       https://devnet-router.magicblock.app/
ephemeral    the `fqdn` returned by router getDelegationStatus
```

| Transaction | Goes to |
| --- | --- |
| init accounts, delegate, USDC escrow, vault seed | base layer |
| vote, mark, chat, tick, resolve floor, VRF request/callback | ephemeral rollup |
| commit, undelegate | ephemeral rollup |

Two consequences to build around:

- The base blockhash must come from the base connection, the ER blockhash from
  the ER connection. Reusing a base blockhash on an ER transaction is a
  classic failure.
- Balances are endpoint-scoped. Read ER balances on the ER connection and base
  balances on the base connection. The other side is stale by design until
  commit.

## 2. Router status

JSON-RPC POST to the router endpoint:

```typescript
type DelegationStatus = {
  isDelegated: boolean;
  fqdn?: string;
  delegationRecord?: {
    authority: string;
    owner: string;
    delegationSlot: number;
    lamports: number;
  };
};

async function getDelegationStatus(account: PublicKey): Promise<DelegationStatus> {
  const res = await fetch("https://devnet-router.magicblock.app/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "getDelegationStatus",
      params: [account.toBase58()],
    }),
  });
  const body = await res.json();
  if (body.error) throw new Error(body.error.message);
  return body.result;
}
```

Verified live: a non-delegated account returns `{ isDelegated: false }`. A
delegated account adds `fqdn`. Poll until base owner, router `fqdn`, and ER
owner all agree, with a bounded timeout. "The transaction succeeded" is not
the gate; the three-way ownership check is.

**The delegation debugging invariant.** A correctly delegated account:
1. is owned by the delegation program on base,
2. is owned by our program on the ER endpoint the router names,
3. reports `delegated=true` in the ER.

## 3. The lifecycle

```
1  base      init Run, ClueSlot[i], Vault PDAs, lock USDC into Escrow
2  base      delegate Run and every ClueSlot
3  ER        the entire run: deal, vote, mark, chat, resolve, climb
4  ER        commit at the end of each floor
5  ER        commit_and_undelegate on bank, clear, or fall
6  base      Magic Action pays out atomically with the final commit
```

### Delegate (base)

The delegate method is auto-generated as `delegate_<field_name>` and the
delegated account uses the `del` constraint on an `AccountInfo`:

```rust
pub fn delegate(ctx: Context<DelegateRun>) -> Result<()> {
    // `del` constraint + method named after the field
    ctx.accounts.delegate_run(
        &ctx.accounts.payer,
        &[b"run", ctx.accounts.run.code.as_slice()],
        DelegateConfig::default(),
    )?;
    // one delegate_<field> call per ClueSlot, same pattern with
    // [b"clue", run.key().as_ref(), seat.to_le_bytes().as_slice()]
    Ok(())
}

#[delegate]
#[derive(Accounts)]
#[instruction(code: [u8; 4])]
pub struct DelegateRun<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: the PDA to delegate.
    #[account(mut, del, seeds = [b"run", code.as_slice()], bump)]
    pub run: UncheckedAccount<'info>,
    // ... one del account per ClueSlot
}
```

For a **Private ER**, pass the TEE validator identity in `DelegateConfig`:

```rust
DelegateConfig {
    validator: Some(*ctx.accounts.validator.key), // resolved via getIdentity on the TEE fqdn
    ..Default::default()
}
```

Verified on 7 Aug 2026:
- devnet TEE validator identity: `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo`
  (from `getIdentity` on `https://devnet-tee-as.magicblock.app`)
- devnet plain ER identity: `MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57`

Resolve the validator with `getIdentity` at runtime rather than hardcoding
either address, exactly like the ER endpoint itself. If delegation is
unpinned (`validator: None`), confirm all interacting accounts share the same
`fqdn` before any joint ER transaction.

### Commit and undelegate (ER)

Use `MagicIntentBundleBuilder`. The free functions `commit_accounts` and
`commit_and_undelegate_accounts` are deprecated.

```rust
pub fn commit_floor(ctx: Context<CommitFloor>) -> Result<()> {
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    )
    .commit(&[ctx.accounts.run.to_account_info()])
    .build_and_invoke()?;
    Ok(())
}

pub fn final_settle(ctx: Context<FinalSettle>) -> Result<()> {
    // see section 5 for the CallHandler
    MagicIntentBundleBuilder::new(
        ctx.accounts.payer.to_account_info(),
        ctx.accounts.magic_context.to_account_info(),
        ctx.accounts.magic_program.to_account_info(),
    )
    .commit_and_undelegate(&[ctx.accounts.run.to_account_info()])
    .add_post_commit_actions([action])
    .build_and_invoke_signed(&[run_seeds])?; // Run PDA is the escrow authority
    Ok(())
}
```

Notes:

- `#[commit]` on the context adds `magic_context` and `magic_program`
  automatically.
- The builder takes owned `AccountInfo`, so pass `.to_account_info()`.
- The payer and the committed accounts are independent. The run PDA can pay
  for its own settlement via `build_and_invoke_signed`.

### Commit sponsorship

**10 free commits per delegated account by default.** A DEEP run commits once
per floor: 5, plus one final undelegate. Fits with room to spare. If the cap
is ever hit, re-delegating refreshes the quota. If we are committing more than
once per floor, that is the bug, not the quota.

## 4. Extracting the base signature

An ER transaction's signature is an ER signature. To confirm the base commit:

```typescript
const erSig = await erProvider.sendAndConfirm(tx, [], { commitment: "confirmed" });
const baseSig = await GetCommitmentSignature(erSig, erConnection);
await baseConnection.confirmTransaction(baseSig, "confirmed");
```

`GetCommitmentSignature` is exported from `@magicblock-labs/ephemeral-rollups-sdk`.
It reads the ER logs to find the base signature; it does not confirm it.
Confirming the base transaction separately is the only thing that proves the
state landed.

## 5. Magic Actions: the settlement link

Magic Actions are base-layer instructions scheduled inside an ER transaction.
Within one attempted base transaction, commit + actions run atomically. If an
action fails, the committor removes every BaseAction in that transaction
strategy and retries the commit; the action is not retried on its own.

The target instruction is marked `#[action]`:

```rust
#[action]
#[derive(Accounts)]
pub struct Settle<'info> {
    #[account(mut, seeds = [b"run", run.code.as_slice()], bump)]
    pub run: Account<'info, Run>,
    #[account(mut, seeds = [b"escrow", run.key().as_ref()], bump)]
    pub escrow: UncheckedAccount<'info>,          // token account, writable via action metas
    // vault, vault token account, player ATAs, mint, token program, ...
}
```

Scheduling the action:

```rust
let instruction_data = anchor_lang::InstructionData::data(&crate::instruction::Settle {});
let action = CallHandler {
    destination_program: crate::ID,
    accounts: vec![
        ShortAccountMeta { pubkey: run.key().to_bytes().into(), is_writable: true },
        ShortAccountMeta { pubkey: escrow.key().to_bytes().into(), is_writable: true },
        // one ShortAccountMeta per account the action reads or writes, is_writable matching actual writes
    ],
    args: ActionArgs::new(instruction_data),
    escrow_authority: ctx.accounts.run.to_account_info(), // Run PDA pays; needs build_and_invoke_signed
    compute_units: 400_000, // 4 SPL transfers + reads; 200k default is a floor, not a ceiling
};
```

Rules that cost real hours:

- `#[action]` is required on the target context, or the SDK cannot dispatch.
- `is_writable` in the `ShortAccountMeta` list must match what the action
  actually writes. It is independent of the outer `#[commit]` context.
- PDA `escrow_authority` requires `build_and_invoke_signed` with the run seeds.
  Calling `build_and_invoke()` fails signature verification at action time.
- Compute units are per action, not per bundle.
- **Scheduling success is not execution.** A successful ER transaction or a
  later successful commit does not prove the action ran. Reconciliation is a
  real task (see `04-economy-and-settlement.md`).

## 6. Local development

The smallest environment that proves a claim, then a live integration test.

| Claim | Environment |
| --- | --- |
| Clue math, vote rules, charset | `cargo test`, pure Rust |
| Base init + SPL behavior | local Solana validator |
| Delegation, ER writes, commit, undelegate | local MagicBlock stack or devnet |
| Router discovery, cross-endpoint propagation | devnet |
| VRF callback, Magic Action delivery | devnet |
| PER confidentiality boundary | TEE-backed PER environment (devnet TEE) |

Local stack snapshot (verified 15 Jul 2026 in the skill):

```bash
npx --yes --package=@magicblock-labs/ephemeral-validator@0.13.7 mb-stack
# base RPC 127.0.0.1:8899, internal ER RPC 127.0.0.1:7799,
# public ER entrypoint 127.0.0.1:6699, each HTTP port + 1 for ws.
```

`mb-stack --help` is not a discovery probe (it can start services). The local
stack does not build or deploy your program. `magicsvm` gives fast in-process
tests but proves nothing about routing, TEE privacy, or cross-layer
propagation.

For the ER-only devnet flows, run against devnet directly from Friday. Local
never reproduces routing, TEE auth, or a validator that moved.

## 7. Wait-for-propagation checklist

1. Send delegate to base, confirmed.
2. Poll router `getDelegationStatus` until `isDelegated: true` and `fqdn` set.
3. Confirm base owner is the delegation program.
4. On the `fqdn`, confirm owner is our program and `delegated=true`.
5. Only then send ER operations.
6. After `commit_and_undelegate`, confirm base owner is our program again, and
   confirm the extracted base signature.
