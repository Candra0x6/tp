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
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between p-4 select-none">
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
