# 05 Chain Client, Bots, and the Failure Ladder

The TypeScript side: dual connections, the subscription model, the bot engine,
and mapping every async boundary to a visible state. This is Lane B's
starting point. "There is no backend" is the claim; these are the files that
make it true.

## 1. The shape of the client

`docs/technical/ARCHITECTURE.md` sections 3 and 4 define four boundaries and
one data flow. The chain client is a small set of files with one crossing
point each:

```
packages/chain-client/src/   or  app/src/chain/
  connection.ts   router getDelegationStatus, base + ER Connection factories, TEE resolver
  program.ts      typed wrappers over the Anchor IDL. No component builds a tx inline.
  subscribe.ts    connection.onAccountChange(runPda, cb) -> Zustand store
  tee.ts          verifyTeeRpcIntegrity, getAuthToken, private ClueSlot read
  settle.ts       final_settle trigger + reconciliation
app/src/game/
  store.ts        one Zustand store, write-only from chain/, read by screens
  bots.ts         web worker, sees the same store
  clue.ts         takes a u8, returns tiles + a sentence. Never fetches.
```

Rules:

- No component ever calls a connection directly.
- No component builds a transaction inline.
- `clue.ts` never fetches; the private read happens once per floor in
  `tee.ts` and lands in the store.
- The ER endpoint, the router, and the validator identity all resolve at
  runtime. The only constant in the codebase is the devnet base RPC.

## 2. Dual connections, concrete

```typescript
import { Connection } from "@solana/web3.js";
import {
  GetCommitmentSignature,
  DELEGATION_PROGRAM_ID,
} from "@magicblock-labs/ephemeral-rollups-sdk";
import { getDelegationStatus } from "./connection";

const BASE = new Connection("https://rpc.magicblock.app/devnet");
let er: Connection | null = null;

export async function resolveEr(runPda: PublicKey): Promise<Connection> {
  const status = await getDelegationStatus(runPda);
  if (!status.isDelegated || !status.fqdn) {
    throw new Error("NOT_DELEGATED");
  }
  return new Connection(status.fqdn);
}
```

Key differences from a plain Solana app:

- ER transactions use the ER blockhash: `er.getLatestBlockhash()`, never a
  base blockhash.
- ER signatures are confirmed on the ER; the base signature is extracted with
  `GetCommitmentSignature(erSig, erConnection)` and confirmed on the base
  connection.
- `skipPreflight: true` only for an ER path with a documented simulation
  incompatibility. Everything else keeps preflight.

## 3. The subscription model

There is no realtime library. Gameplay state arrives through a plain Solana
account subscription against the ER websocket:

```typescript
const ws = new Connection(status.fqdn.replace("https", "wss")); // devnet fqdns serve wss on the same host;
// only the local mb-stack uses ws on http port + 1 (e.g. 6699 -> 6700)
ws.onAccountChange(runPda, (info) => {
  const run = decodeRun(info.data);       // program.account.run.coder
  useStore.getState().setRun(run);        // single write point
});
```

Every client in the party runs the same path off the same push. Nobody polls,
nobody is authoritative, and there is no reconciliation step for game state
because there is only one copy.

The private half never takes this path. `ClueSlot` is read once per floor
through the TEE token connection straight into the store and is never
broadcast.

## 4. The bots

Bots are clients. They run in a web worker in the judge's own browser, so the
deploy stays static and there is no bot server to fall over. They are
cooperative teammates that play honestly, labelled `CPU`, never presented as
people.

```typescript
// app/src/game/bots.ts, in a web worker
onmessage = (e) => {
  const state = e.data; // the same decoded Run the store holds
  // behaviour from docs/technical/GAME-LOGIC.md section 7
};
```

The four rules:

| Event | Bot action |
| --- | --- |
| floor start | wait 2 to 5s, then post its clue to chat in plain form and mark its own cold doors |
| board resolved (one candidate left) | vote it |
| 10s remaining | panic-vote the current best candidate |
| bank vote | climb, unless it is the final floor |

Bots read their own `ClueSlot` through the same TEE path a human uses, so the
privacy boundary is exercised by the same code. They use a session key for
vote/mark/chat exactly like a human.

Deliberate ceiling, stated: a bot posts its clue on a fixed delay and never
lies, so a fully botted party clears reliably. That is correct for a demo,
where the job is to show the mechanic.

## 5. QUICK PLAY

`QUICK PLAY` is the default focus on S2 and the path a solo judge takes. It is
a client-side convenience that:

1. creates a party (host = the connected wallet),
2. fills empty seats with CPU players (the browser generates CPU keypairs),
3. sets depth QUICK and stake (zero-stake variant ships as the fallback if the
   faucet is dry),
4. flips all ready bits,
5. triggers the base init, delegate, then ER start.

The judge never sits in an empty lobby. This is the difference between a judge
inside a live clue in 20 seconds and a judge staring at empty seats.

## 6. Failure ladder, every row becomes a visible state

From `docs/technical/MAGICBLOCK.md` section 8. Each row is a UI state with a
timeout, never a spinner over an assumed result.

| Failure | Detection | Visible state |
| --- | --- | --- |
| Router returns no `fqdn` | `getDelegationStatus` throws / empty | retry twice, then S1 "TOWER OFFLINE" with the status URL. Never blank. |
| VRF callback never lands | 10s timer on `vrf_state == Requested` | S4 offers retry with a new nonce; old nonce invalidated |
| ER validator unreachable mid run | ws close + RPC error | freeze the timer, "RECONNECTING", resume from committed state. Never resolve a floor a player could not see. |
| TEE auth token rejected | `getAuthToken` throws | fall to rung 1 and **change the on-screen PRIVACY label** |
| Commit sponsorship exhausted | commit error at floor end | re-delegate to refresh quota, log loudly |
| Crank never registers | not observed in 5s | fall back to client `resolve_expired`, always live anyway |
| Magic Action fails at payout | reconcile after commit | "SETTLEMENT PENDING", manual settle path |
| Devnet USDC faucet dry | balance zero at S1 | pre-funded wallets, zero-stake QUICK PLAY |

The pattern in every row: **acceptance is not completion.** Request accepted,
scheduled, executed, and reconciled are four different states and each gets
its own screen state.

## 7. The settle trigger and reconciliation client

```typescript
export async function settleRun(runPda: PublicKey) {
  const er = await resolveEr(runPda);
  const erSig = await program.methods
    .finalSettle()
    .accounts({ /* run, magicProgram, magicContext, and every settle target */ })
    .transaction()
    .then((tx) => { tx.recentBlockhash = (await er.getLatestBlockhash()).blockhash; return tx; });
  const sig = await er.sendRawTransaction(tx.serialize());
  await er.confirmTransaction(sig, "confirmed");

  const baseSig = await GetCommitmentSignature(sig, er);
  await baseConnection.confirmTransaction(baseSig, "confirmed");

  // reconcile: read each player ATA + vault on base, assert deltas
  // if action did not run but outcome is terminal -> SETTLEMENT PENDING + manual path
}
```

## 8. Pre-submission verification (the six steps)

From `docs/technical/MAGICBLOCK.md` section 9, run from a clean profile:

```
1  status.magicblock.app/api/services         devnet er + vrf_oracle live
2  router getDelegationStatus on a live run   returns an fqdn
3  base getAccountInfo on Run                 owner = delegation program
4  ER  getAccountInfo on Run                  owner = our program, delegated=true
5  ER  getAccountInfo on someone else's slot  denied on rung 2, readable on rung 1
6  full DEEP run, two browsers, one terminal  clears and pays out
```

Step 5 is the submission. It is the only observation that separates this from
a game that merely says it is private, and it is what the video shows.
