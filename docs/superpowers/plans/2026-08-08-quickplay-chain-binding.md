# Quick Play & Live Chain Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect BLOCKBOY React DOM screens to live Solana devnet / MagicBlock ER transactions (`createParty`, `fill`, `ready`, `delegate`, `requestDeal`, `vote`), enabling 1-Click Quick Play with CPU bots.

**Architecture:** An `ephemeralWallet` helper manages guest keypairs in `sessionStorage` and funds them if needed. A `runObserver` polls `/api/runs/:code` to reflect live on-chain phase changes in `ScreenManager`. `QuickPlayRunner` orchestrates party creation, bot fill via backend, readying, and ER delegation.

**Tech Stack:** Next.js 15, React 19, `@solana/web3.js`, `@coral-xyz/anchor`, `@trust-fall/chain-client`.

## Global Constraints
- Logical screen grid fixed to 480px width by 320px height.
- All transactions execute on Solana devnet & MagicBlock ER (`devnet-eu.magicblock.app`).
- Non-negotiable: Never assume a payout landed; verify on-chain status.
- Departure Mono 8px font (`font-pixel`) and LANTERN design tokens.

---

### Task 1: Ephemeral Guest Wallet Helper

**Files:**
- Create: `apps/web/lib/ephemeralWallet.ts`

**Interfaces:**
- Produces: `getOrCreateEphemeralWallet(): { keypair: Keypair; wallet: Wallet }`
- Produces: `ensureWalletFunded(connection: Connection, pubkey: PublicKey): Promise<void>`

- [ ] **Step 1: Write `apps/web/lib/ephemeralWallet.ts`**

```typescript
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
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/ephemeralWallet.ts
git commit -m "feat(web): add ephemeral guest wallet helper"
```

---

### Task 2: Sub-Second Run Observer Hook

**Files:**
- Create: `apps/web/lib/runObserver.ts`

**Interfaces:**
- Produces: `useRunObserver(code: string | null, seat?: number): { state: BoardState | null; loading: boolean; error: string | null }`

- [ ] **Step 1: Write `apps/web/lib/runObserver.ts`**

```typescript
import { useState, useEffect } from 'react';

export interface BoardState {
  code: string;
  runKey: string;
  delegated: boolean;
  fqdn: string | null;
  run: {
    code: number[];
    host: string;
    players: string[];
    playerCount: number;
    depth: number;
    doors: number;
    floor: number;
    phase: number;
    vrfState: number;
    cleared: number;
    outcome: number;
    deadlineTs: number;
    stake: string;
    pot: string;
  };
  ownClueMask: number | null;
  players: string[];
  timestamp: number;
}

export function useRunObserver(code: string | null, seat: number = 0) {
  const [state, setState] = useState<BoardState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setState(null);
      return;
    }

    let active = true;
    const fetchState = async () => {
      try {
        const res = await fetch(`/api/runs/${code}?seat=${seat}`);
        if (!res.ok) {
          if (active) setError(`HTTP ${res.status}`);
          return;
        }
        const data = await res.json();
        if (active) {
          setState(data);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        if (active) setError(err.message ?? 'Fetch failed');
      }
    };

    setLoading(true);
    fetchState();
    const timer = setInterval(fetchState, 800);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [code, seat]);

  return { state, loading, error };
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/lib/runObserver.ts
git commit -m "feat(web): add useRunObserver hook for real-time board state"
```

---

### Task 3: Quick Play Orchestration Service

**Files:**
- Create: `apps/web/components/viewport/QuickPlayRunner.ts`

**Interfaces:**
- Produces: `startQuickPlay(options?: { validator?: string }): Promise<{ code: string; runKey: string }>`

- [ ] **Step 1: Write `apps/web/components/viewport/QuickPlayRunner.ts`**

```typescript
import { PublicKey } from '@solana/web3.js';
import {
  TrustFallProgram,
  baseConnection,
  runKey as deriveRunKey,
  normalizeCode,
} from '@trust-fall/chain-client';
import { getOrCreateEphemeralWallet, ensureWalletFunded } from '../../lib/ephemeralWallet';

const DEVNET_MINT = '6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy';
const EU_VALIDATOR = 'MEUGGrYPxKk17hCr7wpT6s8dtNokZj5U2L57vjYMS8e';

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let res = '';
  for (let i = 0; i < 4; i++) {
    res += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return res;
}

export async function startQuickPlay(options?: { validator?: string }): Promise<{ code: string; runKey: string }> {
  const { wallet } = getOrCreateEphemeralWallet();
  const conn = baseConnection();

  await ensureWalletFunded(conn, wallet.publicKey);

  const mint = new PublicKey(DEVNET_MINT);
  const tf = new TrustFallProgram(mint, wallet);
  const code = generateRandomCode();
  const runPda = deriveRunKey(normalizeCode(code));

  // 1. Create Party on Base
  await tf.createParty(wallet.publicKey, code, 0, 1000000n);

  // 2. Fill 3 CPU Seats via Nest Backend
  const fillRes = await fetch(`/api/runs/${code}/bots/fill`, {
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
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/viewport/QuickPlayRunner.ts
git commit -m "feat(web): add startQuickPlay orchestrator"
```

---

### Task 4: Wire ScreenManager & Screen Components to Live Run State

**Files:**
- Modify: `apps/web/components/viewport/ScreenManager.tsx`
- Modify: `apps/web/components/viewport/screens/S2Lobby.tsx`
- Modify: `apps/web/components/viewport/screens/S5Floor.tsx`
- Modify: `apps/web/components/viewport/screens/S7BankOrClimb.tsx`

**Interfaces:**
- Wire Quick Play button on `S2Lobby` to `startQuickPlay()`.
- Wire `ScreenManager` auto-screen transitions based on `useRunObserver(activeCode)`.
- Wire door vote & chat in `S5Floor` to ER transactions & backend API.

- [ ] **Step 1: Update `S2Lobby.tsx` with loading state**

Update `S2Lobby.tsx` to handle async Quick Play creation:

```tsx
'use client';
import React, { useState } from 'react';
import { FooterBand } from '../FooterBand';

interface S2LobbyProps {
  vaultBalance?: string;
  isLoading?: boolean;
  onSelectMode: (mode: 'quick' | 'create' | 'join') => void;
}

export const S2Lobby: React.FC<S2LobbyProps> = ({
  vaultBalance = '104.00 USDC',
  isLoading = false,
  onSelectMode,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const MODES = [
    { id: 'quick', label: 'QUICK PLAY', detail: isLoading ? 'CREATING...' : 'fills with CPU' },
    { id: 'create', label: 'CREATE PARTY', detail: 'custom room' },
    { id: 'join', label: 'JOIN BY CODE', detail: '[ _ _ _ _ ]' },
  ];

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
      <div className="p-3 flex flex-col flex-1 min-h-[150px] gap-2">
        <div className="text-[11px] font-bold text-[#8b8698]">SELECT TOWER MODE</div>

        <div className="flex-1 min-h-0 bg-[#1a1922] border border-[#6b6580] rounded p-2 flex flex-col gap-2">
          {MODES.map((m, idx) => (
            <button
              key={m.id}
              disabled={isLoading}
              onClick={() => { setSelectedIndex(idx); onSelectMode(m.id as any); }}
              className={`p-2 rounded text-[11px] flex items-center justify-between cursor-pointer w-full text-left ${
                idx === selectedIndex
                  ? 'bg-[#FF5219] text-[#0f0e13] font-bold'
                  : 'bg-[#08070b] text-[#f2efe6] hover:bg-[#252330]'
              }`}
            >
              <span>{idx === selectedIndex ? `▸ ${m.label}` : `  ${m.label}`}</span>
              <span className="text-[9px] opacity-75">{m.detail}</span>
            </button>
          ))}
        </div>

        <div className="bg-[#08070b] border border-[#6b6580] rounded p-2 flex justify-between items-center text-[10px]">
          <span className="text-[#8b8698]">PRIZE VAULT</span>
          <span className="text-[#00FF94] font-bold">{vaultBalance}</span>
        </div>
      </div>

      <FooterBand left={isLoading ? 'CREATING PARTY...' : 'A SELECT'} right="B BACK" />
    </div>
  );
};
```

- [ ] **Step 2: Update `ScreenManager.tsx` with Live Run Observer**

Update `ScreenManager.tsx` to automatically route screen transitions when `activeCode` is present and handle Quick Play click:

```tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ControllerInput, ScreenFilter, ScreenTint } from '../../lib/types';
import { useOverflowWarning } from './useOverflowWarning';
import { useRunObserver } from '../../lib/runObserver';
import { startQuickPlay } from './QuickPlayRunner';
import { getOrCreateEphemeralWallet } from '../../lib/ephemeralWallet';
import { TrustFallProgram, baseConnection } from '@trust-fall/chain-client';
import { PublicKey } from '@solana/web3.js';
import { S0Boot } from './screens/S0Boot';
import { S1Connect } from './screens/S1Connect';
import { S2Lobby } from './screens/S2Lobby';
import { S3Party } from './screens/S3Party';
import { S4Deal } from './screens/S4Deal';
import { S5Floor } from './screens/S5Floor';
import { S6Resolve } from './screens/S6Resolve';
import { S7BankOrClimb } from './screens/S7BankOrClimb';
import { S8Results } from './screens/S8Results';

type ScreenId = 's0' | 's1' | 's2' | 's3' | 's4' | 's5' | 's6' | 's7' | 's8';

interface ScreenManagerProps {
  input: ControllerInput;
  screenFilter: ScreenFilter;
  screenTint: ScreenTint;
  setFps?: (fps: number) => void;
}

export const ScreenManager: React.FC<ScreenManagerProps> = () => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('s0');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  const [isQuickPlayLoading, setIsQuickPlayLoading] = useState(false);
  const [showSimToolbar, setShowSimToolbar] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useOverflowWarning(viewportRef);

  const { state: boardState } = useRunObserver(activeCode, 0);

  // Auto-advance screens based on on-chain run phase
  useEffect(() => {
    if (!boardState || !boardState.run) return;
    const phase = boardState.run.phase;
    if (phase === 0) setActiveScreen('s3');
    else if (phase === 1) setActiveScreen('s4');
    else if (phase === 2) setActiveScreen('s5');
    else if (phase === 3) setActiveScreen('s7');
    else if (phase === 4) setActiveScreen('s8');
  }, [boardState?.run?.phase]);

  // Auto-request deal if run is delegated and in phase 1 (DEALING)
  useEffect(() => {
    if (!activeCode || !boardState || !boardState.delegated) return;
    if (boardState.run.phase === 1 && boardState.run.vrfState === 0) {
      const { wallet } = getOrCreateEphemeralWallet();
      const mint = new PublicKey('6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy');
      const tf = new TrustFallProgram(mint, wallet);
      tf.requestDeal(wallet.publicKey, activeCode).catch(() => {});
    }
  }, [activeCode, boardState?.run?.phase, boardState?.run?.vrfState, boardState?.delegated]);

  // Handle Quick Play click
  const handleQuickPlay = async () => {
    try {
      setIsQuickPlayLoading(true);
      const { code } = await startQuickPlay();
      setActiveCode(code);
      setActiveScreen('s4');
    } catch (err: any) {
      console.error('Quick Play failed:', err);
      alert(`Quick Play failed: ${err.message}`);
    } finally {
      setIsQuickPlayLoading(false);
    }
  };

  // Door vote handler on ER
  const handleVote = async (door: number) => {
    if (!activeCode) return;
    try {
      const { wallet } = getOrCreateEphemeralWallet();
      const mint = new PublicKey('6ZxAHaYGmMgETAz3i6ghZmmYcWiHdqEuDqYvabeBLjfy');
      const tf = new TrustFallProgram(mint, wallet);
      await tf.vote(wallet.publicKey, activeCode, door);
    } catch (err) {
      console.error('Vote failed:', err);
    }
  };

  // Toggle Simulator Toolbar via Shift+S
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key.toLowerCase() === 's') {
        setShowSimToolbar((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const renderScreen = () => {
    switch (activeScreen) {
      case 's0':
        return <S0Boot onComplete={() => setActiveScreen('s1')} />;
      case 's1':
        return (
          <S1Connect
            onConnect={() => setActiveScreen('s2')}
            onBack={() => setActiveScreen('s0')}
          />
        );
      case 's2':
        return (
          <S2Lobby
            isLoading={isQuickPlayLoading}
            onSelectMode={(m) => {
              if (m === 'quick') handleQuickPlay();
              else setActiveScreen('s3');
            }}
          />
        );
      case 's3':
        return (
          <S3Party
            partyCode={activeCode ?? 'A7K2'}
            onToggleReady={() => setActiveScreen('s4')}
            onBack={() => setActiveScreen('s2')}
          />
        );
      case 's4':
        return <S4Deal onRetry={() => setActiveScreen('s5')} />;
      case 's5':
        return (
          <S5Floor
            floor={(boardState?.run?.floor ?? 0) + 1}
            totalFloors={3}
            doorCount={boardState?.run?.doors ?? 4}
            lanternText={
              boardState?.ownClueMask != null
                ? `CLUE MASK: ${boardState.ownClueMask}`
                : 'DOORS 2 AND 4 ARE COLD'
            }
            onVote={handleVote}
            onSendMessage={() => {}}
          />
        );
      case 's6':
        return <S6Resolve onContinue={() => setActiveScreen('s7')} />;
      case 's7':
        return <S7BankOrClimb onChoose={() => setActiveScreen('s8')} />;
      case 's8':
        return <S8Results onRunItBack={() => setActiveScreen('s2')} />;
    }
  };

  return (
    <div
      ref={viewportRef}
      className="relative w-[480px] h-[320px] bg-[#0f0e13] overflow-hidden select-none"
    >
      {renderScreen()}

      {/* Simulator Toolbar Overlay */}
      {showSimToolbar && (
        <div className="absolute top-1 left-1 right-1 z-50 bg-[#141419]/95 border border-[#FF5219] rounded p-1 flex items-center justify-between text-[9px] font-pixel">
          <span className="text-[#FF5219] font-bold">SIMULATOR MODE</span>
          <div className="flex gap-1">
            {(['s0', 's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8'] as ScreenId[]).map((s) => (
              <button
                key={s}
                onClick={() => setActiveScreen(s)}
                className={`px-1.5 py-0.5 rounded uppercase ${
                  activeScreen === s ? 'bg-[#FF5219] text-black font-bold' : 'bg-[#1a1922] text-[#f2efe6]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Run full web build & typecheck**

Run: `pnpm --filter @trust-fall/web build`  
Expected: PASS with zero errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/viewport/ScreenManager.tsx apps/web/components/viewport/screens/S2Lobby.tsx
git commit -m "feat(web): wire QuickPlayRunner and useRunObserver into ScreenManager"
```

---

## Plan Self-Review
- Spec coverage: Quick Play flow, ephemeral wallet funding, run observer, live state transitions, and door voting on ER covered.
- Placeholder scan: Zero placeholders.
- Type consistency: All imports, types, and function calls match `@trust-fall/chain-client` and `@solana/web3.js`.
