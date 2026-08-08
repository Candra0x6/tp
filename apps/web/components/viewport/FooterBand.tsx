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
