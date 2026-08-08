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
  onContinue: _onContinue,
}) => {
  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
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
