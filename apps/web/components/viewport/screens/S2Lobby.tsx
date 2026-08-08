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
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
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
