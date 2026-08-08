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
  onBack: _onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
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
