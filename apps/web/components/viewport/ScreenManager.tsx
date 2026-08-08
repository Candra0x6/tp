'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ControllerInput, ScreenFilter, ScreenTint } from '../../lib/types';
import { useOverflowWarning } from './useOverflowWarning';
import { useRunObserver } from '../../lib/runObserver';
import { startQuickPlay } from './QuickPlayRunner';
import { getOrCreateEphemeralWallet } from '../../lib/ephemeralWallet';
import { TrustFallProgram } from '@trust-fall/chain-client';
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
