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
  onToggleReady: _onToggleReady,
  onBack: _onBack,
}) => {
  const readyCount = players.filter((p) => p.isReady).length;

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
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
