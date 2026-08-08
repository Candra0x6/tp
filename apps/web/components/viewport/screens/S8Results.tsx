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
  onRunItBack: _onRunItBack,
}) => {
  const isLoss = outcome === 'FELL';

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
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
