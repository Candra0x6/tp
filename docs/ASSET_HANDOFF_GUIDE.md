# Trust Fall: Pixel Asset & Character Handoff Guide

This document provides a comprehensive guide for artists, designers, and developers to update, replace, or migrate Trust Fall's character sprites and environment assets to custom pixel art or Phaser 3 spritesheets.

---

## 1. Character Roster & Sprite Specifications

Trust Fall features 4 distinct playable co-op character roles. Characters are rendered using 4-directional 32x32 px or 16x16 px spritesheets.

### Character Overview

| Character ID | Name | Role | Primary Theme Color | Signature Equipment | Animation States Needed |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `p1` | **VALOR** | Warrior | `#3b82f6` (Blue) | Visor Helmet & Glowing Sword | Idle, Walk (4-dir), Vote/Climb |
| `p2` | **LYRA** | Mage | `#a855f7` (Purple) | Pointy Wizard Hat & Floating Orb | Idle, Walk (4-dir), Cast |
| `p3` | **SHADOW** | Rogue | `#22c55e` (Green) | Emerald Hood & Dual Daggers | Idle, Walk (4-dir), Steal/Vote |
| `p4` | **AURA** | Cleric | `#eab308` (Gold) | Holy Robes & Radiant Staff | Idle, Walk (4-dir), Heal/Climb |

---

## 2. Spritesheet Layout Requirements

For designers producing spritesheets (for Phaser 3 or HTML5 Canvas `drawImage`):

### Recommended Sprite Specs
- **Grid Size per Frame**: `32 x 32 px` (or `16 x 16 px` scaled 2x).
- **Format**: `PNG-32` with alpha transparency (No background).
- **Color Palette**: 16-color retro palette (e.g. Lospec DB32 or custom Game Boy/SNES palette).
- **Pixel Scale**: 1:1 crisp pixel art (Nearest Neighbor scaling, non-anti-aliased).

### Spritesheet Frame Layout (Grid 128x128 px per Character)

```text
Row 0 (y: 0-31px)   : [ Idle Down ]   [ Walk Down 1 ]   [ Walk Down 2 ]   [ Action/Vote ]
Row 1 (y: 32-63px)  : [ Idle Up ]     [ Walk Up 1 ]     [ Walk Up 2 ]     [ Action/Vote ]
Row 2 (y: 64-95px)  : [ Idle Left ]   [ Walk Left 1 ]   [ Walk Left 2 ]   [ Action/Vote ]
Row 3 (y: 96-127px) : [ Idle Right ]  [ Walk Right 1 ]  [ Walk Right 2 ]  [ Action/Vote ]
```

> [!TIP]
> **No JSON Files Required**: If artists deliver uniform grid PNGs (`32x32 px` per frame, `128x128 px` total), neither HTML5 Canvas nor Phaser 3 requires JSON texture atlases. Grid coordinates are calculated programmatically: `sx = frameIndex * 32`, `sy = directionIndex * 32`.

---

## 3. Web Pixel-Perfect Aspect Ratio & Scaling Specifications

To guarantee 100% pixel-accurate rendering on the web without subpixel blur or distortion ("pecah"), follow these width ratio & viewport standards:

### Native Screen & Buffer Resolution
- **Native Resolution**: `320 x 240 px` (Internal Canvas Logical Buffer).
- **Aspect Ratio**: `4:3` (Exact `1.333:1` Width-to-Height Aspect Ratio).
- **Playfield Floor Tilemap Area**: `320 x 172 px` (16 columns × 8.6 rows of `20 x 20 px` tiles).

### Pixel-Accurate Web Display Scaling Rules
1. **Integer Scaling Factors**: Scale the `320 x 240 px` canvas by exact integer multiples in web containers:
   - **1x (Native)**: `320 x 240 px`
   - **2x (Retina / Desktop)**: `640 x 480 px`
   - **3x (Full HD Console)**: `960 x 720 px`
   - **4x (4K Ultra)**: `1280 x 960 px`
2. **CSS Anti-Aliasing Lock**: Force Nearest-Neighbor texture filtering on web `<canvas>` instances:
   ```css
   canvas {
     image-rendering: pixelated;
     image-rendering: crisp-edges;
     -ms-interpolation-mode: nearest-neighbor;
   }
   ```
3. **HTML Canvas Buffer Attributes**: Always retain `<canvas width="320" height="240">` in DOM. Use CSS scale transforms (`scale(N)`) or `useFitScale` for responsive resizing to maintain strict 1:1 pixel grid alignment.

---

## 4. Unified Dungeon Floor Tileset Architecture (6 Biomes)

> [!NOTE]
> **Pillars & Obstacles Removed**: The central pillars have been deleted to allow an open, unobstructed dungeon floor for smooth character navigation and voting.

The dungeon environment is a unified tilemap floor transitioning through 6 floor biomes across 6 levels (1 biome per floor):

| Floor | Biome / Theme Name | Tile Palette Colors | Magic Seal Glow | Ambient Particles |
| :--- | :--- | :--- | :--- | :--- |
| **Floor 1** | **ANCIENT CRYPT** | `#1e293b` / `#152032` (Dark Slate) | Indigo (`#6366f1`) | Fire Embers & Smoke |
| **Floor 2** | **MAGMA CAVERN** | `#2d1212` / `#1a0a0a` (Volcanic Red) | Flame Orange (`#f97316`) | Lava Sparks & Ash |
| **Floor 3** | **FROST TEMPLE** | `#1e3a5f` / `#132640` (Glacial Ice) | Frost Blue (`#38bdf8`) | Snowflakes & Ice Mists |
| **Floor 4** | **EMERALD RUINS** | `#143823` / `#0b2415` (Jungle Moss) | Emerald Green (`#10b981`) | Spores & Glowing Pollen |
| **Floor 5** | **GOLDEN SANCTUM** | `#3a2d0c` / `#241b06` (Gilded Gold) | Sun Yellow (`#facc15`) | Gold Dust & Rays |
| **Floor 6** | **VOID THRONE** | `#280e3b` / `#180726` (Void Purple) | Radiant Purple (`#c084fc`) | Void Orbs & Cosmic Dust |

### Dungeon Grid Specifications
- **Unified Floor Area**: `320 x 160 px` (16 columns x 8 rows of `20 x 20 px` floor tiles).
- **Walls & Boundaries**: Top stone wall (`height: 26px`), Left/Right walls (`width: 12px`), Central Stairs (`50 x 18 px`).

> [!IMPORTANT]
> **Direct Full-Image Background Option (No JSON Tilemap Needed)**:
> Artists can provide 6 individual full-resolution background PNG images (`320 x 240 px` per biome) instead of a Tiled JSON map.
> On the HTML5 Canvas, drawing a single background image using `ctx.drawImage(biomeImage, 0, 0, 320, 240)` will place 100% pixel-perfectly with zero overhead and no JSON configuration required.

---

## 5. Interactive Objects & Props

- **3 Door Archways (`drawHdDoor`)**: `44 x 48 px` (Wood planks, stone arch, rune slot, number plate 1/2/3).
- **Wall Torches (`drawHdTorch`)**: `16 x 32 px` (Wooden wall bracket with 4-frame animated flame cycle).
- **Center Magic Seal**: `64 x 64 px` circular floor rune (x: 160, y: 110).

---

## 6. Integration Guide (Canvas & Phaser 3)

### Option A: Direct HTML5 Canvas Replacement (`TrustFallGame.ts`)

```typescript
// Load character spritesheet
const heroSheet = new Image();
heroSheet.src = '/assets/sprites/characters.png';

// Inside render loop:
private drawHdHero(ctx: CanvasRenderingContext2D, x: number, y: number, roleIndex: number, dir: string, frame: number) {
  const frameWidth = 32;
  const frameHeight = 32;
  const dirRowMap = { down: 0, up: 1, left: 2, right: 3 };
  
  const sx = frame * frameWidth;
  const sy = (roleIndex * 4 + dirRowMap[dir]) * frameHeight;

  ctx.drawImage(
    heroSheet,
    sx, sy, frameWidth, frameHeight, // Source frame
    x - 16, y - 16, frameWidth, frameHeight // Destination canvas
  );
}
```

### Option B: Phaser 3 Loader & Tilemap Setup

```javascript
// Preload Sprites & Dungeon Unified Tileset
function preload() {
  this.load.image('dungeon_tiles', 'assets/tilesets/dungeon_20x20.png');
  this.load.tilemapTiledJSON('dungeon_map', 'assets/maps/floor1.json');
  this.load.spritesheet('hero_valor', 'assets/sprites/valor.png', { frameWidth: 32, frameHeight: 32 });
}

// Create Unified Map & Character Animations
function create() {
  const map = this.make.tilemap({ key: 'dungeon_map' });
  const tileset = map.addTilesetImage('dungeon_tileset', 'dungeon_tiles');
  const floorLayer = map.createLayer('Floor', tileset, 0, 0);

  this.anims.create({
    key: 'valor_walk_down',
    frames: this.anims.generateFrameNumbers('hero_valor', { start: 0, end: 2 }),
    frameRate: 8,
    repeat: -1
  });
}
```

---

## 7. File Delivery Checklist for Artists

- [ ] `valor_warrior_32x32.png` (Warrior Spritesheet)
- [ ] `lyra_mage_32x32.png` (Mage Spritesheet)
- [ ] `shadow_rogue_32x32.png` (Rogue Spritesheet)
- [ ] `aura_cleric_32x32.png` (Cleric Spritesheet)
- [ ] `dungeon_unified_tileset_20x20.png` (6 biome floor tilesets: Crypt, Magma, Frost, Emerald, Golden, Void)
- [ ] `doors_44x48.png` (West, North, East sanctuary doors with states)
- [ ] `torches_16x32.png` (4-frame flame animation sheet)
