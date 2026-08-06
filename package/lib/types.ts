// Console and Game Engine Types

export type ConsoleTheme = 
  | 'classic-gray' 
  | 'atomic-purple' 
  | 'cyber-red' 
  | 'retro-yellow' 
  | 'mint-green' 
  | 'stealth-black';

export type ScreenFilter = 'none' | 'scanlines' | 'lcd-grid' | 'crt-flicker';
export type ScreenTint = 'full-color' | 'gb-green' | 'pocket-bw';

export interface ControllerInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  buttonA: boolean;
  buttonB: boolean;
  select: boolean;
  start: boolean;
}

export type GameId = 'trustfall';

export interface GameMetadata {
  id: GameId;
  name: string;
  genre: string;
  description: string;
  controlsInfo: string;
}

export interface GameInstance {
  init: (canvas: HTMLCanvasElement) => void;
  update: (dt: number, input: ControllerInput) => void;
  render: (ctx: CanvasRenderingContext2D) => void;
  destroy: () => void;
  reset?: () => void;
  onCustomInput?: (key: string, value: unknown) => void;
}
