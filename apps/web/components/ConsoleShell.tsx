'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { ConsoleTheme, ScreenFilter, ScreenTint, ControllerInput, GameId, GameMetadata } from '../lib/types';
import { ScreenManager } from './viewport/ScreenManager';
import { sound } from '../lib/sound';
import { Console } from '../../../packages/ui/src/console/Console';
import { useConsolePressed, useConsoleIntent } from '../../../packages/ui/src/console/useConsoleInput';
import { ConsoleIntent } from '../../../packages/ui/src/console/intents';
import '../../../packages/ui/src/styles/tokens.css';
import {
  Volume2,
  VolumeX,
  Tv,
  Palette,
  Gamepad2,
  Settings,
  Sparkles,
  Maximize2,
  Minimize2,
  Music
} from 'lucide-react';

export const GAME_CATALOG: GameMetadata[] = [
  {
    id: 'trustfall',
    name: 'TRUST FALL',
    genre: 'Co-Op Tower Climber',
    description: '4 adventurers, 3 doors, 1 safe door! Share private clues, vote & climb for USDC!',
    controlsInfo: 'D-Pad Left/Right: Door Vote | Up/Down: Clue Inspection | A: CLIMB | B: BANK | Select: Tab',
  },
];

interface ConsoleViewportBridgeProps {
  currentGameId: GameId;
  screenFilter: ScreenFilter;
  screenTint: ScreenTint;
  setFps: (fps: number) => void;
}

function ConsoleViewportBridge({
  currentGameId,
  screenFilter,
  screenTint,
  setFps,
}: ConsoleViewportBridgeProps) {
  const pressed = useConsolePressed();

  // Convert Set<ConsoleIntent> into ControllerInput expected by GameViewport
  const input: ControllerInput = useMemo(
    () => ({
      up: pressed.has('UP'),
      down: pressed.has('DOWN'),
      left: pressed.has('LEFT'),
      right: pressed.has('RIGHT'),
      buttonA: pressed.has('A'),
      buttonB: pressed.has('B'),
      select: pressed.has('SELECT'),
      start: pressed.has('START'),
    }),
    [pressed]
  );

  // Trigger retro SFX audio feedback on input intents
  useConsoleIntent(
    useCallback((intent: ConsoleIntent) => {
      if (
        intent === 'UP' ||
        intent === 'DOWN' ||
        intent === 'LEFT' ||
        intent === 'RIGHT'
      ) {
        sound.playDpad();
      } else if (intent === 'A') {
        sound.playButtonA();
      } else if (intent === 'B') {
        sound.playButtonB();
      } else if (intent === 'SELECT') {
        sound.playSelect();
      } else if (intent === 'START') {
        sound.playStart();
      }
    }, [])
  );

  return (
    <ScreenManager
      input={input}
      screenFilter={screenFilter}
      screenTint={screenTint}
      setFps={setFps}
    />
  );
}

export const ConsoleShell: React.FC = () => {
  // Console Customization State
  const [theme, setTheme] = useState<ConsoleTheme>('classic-gray');
  const [screenFilter, setScreenFilter] = useState<ScreenFilter>('none');
  const [screenTint, setScreenTint] = useState<ScreenTint>('full-color');
  const [currentGameId] = useState<GameId>('trustfall');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Audio & Hardware State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isBgmOn, setIsBgmOn] = useState<boolean>(false);
  const [, setFps] = useState<number>(60);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Dynamic Theme Custom Properties
  const themeStyles = useMemo<React.CSSProperties>(() => {
    switch (theme) {
      case 'atomic-purple':
        return {
          '--shell': '#5b21b6',
          '--shell-d': '#3b0764',
          '--shell-dd': '#2e1065',
          '--shell-l': '#a855f7',
          '--btn': '#e9d5ff',
          '--btn-d': '#c084fc',
        } as React.CSSProperties;
      case 'cyber-red':
        return {
          '--shell': '#991b1b',
          '--shell-d': '#450a0a',
          '--shell-dd': '#290606',
          '--shell-l': '#f87171',
          '--btn': '#fecaca',
          '--btn-d': '#f87171',
        } as React.CSSProperties;
      case 'retro-yellow':
        return {
          '--shell': '#d97706',
          '--shell-d': '#78350f',
          '--shell-dd': '#451a03',
          '--shell-l': '#fde047',
          '--btn': '#fef08a',
          '--btn-d': '#facc15',
        } as React.CSSProperties;
      case 'mint-green':
        return {
          '--shell': '#0d9488',
          '--shell-d': '#134e4a',
          '--shell-dd': '#042f2e',
          '--shell-l': '#5eead4',
          '--btn': '#ccfbf1',
          '--btn-d': '#2dd4bf',
        } as React.CSSProperties;
      case 'stealth-black':
        return {
          '--shell': '#18181b',
          '--shell-d': '#09090b',
          '--shell-dd': '#000000',
          '--shell-l': '#52525b',
          '--btn': '#a1a1aa',
          '--btn-d': '#71717a',
        } as React.CSSProperties;
      case 'classic-gray':
      default:
        return {
          '--shell': '#6e54ff',
          '--shell-d': '#4a35c4',
          '--shell-dd': '#3a2a9e',
          '--shell-l': '#9c89ff',
          '--btn': '#e4dfff',
          '--btn-d': '#b3a6ec',
        } as React.CSSProperties;
    }
  }, [theme]);

  const currentGameMeta = GAME_CATALOG[0];

  return (
    <div style={themeStyles} className="relative w-full h-full min-h-screen">
      {/* Floating Top Control Toolbar */}
      <header className="fixed top-3 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-xl bg-[#12131a]/95 backdrop-blur-md border border-[#2a2c3d] rounded-xl p-2 sm:p-2.5 shadow-2xl flex items-center justify-between gap-2">
        {/* Game Title Badge */}
        <div className="flex items-center gap-2 px-2 py-1 bg-[#1e202e] border border-yellow-500/50 rounded">
          <Gamepad2 className="w-4 h-4 text-yellow-400 animate-pulse" />
          <span className="text-yellow-300 font-pixel text-xs font-bold tracking-wide">
            TRUST FALL: CO-OP TOWER CLIMBER
          </span>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1.5">
          {/* Mute Toggle */}
          <button
            onClick={() => {
              const newMute = !isMuted;
              setIsMuted(newMute);
              sound.setMuted(newMute);
            }}
            title="Toggle SFX Mute"
            className={`p-1.5 rounded border transition-colors ${
              isMuted
                ? 'bg-red-900/50 border-red-500 text-red-300'
                : 'bg-emerald-900/50 border-emerald-500 text-emerald-300'
            }`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Chiptune Music Toggle */}
          <button
            onClick={() => {
              const bgmActive = sound.toggleBgm();
              setIsBgmOn(bgmActive);
            }}
            title="Toggle Chiptune BGM"
            className={`p-1.5 rounded border transition-colors ${
              isBgmOn
                ? 'bg-purple-900/60 border-purple-400 text-purple-200 animate-bounce'
                : 'bg-slate-800 border-slate-600 text-slate-400'
            }`}
          >
            <Music className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="Toggle Fullscreen Game View"
            className={`p-1.5 rounded border transition-colors ${
              isFullscreen
                ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                : 'bg-[#1e202e] border-slate-600 text-slate-200 hover:bg-[#2a2c3d]'
            }`}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings Drawer Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded border transition-colors ${
              showSettings
                ? 'bg-yellow-500 text-black border-yellow-400'
                : 'bg-[#1e202e] border-slate-600 text-slate-200 hover:bg-[#2a2c3d]'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Customization Settings Drawer */}
      {showSettings && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl bg-[#161824] border-2 border-yellow-500/80 rounded-xl p-3.5 shadow-2xl text-xs animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-3">
            <span className="font-pixel text-yellow-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> HARDWARE & DISPLAY CUSTOMIZER
            </span>
            <button
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Shell Skin Selector */}
            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-purple-400" /> Console Theme:
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as ConsoleTheme)}
                className="w-full bg-[#0d0e15] border border-slate-700 rounded px-2 py-1 text-slate-200 cursor-pointer"
              >
                <option value="classic-gray">Classic Monad Purple</option>
                <option value="atomic-purple">Atomic Translucent Purple</option>
                <option value="cyber-red">Cyber Crimson Red</option>
                <option value="retro-yellow">Retro Gold Yellow</option>
                <option value="mint-green">Mint Pocket Green</option>
                <option value="stealth-black">Stealth OLED Black</option>
              </select>
            </div>

            {/* Screen CRT Overlay */}
            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <Tv className="w-3.5 h-3.5 text-cyan-400" /> CRT Overlay:
              </label>
              <select
                value={screenFilter}
                onChange={(e) => setScreenFilter(e.target.value as ScreenFilter)}
                className="w-full bg-[#0d0e15] border border-slate-700 rounded px-2 py-1 text-slate-200 cursor-pointer"
              >
                <option value="scanlines">Retro Scanlines</option>
                <option value="lcd-grid">LCD Dot Matrix Grid</option>
                <option value="crt-flicker">CRT Pulse Flicker</option>
                <option value="none">Clean Pure Pixel (No Filter)</option>
              </select>
            </div>

            {/* Screen Color Tint */}
            <div>
              <label className="text-slate-400 block mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> LCD Palette:
              </label>
              <select
                value={screenTint}
                onChange={(e) => setScreenTint(e.target.value as ScreenTint)}
                className="w-full bg-[#0d0e15] border border-slate-700 rounded px-2 py-1 text-slate-200 cursor-pointer"
              >
                <option value="full-color">Full 16-Bit RGB Color</option>
                <option value="gb-green">Classic GB Green</option>
                <option value="pocket-bw">GameBoy Pocket B&W</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Handheld Console using components/console */}
      <Console wordmark={currentGameMeta.name}>
        <ConsoleViewportBridge
          currentGameId={currentGameId}
          screenFilter={screenFilter}
          screenTint={screenTint}
          setFps={setFps}
        />
      </Console>

      {/* Fullscreen Overlay Mode */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#090a0f] flex flex-col justify-between p-2 sm:p-4 select-none">
          <div className="w-full flex items-center justify-between bg-[#11131d] border border-slate-700/80 rounded-lg px-3 py-2 text-xs font-pixel">
            <span className="text-yellow-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {currentGameMeta.name} — FULLSCREEN MODE
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-pixel text-[10px] transition-colors"
            >
              <Minimize2 className="w-3.5 h-3.5" /> EXIT FULLSCREEN
            </button>
          </div>

          <div className="relative flex-1 w-full my-2 bg-black rounded-lg border-2 border-slate-800 overflow-hidden flex items-center justify-center">
            <ConsoleViewportBridge
              currentGameId={currentGameId}
              screenFilter={screenFilter}
              screenTint={screenTint}
              setFps={setFps}
            />
          </div>
        </div>
      )}
    </div>
  );
};
