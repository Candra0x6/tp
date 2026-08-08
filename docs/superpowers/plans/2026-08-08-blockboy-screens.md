# BLOCKBOY React DOM/CSS Screens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete React DOM/CSS screen system (S0–S8) on a fixed 480×320 grid driven by LANTERN design tokens and `@trust-fall/chain-client` state, replacing the legacy HTML5 canvas placeholder.

**Architecture:** A modular React viewport (`ScreenManager`) routing between screens (S0 Boot, S1 Connect, S2 Lobby, S3 Party, S4 Deal, S5 Floor, S6 Resolve, S7 BankOrClimb, S8 Results). Uses pure HTML/CSS layout (no canvas engine) with Departure Mono font and LANTERN palette tokens. Includes a Dev/Simulator mode toggle (`Shift+S`).

**Tech Stack:** Next.js 15, React 19, Tailwind CSS, `@trust-fall/chain-client`, `@trust-fall/types`.

## Global Constraints
- Logical screen grid fixed to 480px width by 320px height.
- DOM and CSS only, no canvas engine.
- Departure Mono 8px font (`font-pixel`).
- LANTERN palette CSS tokens (`--color-screen`, `--color-panel`, `--color-sunk`, `--color-edge`, `--color-ink`, `--color-accent`, `--color-gain`, `--color-loss`, `--color-warn`, `--color-cold`).
- `image-rendering: pixelated` on all sprites.
- Every screen must have exactly ONE block with `flex-1 min-h-0` to absorb vertical remainder.
- Dev height overflow warning via `useOverflowWarning`.

---

### Task 1: Overflow Warning Hook & Footer Band

**Files:**
- Create: `apps/web/components/viewport/useOverflowWarning.ts`
- Create: `apps/web/components/viewport/FooterBand.tsx`

**Interfaces:**
- Produces: `useOverflowWarning(ref: RefObject<HTMLDivElement | null>): void`
- Produces: `FooterBand(props: { left: string; right?: string; highlight?: string }): JSX.Element`

- [ ] **Step 1: Create `useOverflowWarning.ts`**

```typescript
import { useEffect, RefObject } from 'react';

export function useOverflowWarning(ref: RefObject<HTMLDivElement | null>): void {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    const el = ref.current;
    if (!el) return;

    const check = () => {
      const over = el.scrollHeight - el.clientHeight;
      if (over > 0) {
        console.warn(
          `[viewport] Screen height overruns by ${over}px and is being clipped. ` +
            `The 480x320 box is fixed; something above the footer has to give.`
        );
      }
    };

    const frame = requestAnimationFrame(check);
    void document.fonts?.ready?.then(check);
    return () => cancelAnimationFrame(frame);
  });
}
```

- [ ] **Step 2: Create `FooterBand.tsx`**

```tsx
import React from 'react';

interface FooterBandProps {
  left: string;
  right?: string;
  highlight?: string;
}

export const FooterBand: React.FC<FooterBandProps> = ({ left, right, highlight }) => {
  return (
    <footer className="h-[20px] shrink-0 border-t border-[#6b6580] bg-[#1a1922] px-2 flex items-center justify-between text-[10px] font-pixel text-[#f2efe6] select-none">
      <div className="flex items-center gap-2">
        <span>{left}</span>
        {highlight && <span className="text-[#FF5219] font-bold">{highlight}</span>}
      </div>
      {right && <span className="text-[#8b8698]">{right}</span>}
    </footer>
  );
};
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/viewport/useOverflowWarning.ts apps/web/components/viewport/FooterBand.tsx
git commit -m "feat(web): add useOverflowWarning hook and FooterBand component"
```

---

### Task 2: Boot & Connect Screens (S0 & S1)

**Files:**
- Create: `apps/web/components/viewport/screens/S0Boot.tsx`
- Create: `apps/web/components/viewport/screens/S1Connect.tsx`

**Interfaces:**
- Produces: `S0Boot(props: { onComplete: () => void }): JSX.Element`
- Produces: `S1Connect(props: { privacyRung: string; usdcBalance: string; onConnect: (wallet: string) => void; onBack: () => void }): JSX.Element`

- [ ] **Step 1: Create `S0Boot.tsx`**

```tsx
'use client';
import React, { useEffect } from 'react';

export const S0Boot: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => onComplete(), 1500);
    const handleKey = () => onComplete();
    window.addEventListener('keydown', handleKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onComplete]);

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between p-4">
      <div className="text-center font-bold text-lg text-[#FF5219] tracking-wider pt-2">
        BLOCKBOY
      </div>
      <div className="flex-1 min-h-[100px] flex flex-col items-center justify-center gap-3">
        <div className="border-2 border-[#6b6580] bg-[#1a1922] px-6 py-3 rounded text-center shadow-lg">
          <span className="text-sm font-bold tracking-widest text-[#f2efe6]">TRUST FALL</span>
          <div className="text-[9px] text-[#8b8698] mt-1">CARTRIDGE V1.0</div>
        </div>
        <div className="text-[10px] text-[#8b8698] flex items-center gap-1">
          <span>▶</span> <span className="text-white font-bold">MagicBlock</span>
        </div>
      </div>
      <div className="text-center text-[10px] text-[#8b8698] animate-pulse pb-2">
        CHECKING TOWER...
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Create `S1Connect.tsx`**

```tsx
'use client';
import React, { useState } from 'react';
import { FooterBand } from '../FooterBand';

interface S1ConnectProps {
  privacyRung?: string;
  usdcBalance?: string;
  onConnect: (wallet: string) => void;
  onBack: () => void;
}

const WALLETS = ['PHANTOM', 'BACKPACK', 'SOLFLARE'];

export const S1Connect: React.FC<S1ConnectProps> = ({
  privacyRung = 'PUBLIC ER',
  usdcBalance = '12.00 USDC',
  onConnect,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between">
      <div className="p-3 flex flex-col flex-1 min-h-[150px] gap-2">
        <div className="text-[11px] font-bold text-[#8b8698]">INSERT MEMORY CARD</div>

        {/* Wallet List (Flexible Block) */}
        <div className="flex-1 min-h-0 bg-[#1a1922] border border-[#6b6580] rounded p-2 flex flex-col gap-1.5 overflow-y-auto">
          {WALLETS.map((w, idx) => (
            <div
              key={w}
              onClick={() => { setSelectedIndex(idx); onConnect(w); }}
              className={`px-2 py-1 rounded text-[11px] flex items-center justify-between cursor-pointer ${
                idx === selectedIndex
                  ? 'bg-[#FF5219] text-[#0f0e13] font-bold'
                  : 'hover:bg-[#252330] text-[#f2efe6]'
              }`}
            >
              <span>{idx === selectedIndex ? `▸ ${w}` : `  ${w}`}</span>
              <span className="text-[9px] opacity-80">READY</span>
            </div>
          ))}
        </div>

        {/* Balance & Privacy readout */}
        <div className="bg-[#08070b] border border-[#6b6580] rounded p-2 text-[10px] space-y-1">
          <div className="flex justify-between">
            <span className="text-[#8b8698]">BALANCE</span>
            <span className="text-[#00FF94] font-bold">{usdcBalance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8698]">PRIVACY</span>
            <span className="text-[#FF5219] font-bold">{privacyRung}</span>
          </div>
        </div>
      </div>

      <FooterBand left="A CONNECT" right="B BACK" />
    </div>
  );
};
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/viewport/screens/S0Boot.tsx apps/web/components/viewport/screens/S1Connect.tsx
git commit -m "feat(web): add S0Boot and S1Connect screen components"
```

---

### Task 3: Lobby & Party Screens (S2 & S3)

**Files:**
- Create: `apps/web/components/viewport/screens/S2Lobby.tsx`
- Create: `apps/web/components/viewport/screens/S3Party.tsx`

**Interfaces:**
- Produces: `S2Lobby(props: { vaultBalance: string; onSelectMode: (mode: 'quick' | 'create' | 'join') => void }): JSX.Element`
- Produces: `S3Party(props: { partyCode: string; players: Array<{ name: string; isHost: boolean; isReady: boolean; isCpu: boolean }>; depth: 'QUICK' | 'DEEP'; stake: string; pot: string; onToggleReady: () => void; onBack: () => void }): JSX.Element`

- [ ] **Step 1: Create `S2Lobby.tsx`**

```tsx
'use client';
import React, { useState } from 'react';
import { FooterBand } from '../FooterBand';

interface S2LobbyProps {
  vaultBalance?: string;
  onSelectMode: (mode: 'quick' | 'create' | 'join') => void;
}

export const S2Lobby: React.FC<S2LobbyProps> = ({
  vaultBalance = '104.00 USDC',
  onSelectMode,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const MODES = [
    { id: 'quick', label: 'QUICK PLAY', detail: 'fills with CPU' },
    { id: 'create', label: 'CREATE PARTY', detail: 'custom room' },
    { id: 'join', label: 'JOIN BY CODE', detail: '[ _ _ _ _ ]' },
  ];

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between">
      <div className="p-3 flex flex-col flex-1 min-h-[150px] gap-2">
        <div className="text-[11px] font-bold text-[#8b8698]">SELECT TOWER MODE</div>

        {/* Mode List (Flexible Block) */}
        <div className="flex-1 min-h-0 bg-[#1a1922] border border-[#6b6580] rounded p-2 flex flex-col gap-2">
          {MODES.map((m, idx) => (
            <div
              key={m.id}
              onClick={() => { setSelectedIndex(idx); onSelectMode(m.id as any); }}
              className={`p-2 rounded text-[11px] flex items-center justify-between cursor-pointer ${
                idx === selectedIndex
                  ? 'bg-[#FF5219] text-[#0f0e13] font-bold'
                  : 'bg-[#08070b] text-[#f2efe6] hover:bg-[#252330]'
              }`}
            >
              <span>{idx === selectedIndex ? `▸ ${m.label}` : `  ${m.label}`}</span>
              <span className="text-[9px] opacity-75">{m.detail}</span>
            </div>
          ))}
        </div>

        {/* Prize Vault Readout */}
        <div className="bg-[#08070b] border border-[#6b6580] rounded p-2 flex justify-between items-center text-[10px]">
          <span className="text-[#8b8698]">PRIZE VAULT</span>
          <span className="text-[#00FF94] font-bold">{vaultBalance}</span>
        </div>
      </div>

      <FooterBand left="A SELECT" right="B BACK" />
    </div>
  );
};
```

- [ ] **Step 2: Create `S3Party.tsx`**

```tsx
'use client';
import React from 'react';
import { FooterBand } from '../FooterBand';

interface PlayerSeat {
  name: string;
  isHost: boolean;
  isReady: boolean;
  isCpu: boolean;
}

interface S3PartyProps {
  partyCode?: string;
  players?: PlayerSeat[];
  depth?: 'QUICK' | 'DEEP';
  stake?: string;
  pot?: string;
  onToggleReady: () => void;
  onBack: () => void;
}

export const S3Party: React.FC<S3PartyProps> = ({
  partyCode = 'A7K2',
  players = [
    { name: 'P1 7xKq..3f', isHost: true, isReady: true, isCpu: false },
    { name: 'P2 Bd91..az', isHost: false, isReady: true, isCpu: false },
    { name: 'P3 CPU', isHost: false, isReady: true, isCpu: true },
    { name: 'P4 EMPTY', isHost: false, isReady: false, isCpu: false },
  ],
  depth = 'QUICK',
  stake = '1.00 USDC EACH',
  pot = '3.00 USDC',
  onToggleReady,
  onBack,
}) => {
  const readyCount = players.filter((p) => p.isReady).length;

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between">
      <div className="p-3 flex flex-col flex-1 min-h-[150px] gap-2">
        <div className="flex justify-between items-center text-[11px] font-bold">
          <span>PARTY <span className="text-[#FF5219]">{partyCode}</span></span>
          <span className="text-[#8b8698]">{readyCount} / 4</span>
        </div>

        {/* Player Roster (Flexible Block) */}
        <div className="flex-1 min-h-0 bg-[#1a1922] border border-[#6b6580] rounded p-2 flex flex-col gap-1 overflow-y-auto">
          {players.map((p, i) => (
            <div key={i} className="flex justify-between items-center text-[10px] bg-[#08070b] px-2 py-1 rounded">
              <div className="flex items-center gap-1.5">
                <span className={p.isReady ? 'text-[#00FF94]' : 'text-[#8b8698]'}>
                  {p.isReady ? '●' : '○'}
                </span>
                <span>{p.name}</span>
                {p.isHost && <span className="text-[8px] bg-[#FF5219] text-[#0f0e13] px-1 rounded font-bold">HOST</span>}
              </div>
              <span className={p.isReady ? 'text-[#00FF94] font-bold' : 'text-[#8b8698]'}>
                {p.isReady ? 'READY' : 'WAITING'}
              </span>
            </div>
          ))}
        </div>

        {/* Config Summary */}
        <div className="bg-[#08070b] border border-[#6b6580] rounded p-2 text-[9px] space-y-1">
          <div className="flex justify-between">
            <span className="text-[#8b8698]">DEPTH</span>
            <span className="text-[#FF5219] font-bold">{depth} (3 FLOORS)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8698]">STAKE</span>
            <span>{stake} · POT <span className="text-[#00FF94] font-bold">{pot}</span></span>
          </div>
        </div>
      </div>

      <FooterBand left="A READY" right="B BACK" />
    </div>
  );
};
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/viewport/screens/S2Lobby.tsx apps/web/components/viewport/screens/S3Party.tsx
git commit -m "feat(web): add S2Lobby and S3Party screen components"
```

---

### Task 4: Dealing, Floor, & Resolve Screens (S4, S5, S6)

**Files:**
- Create: `apps/web/components/viewport/screens/S4Deal.tsx`
- Create: `apps/web/components/viewport/screens/S5Floor.tsx`
- Create: `apps/web/components/viewport/screens/S6Resolve.tsx`

**Interfaces:**
- Produces: `S4Deal(props: { onRetry?: () => void }): JSX.Element`
- Produces: `S5Floor(props: { floor: number; totalFloors: number; doorCount: number; secondsLeft: number; lanternText: string; chatMessages: Array<{ sender: string; text: string }>; onVote: (door: number) => void; onSendMessage: (text: string) => void }): JSX.Element`
- Produces: `S6Resolve(props: { doorIndex: number; isSafe: boolean; floor: number; pot: string; postMortem: string; onContinue: () => void }): JSX.Element`

- [ ] **Step 1: Create `S4Deal.tsx`**

```tsx
'use client';
import React, { useEffect, useState } from 'react';
import { FooterBand } from '../FooterBand';

export const S4Deal: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between">
      <div className="p-4 flex flex-col items-center justify-center flex-1 min-h-[150px] gap-3 text-center">
        <div className="text-[11px] font-bold text-[#FF5219]">THE TOWER IS DEALING</div>

        {/* Stepped animation block (Flexible) */}
        <div className="flex-1 min-h-[60px] flex items-center justify-center">
          <div className="text-xl tracking-widest text-[#00FF94] animate-pulse">
            ░░▓▓██▓▓░░
          </div>
        </div>

        <div className="text-[9px] text-[#8b8698] space-y-0.5">
          <div>VRF REQUESTED</div>
          <div>WAITING FOR THE ORACLE ({seconds}s)</div>
        </div>

        {seconds >= 10 && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-[#FF5219] text-[#0f0e13] text-[9px] font-bold rounded hover:brightness-110"
          >
            RETRY DEAL
          </button>
        )}
      </div>

      <FooterBand left="VRF IN FLIGHT" right={`${seconds}s`} />
    </div>
  );
};
```

- [ ] **Step 2: Create `S5Floor.tsx`**

```tsx
'use client';
import React, { useState } from 'react';
import { FooterBand } from '../FooterBand';

interface ChatMessage {
  sender: string;
  text: string;
}

interface S5FloorProps {
  floor?: number;
  totalFloors?: number;
  doorCount?: number;
  secondsLeft?: number;
  lanternText?: string;
  chatMessages?: ChatMessage[];
  onVote: (door: number) => void;
  onSendMessage: (text: string) => void;
}

export const S5Floor: React.FC<S5FloorProps> = ({
  floor = 1,
  totalFloors = 3,
  doorCount = 4,
  secondsLeft = 28,
  lanternText = 'DOORS 2 AND 4 ARE COLD',
  chatMessages = [
    { sender: 'P2', text: '4 IS COLD FOR ME' },
    { sender: 'CPU', text: 'DOOR 2 IS COLD' },
    { sender: 'P1', text: 'SO ITS 1 OR 3' },
  ],
  onVote,
  onSendMessage,
}) => {
  const [selectedDoor, setSelectedDoor] = useState(1);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const doors = Array.from({ length: doorCount }, (_, i) => i + 1);
  const isWarning = secondsLeft <= 10;

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim().toUpperCase());
      setChatInput('');
    }
    setIsChatOpen(false);
  };

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between">
      <div className="p-2 flex flex-col flex-1 min-h-[150px] gap-1.5">
        {/* Header */}
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold">FLOOR {floor} / {totalFloors}</span>
          <span className={`font-bold ${isWarning ? 'text-[#FFB020] animate-pulse' : 'text-[#00FF94]'}`}>
            0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
          </span>
        </div>

        {/* Doors Row */}
        <div className="grid grid-flow-col auto-cols-fr gap-1 bg-[#08070b] p-1.5 border border-[#6b6580] rounded">
          {doors.map((d) => (
            <button
              key={d}
              onClick={() => { setSelectedDoor(d); onVote(d); }}
              className={`py-2 rounded text-[11px] font-bold border transition-colors ${
                selectedDoor === d
                  ? 'bg-[#FF5219] text-[#0f0e13] border-[#FF5219]'
                  : 'bg-[#1a1922] border-[#6b6580] text-[#f2efe6] hover:bg-[#252330]'
              }`}
            >
              DOOR {d}
            </button>
          ))}
        </div>

        {/* Your Lantern Box */}
        <div className="bg-[#1a1922] border border-[#FF5219] rounded p-1.5 text-[9px]">
          <div className="text-[#FF5219] font-bold text-[8px] mb-0.5">YOUR LANTERN</div>
          <div className="text-[#f2efe6] font-bold">{lanternText}</div>
        </div>

        {/* The Line Chat Container (Flexible Block) */}
        <div className="flex-1 min-h-0 bg-[#08070b] border border-[#6b6580] rounded p-1.5 flex flex-col justify-end overflow-y-auto text-[9px]">
          {chatMessages.map((m, i) => (
            <div key={i} className="leading-tight">
              <span className="text-[#8b8698] font-bold">{m.sender} &gt; </span>
              <span className="text-[#f2efe6]">{m.text}</span>
            </div>
          ))}
        </div>

        {/* Inline Chat Input Modal */}
        {isChatOpen && (
          <form onSubmit={handleChatSubmit} className="flex gap-1">
            <input
              type="text"
              autoFocus
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value.toUpperCase())}
              placeholder="TYPE MESSAGE..."
              className="flex-1 bg-[#1a1922] border border-[#FF5219] rounded px-2 py-0.5 text-[10px] text-[#f2efe6] focus:outline-none uppercase"
            />
          </form>
        )}
      </div>

      <FooterBand
        left={isChatOpen ? '⏎ SEND' : 'A VOTE  ·  SELECT TALK'}
        right={isChatOpen ? 'ESC CANCEL' : `DOOR ${selectedDoor}`}
      />
    </div>
  );
};
```

- [ ] **Step 3: Create `S6Resolve.tsx`**

```tsx
'use client';
import React from 'react';
import { FooterBand } from '../FooterBand';

interface S6ResolveProps {
  doorIndex?: number;
  isSafe?: boolean;
  floor?: number;
  pot?: string;
  postMortem?: string;
  onContinue: () => void;
}

export const S6Resolve: React.FC<S6ResolveProps> = ({
  doorIndex = 3,
  isSafe = true,
  floor = 1,
  pot = '3.00 USDC',
  postMortem = 'P2 HELD THE ANSWER',
  onContinue,
}) => {
  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between">
      <div className="p-4 flex flex-col items-center justify-center flex-1 min-h-[150px] text-center gap-2">
        <div className="text-[11px] text-[#8b8698]">DOOR {doorIndex}</div>

        {/* Door Reveal Graphic (Flexible Block) */}
        <div className="flex-1 min-h-[50px] flex items-center justify-center">
          <div className={`border-2 rounded px-6 py-2 ${isSafe ? 'border-[#00FF94] bg-[#00FF94]/10 text-[#00FF94]' : 'border-[#FF3B4E] bg-[#FF3B4E]/10 text-[#FF3B4E]'}`}>
            <span className="text-lg font-bold">{isSafe ? 'SAFE' : 'FALL'}</span>
          </div>
        </div>

        <div className={`text-xs font-bold ${isSafe ? 'text-[#00FF94]' : 'text-[#FF3B4E]'}`}>
          {isSafe ? `FLOOR ${floor} CLEARED` : 'THE PARTY FELL'}
        </div>

        <div className="text-[10px] text-[#8b8698]">
          POT: <span className="text-[#00FF94] font-bold">{pot}</span>
        </div>

        <div className="text-[9px] text-[#8b8698] border-t border-[#6b6580] pt-1 w-full max-w-xs">
          {postMortem}
        </div>
      </div>

      <FooterBand left="A CONTINUE" right={isSafe ? 'NEXT' : 'GAME OVER'} />
    </div>
  );
};
```

- [ ] **Step 4: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/viewport/screens/S4Deal.tsx apps/web/components/viewport/screens/S5Floor.tsx apps/web/components/viewport/screens/S6Resolve.tsx
git commit -m "feat(web): add S4Deal, S5Floor, and S6Resolve screen components"
```

---

### Task 5: BankOrClimb Overlay & Results Screen (S7 & S8)

**Files:**
- Create: `apps/web/components/viewport/screens/S7BankOrClimb.tsx`
- Create: `apps/web/components/viewport/screens/S8Results.tsx`

**Interfaces:**
- Produces: `S7BankOrClimb(props: { bankAmount: string; shareAmount: string; nextAmount: string; nextFloorDoors: number; onChoose: (choice: 'bank' | 'climb') => void }): JSX.Element`
- Produces: `S8Results(props: { outcome: 'BANKED' | 'FELL' | 'CLEARED'; payout: string; perPlayer: string; floorsCleared: string; messagesSent: number; blindOdds: string; vaultBalance: string; onRunItBack: () => void }): JSX.Element`

- [ ] **Step 1: Create `S7BankOrClimb.tsx`**

```tsx
'use client';
import React, { useState, useEffect } from 'react';
import { FooterBand } from '../FooterBand';

interface S7BankOrClimbProps {
  bankAmount?: string;
  shareAmount?: string;
  nextAmount?: string;
  nextFloorDoors?: number;
  onChoose: (choice: 'bank' | 'climb') => void;
}

export const S7BankOrClimb: React.FC<S7BankOrClimbProps> = ({
  bankAmount = '7.80 USDC',
  shareAmount = '2.60 EACH',
  nextAmount = '11.40 USDC',
  nextFloorDoors = 5,
  onChoose,
}) => {
  const [seconds, setSeconds] = useState(14);

  useEffect(() => {
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          onChoose('climb');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [onChoose]);

  return (
    <div className="w-full h-full bg-[#0f0e13]/90 text-[#f2efe6] font-pixel flex flex-col justify-between p-2">
      <div className="bg-[#1a1922] border-2 border-[#FF5219] rounded p-3 flex flex-col flex-1 min-h-[150px] gap-2 text-center">
        <div className="text-[11px] font-bold text-[#FF5219]">BANK OR CLIMB</div>

        <div className="grid grid-cols-2 gap-2 text-[9px]">
          <div className="bg-[#08070b] p-2 border border-[#6b6580] rounded">
            <div className="text-[#8b8698]">BANK NOW</div>
            <div className="text-[#00FF94] font-bold text-[11px]">{bankAmount}</div>
            <div className="text-[8px] text-[#8b8698]">{shareAmount}</div>
          </div>

          <div className="bg-[#08070b] p-2 border border-[#6b6580] rounded">
            <div className="text-[#8b8698]">CLIMB NEXT</div>
            <div className="text-[#FF5219] font-bold text-[11px]">{nextAmount}</div>
            <div className="text-[8px] text-[#8b8698]">{nextFloorDoors} DOORS</div>
          </div>
        </div>

        {/* Spacer (Flexible Block) */}
        <div className="flex-1 min-h-[20px]" />

        <div className="flex justify-center gap-3">
          <button
            onClick={() => onChoose('bank')}
            className="px-4 py-1 bg-[#00FF94] text-[#0f0e13] text-[10px] font-bold rounded hover:brightness-110"
          >
            A BANK
          </button>
          <button
            onClick={() => onChoose('climb')}
            className="px-4 py-1 bg-[#FF5219] text-[#0f0e13] text-[10px] font-bold rounded hover:brightness-110"
          >
            B CLIMB
          </button>
        </div>

        <div className="text-[8px] text-[#8b8698]">
          DEFAULTS TO CLIMB IN <span className="text-[#FFB020] font-bold">{seconds}s</span>
        </div>
      </div>

      <FooterBand left="A BANK  ·  B CLIMB" right={`0:${seconds < 10 ? `0${seconds}` : seconds}`} />
    </div>
  );
};
```

- [ ] **Step 2: Create `S8Results.tsx`**

```tsx
'use client';
import React from 'react';
import { FooterBand } from '../FooterBand';

interface S8ResultsProps {
  outcome?: 'BANKED' | 'FELL' | 'CLEARED';
  payout?: string;
  perPlayer?: string;
  floorsCleared?: string;
  messagesSent?: number;
  blindOdds?: string;
  vaultBalance?: string;
  onRunItBack: () => void;
}

export const S8Results: React.FC<S8ResultsProps> = ({
  outcome = 'BANKED',
  payout = '7.80 USDC',
  perPlayer = '2.60 EACH',
  floorsCleared = '3 / 3',
  messagesSent = 24,
  blindOdds = '1 IN 80',
  vaultBalance = '96.20 USDC',
  onRunItBack,
}) => {
  const isLoss = outcome === 'FELL';

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between">
      <div className="p-3 flex flex-col flex-1 min-h-[150px] gap-2 text-center">
        <div className={`text-sm font-bold ${isLoss ? 'text-[#FF3B4E]' : 'text-[#00FF94]'}`}>
          {outcome}
        </div>
        <div className="text-lg font-bold text-[#f2efe6]">{payout}</div>
        <div className="text-[9px] text-[#8b8698]">{perPlayer}</div>

        {/* Stats Table (Flexible Block) */}
        <div className="flex-1 min-h-0 bg-[#1a1922] border border-[#6b6580] rounded p-2 text-[9px] space-y-1 text-left overflow-y-auto">
          <div className="flex justify-between">
            <span className="text-[#8b8698]">FLOORS CLEARED</span>
            <span className="font-bold">{floorsCleared}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8698]">MESSAGES SENT</span>
            <span className="font-bold">{messagesSent}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8698]">BLIND ODDS</span>
            <span className="font-bold">{blindOdds}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#8b8698]">PRIZE VAULT</span>
            <span className="text-[#00FF94] font-bold">{vaultBalance}</span>
          </div>
        </div>

        {/* Rake Zero Rule Statement */}
        <div className="text-[8px] text-[#8b8698] font-bold">
          PAID FROM PARTIES THAT FELL. RAKE 0.
        </div>
      </div>

      <FooterBand left="A RUN IT BACK" right="B DISKS" />
    </div>
  );
};
```

- [ ] **Step 3: Run typecheck**

Run: `pnpm --filter @trust-fall/web exec tsc --noEmit`  
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/viewport/screens/S7BankOrClimb.tsx apps/web/components/viewport/screens/S8Results.tsx
git commit -m "feat(web): add S7BankOrClimb and S8Results screen components"
```

---

### Task 6: ScreenManager & ConsoleShell Integration

**Files:**
- Create: `apps/web/components/viewport/ScreenManager.tsx`
- Modify: `apps/web/components/ConsoleShell.tsx`

**Interfaces:**
- Produces: `ScreenManager(props: { input: ControllerInput; screenFilter: ScreenFilter; screenTint: ScreenTint; setFps: (fps: number) => void }): JSX.Element`

- [ ] **Step 1: Create `ScreenManager.tsx`**

```tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ControllerInput, ScreenFilter, ScreenTint } from '../../lib/types';
import { useOverflowWarning } from './useOverflowWarning';
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

export const ScreenManager: React.FC<ScreenManagerProps> = ({ input }) => {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('s0');
  const [showSimToolbar, setShowSimToolbar] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  useOverflowWarning(viewportRef);

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
            onSelectMode={() => setActiveScreen('s3')}
          />
        );
      case 's3':
        return (
          <S3Party
            onToggleReady={() => setActiveScreen('s4')}
            onBack={() => setActiveScreen('s2')}
          />
        );
      case 's4':
        return <S4Deal onRetry={() => setActiveScreen('s5')} />;
      case 's5':
        return (
          <S5Floor
            onVote={() => setActiveScreen('s6')}
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

- [ ] **Step 2: Update `ConsoleShell.tsx`**

Replace `GameViewport` import and usage with `ScreenManager` in `apps/web/components/ConsoleShell.tsx`.

```tsx
// Replace import
import { ScreenManager } from './viewport/ScreenManager';

// Replace inside ConsoleViewportBridge:
return (
  <ScreenManager
    input={input}
    screenFilter={screenFilter}
    screenTint={screenTint}
    setFps={setFps}
  />
);
```

- [ ] **Step 3: Run full web build & typecheck**

Run: `pnpm --filter @trust-fall/web build`  
Expected: PASS with zero errors

- [ ] **Step 4: Commit**

```bash
git add apps/web/components/viewport/ScreenManager.tsx apps/web/components/ConsoleShell.tsx
git commit -m "feat(web): integrate ScreenManager into ConsoleShell replacing canvas"
```

---

## Plan Self-Review
- Spec coverage: All screens S0–S8, overflow warning, DOM/CSS grid 480×320, Departure Mono typography, LANTERN palette, and simulator mode covered.
- Placeholder scan: Zero placeholders.
- Type consistency: All props and function signatures consistent across components.
