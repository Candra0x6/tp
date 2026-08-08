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
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
      <div className="p-4 flex flex-col items-center justify-center flex-1 min-h-[150px] gap-3 text-center">
        <div className="text-[11px] font-bold text-[#FF5219] tracking-wide">
          THE TOWER IS DEALING
        </div>

        {/* Stepped loading animation block (Flexible) */}
        <div className="flex-1 min-h-[60px] flex flex-col items-center justify-center gap-2">
          <div className="text-xl tracking-widest text-[#00FF94] animate-pulse">
            ░░▓▓██▓▓░░
          </div>
          <div className="text-[9px] text-[#00FF94] font-bold bg-[#00FF94]/10 border border-[#00FF94] px-2 py-0.5 rounded">
            ⏳ WAITING FOR VRF ORACLE...
          </div>
        </div>

        <div className="text-[9px] text-[#8b8698] space-y-0.5">
          <div>RANDOMNESS REQUESTED ON-CHAIN</div>
          <div>ESTIMATED TIME: 2-5 SECONDS ({seconds}s)</div>
        </div>

        {seconds >= 10 && onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-[#FF5219] text-[#0f0e13] text-[9px] font-bold rounded hover:brightness-110"
          >
            RETRY DEAL REQUEST
          </button>
        )}
      </div>

      <FooterBand left="VRF IN FLIGHT" right={`0:${seconds < 10 ? `0${seconds}` : seconds}`} />
    </div>
  );
};
