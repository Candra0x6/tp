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
    <div className="w-full h-full bg-[#0f0e13]/90 text-[#f2efe6] font-pixel flex flex-col justify-between p-2 select-none">
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
