// Procedural 8-bit Pixel Art Graphics Engine
// Draws sharp pixel sprites and tilemaps directly on Canvas with crisp edges

export class PixelRenderer {
  // Draw pixel matrix from a string array map
  public static drawPixelMatrix(
    ctx: CanvasRenderingContext2D,
    matrix: string[],
    colorMap: Record<string, string>,
    x: number,
    y: number,
    pixelSize: number = 2
  ) {
    ctx.save();
    for (let r = 0; r < matrix.length; r++) {
      const line = matrix[r];
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char !== '.' && char !== ' ' && colorMap[char]) {
          ctx.fillStyle = colorMap[char];
          ctx.fillRect(x + c * pixelSize, y + r * pixelSize, pixelSize, pixelSize);
        }
      }
    }
    ctx.restore();
  }

  // --- SPRITE DEFINITIONS ---

  // Hero Knight (Facing Down / Left / Right / Up)
  public static drawHero(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    dir: 'down' | 'left' | 'right' | 'up' = 'down',
    frame: number = 0,
    size: number = 2
  ) {
    const isWalk = frame % 2 === 1;
    const bodyColor = '#3b82f6';
    const skinColor = '#ffdbac';
    const hairColor = '#d97706';
    const armorColor = '#94a3b8';
    const darkArmor = '#475569';

    const colors: Record<string, string> = {
      'H': hairColor,
      'S': skinColor,
      'A': armorColor,
      'D': darkArmor,
      'B': bodyColor,
      'E': '#000000',
      'W': '#ffffff',
      'G': '#eab308', // Gold belt
    };

    let matrix: string[] = [];

    if (dir === 'down') {
      matrix = [
        "  HHHHHH  ",
        " HHHHHHHH ",
        " HSSESSEH ",
        "  SSSSSS  ",
        "  AAAAAA  ",
        " AABBBBAA ",
        " AABGGBAA ",
        "  AABBAA  ",
        isWalk ? "  DD  DD  " : "  DDD DDD "
      ];
    } else if (dir === 'up') {
      matrix = [
        "  HHHHHH  ",
        " HHHHHHHH ",
        " HHHHHHHH ",
        "  AAAAAA  ",
        " AAAAAAAA ",
        " AABBBBAA ",
        " AABGGBAA ",
        "  AABBAA  ",
        isWalk ? "  DD  DD  " : "  DDD DDD "
      ];
    } else {
      // left or right
      matrix = [
        "  HHHHH   ",
        " HHHHHH   ",
        " HSE S    ",
        "  SSSS    ",
        "  AAAAA   ",
        " AAABBA   ",
        " AAABGA   ",
        "  AABA    ",
        isWalk ? "  DD D    " : "  DD DD   "
      ];
    }

    ctx.save();
    if (dir === 'left') {
      ctx.translate(x + 10 * size, y);
      ctx.scale(-1, 1);
      this.drawPixelMatrix(ctx, matrix, colors, 0, 0, size);
    } else {
      this.drawPixelMatrix(ctx, matrix, colors, x, y, size);
    }
    ctx.restore();
  }

  // Slime Monster
  public static drawSlime(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: 'green' | 'red' | 'blue' = 'green',
    animOffset: number = 0,
    size: number = 2
  ) {
    const isSquish = Math.floor(animOffset) % 2 === 1;

    let mainColor = '#22c55e';
    let lightColor = '#86efac';
    let darkColor = '#15803d';

    if (color === 'red') {
      mainColor = '#ef4444';
      lightColor = '#fca5a5';
      darkColor = '#b91c1c';
    } else if (color === 'blue') {
      mainColor = '#06b6d4';
      lightColor = '#67e8f9';
      darkColor = '#0e7490';
    }

    const colors: Record<string, string> = {
      'M': mainColor,
      'L': lightColor,
      'D': darkColor,
      'E': '#ffffff',
      'P': '#000000',
    };

    let matrix: string[] = [];

    if (!isSquish) {
      matrix = [
        "   LLLL   ",
        "  LMMMMM  ",
        " LMEPMEPD ",
        " LMMMMMMD ",
        " LMMMMMMD ",
        " DDDDDDDD "
      ];
    } else {
      matrix = [
        "          ",
        "  LLLLLL  ",
        " LMEPMEPD ",
        " LMMMMMMD ",
        " LMMMMMMD ",
        "DDDDDDDDDD"
      ];
    }

    this.drawPixelMatrix(ctx, matrix, colors, x, y, size);
  }

  // Dragon Boss
  public static drawDragon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    frame: number = 0,
    size: number = 3
  ) {
    const flap = Math.floor(frame / 10) % 2 === 1;
    const colors: Record<string, string> = {
      'R': '#dc2626',
      'D': '#991b1b',
      'Y': '#facc15',
      'W': '#ffffff',
      'E': '#000000',
      'O': '#f97316',
      'G': '#4b5563',
    };

    const matrix = flap ? [
      " R      R ",
      "RRR    RRR",
      " RRRRRRRR ",
      " RREWEWRD ",
      " RRRORRRD ",
      "  RRRRRD  ",
      "  YYYYYD  ",
      "  R D R D "
    ] : [
      "RR      RR",
      "RRR    RRR",
      " RRRRRRRR ",
      " RREWEWRD ",
      " RRRORRRD ",
      "  RRRRRD  ",
      "  YYYYYD  ",
      "  RD  RD  "
    ];

    this.drawPixelMatrix(ctx, matrix, colors, x, y, size);
  }

  // Treasure Chest
  public static drawChest(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    isOpen: boolean = false,
    size: number = 2
  ) {
    const colors: Record<string, string> = {
      'W': '#854d0e',
      'L': '#ca8a04',
      'G': '#eab308',
      'D': '#451a03',
      'K': '#000000',
      'S': '#fef08a'
    };

    const matrix = isOpen ? [
      "  SSSSSS  ",
      " SLLLLLL  ",
      "WWWWWWWWWW",
      "W  KGK   W",
      "W  KGK   W",
      "WWWWWWWWWW"
    ] : [
      "WWWWWWWWWW",
      "WLLLLLLLLW",
      "WWWWWWWWWW",
      "W  KGK   W",
      "W  KGK   W",
      "WWWWWWWWWW"
    ];

    this.drawPixelMatrix(ctx, matrix, colors, x, y, size);
  }

  // Pixel Tile Types
  public static drawTile(
    ctx: CanvasRenderingContext2D,
    type: 'grass' | 'water' | 'wall' | 'brick' | 'lava' | 'dirt' | 'sand' | 'cyber',
    x: number,
    y: number,
    tileSize: number = 16,
    animFrame: number = 0
  ) {
    ctx.save();
    if (type === 'grass') {
      ctx.fillStyle = '#15803d';
      ctx.fillRect(x, y, tileSize, tileSize);
      // Grass blades
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(x + 2, y + 3, 2, 4);
      ctx.fillRect(x + 10, y + 8, 2, 4);
      ctx.fillRect(x + 6, y + 12, 2, 3);
      ctx.fillStyle = '#166534';
      ctx.fillRect(x + 3, y + 7, 2, 2);
    } else if (type === 'wall' || type === 'brick') {
      ctx.fillStyle = '#374151';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.fillStyle = '#1f2937';
      // Brick lines
      ctx.fillRect(x, y + 4, tileSize, 1);
      ctx.fillRect(x, y + 9, tileSize, 1);
      ctx.fillRect(x, y + 14, tileSize, 1);
      ctx.fillRect(x + 6, y, 1, 4);
      ctx.fillRect(x + 11, y + 4, 1, 5);
      ctx.fillRect(x + 4, y + 9, 1, 5);
      // Highlights
      ctx.fillStyle = '#4b5563';
      ctx.fillRect(x + 1, y + 1, 4, 2);
      ctx.fillRect(x + 7, y + 5, 3, 2);
    } else if (type === 'water') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.fillStyle = '#38bdf8';
      const wave = Math.sin(animFrame * 0.1 + x * 0.05) * 2;
      ctx.fillRect(x + 2, y + 4 + wave, 6, 2);
      ctx.fillRect(x + 9, y + 11 - wave, 5, 2);
    } else if (type === 'lava') {
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(x + 3, y + 2, 4, 4);
      ctx.fillRect(x + 10, y + 8, 5, 5);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x + 4, y + 3, 2, 2);
    } else if (type === 'dirt') {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(x + 3, y + 4, 3, 3);
      ctx.fillRect(x + 10, y + 10, 4, 3);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(x + 8, y + 2, 2, 2);
    } else if (type === 'sand') {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x + 4, y + 5, 2, 2);
      ctx.fillRect(x + 12, y + 10, 2, 2);
    } else if (type === 'cyber') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(x, y, tileSize, tileSize);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y + 0.5, tileSize - 1, tileSize - 1);
      ctx.fillStyle = '#a855f7';
      ctx.fillRect(x + 7, y + 7, 2, 2);
    }
    ctx.restore();
  }

  // Draw Pixel Dialogue Box
  public static drawDialogueBox(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    speaker: string,
    text: string,
    portraitType?: 'hero' | 'npc' | 'slime' | 'dragon'
  ) {
    ctx.save();
    // Dark pixel border with white inner line
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#1e1b4b'; // Deep blue retro interior
    ctx.fillRect(x + 3, y + 3, width - 6, height - 6);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);

    let textX = x + 12;
    if (portraitType) {
      // Draw Portrait Frame
      ctx.fillStyle = '#000000';
      ctx.fillRect(x + 10, y + 10, 36, 36);
      ctx.fillStyle = '#312e81';
      ctx.fillRect(x + 12, y + 12, 32, 32);

      if (portraitType === 'hero') {
        this.drawHero(ctx, x + 16, y + 14, 'down', 0, 1.8);
      } else if (portraitType === 'slime') {
        this.drawSlime(ctx, x + 16, y + 20, 'green', 0, 2);
      } else if (portraitType === 'dragon') {
        this.drawDragon(ctx, x + 14, y + 16, 0, 1.5);
      }
      textX = x + 54;
    }

    // Speaker Name Tag
    if (speaker) {
      ctx.fillStyle = '#facc15';
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillText(speaker.toUpperCase(), textX, y + 20);
    }

    // Dialogue Body Text (wrap text)
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P", monospace';

    const maxCharsPerLine = Math.floor((width - (textX - x) - 15) / 8);
    const words = text.split(' ');
    let currentLine = '';
    let lineY = y + (speaker ? 34 : 20);

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + (currentLine ? ' ' : '') + words[i];
      if (testLine.length > maxCharsPerLine) {
        ctx.fillText(currentLine, textX, lineY);
        currentLine = words[i];
        lineY += 12;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      ctx.fillText(currentLine, textX, lineY);
    }

    ctx.restore();
  }
}
