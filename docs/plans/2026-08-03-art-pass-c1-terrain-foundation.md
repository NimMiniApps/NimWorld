# Art Pass C1 — Terrain Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the NimWorld plaza ground plan as a circular hub with radial spoke paths enclosed by a water canal, rendered in placeholder colors with terrain-driven collision, with zero PixelLab spend.

**Architecture:** The existing semantic-grid → dual-grid Wang resolver → Phaser tilemap pipeline is kept intact. Two new cell types (`TERRAIN_WATER`, `TERRAIN_PATH`) are added, the Wang resolver's hardcoded stone predicate becomes an optional parameter so the same math drives three binary layers, `buildPlazaTerrainGrid()` is rewritten to stamp a hub + spokes + elliptical canal, and a new module emits run-merged static collision bodies for water.

**Tech Stack:** TypeScript, Vue 3, Phaser 3, Vitest.

**Spec:** `docs/plans/2026-08-03-art-pass-c-design.md`

## Global Constraints

- **No PixelLab generations in C1.** Water and path render with existing placeholder textures. Art arrives in C2.
- **Mobile-first.** No new HUD panels, no desktop-only layout.
- **No mock data surfaces** for chat, XP, leaderboards, events, or any feature owned by `docs/ROADMAP.md` Phases 1–4.
- **Keep the six existing location IDs**: `fountain`, `arcade`, `arena`, `marketplace`, `social-club`, `town-hall`. No renaming.
- **`TERRAIN_TILE` stays 32.** Grid grows to `TERRAIN_COLS = 36`, `TERRAIN_ROWS = 27`.
- **World size becomes 1152 × 864.**
- Wang ownership (`tile-owns-NW`) and the out-of-bounds-is-lower rule in `terrainTopology.ts` are unchanged.
- Run all tests with `npm test -w @nimworld/web`. A single file: `npx vitest run src/game/world/<file>.test.ts --root apps/web`.

---

## File Structure

| File | Responsibility | Change |
| --- | --- | --- |
| `apps/web/src/game/world/terrainTypes.ts` | Cell type constants, family predicates, grid dimensions | Modify |
| `apps/web/src/game/world/terrainTypes.test.ts` | Constants and predicate tests | Modify |
| `apps/web/src/game/world/terrainResolver.ts` | Dual-grid Wang resolve | Modify (optional predicate param) |
| `apps/web/src/game/world/locations.ts` | Landmark coords, `WORLD`, `VIEW_FRAME`, `DECOR`, `FUTURE_LANDMARKS` | Modify |
| `apps/web/src/game/world/plazaTerrainMap.ts` | Stamp helpers + `buildPlazaTerrainGrid()` + flood fill | Modify |
| `apps/web/src/game/world/plazaTerrainMap.test.ts` | Layout assertions | Modify |
| `apps/web/src/game/world/terrainCollision.ts` | Run-merged blocking rects from the grid | **Create** |
| `apps/web/src/game/world/terrainCollision.test.ts` | Collision merge tests | **Create** |
| `apps/web/src/game/scenes/PlazaScene.ts` | Renders layers, adds colliders | Modify |

`terrainQa.ts` and `terrainTopology.ts` are **not** touched. `terrainQa.ts` inspects decoded tileset pixels — unrelated to layout.

---

## Task 1: New terrain cell types

**Files:**
- Modify: `apps/web/src/game/world/terrainTypes.ts`
- Test: `apps/web/src/game/world/terrainTypes.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `TERRAIN_WATER = 4`, `TERRAIN_PATH = 5`, `TerrainCell = 0|1|2|3|4|5`, `TERRAIN_COLS = 36`, `TERRAIN_ROWS = 27`, `isPath(cell: number): boolean`, `isWater(cell: number): boolean`, `isWalkable(cell: number): boolean`. `isStoneFamily` keeps its current three members.

- [ ] **Step 1: Write the failing test**

Replace the whole body of `apps/web/src/game/world/terrainTypes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  TERRAIN_GRASS,
  TERRAIN_PLAZA,
  TERRAIN_ENTRANCE,
  TERRAIN_CONSTRUCTION,
  TERRAIN_WATER,
  TERRAIN_PATH,
  TERRAIN_COLS,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  isStoneFamily,
  isPath,
  isWater,
  isWalkable,
} from './terrainTypes'

describe('terrainTypes', () => {
  it('uses a 36×27 grid of 32px cells covering the 1152×864 world', () => {
    expect(TERRAIN_COLS).toBe(36)
    expect(TERRAIN_ROWS).toBe(27)
    expect(TERRAIN_TILE).toBe(32)
    expect(TERRAIN_COLS * TERRAIN_TILE).toBe(1152)
    expect(TERRAIN_ROWS * TERRAIN_TILE).toBe(864)
  })

  it('treats plaza/entrance/construction as stone family', () => {
    expect(isStoneFamily(TERRAIN_GRASS)).toBe(false)
    expect(isStoneFamily(TERRAIN_PLAZA)).toBe(true)
    expect(isStoneFamily(TERRAIN_ENTRANCE)).toBe(true)
    expect(isStoneFamily(TERRAIN_CONSTRUCTION)).toBe(true)
  })

  it('keeps path out of the stone family so it gets its own Wang layer', () => {
    expect(isStoneFamily(TERRAIN_PATH)).toBe(false)
    expect(isPath(TERRAIN_PATH)).toBe(true)
    expect(isPath(TERRAIN_PLAZA)).toBe(false)
  })

  it('identifies water', () => {
    expect(isWater(TERRAIN_WATER)).toBe(true)
    expect(isWater(TERRAIN_GRASS)).toBe(false)
  })

  it('treats water as the only impassable terrain', () => {
    expect(isWalkable(TERRAIN_WATER)).toBe(false)
    expect(isWalkable(TERRAIN_GRASS)).toBe(true)
    expect(isWalkable(TERRAIN_PATH)).toBe(true)
    expect(isWalkable(TERRAIN_PLAZA)).toBe(true)
    expect(isWalkable(TERRAIN_ENTRANCE)).toBe(true)
    expect(isWalkable(TERRAIN_CONSTRUCTION)).toBe(true)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/world/terrainTypes.test.ts --root apps/web`
Expected: FAIL — `TERRAIN_WATER` / `isPath` / `isWater` / `isWalkable` are not exported, and `TERRAIN_COLS` is 30.

- [ ] **Step 3: Write minimal implementation**

Replace the whole body of `apps/web/src/game/world/terrainTypes.ts`:

```ts
export const TERRAIN_GRASS = 0
export const TERRAIN_PLAZA = 1
export const TERRAIN_ENTRANCE = 2
export const TERRAIN_CONSTRUCTION = 3
export const TERRAIN_WATER = 4
export const TERRAIN_PATH = 5

export type TerrainCell = 0 | 1 | 2 | 3 | 4 | 5

export const TERRAIN_TILE = 32
export const TERRAIN_COLS = 36
export const TERRAIN_ROWS = 27

/**
 * Paved stone: the hub, landmark landings, and construction pads.
 * Path is deliberately excluded — it is a separate Wang layer with its own
 * tileset, and folding it in here would render hub and spokes identically.
 */
export function isStoneFamily(cell: number): boolean {
  return cell === TERRAIN_PLAZA || cell === TERRAIN_ENTRANCE || cell === TERRAIN_CONSTRUCTION
}

export function isPath(cell: number): boolean {
  return cell === TERRAIN_PATH
}

export function isWater(cell: number): boolean {
  return cell === TERRAIN_WATER
}

/** Water is the only impassable terrain; the border wall is props + world bounds. */
export function isWalkable(cell: number): boolean {
  return cell !== TERRAIN_WATER
}

export function createEmptyTerrainGrid(): TerrainCell[][] {
  return Array.from({ length: TERRAIN_ROWS }, () =>
    Array.from({ length: TERRAIN_COLS }, () => TERRAIN_GRASS as TerrainCell),
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/world/terrainTypes.test.ts --root apps/web`
Expected: PASS (5 tests).

Other suites will now fail — `plazaTerrainMap.test.ts` asserts the old grid size. That is expected and fixed in Task 4.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/game/world/terrainTypes.ts apps/web/src/game/world/terrainTypes.test.ts
git commit -m "feat(web): add water and path terrain cell types

Grid grows to 36x27 (1152x864 world) to fit a circular hub with radial
spokes and an enclosing canal. Path stays out of the stone family so it
resolves as its own Wang layer."
```

---

## Task 2: Parameterize the Wang resolver

**Files:**
- Modify: `apps/web/src/game/world/terrainResolver.ts`
- Test: `apps/web/src/game/world/terrainResolver.test.ts` (append only — existing tests must keep passing untouched)

**Interfaces:**
- Consumes: `TerrainCell`, `isStoneFamily`, `isPath`, `isWater` from Task 1.
- Produces: `type CellPredicate = (cell: TerrainCell) => boolean`; `resolveCornerMask(grid, col, row, isUpper?: CellPredicate)`, `resolveTileIndex(grid, col, row, isUpper?: CellPredicate)`, `resolveTerrainLayer(grid, isUpper?: CellPredicate)`. The predicate is **optional and defaults to `isStoneFamily`** so the ~25 existing call sites in `terrainResolver.test.ts` compile and pass unchanged.

- [ ] **Step 1: Write the failing test**

Append to `apps/web/src/game/world/terrainResolver.test.ts` (inside the outermost `describe`, or as a new top-level `describe` at the end of the file):

```ts
describe('resolver predicate parameter', () => {
  it('defaults to the stone family when no predicate is given', () => {
    const grid: TerrainCell[][] = [
      [TERRAIN_PLAZA, TERRAIN_GRASS],
      [TERRAIN_GRASS, TERRAIN_GRASS],
    ]
    expect(resolveCornerMask(grid, 0, 0)).toBe(CORNER_NW)
  })

  it('resolves a water layer when given the water predicate', () => {
    const grid: TerrainCell[][] = [
      [TERRAIN_WATER, TERRAIN_GRASS],
      [TERRAIN_GRASS, TERRAIN_GRASS],
    ]
    // Water is upper for this layer; stone family sees nothing.
    expect(resolveCornerMask(grid, 0, 0, isWater)).toBe(CORNER_NW)
    expect(resolveCornerMask(grid, 0, 0)).toBe(0)
  })

  it('resolves a path layer independently of stone', () => {
    const grid: TerrainCell[][] = [
      [TERRAIN_PATH, TERRAIN_PLAZA],
      [TERRAIN_GRASS, TERRAIN_GRASS],
    ]
    expect(resolveCornerMask(grid, 0, 0, isPath)).toBe(CORNER_NW)
    expect(resolveCornerMask(grid, 0, 0, isStoneFamily)).toBe(CORNER_NE)
  })

  it('applies the predicate across a whole layer', () => {
    const grid: TerrainCell[][] = [
      [TERRAIN_WATER, TERRAIN_WATER],
      [TERRAIN_WATER, TERRAIN_WATER],
    ]
    const layer = resolveTerrainLayer(grid, isWater)
    expect(layer).toHaveLength(2)
    expect(layer[0]).toHaveLength(2)
    // Top-left display tile has all four corners water.
    expect(layer[0]![0]).toBe(resolveTileIndex(grid, 0, 0, isWater))
  })
})
```

Add the imports this block needs to the existing import statements at the top of the file — `TERRAIN_WATER`, `TERRAIN_PATH`, `TERRAIN_PLAZA`, `TERRAIN_GRASS`, `isWater`, `isPath`, `isStoneFamily`, `type TerrainCell` from `./terrainTypes`, and `CORNER_NW` / `CORNER_NE` from `./terrainTopology`. Several are likely imported already — do not duplicate them.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/world/terrainResolver.test.ts --root apps/web`
Expected: FAIL — `resolveCornerMask` takes 3 arguments, and the water/path cases resolve to 0.

- [ ] **Step 3: Write minimal implementation**

Replace the whole body of `apps/web/src/game/world/terrainResolver.ts`:

```ts
import { isStoneFamily, type TerrainCell } from './terrainTypes'
import {
  CORNER_NE,
  CORNER_NW,
  CORNER_SE,
  CORNER_SW,
  wangToArrayIndex,
} from './terrainTopology'

/**
 * Dual-grid Wang resolver, shared by every terrain layer.
 *
 * Ownership (locked in terrainTopology.ts as `tile-owns-NW`):
 *   NW ← cell(col, row) · NE ← cell(col+1, row)
 *   SW ← cell(col, row+1) · SE ← cell(col+1, row+1)
 * Out of bounds = lower. No majority voting.
 *
 * `isUpper` selects which cell family counts as the upper terrain, so the
 * same corner math drives the stone, path, and water layers. It defaults to
 * the stone family, which is what every pre-existing caller means.
 */
export type CellPredicate = (cell: TerrainCell) => boolean

function cellIsUpper(
  grid: TerrainCell[][],
  col: number,
  row: number,
  isUpper: CellPredicate,
): boolean {
  if (row < 0 || col < 0 || row >= grid.length) return false
  const line = grid[row]
  if (!line || col >= line.length) return false
  return isUpper(line[col]!)
}

/** Wang corner mask 0–15 for the display tile at (col, row). */
export function resolveCornerMask(
  grid: TerrainCell[][],
  col: number,
  row: number,
  isUpper: CellPredicate = isStoneFamily,
): number {
  let mask = 0
  if (cellIsUpper(grid, col, row, isUpper)) mask |= CORNER_NW
  if (cellIsUpper(grid, col + 1, row, isUpper)) mask |= CORNER_NE
  if (cellIsUpper(grid, col, row + 1, isUpper)) mask |= CORNER_SW
  if (cellIsUpper(grid, col + 1, row + 1, isUpper)) mask |= CORNER_SE
  return mask
}

/** Spritesheet array index 0–15 for the display tile at (col, row). */
export function resolveTileIndex(
  grid: TerrainCell[][],
  col: number,
  row: number,
  isUpper: CellPredicate = isStoneFamily,
): number {
  return wangToArrayIndex(resolveCornerMask(grid, col, row, isUpper))
}

/** Full layer of spritesheet array indexes matching the semantic grid shape. */
export function resolveTerrainLayer(
  grid: TerrainCell[][],
  isUpper: CellPredicate = isStoneFamily,
): number[][] {
  const rows = grid.length
  const cols = rows > 0 ? (grid[0]?.length ?? 0) : 0
  const layer: number[][] = []
  for (let r = 0; r < rows; r++) {
    const out: number[] = []
    for (let c = 0; c < cols; c++) {
      out.push(resolveTileIndex(grid, c, r, isUpper))
    }
    layer.push(out)
  }
  return layer
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/world/terrainResolver.test.ts --root apps/web`
Expected: PASS — both the four new tests and every pre-existing test in the file.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/game/world/terrainResolver.ts apps/web/src/game/world/terrainResolver.test.ts
git commit -m "refactor(web): parameterize the Wang resolver's upper-terrain predicate

One corner-math implementation now drives the stone, path, and water
layers. The predicate defaults to isStoneFamily so existing callers are
unchanged."
```

---

## Task 3: Reposition the world onto the compass

**Files:**
- Modify: `apps/web/src/game/world/locations.ts`
- Test: `apps/web/src/game/world/locations.test.ts` (verify unchanged — it asserts only interaction radii)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `WORLD = { width: 1152, height: 864, padding: 24 }`, `PLAZA_CENTER = { x: 576, y: 432 }`, `SPAWN_POINT = { x: 576, y: 592 }`, repositioned `LOCATIONS`, rescaled `FUTURE_LANDMARKS` and `DECOR`. Location `id`, `label`, `radius`, `collideW`, `collideH`, `texture`, `subtitle`, and `accent` values are all unchanged — **only `x` and `y` move.**

Landmarks sit at roughly 9.5 cells (~300px) from center, well inside the canal at ~11.5 cells.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/game/world/worldLayout.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { LOCATIONS, PLAZA_CENTER, SPAWN_POINT, VIEW_FRAME, WORLD, DECOR } from './locations'
import { TERRAIN_COLS, TERRAIN_ROWS, TERRAIN_TILE } from './terrainTypes'

describe('world layout', () => {
  it('matches the terrain grid footprint', () => {
    expect(WORLD.width).toBe(TERRAIN_COLS * TERRAIN_TILE)
    expect(WORLD.height).toBe(TERRAIN_ROWS * TERRAIN_TILE)
  })

  it('centers the plaza in the world', () => {
    expect(PLAZA_CENTER).toEqual({ x: WORLD.width / 2, y: WORLD.height / 2 })
  })

  it('never shows the whole world at once', () => {
    expect(VIEW_FRAME.width).toBeLessThan(WORLD.width)
    expect(VIEW_FRAME.height).toBeLessThan(WORLD.height)
  })

  it('places every landmark inside the canal radius', () => {
    // Canal inner edge is 11 cells from center; landmarks must stay inside it.
    const maxRadius = 11 * TERRAIN_TILE
    for (const loc of LOCATIONS) {
      const dx = loc.x - PLAZA_CENTER.x
      const dy = loc.y - PLAZA_CENTER.y
      expect(Math.hypot(dx, dy), `${loc.id} distance from center`).toBeLessThan(maxRadius)
    }
  })

  it('arranges landmarks on distinct compass bearings', () => {
    const bearings = LOCATIONS.filter((l) => l.id !== 'fountain').map((l) =>
      Math.round(
        (Math.atan2(l.y - PLAZA_CENTER.y, l.x - PLAZA_CENTER.x) * 180) / Math.PI,
      ),
    )
    expect(new Set(bearings).size).toBe(bearings.length)
  })

  it('spawns the player south of the fountain, inside the world', () => {
    expect(SPAWN_POINT.x).toBe(PLAZA_CENTER.x)
    expect(SPAWN_POINT.y).toBeGreaterThan(PLAZA_CENTER.y)
    expect(SPAWN_POINT.y).toBeLessThan(WORLD.height)
  })

  it('keeps every decor prop inside the world bounds', () => {
    for (const prop of DECOR) {
      expect(prop.x, `${prop.key} x`).toBeGreaterThanOrEqual(0)
      expect(prop.x, `${prop.key} x`).toBeLessThanOrEqual(WORLD.width)
      expect(prop.y, `${prop.key} y`).toBeGreaterThanOrEqual(0)
      expect(prop.y, `${prop.key} y`).toBeLessThanOrEqual(WORLD.height)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/world/worldLayout.test.ts --root apps/web`
Expected: FAIL — `WORLD.width` is 960, not 1152.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/src/game/world/locations.ts`, replace the `WORLD`, `VIEW_FRAME`, and `PLAZA_CENTER` declarations:

```ts
/** Compact world bounds — physics / scroll limits. Matches the 36×27 terrain grid. */
export const WORLD = {
  width: 1152,
  height: 864,
  padding: 24,
}

/**
 * Content frame used for cover-zoom. Tighter than WORLD so the paved plaza
 * fills the viewport instead of showing large empty grass/water margins.
 * Sized so the player never sees the entire world at once.
 */
export const VIEW_FRAME = {
  width: 780,
  height: 600,
}

export const PLAZA_CENTER = { x: 576, y: 432 }
```

Then update **only the `x` and `y`** of each entry in `LOCATIONS` — leave every other field exactly as it is:

| id | x | y | bearing |
| --- | ---: | ---: | --- |
| `fountain` | `PLAZA_CENTER.x` | `PLAZA_CENTER.y + 8` | center |
| `arcade` | `576` | `150` | N |
| `arena` | `210` | `400` | W |
| `marketplace` | `942` | `400` | E |
| `social-club` | `280` | `700` | SW |
| `town-hall` | `872` | `700` | SE |

Update the spawn point:

```ts
export const SPAWN_POINT = { x: PLAZA_CENTER.x, y: PLAZA_CENTER.y + 160 }
```

Rescale `FUTURE_LANDMARKS` positions for the larger world (× 1.2, matching 1152/960 and 864/720):

| id | x | y |
| --- | ---: | ---: |
| `harbor` | `576` | `814` |
| `mountain` | `576` | `50` |
| `tunnel` | `58` | `432` |

For `DECOR`, do **not** hand-place 40+ props against the new layout — C3 redoes placement against real art. Scale the existing list and drop anything that would land in the canal. Replace the `export const DECOR = [...]` declaration with a scaled derivation, keeping the original array as the source data:

```ts
/** Prop placements authored against the original 960×720 plaza. */
const DECOR_960: Array<{ key: string; x: number; y: number; depthBias?: number }> = [
  // ...the entire existing DECOR array body, unchanged...
]

/**
 * ponytail: uniform 1.2× rescale of the original placements, not a fresh
 * composition. C3 re-authors prop placement against the new layout with real
 * art; this only keeps props on-screen and out of the canal until then.
 */
const DECOR_SCALE = 1.2
const CANAL_INNER_RADIUS = 11 * 32

export const DECOR = DECOR_960.map((p) => ({
  ...p,
  x: Math.round(p.x * DECOR_SCALE),
  y: Math.round(p.y * DECOR_SCALE),
})).filter((p) => Math.hypot(p.x - PLAZA_CENTER.x, p.y - PLAZA_CENTER.y) < CANAL_INNER_RADIUS)
```

Rename the existing `export const DECOR: Array<...> = [` line to `const DECOR_960: Array<...> = [` and leave its contents alone.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/world/worldLayout.test.ts src/game/world/locations.test.ts --root apps/web`
Expected: PASS. `locations.test.ts` asserts only interaction radii, which did not change.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/game/world/locations.ts apps/web/src/game/world/worldLayout.test.ts
git commit -m "feat(web): reposition landmarks onto compass bearings

World grows to 1152x864. Five landmarks sit on distinct bearings around a
centered hub, inside the canal radius. Decor props are rescaled 1.2x and
canal-filtered as a stopgap; C3 re-authors placement."
```

---

## Task 4: Stamp the hub, spokes, and canal

**Files:**
- Modify: `apps/web/src/game/world/plazaTerrainMap.ts`
- Test: `apps/web/src/game/world/plazaTerrainMap.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1 and 3.
- Produces: `stampOutsideEllipse(grid, col, row, rx, ry, value)`, `floodReachable(grid, startCol, startRow, passable: CellPredicate): Set<string>`, and a rewritten `buildPlazaTerrainGrid()`. **`stoneFloodReachable` is removed** — its only consumer is `plazaTerrainMap.test.ts`, updated in this task.

Layout constants, in cell space, center cell `(18, 13)`:

| Element | Value |
| --- | --- |
| Hub disk radius | 5 cells |
| Spoke half-width | 1 cell |
| Canal ellipse | `rx = 16`, `ry = 11.5` — outside it is water |
| Landing pads | Arcade 5×3, Arena 4×3, Marketplace 2×2 (`TERRAIN_CONSTRUCTION`), Social Club 3×2, Town Hall 3×3 |

- [ ] **Step 1: Write the failing test**

Replace the `describe('plazaTerrainMap', ...)` block in `apps/web/src/game/world/plazaTerrainMap.test.ts` with the following, and update the imports at the top of the file to pull `TERRAIN_WATER`, `TERRAIN_PATH`, `isWalkable`, `isPath` from `./terrainTypes` and `floodReachable` (not `stoneFloodReachable`) from `./plazaTerrainMap`. Keep the existing `toCell`, `countStoneInDisk`, `findLandingNear`, and `countKindNear` helpers — they are still used.

```ts
describe('plazaTerrainMap', () => {
  it('builds a TERRAIN_ROWS × TERRAIN_COLS semantic grid', () => {
    const grid = buildPlazaTerrainGrid()
    expect(grid).toHaveLength(TERRAIN_ROWS)
    expect(grid.every((row) => row.length === TERRAIN_COLS)).toBe(true)
  })

  it('paves a circular hub around the fountain', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    expect(isStoneFamily(grid[fc.r]![fc.c]!)).toBe(true)
    // Disk radius 5 → 81 cells; assert most of a radius-4 sample is stone.
    expect(countStoneInDisk(grid, fc.c, fc.r, 4)).toBeGreaterThan(40)
  })

  it('reaches every landmark landing from the hub across stone and path', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    const passable = (cell: TerrainCell) => isStoneFamily(cell) || isPath(cell)
    const reachable = floodReachable(grid, fc.c, fc.r, passable)

    const landings: Array<{ id: string; kinds: number[] }> = [
      { id: 'arcade', kinds: [TERRAIN_ENTRANCE] },
      { id: 'arena', kinds: [TERRAIN_ENTRANCE] },
      { id: 'town-hall', kinds: [TERRAIN_ENTRANCE] },
      { id: 'social-club', kinds: [TERRAIN_ENTRANCE] },
      { id: 'marketplace', kinds: [TERRAIN_CONSTRUCTION] },
    ]

    for (const { id, kinds } of landings) {
      const loc = LOCATIONS.find((l) => l.id === id)!
      const near = toCell(loc.x, loc.y)
      const landing = findLandingNear(grid, near.c, near.r, new Set(kinds))
      expect(landing, `expected landing near ${id}`).not.toBeNull()
      expect(reachable.has(`${landing!.c},${landing!.r}`), `${id} landing reachable`).toBe(true)
    }
  })

  it('gives each landmark a landing pad sized for its role', () => {
    const grid = buildPlazaTerrainGrid()

    const regions: Array<{ id: string; kind: number; minCells: number }> = [
      { id: 'arcade', kind: TERRAIN_ENTRANCE, minCells: 15 }, // 5×3
      { id: 'arena', kind: TERRAIN_ENTRANCE, minCells: 12 }, // 4×3
      { id: 'town-hall', kind: TERRAIN_ENTRANCE, minCells: 9 }, // 3×3
      { id: 'social-club', kind: TERRAIN_ENTRANCE, minCells: 6 }, // 3×2
      { id: 'marketplace', kind: TERRAIN_CONSTRUCTION, minCells: 4 }, // 2×2
    ]

    for (const { id, kind, minCells } of regions) {
      const loc = LOCATIONS.find((l) => l.id === id)!
      const near = toCell(loc.x, loc.y)
      const count = countKindNear(grid, near.c, near.r, kind)
      expect(count, `${id} landing cells`).toBeGreaterThanOrEqual(minCells)
    }
  })

  it('connects the hub to each landmark with a path spoke', () => {
    const grid = buildPlazaTerrainGrid()
    const paths = grid.flat().filter((c) => isPath(c)).length
    expect(paths).toBeGreaterThan(60)
  })

  it('keeps water out of the hub and off every spoke', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    for (let dr = -5; dr <= 5; dr++) {
      for (let dc = -5; dc <= 5; dc++) {
        if (dc * dc + dr * dr > 25) continue
        expect(grid[fc.r + dr]![fc.c + dc]).not.toBe(TERRAIN_WATER)
      }
    }
    // No cell is both path and water — they are distinct values, but assert
    // the canal never overwrote a spoke.
    const pathCells = grid.flat().filter((c) => c === TERRAIN_PATH).length
    const waterCells = grid.flat().filter((c) => c === TERRAIN_WATER).length
    expect(pathCells).toBeGreaterThan(0)
    expect(waterCells).toBeGreaterThan(0)
  })

  it('encloses the plaza with a canal the player cannot walk around', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    // Walking over any non-water cell from the hub must not reach the world edge.
    const reachable = floodReachable(grid, fc.c, fc.r, isWalkable)
    let touchesEdge = false
    for (const key of reachable) {
      const [c, r] = key.split(',').map(Number)
      if (c === 0 || r === 0 || c === TERRAIN_COLS - 1 || r === TERRAIN_ROWS - 1) {
        touchesEdge = true
        break
      }
    }
    expect(touchesEdge, 'canal ring has a gap to the world edge').toBe(false)
  })

  it('does not pave the entire world with stone', () => {
    const grid = buildPlazaTerrainGrid()
    const total = TERRAIN_ROWS * TERRAIN_COLS
    const stone = grid.flat().filter((c) => isStoneFamily(c)).length
    expect(stone).toBeGreaterThan(0)
    expect(stone / total).toBeLessThan(0.4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/world/plazaTerrainMap.test.ts --root apps/web`
Expected: FAIL — `floodReachable` is not exported, and there are no water or path cells.

- [ ] **Step 3: Write minimal implementation**

In `apps/web/src/game/world/plazaTerrainMap.ts`:

Update the imports to add `TERRAIN_WATER`, `TERRAIN_PATH`, and `type CellPredicate` (from `./terrainResolver`). Keep `stampDisk`, `stampLandingPad`, `stampCurve`, and `toCell` exactly as they are.

Add the ring helper next to the other stamp helpers:

```ts
/**
 * Fill everything outside an ellipse. Elliptical rather than circular because
 * the world is wider than it is tall — a circle would leave large dead grass
 * margins at the left and right edges.
 *
 * ponytail: fills to the world edge rather than stamping a fixed-width ring.
 * A ring would need a second walkable-margin check to stop the player
 * slipping behind it; "outside is water" is sealed by construction. The
 * visible band is bounded by the camera, not by a thickness parameter.
 */
function stampOutsideEllipse(
  grid: TerrainCell[][],
  col: number,
  row: number,
  rx: number,
  ry: number,
  value: TerrainCell,
): void {
  for (let r = 0; r < TERRAIN_ROWS; r++) {
    for (let c = 0; c < TERRAIN_COLS; c++) {
      const dx = c - col
      const dy = r - row
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) >= 1) grid[r]![c] = value
    }
  }
}
```

Replace `stoneFloodReachable` with a predicate-taking version:

```ts
/** BFS over cells matching `passable`; keys are `"col,row"`. */
export function floodReachable(
  grid: TerrainCell[][],
  startCol: number,
  startRow: number,
  passable: CellPredicate,
): Set<string> {
  const seen = new Set<string>()
  if (startRow < 0 || startCol < 0 || startRow >= grid.length || startCol >= grid[0]!.length) {
    return seen
  }
  if (!passable(grid[startRow]![startCol]!)) return seen

  const queue: Array<[number, number]> = [[startCol, startRow]]
  seen.add(`${startCol},${startRow}`)
  const dirs: Array<[number, number]> = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]

  while (queue.length > 0) {
    const [c, r] = queue.shift()!
    for (const [dc, dr] of dirs) {
      const nc = c + dc
      const nr = r + dr
      const key = `${nc},${nr}`
      if (seen.has(key)) continue
      if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0]!.length) continue
      if (!passable(grid[nr]![nc]!)) continue
      seen.add(key)
      queue.push([nc, nr])
    }
  }
  return seen
}
```

Replace `buildPlazaTerrainGrid` entirely:

```ts
/** Hub radius in cells. */
const HUB_RADIUS = 5
/** Canal ellipse, in cells from the center cell. Outside it is water. */
const CANAL_RX = 16
const CANAL_RY = 11.5

/**
 * Circular hub with radial path spokes to each landmark, enclosed by a canal.
 * Semantic cells for Wang dual-grid sampling (not autotile masks).
 */
export function buildPlazaTerrainGrid(): TerrainCell[][] {
  const grid = createEmptyTerrainGrid()

  const center = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)

  // Canal first — everything paved afterwards wins over water, which
  // guarantees no spoke or landing can be drowned by the ring.
  stampOutsideEllipse(grid, center.c, center.r, CANAL_RX, CANAL_RY, TERRAIN_WATER)

  // Spokes: straight paths from hub edge to each landmark.
  const spokes: Array<{ id: string; pad: { w: number; h: number }; kind: TerrainCell }> = [
    { id: 'arcade', pad: { w: 5, h: 3 }, kind: TERRAIN_ENTRANCE },
    { id: 'arena', pad: { w: 4, h: 3 }, kind: TERRAIN_ENTRANCE },
    { id: 'marketplace', pad: { w: 2, h: 2 }, kind: TERRAIN_CONSTRUCTION },
    { id: 'social-club', pad: { w: 3, h: 2 }, kind: TERRAIN_ENTRANCE },
    { id: 'town-hall', pad: { w: 3, h: 3 }, kind: TERRAIN_ENTRANCE },
  ]

  for (const { id, pad, kind } of spokes) {
    const loc = LOCATIONS.find((l) => l.id === id)!
    // bulge 0 → straight spoke.
    stampCurve(grid, PLAZA_CENTER.x, PLAZA_CENTER.y, loc.x, loc.y, 0, 1, TERRAIN_PATH, 32)
    const cell = toCell(loc.x, loc.y)
    stampLandingPad(grid, cell.c, cell.r, pad.w, pad.h, kind)
  }

  // Spawn approach — a sixth spoke running south from the hub.
  stampCurve(
    grid,
    PLAZA_CENTER.x,
    PLAZA_CENTER.y,
    SPAWN_POINT.x,
    SPAWN_POINT.y,
    0,
    1,
    TERRAIN_PATH,
    16,
  )

  // Hub last so it always reads as one clean disk over the spoke stubs.
  stampDisk(grid, center.c, center.r, HUB_RADIUS, TERRAIN_PLAZA)

  return grid
}
```

Note `stampCurve` applies a `Math.sin` jitter to its samples. With `bulge: 0` that jitter still gives the spokes a slight organic waver, which is desirable — perfectly straight spokes read as sterile. If a spoke visibly misses its landing pad in Task 6's visual check, reduce the jitter amplitude in `stampCurve` from `6` to `2` rather than removing it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/world/plazaTerrainMap.test.ts --root apps/web`
Expected: PASS (8 tests).

If "encloses the plaza" fails, a spoke or landing pad has punched through the canal into the outer water — shrink `CANAL_RX` / `CANAL_RY`, or move the offending landmark closer to center in `locations.ts`. If "does not pave the entire world with stone" fails, reduce `HUB_RADIUS`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/game/world/plazaTerrainMap.ts apps/web/src/game/world/plazaTerrainMap.test.ts
git commit -m "feat(web): stamp circular hub, radial spokes, and enclosing canal

Replaces the cross-shaped slab. Canal is stamped first so paving always
wins over water. stoneFloodReachable becomes floodReachable with a
passability predicate."
```

---

## Task 5: Terrain collision with run merging

**Files:**
- Create: `apps/web/src/game/world/terrainCollision.ts`
- Test: `apps/web/src/game/world/terrainCollision.test.ts`

**Interfaces:**
- Consumes: `TerrainCell`, `TERRAIN_TILE`, `isWater` from Task 1; `CellPredicate` from Task 2.
- Produces: `type BlockingRect = { x: number; y: number; width: number; height: number }` (world-space, top-left origin) and `buildBlockingRects(grid: TerrainCell[][], isBlocking?: CellPredicate): BlockingRect[]`, defaulting to `isWater`.

This is the one genuinely new mechanism in C1: `PlazaScene` currently collides only against landmark rectangles and world bounds, so grass is freely walkable and no terrain has ever blocked movement.

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/game/world/terrainCollision.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildBlockingRects } from './terrainCollision'
import {
  TERRAIN_GRASS,
  TERRAIN_WATER,
  TERRAIN_TILE,
  type TerrainCell,
} from './terrainTypes'

const G = TERRAIN_GRASS as TerrainCell
const W = TERRAIN_WATER as TerrainCell

describe('buildBlockingRects', () => {
  it('returns nothing for a grid with no water', () => {
    expect(buildBlockingRects([[G, G], [G, G]])).toEqual([])
  })

  it('emits one rect per water cell when they are isolated', () => {
    const rects = buildBlockingRects([[W, G], [G, W]])
    expect(rects).toHaveLength(2)
    expect(rects[0]).toEqual({ x: 0, y: 0, width: TERRAIN_TILE, height: TERRAIN_TILE })
    expect(rects[1]).toEqual({
      x: TERRAIN_TILE,
      y: TERRAIN_TILE,
      width: TERRAIN_TILE,
      height: TERRAIN_TILE,
    })
  })

  it('merges a horizontal run into a single rect', () => {
    const rects = buildBlockingRects([[W, W, W, G]])
    expect(rects).toHaveLength(1)
    expect(rects[0]).toEqual({ x: 0, y: 0, width: TERRAIN_TILE * 3, height: TERRAIN_TILE })
  })

  it('breaks runs at gaps and at row ends', () => {
    const rects = buildBlockingRects([[W, W, G, W]])
    expect(rects).toHaveLength(2)
    expect(rects[0]!.width).toBe(TERRAIN_TILE * 2)
    expect(rects[1]!.width).toBe(TERRAIN_TILE)
    expect(rects[1]!.x).toBe(TERRAIN_TILE * 3)
  })

  it('does not merge across rows', () => {
    const rects = buildBlockingRects([[W, W], [W, W]])
    expect(rects).toHaveLength(2)
    expect(rects.every((r) => r.height === TERRAIN_TILE)).toBe(true)
  })

  it('accepts a custom blocking predicate', () => {
    const rects = buildBlockingRects([[G, G]], (cell) => cell === TERRAIN_GRASS)
    expect(rects).toHaveLength(1)
    expect(rects[0]!.width).toBe(TERRAIN_TILE * 2)
  })

  it('produces far fewer rects than blocking cells on a large ring', () => {
    // 30-wide rows of solid water: 1 rect per row, not 30.
    const grid: TerrainCell[][] = Array.from({ length: 10 }, () =>
      Array.from({ length: 30 }, () => W),
    )
    expect(buildBlockingRects(grid)).toHaveLength(10)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/world/terrainCollision.test.ts --root apps/web`
Expected: FAIL — cannot resolve `./terrainCollision`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/web/src/game/world/terrainCollision.ts`:

```ts
import { TERRAIN_TILE, isWater, type TerrainCell } from './terrainTypes'
import type { CellPredicate } from './terrainResolver'

/** World-space blocking rectangle, top-left origin. */
export type BlockingRect = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Static collision bodies for impassable terrain.
 *
 * Horizontal runs of consecutive blocking cells merge into one rect. The
 * canal alone spans several hundred cells; one body per cell would be
 * wasteful on mobile, and run-merging brings it down to tens of bodies for
 * about ten lines of work.
 *
 * ponytail: rows only, no rectangle packing. Vertical merging would roughly
 * halve the count again — do it only if profiling says these bodies matter.
 */
export function buildBlockingRects(
  grid: TerrainCell[][],
  isBlocking: CellPredicate = isWater,
): BlockingRect[] {
  const rects: BlockingRect[] = []

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]!
    let runStart = -1

    for (let c = 0; c <= row.length; c++) {
      const blocking = c < row.length && isBlocking(row[c]!)

      if (blocking && runStart === -1) {
        runStart = c
      } else if (!blocking && runStart !== -1) {
        rects.push({
          x: runStart * TERRAIN_TILE,
          y: r * TERRAIN_TILE,
          width: (c - runStart) * TERRAIN_TILE,
          height: TERRAIN_TILE,
        })
        runStart = -1
      }
    }
  }

  return rects
}
```

The loop runs to `c <= row.length` so a run reaching the row's end is flushed by the final iteration rather than needing a duplicate flush after the loop.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/game/world/terrainCollision.test.ts --root apps/web`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/game/world/terrainCollision.ts apps/web/src/game/world/terrainCollision.test.ts
git commit -m "feat(web): derive run-merged collision rects from blocking terrain

First terrain that blocks movement. Horizontal run merging keeps the canal
at tens of bodies instead of hundreds."
```

---

## Task 6: Render the layers and collide against water

**Files:**
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (`paintEnvironment` around lines 195–246; collider setup around line 602)

**Interfaces:**
- Consumes: `buildPlazaTerrainGrid` (Task 4), `resolveTerrainLayer` with predicates (Task 2), `buildBlockingRects` (Task 5), `isWater` / `isPath` / `isStoneFamily` (Task 1).
- Produces: no new exports.

There is no unit test for this task — `PlazaScene` needs a live Phaser context. It is verified by the manual check in Step 4, which is the gate for the whole phase.

- [ ] **Step 1: Build the grid once and render three Wang layers**

In `paintEnvironment()`, replace the single-layer block (currently `const indexes = resolveTerrainLayer(buildPlazaTerrainGrid())` through `layer.setDepth(0)`) with a helper that builds one tilemap layer per predicate. Build the grid **once** and reuse it — `buildPlazaTerrainGrid()` is not free and Task 5 needs the same grid.

```ts
const grid = buildPlazaTerrainGrid()

const makeWangLayer = (isUpper: CellPredicate, depth: number) => {
  const map = this.make.tilemap({
    data: resolveTerrainLayer(grid, isUpper),
    tileWidth: TERRAIN_TILE,
    tileHeight: TERRAIN_TILE,
  })
  const tileset = map.addTilesetImage(
    TERRAIN_TILESET_KEY,
    TERRAIN_TILESET_KEY,
    TERRAIN_TILE,
    TERRAIN_TILE,
    0,
    0,
  )
  if (!tileset) {
    throw new Error(
      `Plaza terrain tileset missing: expected texture key "${TERRAIN_TILESET_KEY}" (preload loadTerrainTileset?)`,
    )
  }
  const layer = map.createLayer(0, tileset, 0, 0)
  if (!layer) {
    throw new Error(
      `Plaza terrain TilemapLayer failed to create for tileset "${TERRAIN_TILESET_KEY}"`,
    )
  }
  layer.setDepth(depth)
  return layer
}

// Painter order: water below, then path, then stone on top.
// ponytail: C1 renders all three layers from the single existing stone
// tileset, tinted. C2 swaps in the real water and path tilesets.
makeWangLayer(isWater, 0).setTint(0x2f6f9f)
makeWangLayer(isPath, 1).setTint(0xc8a06a)
makeWangLayer(isStoneFamily, 2)
```

Import `CellPredicate` from `@/game/world/terrainResolver` and `isWater` / `isPath` / `isStoneFamily` from `@/game/world/terrainTypes`.

- [ ] **Step 2: Delete the ad-hoc water band**

The rim water is now real terrain. Remove the `const waterBand = [...]` block and the loop that pushes into `this.waterTiles` (currently lines 225–235). Leave the `fog` vignette that follows it.

If `this.waterTiles` is referenced elsewhere in the file (check with `grep -n waterTiles apps/web/src/game/scenes/PlazaScene.ts`) — for example in an animation tick — remove those references too, or leave the array declared and empty if that is the smaller diff.

- [ ] **Step 3: Add the water collider**

Where the landmark `walls` collider is set up (near line 602), add static bodies for blocking terrain:

```ts
const blocking = this.physics.add.staticGroup()
for (const rect of buildBlockingRects(grid)) {
  const body = this.add.rectangle(
    rect.x + rect.width / 2,
    rect.y + rect.height / 2,
    rect.width,
    rect.height,
    0x000000,
    0,
  )
  blocking.add(body)
}
this.physics.add.collider(this.player.sprite, blocking)
```

`buildBlockingRects` returns top-left origin rects; `this.add.rectangle` takes a center, hence the half-width offsets. Import `buildBlockingRects` from `@/game/world/terrainCollision`.

`grid` is declared in `paintEnvironment()`. If the collider setup lives in a different method, promote the grid to a private field (`private terrainGrid?: TerrainCell[][]`) assigned in `paintEnvironment()` and read where the colliders are built — do not call `buildPlazaTerrainGrid()` twice, as the two grids would be separate objects.

- [ ] **Step 4: Verify in the running app**

```bash
npm run dev
```

Open the app and confirm all of the following. This is the acceptance gate for C1:

1. The plaza reads as a **round hub** with paths radiating outward, not a cross.
2. Each of the five landmarks sits at the end of a path with a paved landing at its door.
3. A blue canal encloses the plaza on all sides.
4. **Walking into the canal is blocked** — the player cannot leave the enclosure at any point around the ring.
5. Every landmark can be reached on foot from the spawn point.
6. No prop floats in the water.

Capture a fresh screenshot at 1440×900 to `docs/screenshots/1440x900.png`, replacing the old one.

- [ ] **Step 5: Run the full test suite**

Run: `npm test -w @nimworld/web`
Expected: PASS. If `locationEntry.test.ts` or `terrainQa.test.ts` fail, that is a genuine regression — neither depends on layout coordinates, so investigate rather than adjusting the assertions.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/game/scenes/PlazaScene.ts docs/screenshots/1440x900.png
git commit -m "feat(web): render water/path/stone terrain layers with canal collision

Three Wang layers share one tileset with placeholder tints until C2 brings
real art. The ad-hoc rim water images are replaced by real water terrain
that blocks movement."
```

---

## Task 7: Record the phase outcome

**Files:**
- Modify: `docs/plans/2026-08-03-art-pass-c-design.md`
- Modify: `docs/ROADMAP.md`

- [ ] **Step 1: Mark C1 done in the design doc**

In the Phasing table, change the C1 row's status by appending ` — **done**` to its content cell.

- [ ] **Step 2: Point the roadmap at Art Pass C**

Add to the "Already shipped (do not re-plan)" list in `docs/ROADMAP.md`:

```markdown
- Art Pass C1: circular-hub plaza layout, water/path terrain, terrain collision (see `docs/plans/2026-08-03-art-pass-c-design.md`)
```

- [ ] **Step 3: Commit**

```bash
git add docs/plans/2026-08-03-art-pass-c-design.md docs/ROADMAP.md
git commit -m "docs: record Art Pass C1 completion"
```

---

## Self-Review Notes

Checked against `docs/plans/2026-08-03-art-pass-c-design.md`:

| Spec requirement | Task |
| --- | --- |
| `TERRAIN_WATER` / `TERRAIN_PATH` cell types | 1 |
| Path excluded from stone family | 1 |
| Resolver predicate parameter | 2 |
| Three layers painted bottom-up | 6 |
| 36 × 27 grid, 1152 × 864 world | 1, 3 |
| `VIEW_FRAME` re-checked | 3 |
| Landmarks on compass bearings | 3 |
| `stampOutsideEllipse` helper | 4 |
| Hub disk, six spokes, landing pads carried over | 4 |
| Canal outside the landmark band, no bridges | 3 (radius assertion), 4 |
| No `TERRAIN_WALL` | 1 (by omission — asserted in `isWalkable` test) |
| Run-merged terrain collision | 5, 6 |
| Flood fill takes a passability predicate | 4 |
| QA: landings reachable | 4 |
| QA: no water in hub or on spokes | 4 |
| QA: canal is closed | 4 |
| QA: grid and world bounds agree | 3 |
| Zero PixelLab spend | all — placeholder tints in 6 |

Deferred to later phases by design, not oversight: real water and path tilesets (C2), border wall props and re-authored decor placement (C3), landmark scale-up and signboards (C4), HUD (C5).
