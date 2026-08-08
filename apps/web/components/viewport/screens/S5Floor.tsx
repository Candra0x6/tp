'use client';
import React, { useState } from 'react';
import { FooterBand } from '../FooterBand';

interface ChatMessage {
  sender: string;
  text: string;
}

interface S5FloorProps {
  floor?: number;
  totalFloors?: number;
  doorCount?: number;
  secondsLeft?: number;
  lanternText?: string;
  chatMessages?: ChatMessage[];
  onVote: (door: number) => void;
  onSendMessage: (text: string) => void;
}

export const S5Floor: React.FC<S5FloorProps> = ({
  floor = 1,
  totalFloors = 3,
  doorCount = 4,
  secondsLeft = 28,
  lanternText = 'DOORS 2 AND 4 ARE COLD',
  chatMessages = [
    { sender: 'P2', text: '4 IS COLD FOR ME' },
    { sender: 'CPU', text: 'DOOR 2 IS COLD' },
    { sender: 'P1', text: 'SO ITS 1 OR 3' },
  ],
  onVote,
  onSendMessage,
}) => {
  const [selectedDoor, setSelectedDoor] = useState(1);
  const [votedDoor, setVotedDoor] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');

  const doors = Array.from({ length: doorCount }, (_, i) => i + 1);
  const isWarning = secondsLeft <= 10;
  const hasVoted = votedDoor !== null;

  const handleVoteClick = (door: number) => {
    setSelectedDoor(door);
    setVotedDoor(door);
    onVote(door);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      onSendMessage(chatInput.trim().toUpperCase());
      setChatInput('');
    }
    setIsChatOpen(false);
  };

  return (
    <div className="w-full h-full bg-[#0f0e13] text-[#f2efe6] font-pixel flex flex-col justify-between select-none">
      <div className="p-2 flex flex-col flex-1 min-h-[150px] gap-1.5">
        {/* Header */}
        <div className="flex justify-between items-center text-[10px]">
          <span className="font-bold">FLOOR {floor} / {totalFloors}</span>
          <span className={`font-bold ${isWarning ? 'text-[#FFB020] animate-pulse' : 'text-[#00FF94]'}`}>
            0:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
          </span>
        </div>

        {/* Action / Vote Status Guidance Banner */}
        <div className={`px-2 py-1 rounded text-[9px] font-bold flex items-center justify-between border ${
          hasVoted
            ? 'bg-[#00FF94]/10 border-[#00FF94] text-[#00FF94]'
            : 'bg-[#FF5219]/10 border-[#FF5219] text-[#FF5219]'
        }`}>
          <span>
            {hasVoted
              ? `✓ VOTE CAST FOR DOOR ${votedDoor} · WAITING FOR TEAM...`
              : '▸ CHOOSE A DOOR BELOW & CLICK TO VOTE'}
          </span>
          {hasVoted && (
            <span className="animate-pulse text-[8px] bg-[#00FF94] text-[#0f0e13] px-1 rounded font-bold">
              VOTED
            </span>
          )}
        </div>

        {/* Doors Row */}
        <div className="grid grid-flow-col auto-cols-fr gap-1 bg-[#08070b] p-1.5 border border-[#6b6580] rounded">
          {doors.map((d) => {
            const isVoted = votedDoor === d;
            const isSelected = selectedDoor === d;

            return (
              <button
                key={d}
                onClick={() => handleVoteClick(d)}
                className={`py-2 rounded text-[11px] font-bold border transition-all flex flex-col items-center justify-center gap-0.5 ${
                  isVoted
                    ? 'bg-[#00FF94] text-[#0f0e13] border-[#00FF94] shadow-md scale-98'
                    : isSelected
                    ? 'bg-[#FF5219] text-[#0f0e13] border-[#FF5219]'
                    : 'bg-[#1a1922] border-[#6b6580] text-[#f2efe6] hover:bg-[#252330]'
                }`}
              >
                <span>DOOR {d}</span>
                {isVoted && <span className="text-[7px] bg-[#0f0e13] text-[#00FF94] px-1 rounded">VOTED</span>}
              </button>
            );
          })}
        </div>

        {/* Your Lantern Box */}
        <div className="bg-[#1a1922] border border-[#FF5219] rounded p-1.5 text-[9px]">
          <div className="text-[#FF5219] font-bold text-[8px] mb-0.5 flex justify-between">
            <span>YOUR LANTERN (PRIVATE CLUE)</span>
            <span className="text-[#8b8698]">ONLY YOU SEE THIS</span>
          </div>
          <div className="text-[#f2efe6] font-bold">{lanternText}</div>
        </div>

        {/* The Line Chat Container (Flexible Block) */}
        <div className="flex-1 min-h-0 bg-[#08070b] border border-[#6b6580] rounded p-1.5 flex flex-col justify-end overflow-y-auto text-[9px]">
          {chatMessages.map((m, i) => (
            <div key={i} className="leading-tight">
              <span className="text-[#8b8698] font-bold">{m.sender} &gt; </span>
              <span className="text-[#f2efe6]">{m.text}</span>
            </div>
          ))}
        </div>

        {/* Inline Chat Input Modal */}
        {isChatOpen && (
          <form onSubmit={handleChatSubmit} className="flex gap-1">
            <input
              type="text"
              autoFocus
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value.toUpperCase())}
              placeholder="TYPE MESSAGE..."
              className="flex-1 bg-[#1a1922] border border-[#FF5219] rounded px-2 py-0.5 text-[10px] text-[#f2efe6] focus:outline-none uppercase"
            />
          </form>
        )}
      </div>

      <FooterBand
        left={
          isChatOpen
            ? '⏎ SEND'
            : hasVoted
            ? `✓ VOTED DOOR ${votedDoor}  ·  SELECT TALK`
            : 'A VOTE  ·  SELECT TALK'
        }
        right={isChatOpen ? 'ESC CANCEL' : hasVoted ? 'WAITING FOR PARTY' : `DOOR ${selectedDoor}`}
      />
    </div>
  );
};
