# 03 PER Privacy and the TEE

The submission is one observation: **you cannot read another player's clue.**
This file is the research behind rung 2 of the privacy ladder
(`docs/technical/MAGICBLOCK.md` section 4), the permission lifecycle, and the
TEE auth flow, with the SDK calls verified against the actual package.

## 1. What the gate is and is not

The gate is at **RPC ingress**, not at execution. Inside the enclave the
program still reads every `ClueSlot` to recompute the safe door from the
union of masks. Outside, the TEE RPC refuses to serve a slot to anyone but its
listed member.

Consequences:

- `Run` stays public and ungated. Floor number, timer, votes, marks, chat, and
  pot are meant to be seen.
- Only `ClueSlot` is private, and it must never be delegated to a non-TEE
  validator.
- Because `docs/technical/GAME-LOGIC.md` 3.2 proves that reading every clue is
  the same as knowing the answer, the clue union is the answer and the union
  must never exist outside the enclave.

## 2. The privacy ladder (what each rung honestly provides)

| Rung | What a player with a terminal can do | Ship it? |
| --- | --- | --- |
| 0. Public ER | read every clue with one `getAccountInfo`, win every floor alone | scaffold only, never the submission |
| 1. Public ER, honest | same, but the screen and README say so plainly | acceptable fallback |
| 2. Private ER | read only their own clue, denied at the enclave ingress | **the target** |

Rung 2 is the plan, rung 1 is the parachute. **Decision point is Saturday
20:00 per `docs/technical/BUILD-PLAN.md` G3.** If rung 2 does not pass, fall to
rung 1, delete the verify command from the README, and change the on-screen
privacy label. Never keep pushing and never overclaim.

## 3. Delegating to the TEE validator

The Private ER is not a special program. It is a normal delegated account whose
`DelegateConfig.validator` is a TEE validator identity. Resolve the identity at
runtime:

```typescript
const res = await fetch("https://devnet-tee-as.magicblock.app/", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getIdentity", params: [] }),
});
const teeValidator = new PublicKey((await res.json()).result.identity);
```

Verified live on 7 Aug 2026:
- TEE validator identity: `MTEWGuqxUpYZGFJQcp8tLN7x5v9BSeoFHYWQQ3n3xzo`
- Plain devnet ER identity: `MAS1Dt9qreoRMQ14YQuhg8UTZMMzDdKhmkZMECCzk57`

Delegate the data PDA with `DelegateConfig { validator: Some(teeValidator), .. }`.
All four `ClueSlot` accounts in a run must target the **same** TEE validator,
or a joint ER transaction cannot see them all.

## 4. The permission lifecycle (all on the ER)

There is no base-layer permission account. Delegate the data PDA on base, then
create/update/close its `EphemeralPermission` on the ER.

Three steps that are easy to get wrong (each cost someone a day):

1. **Delegate only the data account on base.** Never create or delegate a
   separate base-layer permission account.
2. **Pre-fund the data PDA for permission rent** before the create CPI. The
   PDA pays the permission rent from its own lamports. Roughly 32 lamports per
   byte of `EphemeralPermission`; pick a member cap up front and enforce it.
3. **Create idempotently.** Clients retry ER transactions. Skip the create CPI
   when the permission PDA is already an initialized permission-program
   account.

```rust
use ephemeral_rollups_sdk::access_control::instructions::{
    CloseEphemeralPermissionCpi, CreateEphemeralPermissionCpi,
    UpdateEphemeralPermissionCpi,
};
use ephemeral_rollups_sdk::access_control::structs::{
    EphemeralMembersArgs, EphemeralPermission, Member, PERMISSION_SEED,
    TX_BALANCES_FLAG, TX_LOGS_FLAG, TX_MESSAGE_FLAG,
};
use ephemeral_rollups_sdk::consts::{EPHEMERAL_VAULT_ID, MAGIC_PROGRAM_ID, PERMISSION_PROGRAM_ID};

// inside an ER instruction, signer = the delegated ClueSlot PDA via its seeds
let signer_seeds: &[&[u8]] = &[b"clue", run.key().as_ref(), &[seat], &[bump]];
CreateEphemeralPermissionCpi {
    payer: ctx.accounts.slot.to_account_info(),           // the data PDA pays rent
    permissioned_account: ctx.accounts.slot.to_account_info(),
    permission: ctx.accounts.permission.to_account_info(), // [PERMISSION_SEED, slot.key()] under PERMISSION_PROGRAM_ID
    vault: ctx.accounts.ephemeral_vault.to_account_info(), // EPHEMERAL_VAULT_ID
    magic_program: ctx.accounts.magic_program.to_account_info(),
    permission_program: ctx.accounts.permission_program.to_account_info(),
    args: EphemeralMembersArgs {
        is_private: true,
        members: vec![Member {
            pubkey: slot.player,
            flags: TX_LOGS_FLAG | TX_MESSAGE_FLAG | TX_BALANCES_FLAG,
        }],
    },
}
.invoke_signed(&[signer_seeds])?;
```

Update and close use `UpdateEphemeralPermissionCpi` and
`CloseEphemeralPermissionCpi` with the same shared `PermissionContext` shape
(from `magicblock` skill `delegation.md` section 2). On update, rebuild the
**complete** member list; omitting a member revokes them. On settlement, close
the permission before the slot leaves the ER, then undelegate only the data
PDA.

Verified SDK facts:

- The `Member` type carries `AUTHORITY_FLAG`, `TX_LOGS_FLAG`,
  `TX_BALANCES_FLAG`, `TX_MESSAGE_FLAG`, `ACCOUNT_SIGNATURES_FLAG`
  (`@magicblock-labs/ephemeral-rollups-sdk@0.16.2`, `access-control/types/member.d.ts`).
- `PERMISSION_PROGRAM_ID` constant = `ACLseoPoyC3cBqoUtkbjZ4aDrkurZW86v19pXz2XQnp1`.
- The SDK exports client-side builders under `access-control/` for
  create/update/close permission flows.

## 5. TEE auth: the client half

Verified against the SDK source (`access-control/auth.js` and
`access-control/verify.js` in `@magicblock-labs/ephemeral-rollups-sdk@0.16.2`).

```typescript
import { getAuthToken, verifyTeeRpcIntegrity } from "@magicblock-labs/ephemeral-rollups-sdk/access-control";

// 1. prove the endpoint is a real TDX enclave before trusting it
await verifyTeeRpcIntegrity(EPHEMERAL_RPC_URL);
// GET {rpc}/quote?challenge=<64 random bytes base64>
// verifies the DCAP quote with @phala/dcap-qvl and that reportData == challenge

// 2. get a token for this wallet
const { token, expiresAt } = await getAuthToken(EPHEMERAL_RPC_URL, wallet.publicKey, (msg) =>
  wallet.signMessage(msg),
);
// GET {rpc}/auth/challenge?pubkey=<b58>
// POST {rpc}/auth/login { pubkey, challenge, signature }
// token session default is 30 days (SESSION_DURATION)

// 3. use the token on every ER connection that reads private state
const conn = new Connection(`${EPHEMERAL_RPC_URL}?token=${token}`);
```

The flow for reading **your own** clue each floor:

1. `verifyTeeRpcIntegrity` once at connect (S0/S1). Failure is a rung-1 event:
   fall back and relabel, never silently.
2. `getAuthToken` once per session, reuse the token.
3. Read only your seat's `ClueSlot` through the token-scoped connection. Never
   broadcast it. It goes straight into the store and is never part of the
   account subscription path.

## 6. Failure ladder for privacy

| Failure | Detect | Response |
| --- | --- | --- |
| TEE endpoint unreachable | `verifyTeeRpcIntegrity` throws | retry twice, then rung 1 + relabel |
| Auth token rejected | `getAuthToken` throws | rung 1 fallback, change the on-screen PRIVACY label |
| `getAccountInfo` on another seat's slot succeeds | the submission check itself | this build is rung 1, not rung 2. Read the label. |
| TEE validator unavailable at delegate time | `getIdentity` fails | fall back to a plain ER validator = rung 1, honestly |

## 7. The proof a judge can paste

Rung 2 ships only if this holds from a terminal with the Solana CLI, using a
real run's pubkeys (put in the README, not placeholders):

```bash
# your own clue: readable
solana account <YOUR_CLUE_SLOT> --url <TEE_FQDN>?token=<YOUR_TOKEN>
# someone else's clue: denied at the enclave ingress
solana account <THEIR_CLUE_SLOT> --url <TEE_FQDN>?token=<YOUR_TOKEN>
```

If this cannot pass by Saturday 20:00, it is deleted from the README and the
rung-1 statement replaces it in exactly the words
`docs/technical/MAGICBLOCK.md` section 4 prescribes.
