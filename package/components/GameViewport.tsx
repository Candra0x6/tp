'use client';

import React, { useEffect, useRef } from 'react';
import { GameId, ControllerInput, ScreenFilter, ScreenTint, GameInstance } from '../lib/types';
import { TrustFallGame } from '../lib/games/TrustFallGame';

interface GameViewportProps {
  gameId: GameId;
  input: ControllerInput;
  screenFilter: ScreenFilter;
  screenTint: ScreenTint;
  onFpsUpdate?: (fps: number) => void;
}

export const GameViewport: React.FC<GameViewportProps> = ({
  gameId,
  input,
  screenFilter,
  screenTint,
  onFpsUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentGameRef = useRef<GameInstance | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimerRef = useRef<number>(0);

  // Instantiate Trust Fall game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Cleanup previous game
    if (currentGameRef.current) {
      currentGameRef.current.destroy();
      currentGameRef.current = null;
    }

    const instance: GameInstance = new TrustFallGame();
    instance.init(canvas);
    currentGameRef.current = instance;

    return () => {
      if (currentGameRef.current) {
        currentGameRef.current.destroy();
      }
    };
  }, [gameId]);

  // Main Render Loop
  useEffect(() => {
    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // FPS tracking
      frameCountRef.current++;
      if (now - fpsTimerRef.current >= 1000) {
        if (onFpsUpdate) {
          onFpsUpdate(frameCountRef.current);
        }
        frameCountRef.current = 0;
        fpsTimerRef.current = now;
      }

      const canvas = canvasRef.current;
      if (canvas && currentGameRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Sharp pixel scaling setup
          ctx.imageSmoothingEnabled = false;

          // Game logic update
          currentGameRef.current.update(dt, input);

          // Clear & render
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          currentGameRef.current.render(ctx);
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [input, onFpsUpdate]);

  // Tint Overlay Classes
  const getTintStyle = (): React.CSSProperties => {
    if (screenTint === 'gb-green') {
      return {
        filter: 'sepia(1) hue-rotate(50deg) saturate(3) brightness(0.85) contrast(1.2)',
      };
    } else if (screenTint === 'pocket-bw') {
      return {
        filter: 'grayscale(1) contrast(1.3) brightness(0.9)',
      };
    }
    return {};
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-[#090a0f] overflow-hidden select-none">
      {/* HTML5 Pixel Canvas */}
      <canvas
        ref={canvasRef}
        width={320}
        height={240}
        style={getTintStyle()}
        className="w-full h-full object-fill pixelated bg-black rounded-sm border border-black/80 shadow-inner transition-all duration-300"
      />

      {/* Screen Filter Overlays */}
      {screenFilter === 'scanlines' && (
        <div className="absolute inset-0 pointer-events-none scanlines z-10 opacity-70" />
      )}

      {screenFilter === 'lcd-grid' && (
        <div className="absolute inset-0 pointer-events-none lcd-grid z-10 opacity-60" />
      )}

      {screenFilter === 'crt-flicker' && (
        <div className="absolute inset-0 pointer-events-none scanlines z-10 opacity-80 animate-pulse" />
      )}

      {/* Subtle Retro Glass Glare Highlight */}
      {screenFilter !== 'none' && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] z-20 rounded-sm" />
      )}
    </div>
  );
};
