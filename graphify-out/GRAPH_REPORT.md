# Graph Report - .  (2026-08-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 91 nodes · 158 edges · 9 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `41ae57eb`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Console.tsx
- input-store.ts
- palette.ts
- brand.ts
- data.tsx
- index.ts
- text.tsx
- select.tsx
- surface.tsx

## God Nodes (most connected - your core abstractions)
1. `useConsolePressed()` - 6 edges
2. `PixelText()` - 6 edges
3. `useHold()` - 5 edges
4. `ConsoleIntent` - 5 edges
5. `Console()` - 4 edges
6. `DPad()` - 4 edges
7. `ActionButtons()` - 4 edges
8. `StartSelect()` - 4 edges
9. `useStore()` - 4 edges
10. `useConsoleControls()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Console()` --calls--> `useFitScale()`  [EXTRACTED]
  components/console/Console.tsx → components/console/useFitScale.ts
- `useHold()` --calls--> `useConsoleControls()`  [EXTRACTED]
  components/console/Controls.tsx → components/console/useConsoleInput.tsx
- `DPad()` --calls--> `useConsolePressed()`  [EXTRACTED]
  components/console/Controls.tsx → components/console/useConsoleInput.tsx
- `ActionButtons()` --calls--> `useConsolePressed()`  [EXTRACTED]
  components/console/Controls.tsx → components/console/useConsoleInput.tsx
- `StartSelect()` --calls--> `useConsolePressed()`  [EXTRACTED]
  components/console/Controls.tsx → components/console/useConsoleInput.tsx

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "Console.tsx"
Cohesion: 0.19
Nodes (17): Console(), useNeedsRotate(), useOverflowWarning(), ActionButtons(), DPad(), Speaker(), StartSelect(), useHold() (+9 more)

### Community 1 - "input-store.ts"
Cohesion: 0.26
Nodes (11): EMPTY, InputStore, IntentHandler, ConsoleIntent, GAMEPAD_BUTTONS, intentFromKey(), INTENTS, intentsFromAxes() (+3 more)

### Community 2 - "palette.ts"
Cohesion: 0.15
Nodes (12): CONTRAST_FLOOR, contrastContract, CRITICAL_TEXT_FLOOR, criticalText, cssVar, decorative, lantern, LanternColor (+4 more)

### Community 3 - "brand.ts"
Cohesion: 0.22
Nodes (6): brand, CPU_LABEL, DepthId, depths, MULTIPLIERS, seats

### Community 4 - "data.tsx"
Cohesion: 0.25
Nodes (7): BIN_CLASS, BinState, BinStrip(), Chart(), Meter(), Pin(), PinKind

### Community 5 - "index.ts"
Cohesion: 0.52
Nodes (5): FrameName, FRAMES, Marquee(), Sprite(), SpriteAnimation

### Community 6 - "text.tsx"
Cohesion: 0.29
Nodes (6): ROLE, Stat(), TextRole, TextTone, TONE, Value()

### Community 7 - "select.tsx"
Cohesion: 0.33
Nodes (5): List(), Row(), Tabs(), Toggle(), PixelText()

### Community 8 - "surface.tsx"
Cohesion: 0.33
Nodes (5): Dialog(), Field(), Panel(), Scanlines(), Sunk()

## Knowledge Gaps
- **26 isolated node(s):** `brand`, `depths`, `DepthId`, `MULTIPLIERS`, `seats` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ConsoleIntent` connect `input-store.ts` to `Console.tsx`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `brand`, `depths`, `DepthId` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._