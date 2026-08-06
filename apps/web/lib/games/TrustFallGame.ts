import { GameInstance, ControllerInput } from '../types';
import { sound } from '../sound';

export interface EnvironmentTheme {
  name: string;
  bgGrad: [string, string, string];
  tileColor1: string;
  tileColor2: string;
  tileBevel: string;
  wallColor: string;
  wallBorder: string;
  magicCircleFill: string;
  magicCircleStroke: string;
  pillarColor1: string;
  pillarColor2: string;
  pillarColor3: string;
  torchHalo: string;
  torchBracket: string;
  flames: string[];
  particleColors: string[];
  doorWoodBase: string;
  doorWoodSelected: string;
  doorBandColor: string;
  runeColors: string[];
  accentColor: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  role: 'Warrior' | 'Mage' | 'Rogue' | 'Cleric';
  color: string;
  clue: string;
  vote: number | null; // 1, 2, or 3
  isLocal: boolean;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  animFrame: number;
}

interface DoorZone {
  id: number;
  name: string;
  x: number; // center x
  y: number; // center y
  width: number;
  height: number;
  voters: string[]; // player IDs
}

const PIXEL_FONT_MAP: Record<string, string[]> = {
  'A': ['01110','10001','10001','11111','10001','10001','10001'],
  'B': ['11110','10001','10001','11110','10001','10001','11110'],
  'C': ['01111','10000','10000','10000','10000','10000','01111'],
  'D': ['11110','10001','10001','10001','10001','10001','11110'],
  'E': ['11111','10000','10000','11110','10000','10000','11111'],
  'F': ['11111','10000','10000','11110','10000','10000','10000'],
  'G': ['01111','10000','10000','10011','10001','10001','01111'],
  'H': ['10001','10001','10001','11111','10001','10001','10001'],
  'I': ['01110','00100','00100','00100','00100','00100','01110'],
  'J': ['00001','00001','00001','00001','00001','10001','01110'],
  'K': ['10001','10010','10100','11000','10100','10010','10001'],
  'L': ['10000','10000','10000','10000','10000','10000','11111'],
  'M': ['10001','11011','10101','10001','10001','10001','10001'],
  'N': ['10001','11001','10101','10011','10001','10001','10001'],
  'O': ['01110','10001','10001','10001','10001','10001','01110'],
  'P': ['11110','10001','10001','11110','10000','10000','10000'],
  'Q': ['01110','10001','10001','10001','10101','10010','01101'],
  'R': ['11110','10001','10001','11110','10100','10010','10001'],
  'S': ['01111','10000','10000','01110','00001','00001','11110'],
  'T': ['11111','00100','00100','00100','00100','00100','00100'],
  'U': ['10001','10001','10001','10001','10001','10001','01110'],
  'V': ['10001','10001','10001','10001','10001','01010','00100'],
  'W': ['10001','10001','10001','10101','10101','11011','10001'],
  'X': ['10001','10001','01010','00100','01010','10001','10001'],
  'Y': ['10001','10001','01010','00100','00100','00100','00100'],
  'Z': ['11111','00001','00010','00100','01000','10000','11111'],
  '0': ['01110','10001','10011','10101','11001','10001','01110'],
  '1': ['00100','01100','00100','00100','00100','00100','01110'],
  '2': ['01110','10001','00001','00110','01000','10000','11111'],
  '3': ['11110','00001','00001','01110','00001','00001','11110'],
  '4': ['00010','00110','01010','10010','11111','00010','00010'],
  '5': ['11111','10000','11110','00001','00001','10001','01110'],
  '6': ['01110','10000','10000','11110','10001','10001','01110'],
  '7': ['11111','00001','00010','00100','01000','01000','01000'],
  '8': ['01110','10001','10001','01110','10001','10001','01110'],
  '9': ['01110','10001','10001','01111','00001','00001','01110'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
  ':': ['00000','01100','01100','00000','01100','01100','00000'],
  '$': ['00100','01111','10100','01110','00101','11110','00100'],
  '%': ['11001','11010','00100','00100','01000','01011','10011'],
  '[': ['01110','01000','01000','01000','01000','01000','01110'],
  ']': ['01110','00010','00010','00010','00010','00010','01110'],
  '(': ['00010','00100','01000','01000','01000','00100','00010'],
  ')': ['01000','00100','00010','00010','00010','00100','01000'],
  '+': ['00000','00100','00100','11111','00100','00100','00000'],
  '-': ['00000','00000','00000','11111','00000','00000','00000'],
  '!': ['00100','00100','00100','00100','00100','00000','00100'],
  '?': ['01110','10001','00001','00010','00100','00000','00100'],
  '/': ['00001','00010','00010','00100','01000','01000','10000'],
  '▲': ['00100','01110','11111','00000','00000','00000','00000'],
  '▼': ['00000','00000','00000','11111','01110','00100','00000'],
  '#': ['01010','01010','11111','01010','11111','01010','01010'],
  '=': ['00000','11111','00000','00000','11111','00000','00000'],
  '<': ['00010','00100','01000','10000','01000','00100','00010'],
  '>': ['01000','00100','00010','00001','00010','00100','01000'],
  ',': ['00000','00000','00000','00000','00110','00100','01000'],
  '.': ['00000','00000','00000','00000','00000','01100','01100'],
  "'": ['00100','00100','01000','00000','00000','00000','00000'],
  '"': ['01010','01010','00000','00000','00000','00000','00000'],
};

export class TrustFallGame implements GameInstance {
  private canvas!: HTMLCanvasElement;
  private width = 320;
  private height = 240;

  // Tower state
  private currentFloor = 1;
  private maxFloor = 6;
  private usdcPot = 1250;
  private timerSeconds = 24;
  private safeDoor = 3; // 1, 2, or 3
  private selectedDoor = 3; // door player is near or voted for
  private activeTab: 'clues' | 'chat' | 'vote' = 'clues';
  private selectedPlayerIndex = 0;
  private theme!: EnvironmentTheme;

  // Real-time map & collision objects
  private doors: DoorZone[] = [
    { id: 1, name: 'WEST WING', x: 50, y: 55, width: 44, height: 50, voters: [] },
    { id: 2, name: 'NORTH ARCH', x: 160, y: 40, width: 48, height: 50, voters: [] },
    { id: 3, name: 'EAST SANCTUARY', x: 270, y: 55, width: 44, height: 50, voters: [] },
  ];

  // Outer wall obstacles for collision bounds
  private obstacles = [
    { x: 0, y: 0, w: 320, h: 26 }, // top boundary wall
    { x: 0, y: 0, w: 12, h: 240 },  // left wall
    { x: 308, y: 0, w: 12, h: 240 }, // right wall
    { x: 0, y: 172, w: 320, h: 10 }, // bottom corridor wall (above UI)
  ];

  // Players
  private players: PlayerInfo[] = [
    {
      id: 'p1',
      name: 'VALOR',
      role: 'Warrior',
      color: '#3b82f6',
      clue: 'Door 2 is freezing cold ❄️',
      vote: 3,
      isLocal: true,
      x: 160,
      y: 162,
      targetX: 160,
      targetY: 162,
      dir: 'up',
      isMoving: false,
      animFrame: 0,
    },
    {
      id: 'p2',
      name: 'LYRA',
      role: 'Mage',
      color: '#a855f7',
      clue: 'Safe door is ODD number 🔮',
      vote: 3,
      isLocal: false,
      x: 240,
      y: 100,
      targetX: 240,
      targetY: 100,
      dir: 'up',
      isMoving: true,
      animFrame: 0,
    },
    {
      id: 'p3',
      name: 'SHADOW',
      role: 'Rogue',
      color: '#22c55e',
      clue: 'NOT leftmost door 1 🗡️',
      vote: 3,
      isLocal: false,
      x: 260,
      y: 110,
      targetX: 260,
      targetY: 110,
      dir: 'left',
      isMoving: true,
      animFrame: 0,
    },
    {
      id: 'p4',
      name: 'AURA',
      role: 'Cleric',
      color: '#eab308',
      clue: 'Door 1 has acid traps ⚠️',
      vote: 2,
      isLocal: false,
      x: 60,
      y: 100,
      targetX: 60,
      targetY: 100,
      dir: 'up',
      isMoving: false,
      animFrame: 0,
    },
  ];

  // Chat Messages
  private chatMessages: Array<{ sender: string; text: string; color: string }> = [
    { sender: 'P1 VALOR', text: 'Door 2 is freezing cold!', color: '#3b82f6' },
    { sender: 'P2 LYRA', text: 'Safe door is ODD number!', color: '#a855f7' },
    { sender: 'P3 SHADOW', text: 'So it cannot be Door 1 or 2!', color: '#22c55e' },
    { sender: 'P4 AURA', text: 'Gather at Door 3 to CLIMB!', color: '#eab308' },
  ];

  // Particles & ambient effects
  private particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; color: string }> = [];

  // Animation & game status
  private statusMessage = 'EXPLORE TOWER & GATHER AT DOOR TO VOTE!';
  private gameState: 'exploring' | 'climbing' | 'cashing_out' | 'failed' = 'exploring';
  private animCounter = 0;
  private timerFrameCount = 0;
  private nearDoorId: number | null = 3; // Currently near door 3

  // Keyboard input state
  private keys: Record<string, boolean> = {};

  // Controller debouncing
  private prevInputA = false;
  private prevInputB = false;
  private prevSelect = false;

  public init(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = canvas.width;
    this.height = canvas.height;
    if (typeof document !== 'undefined' && document.fonts) {
      document.fonts.load("8px 'Press Start 2P'").catch(() => {});
      document.fonts.load("8px 'Silkscreen'").catch(() => {});
    }
    this.setupKeyboardListeners();
    this.setupNewFloor(1);
  }

  private setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  private getEnvironmentTheme(floorNum: number): EnvironmentTheme {
    switch (floorNum) {
      case 1:
        return {
          name: 'ANCIENT CRYPT',
          bgGrad: ['#0a0d18', '#111827', '#080c14'],
          tileColor1: '#1e293b',
          tileColor2: '#152032',
          tileBevel: '#2d3f58',
          wallColor: '#0f172a',
          wallBorder: '#334155',
          magicCircleFill: 'rgba(99, 102, 241, 0.12)',
          magicCircleStroke: '#6366f1',
          pillarColor1: '#1e293b',
          pillarColor2: '#334155',
          pillarColor3: '#475569',
          torchHalo: 'rgba(251, 146, 60, 0.35)',
          torchBracket: '#78350f',
          flames: ['#ef4444', '#f97316', '#facc15', '#fef08a'],
          particleColors: ['#f97316', '#a7f3d0', '#fbbf24'],
          doorWoodBase: '#3f1d0b',
          doorWoodSelected: '#854d0e',
          doorBandColor: '#1e293b',
          runeColors: ['#38bdf8', '#c084fc', '#facc15'],
          accentColor: '#38bdf8',
        };
      case 2:
        return {
          name: 'MAGMA CAVERN',
          bgGrad: ['#1f0707', '#110303', '#080000'],
          tileColor1: '#2d1212',
          tileColor2: '#1a0a0a',
          tileBevel: '#521c1c',
          wallColor: '#2b0909',
          wallBorder: '#7f1d1d',
          magicCircleFill: 'rgba(249, 115, 22, 0.18)',
          magicCircleStroke: '#f97316',
          pillarColor1: '#2d1212',
          pillarColor2: '#451a1a',
          pillarColor3: '#6e2929',
          torchHalo: 'rgba(239, 68, 68, 0.45)',
          torchBracket: '#450a0a',
          flames: ['#dc2626', '#ea580c', '#facc15', '#fef08a'],
          particleColors: ['#ef4444', '#f97316', '#fde047', '#ffedd5'],
          doorWoodBase: '#1f1917',
          doorWoodSelected: '#9a3412',
          doorBandColor: '#450a0a',
          runeColors: ['#ef4444', '#f97316', '#fde047'],
          accentColor: '#f97316',
        };
      case 3:
        return {
          name: 'FROST TEMPLE',
          bgGrad: ['#0b1d33', '#102a48', '#061222'],
          tileColor1: '#1e3a5f',
          tileColor2: '#132640',
          tileBevel: '#38bdf8',
          wallColor: '#0f2942',
          wallBorder: '#38bdf8',
          magicCircleFill: 'rgba(56, 189, 248, 0.22)',
          magicCircleStroke: '#38bdf8',
          pillarColor1: '#1e3a5f',
          pillarColor2: '#2d5380',
          pillarColor3: '#4a7cb5',
          torchHalo: 'rgba(96, 165, 250, 0.4)',
          torchBracket: '#1e3a8a',
          flames: ['#3b82f6', '#60a5fa', '#93c5fd', '#e0f2fe'],
          particleColors: ['#e0f2fe', '#93c5fd', '#bfdbfe', '#ffffff'],
          doorWoodBase: '#1b3047',
          doorWoodSelected: '#0284c7',
          doorBandColor: '#1e3a8a',
          runeColors: ['#38bdf8', '#60a5fa', '#e0f2fe'],
          accentColor: '#38bdf8',
        };
      case 4:
        return {
          name: 'EMERALD RUINS',
          bgGrad: ['#071a0e', '#0f2d1a', '#041008'],
          tileColor1: '#143823',
          tileColor2: '#0b2415',
          tileBevel: '#22c55e',
          wallColor: '#092916',
          wallBorder: '#22c55e',
          magicCircleFill: 'rgba(16, 185, 129, 0.2)',
          magicCircleStroke: '#10b981',
          pillarColor1: '#143823',
          pillarColor2: '#1e5233',
          pillarColor3: '#2d7a4d',
          torchHalo: 'rgba(52, 211, 153, 0.4)',
          torchBracket: '#064e3b',
          flames: ['#059669', '#10b981', '#34d399', '#a7f3d0'],
          particleColors: ['#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5'],
          doorWoodBase: '#193322',
          doorWoodSelected: '#15803d',
          doorBandColor: '#064e3b',
          runeColors: ['#34d399', '#10b981', '#a7f3d0'],
          accentColor: '#22c55e',
        };
      case 5:
        return {
          name: 'GOLDEN SANCTUM',
          bgGrad: ['#1f1704', '#332506', '#120c02'],
          tileColor1: '#3a2d0c',
          tileColor2: '#241b06',
          tileBevel: '#eab308',
          wallColor: '#2b2108',
          wallBorder: '#eab308',
          magicCircleFill: 'rgba(250, 204, 21, 0.22)',
          magicCircleStroke: '#facc15',
          pillarColor1: '#3a2d0c',
          pillarColor2: '#574312',
          pillarColor3: '#7d611b',
          torchHalo: 'rgba(250, 204, 21, 0.45)',
          torchBracket: '#713f12',
          flames: ['#ca8a04', '#eab308', '#facc15', '#fef08a'],
          particleColors: ['#facc15', '#fde047', '#fef08a', '#ffffff'],
          doorWoodBase: '#4a3a10',
          doorWoodSelected: '#ca8a04',
          doorBandColor: '#713f12',
          runeColors: ['#facc15', '#fde047', '#fef08a'],
          accentColor: '#facc15',
        };
      case 6:
      default:
        return {
          name: 'VOID THRONE',
          bgGrad: ['#140521', '#210836', '#0a0212'],
          tileColor1: '#280e3b',
          tileColor2: '#180726',
          tileBevel: '#a855f7',
          wallColor: '#1e092d',
          wallBorder: '#a855f7',
          magicCircleFill: 'rgba(192, 132, 252, 0.22)',
          magicCircleStroke: '#c084fc',
          pillarColor1: '#280e3b',
          pillarColor2: '#3d1659',
          pillarColor3: '#5a2282',
          torchHalo: 'rgba(192, 132, 252, 0.45)',
          torchBracket: '#581c87',
          flames: ['#9333ea', '#a855f7', '#c084fc', '#e9d5ff'],
          particleColors: ['#c084fc', '#e9d5ff', '#f5f3ff', '#d8b4fe'],
          doorWoodBase: '#2e0d45',
          doorWoodSelected: '#7e22ce',
          doorBandColor: '#581c87',
          runeColors: ['#c084fc', '#e9d5ff', '#a855f7'],
          accentColor: '#c084fc',
        };
    }
  }

  private setupNewFloor(floorNum: number) {
    this.currentFloor = floorNum;
    this.theme = this.getEnvironmentTheme(floorNum);
    this.safeDoor = Math.floor(Math.random() * 3) + 1;
    this.timerSeconds = 24;
    this.gameState = 'exploring';
    this.initParticles();

    // Generate clues
    const door1Trap = this.safeDoor !== 1;
    const door2Trap = this.safeDoor !== 2;
    const door3Trap = this.safeDoor !== 3;
    const isOdd = this.safeDoor % 2 !== 0;

    this.players[0].clue = door2Trap ? 'Door 2 is freezing cold ❄️' : 'Door 2 feels warm and safe 🔥';
    this.players[1].clue = isOdd ? 'Safe door is ODD number 🔮' : 'Safe door is EVEN number 🔮';
    this.players[2].clue = door1Trap ? 'NOT leftmost door 1 🗡️' : 'Left door 1 shows good omen 🗡️';
    this.players[3].clue = door3Trap ? 'Door 3 has acid traps ⚠️' : 'Door 3 leads safely upward ✨';

    // Reset player positions across the map
    this.players[0].x = 160; this.players[0].y = 162;
    this.players[1].x = 240; this.players[1].y = 100;
    this.players[2].x = 260; this.players[2].y = 110;
    this.players[3].x = 60;  this.players[3].y = 100;

    this.statusMessage = `FLOOR ${this.currentFloor} [${this.theme.name}]: WALK TO DOORS & CLIMB!`;
    sound.playStart();
  }

  private initParticles() {
    this.particles = [];
    const colors = this.theme ? this.theme.particleColors : ['#f97316', '#a7f3d0'];
    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * 180,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.2 - Math.random() * 0.4,
        size: Math.random() > 0.5 ? 2 : 3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  public update(dt: number, input: ControllerInput) {
    this.animCounter++;
    this.timerFrameCount++;

    // Countdown timer
    if (this.timerFrameCount % 60 === 0 && this.timerSeconds > 0 && this.gameState === 'exploring') {
      this.timerSeconds--;
      if (this.timerSeconds === 0) {
        this.handleClimb();
      }
    }

    // Particle floating update
    this.particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < 25) {
        p.y = 175;
        p.x = Math.random() * this.width;
      }
    });

    if (this.gameState === 'exploring') {
      this.handleMovement(input);
      this.updateCoOpAI();
      this.checkDoorProximity();
    }

    // Button A: Confirm Vote / Climb
    if (input.buttonA && !this.prevInputA) {
      sound.playButtonA();
      if (this.nearDoorId !== null) {
        this.selectedDoor = this.nearDoorId;
        this.players[0].vote = this.nearDoorId;
        this.chatMessages.push({
          sender: 'P1 VALOR',
          text: `Selected Door ${this.nearDoorId}! Let's climb!`,
          color: '#3b82f6',
        });
        if (this.chatMessages.length > 5) this.chatMessages.shift();
      } else {
        this.players[0].vote = this.selectedDoor;
      }
      this.handleClimb();
    }
    this.prevInputA = input.buttonA;

    // Button B: Cash out / Bank
    if (input.buttonB && !this.prevInputB) {
      sound.playButtonB();
      this.handleBank();
    }
    this.prevInputB = input.buttonB;

    // Select Button: Cycle tab / clue inspection
    if (input.select && !this.prevSelect) {
      sound.playSelect();
      this.selectedPlayerIndex = (this.selectedPlayerIndex + 1) % 4;
    }
    this.prevSelect = input.select;
  }

  private handleMovement(input: ControllerInput) {
    const p1 = this.players[0];
    const speed = 2.0;
    let dx = 0;
    let dy = 0;

    // D-Pad or Keyboard Controls for real-time player movement
    if (input.left || this.keys['arrowleft'] || this.keys['a']) {
      dx -= speed;
      p1.dir = 'left';
    }
    if (input.right || this.keys['arrowright'] || this.keys['d']) {
      dx += speed;
      p1.dir = 'right';
    }
    if (input.up || this.keys['arrowup'] || this.keys['w']) {
      dy -= speed;
      p1.dir = 'up';
    }
    if (input.down || this.keys['arrowdown'] || this.keys['s']) {
      dy += speed;
      p1.dir = 'down';
    }

    if (dx !== 0 || dy !== 0) {
      if (!this.checkCollision(p1.x + dx, p1.y + dy)) {
        p1.x += dx;
        p1.y += dy;
      } else if (!this.checkCollision(p1.x + dx, p1.y)) {
        p1.x += dx;
      } else if (!this.checkCollision(p1.x, p1.y + dy)) {
        p1.y += dy;
      }
      p1.isMoving = true;
      if (this.animCounter % 6 === 0) {
        p1.animFrame = (p1.animFrame + 1) % 4;
      }
    } else {
      p1.isMoving = false;
    }
  }

  private checkCollision(x: number, y: number): boolean {
    const radius = 5;
    for (const obs of this.obstacles) {
      if (
        x + radius > obs.x &&
        x - radius < obs.x + obs.w &&
        y + radius > obs.y &&
        y - radius < obs.y + obs.h
      ) {
        return true;
      }
    }
    return false;
  }

  private updateCoOpAI() {
    this.players.forEach((p, idx) => {
      if (p.isLocal) return;

      const targetDoor = this.doors.find(d => d.id === p.vote);
      if (!targetDoor) return;

      const offsetX = (idx === 1 ? -12 : idx === 2 ? 12 : 0);
      const targetX = targetDoor.x + offsetX;
      const targetY = targetDoor.y + 35;

      const dx = targetX - p.x;
      const dy = targetY - p.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 3) {
        p.x += (dx / dist) * 0.8;
        p.y += (dy / dist) * 0.8;
        p.isMoving = true;
        p.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
        if (this.animCounter % 8 === 0) p.animFrame = (p.animFrame + 1) % 4;
      } else {
        p.isMoving = false;
        p.dir = 'up';
      }
    });
  }

  private checkDoorProximity() {
    const p1 = this.players[0];
    let foundDoor: number | null = null;

    for (const door of this.doors) {
      const dist = Math.hypot(p1.x - door.x, p1.y - (door.y + 25));
      if (dist < 32) {
        foundDoor = door.id;
        break;
      }
    }

    if (foundDoor !== this.nearDoorId) {
      this.nearDoorId = foundDoor;
      if (this.nearDoorId !== null) {
        this.selectedDoor = this.nearDoorId;
        sound.playSelect();
      }
    }
  }

  private handleClimb() {
    const chosenDoor = this.selectedDoor;
    if (chosenDoor === this.safeDoor) {
      this.usdcPot += 350;
      sound.playCoin();
      this.statusMessage = `SAFE! DOOR ${chosenDoor} IS SECURE. +350 USDC!`;
      this.gameState = 'climbing';

      setTimeout(() => {
        if (this.currentFloor < this.maxFloor) {
          this.setupNewFloor(this.currentFloor + 1);
        } else {
          this.statusMessage = `TOWER CONQUERED! WINNER POT: $${this.usdcPot} USDC!`;
        }
      }, 1600);
    } else {
      sound.playExplosion();
      this.statusMessage = `TRAP! DOOR ${chosenDoor} WAS FAKE! TRUST FALL FAILED.`;
      this.gameState = 'failed';

      setTimeout(() => {
        this.usdcPot = 1250;
        this.setupNewFloor(1);
      }, 2000);
    }
  }

  private handleBank() {
    sound.playCoin();
    this.gameState = 'cashing_out';
    this.statusMessage = `CASHOUT SUCCESSFUL! SECURED $${this.usdcPot} USDC!`;
    setTimeout(() => {
      this.usdcPot = 1250;
      this.setupNewFloor(1);
    }, 2200);
  }

  // 64-Bit Pixel UI Text Drawing Helper using 5x7 Pixel Bitmap Engine
  private drawPixelText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    options?: {
      size?: number;
      color?: string;
      align?: 'left' | 'center' | 'right';
      shadowColor?: string;
      shadowOffset?: number;
    }
  ) {
    const scale = options?.size && options.size >= 8 ? 2 : 1;
    const color = options?.color ?? '#ffffff';
    const align = options?.align ?? 'left';
    const shadowColor = options?.shadowColor ?? 'rgba(0, 0, 0, 0.95)';
    const shadowOffset = options?.shadowOffset ?? 1;
    const spacing = 1;

    const charW = 5 * scale;
    const str = text.toUpperCase();
    const totalW = str.length * (charW + spacing * scale) - spacing * scale;

    let startX = Math.floor(x);
    if (align === 'center') {
      startX -= Math.floor(totalW / 2);
    } else if (align === 'right') {
      startX -= totalW;
    }
    const startY = Math.floor(y);

    ctx.save();

    // Draw Shadow
    if (shadowOffset > 0) {
      ctx.fillStyle = shadowColor;
      let currX = startX + shadowOffset;
      for (let i = 0; i < str.length; i++) {
        const char = str[i];
        const glyph = PIXEL_FONT_MAP[char] || PIXEL_FONT_MAP['?'];
        for (let row = 0; row < 7; row++) {
          const bitrow = glyph[row];
          for (let col = 0; col < 5; col++) {
            if (bitrow[col] === '1') {
              ctx.fillRect(currX + col * scale, startY + shadowOffset + row * scale, scale, scale);
            }
          }
        }
        currX += charW + spacing * scale;
      }
    }

    // Draw Foreground Pixels
    ctx.fillStyle = color;
    let currX = startX;
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const glyph = PIXEL_FONT_MAP[char] || PIXEL_FONT_MAP['?'];
      for (let row = 0; row < 7; row++) {
        const bitrow = glyph[row];
        for (let col = 0; col < 5; col++) {
          if (bitrow[col] === '1') {
            ctx.fillRect(currX + col * scale, startY + row * scale, scale, scale);
          }
        }
      }
      currX += charW + spacing * scale;
    }

    ctx.restore();
  }

  public render(ctx: CanvasRenderingContext2D) {
    // -------------------------------------------------------------------------
    // 64-BIT HD RENDER ENGINE: TOWER FLOOR & ENVIRONMENT
    // -------------------------------------------------------------------------
    // Rich gradient floor background from theme
    const bgGrad = ctx.createLinearGradient(0, 0, 0, this.height);
    bgGrad.addColorStop(0, this.theme.bgGrad[0]);
    bgGrad.addColorStop(0.5, this.theme.bgGrad[1]);
    bgGrad.addColorStop(1, this.theme.bgGrad[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // High detail stone tile grid with subtle bevels
    for (let r = 1; r < 9; r++) {
      for (let c = 0; c < 16; c++) {
        const tx = c * 20;
        const ty = r * 20;
        ctx.fillStyle = (c + r) % 2 === 0 ? this.theme.tileColor1 : this.theme.tileColor2;
        ctx.fillRect(tx, ty, 20, 20);

        ctx.strokeStyle = this.theme.tileBevel;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(tx, ty, 20, 20);
      }
    }

    // Central Magic Seal Circle on Floor
    const cx = 160;
    const cy = 110;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fillStyle = this.theme.magicCircleFill;
    ctx.fill();
    ctx.strokeStyle = this.theme.magicCircleStroke;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, 20, 0, Math.PI * 2);
    ctx.strokeStyle = this.theme.magicCircleStroke;
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    ctx.restore();

    // Top stone wall
    ctx.fillStyle = this.theme.wallColor;
    ctx.fillRect(0, 0, this.width, 26);
    ctx.strokeStyle = this.theme.wallBorder;
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, this.width, 26);

    // Stairs leading upward
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(135, 8, 50, 18);
    ctx.strokeStyle = this.theme.accentColor;
    ctx.strokeRect(135, 8, 50, 18);
    this.drawPixelText(ctx, 'STAIRS ▲', 160, 13, { align: 'center', color: this.theme.accentColor });

    // Torches with 64-bit radial light glows
    this.drawHdTorch(ctx, 25, 26);
    this.drawHdTorch(ctx, 115, 26);
    this.drawHdTorch(ctx, 205, 26);
    this.drawHdTorch(ctx, 295, 26);

    // Particles (fog & embers)
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });

    // -------------------------------------------------------------------------
    // 64-BIT DOORS
    // -------------------------------------------------------------------------
    this.doors.forEach(door => {
      const isSelected = this.selectedDoor === door.id;
      const isNear = this.nearDoorId === door.id;
      this.drawHdDoor(ctx, door.x - 22, door.y, 44, 48, door.id, isSelected, isNear);
    });

    // -------------------------------------------------------------------------
    // 64-BIT HERO CHARACTERS & SHADOWS
    // -------------------------------------------------------------------------
    const sortedPlayers = [...this.players].sort((a, b) => a.y - b.y);

    sortedPlayers.forEach(p => {
      // Soft radial shadow
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(p.x, p.y + 3, 8, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Draw 64-bit HD Character Sprite
      this.drawHdHero(ctx, p.x, p.y - 12, p.role, p.dir, p.animFrame, p.color);

      // Overhead Name Badge & Vote
      this.drawPixelText(ctx, p.name, p.x, p.y - 22, { align: 'center', color: p.color });

      if (p.vote !== null) {
        ctx.fillStyle = '#facc15';
        ctx.fillRect(p.x - 10, p.y - 32, 20, 8);
        this.drawPixelText(ctx, `D${p.vote}`, p.x, p.y - 31, { align: 'center', color: '#000000', shadowOffset: 0 });
      }
    });

    // Interaction indicator when standing near a door
    if (this.nearDoorId !== null) {
      const door = this.doors.find(d => d.id === this.nearDoorId);
      if (door) {
        const p1 = this.players[0];
        const pulse = Math.sin(this.animCounter * 0.15) * 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(p1.x - 52, p1.y - 38, 104, 14);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1;
        ctx.strokeRect(p1.x - 52, p1.y - 38, 104, 14);

        this.drawPixelText(ctx, `PRESS [A]: VOTE D${door.id}`, p1.x, p1.y - 34 + pulse, { align: 'center', color: '#facc15' });
      }
    }

    // -------------------------------------------------------------------------
    // 64-BIT TOP HUD HEADER (Floor, Pot, Timer, VRF Seal)
    // -------------------------------------------------------------------------
    ctx.fillStyle = 'rgba(2, 6, 23, 0.95)';
    ctx.fillRect(0, 0, this.width, 22);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, this.width, 22);

    this.drawPixelText(ctx, `FL:${this.currentFloor} [${this.theme.name}]`, 4, 7, { color: '#facc15' });
    this.drawPixelText(ctx, `POT:$${this.usdcPot}`, 126, 7, { color: '#22c55e' });
    this.drawPixelText(ctx, `TIME:${this.timerSeconds}s`, 188, 7, { color: this.timerSeconds <= 5 ? '#ef4444' : '#38bdf8' });

    // VRF Seal
    this.drawVrfSeal(ctx, 244, 2);

    // -------------------------------------------------------------------------
    // 64-BIT BOTTOM HUD PANELS (Private Clues, Chat, Controls)
    // -------------------------------------------------------------------------
    const panelY = 176;
    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, panelY, this.width, 64);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(0, panelY, this.width, 64);

    // Compact Player Portrait & Clue Display
    const activeP = this.players[this.selectedPlayerIndex];
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(4, panelY + 3, 150, 36);
    ctx.strokeStyle = activeP.color;
    ctx.strokeRect(4, panelY + 3, 150, 36);

    ctx.fillStyle = activeP.color;
    ctx.fillRect(8, panelY + 6, 20, 20);
    this.drawPixelText(ctx, activeP.name.substring(0, 5), 18, panelY + 28, { align: 'center', color: '#ffffff' });

    this.drawPixelText(ctx, `CLUE (${activeP.role}):`, 32, panelY + 6, { color: '#facc15' });
    this.drawPixelText(ctx, activeP.clue, 32, panelY + 18, { color: '#e2e8f0' });

    // Pixel Chat Feed Box
    ctx.fillStyle = '#020617';
    ctx.fillRect(158, panelY + 3, 158, 36);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(158, panelY + 3, 158, 36);

    this.drawPixelText(ctx, 'LIVE CO-OP CHAT:', 162, panelY + 6, { color: '#38bdf8' });
    const recentChat = this.chatMessages[this.chatMessages.length - 1];
    if (recentChat) {
      this.drawPixelText(ctx, `${recentChat.sender}:`, 162, panelY + 17, { color: recentChat.color });
      this.drawPixelText(ctx, recentChat.text.substring(0, 22), 162, panelY + 26, { color: '#ffffff' });
    }

    // Action Controls (BANK & CLIMB Buttons)
    const btnY = 215;
    const btnW = 148;
    const btnH = 21;

    // BANK BUTTON [B]
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(6, btnY, btnW, btnH);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(8, btnY + 2, btnW - 4, btnH - 4);
    this.drawPixelText(ctx, `BANK ($${this.usdcPot}) [B]`, 80, btnY + 7, { align: 'center', color: '#ffffff' });

    // CLIMB BUTTON [A]
    ctx.fillStyle = '#166534';
    ctx.fillRect(166, btnY, btnW, btnH);
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(168, btnY + 2, btnW - 4, btnH - 4);
    this.drawPixelText(ctx, `CLIMB DOOR ${this.selectedDoor} [A]`, 240, btnY + 7, { align: 'center', color: '#ffffff' });

    // Overlay for game outcome
    if (this.gameState === 'climbing' || this.gameState === 'failed' || this.gameState === 'cashing_out') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      ctx.fillRect(20, 65, 280, 75);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 65, 280, 75);

      this.drawPixelText(ctx, 'TRUST FALL VERDICT', 160, 75, { align: 'center', color: '#facc15' });
      this.drawPixelText(ctx, this.statusMessage, 160, 95, { align: 'center', color: '#ffffff' });
    }
  }

  // 64-Bit HD Pillar Helper
  private drawHdPillar(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = this.theme.pillarColor1;
    ctx.fillRect(x, y, 14, 18);

    ctx.fillStyle = this.theme.pillarColor2;
    ctx.fillRect(x + 2, y + 2, 10, 14);

    ctx.fillStyle = this.theme.pillarColor3;
    ctx.fillRect(x + 4, y + 4, 6, 10);
  }

  // 64-Bit HD Torch Helper with Light Halo
  private drawHdTorch(ctx: CanvasRenderingContext2D, x: number, y: number) {
    // Radial light halo
    const halo = ctx.createRadialGradient(x + 2, y - 2, 2, x + 2, y - 2, 18);
    halo.addColorStop(0, this.theme.torchHalo);
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x + 2, y - 2, 18, 0, Math.PI * 2);
    ctx.fill();

    // Wooden bracket
    ctx.fillStyle = this.theme.torchBracket;
    ctx.fillRect(x, y, 4, 10);

    // Animated flame
    const f = Math.floor(this.animCounter / 4) % 4;
    ctx.fillStyle = this.theme.flames[f];
    ctx.fillRect(x - 2, y - 5, 8, 5);
    ctx.fillStyle = this.theme.flames[(f + 1) % 4];
    ctx.fillRect(x - 1, y - 7, 6, 3);
  }

  // VRF Seal
  private drawVrfSeal(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(x, y, 74, 18);
    ctx.strokeStyle = '#6366f1';
    ctx.strokeRect(x, y, 74, 18);

    this.drawPixelText(ctx, 'VRF FAIR', x + 37, y + 6, { align: 'center', color: '#34d399' });
  }

  // 64-Bit HD Door Helper
  private drawHdDoor(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    doorNum: number,
    isSelected: boolean,
    isNear: boolean
  ) {
    // Stone arch outline
    ctx.fillStyle = this.theme.wallColor;
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = isSelected ? this.theme.doorWoodSelected : this.theme.doorWoodBase;
    ctx.fillRect(x + 3, y + 3, width - 6, height - 3);

    // Vertical plank lines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(x + 14, y + 3, 1.5, height - 3);
    ctx.fillRect(x + 28, y + 3, 1.5, height - 3);

    // Reinforced iron bands
    ctx.fillStyle = this.theme.doorBandColor;
    ctx.fillRect(x + 3, y + 12, width - 6, 4);
    ctx.fillRect(x + 3, y + 32, width - 6, 4);

    // Gold door knob & lock
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 8, y + 22, 5, 6);

    // Gemstone elemental rune above door
    ctx.fillStyle = this.theme.runeColors[doorNum - 1] || this.theme.accentColor;
    ctx.beginPath();
    ctx.arc(x + width / 2, y + 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Door Number Plate
    ctx.fillStyle = '#020617';
    ctx.fillRect(x + width / 2 - 10, y + 10, 20, 14);
    ctx.strokeStyle = this.theme.accentColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(x + width / 2 - 10, y + 10, 20, 14);

    this.drawPixelText(
      ctx,
      `${doorNum}`,
      x + width / 2,
      y + 13,
      { align: 'center', color: isSelected ? this.theme.accentColor : '#ffffff' }
    );

    // Selection or proximity glow
    if (isSelected || isNear) {
      ctx.strokeStyle = isSelected ? '#facc15' : this.theme.accentColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
    }
  }

  // 64-Bit HD Hero Sprite Renderer
  private drawHdHero(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    role: 'Warrior' | 'Mage' | 'Rogue' | 'Cleric',
    dir: 'up' | 'down' | 'left' | 'right',
    animFrame: number,
    primaryColor: string
  ) {
    ctx.save();
    const isWalk = animFrame % 2 === 1;

    // Body dimensions
    const headY = y;
    const bodyY = headY + 7;
    const legY = bodyY + 7;

    // Shadow/Base offset
    if (role === 'Warrior') {
      // Blue Steel Armor & Visor Helmet
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x - 5, bodyY, 10, 7); // Armor
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(x - 4, headY, 8, 7); // Helmet
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x - 3, headY + 3, 6, 2); // Visor

      // Glowing Sword
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(dir === 'left' ? x - 8 : x + 5, bodyY, 3, 8);

      // Legs
      ctx.fillStyle = '#334155';
      ctx.fillRect(x - 4, legY, 3, isWalk ? 5 : 4);
      ctx.fillRect(x + 1, legY, 3, isWalk ? 4 : 5);
    } else if (role === 'Mage') {
      // Purple Robes & Pointy Wizard Hat
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x - 5, bodyY, 10, 9); // Robe
      ctx.fillStyle = '#6b21a8';
      ctx.fillRect(x - 4, headY - 3, 8, 5); // Hat base
      ctx.fillRect(x - 2, headY - 6, 4, 3); // Hat tip

      // Floating Magic Orb
      const orbOffset = Math.sin(this.animCounter * 0.1) * 2;
      ctx.fillStyle = '#c084fc';
      ctx.beginPath();
      ctx.arc(x + (dir === 'left' ? -7 : 7), bodyY + orbOffset, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (role === 'Rogue') {
      // Emerald Cloak & Hood with Dual Daggers
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x - 4, headY, 8, 6); // Hood
      ctx.fillStyle = '#14532d';
      ctx.fillRect(x - 5, bodyY, 10, 7); // Leather tunic

      // Dual Daggers
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(x - 7, bodyY + 2, 2, 5);
      ctx.fillRect(x + 5, bodyY + 2, 2, 5);

      // Legs
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x - 4, legY, 3, isWalk ? 5 : 4);
      ctx.fillRect(x + 1, legY, 3, isWalk ? 4 : 5);
    } else {
      // Cleric: Gold/White Holy Robes & Radiant Staff
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x - 5, bodyY, 10, 8); // White/Gold Robe
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x - 4, headY, 8, 6); // Head

      // Holy Staff
      ctx.fillStyle = '#eab308';
      ctx.fillRect(dir === 'left' ? x - 7 : x + 5, headY - 2, 2, 12);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(dir === 'left' ? x - 8 : x + 4, headY - 4, 4, 3);
    }

    ctx.restore();
  }

  public destroy() {
    window.removeEventListener('keydown', () => {});
    window.removeEventListener('keyup', () => {});
  }
}
