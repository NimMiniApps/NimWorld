# Ground Terrain Pass Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace standalone path sprites with one production-quality grass ↔ plaza-stone terrain system rendered through a Phaser `TilemapLayer`.

**Architecture:** Semantic terrain grid (`0–3`) → `terrainResolver` (verified PixelLab corner topology, no majority voting) → render indexes → one opaque `TilemapLayer`. Deprecate `path_stone_v01`. Stop at desktop/mobile visual review — no cobble set, characters, or props.

**Tech Stack:** PixelLab MCP (`create_topdown_tileset` / `get_topdown_tileset`), Phaser 3 Tilemap, Vue 3 / Vite, Vitest, existing `scripts/capture-screenshots.mjs`.

**Design authority:** @docs/plans/2026-08-02-ground-terrain-pass-design.md  
**Art authority:** @docs/art/nimworld-art-bible.md

**Hard stop:** After screenshots land and look convincing, wait for human review. Do not start a second terrain material or character/prop work.

---

### Task 1: Semantic terrain types + grid constants

**Files:**
- Create: `apps/web/src/game/world/terrainTypes.ts`
- Create: `apps/web/src/game/world/terrainTypes.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest'
import {
  TERRAIN_GRASS,
  TERRAIN_PLAZA,
  TERRAIN_ENTRANCE,
  TERRAIN_CONSTRUCTION,
  TERRAIN_COLS,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  isStoneFamily,
} from './terrainTypes'

describe('terrainTypes', () => {
  it('uses a 30×23 grid of 32px cells', () => {
    expect(TERRAIN_COLS).toBe(30)
    expect(TERRAIN_ROWS).toBe(23)
    expect(TERRAIN_TILE).toBe(32)
    expect(TERRAIN_COLS * TERRAIN_TILE).toBe(960)
    expect(TERRAIN_ROWS * TERRAIN_TILE).toBe(736) // 16px past WORLD.height 720
  })

  it('treats plaza/entrance/construction as stone family', () => {
    expect(isStoneFamily(TERRAIN_GRASS)).toBe(false)
    expect(isStoneFamily(TERRAIN_PLAZA)).toBe(true)
    expect(isStoneFamily(TERRAIN_ENTRANCE)).toBe(true)
    expect(isStoneFamily(TERRAIN_CONSTRUCTION)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
cd apps/web && npm test -- terrainTypes
```

Expected: FAIL (module missing).

**Step 3: Minimal implementation**

```ts
export const TERRAIN_GRASS = 0
export const TERRAIN_PLAZA = 1
export const TERRAIN_ENTRANCE = 2
export const TERRAIN_CONSTRUCTION = 3

export type TerrainCell = 0 | 1 | 2 | 3

export const TERRAIN_TILE = 32
export const TERRAIN_COLS = 30
export const TERRAIN_ROWS = 23

export function isStoneFamily(cell: number): boolean {
  return cell === TERRAIN_PLAZA || cell === TERRAIN_ENTRANCE || cell === TERRAIN_CONSTRUCTION
}

export function createEmptyTerrainGrid(): TerrainCell[][] {
  return Array.from({ length: TERRAIN_ROWS }, () =>
    Array.from({ length: TERRAIN_COLS }, () => TERRAIN_GRASS as TerrainCell),
  )
}
```

**Step 4: Run test to verify it passes**

```bash
cd apps/web && npm test -- terrainTypes
```

Expected: PASS.

**Step 5: Commit**

```bash
git add apps/web/src/game/world/terrainTypes.ts apps/web/src/game/world/terrainTypes.test.ts
git commit -m "feat(terrain): add semantic terrain types and 30×23 grid constants"
```

---

### Task 2: Terrain QA tooling (build/test only)

**Files:**
- Create: `apps/web/src/game/world/terrainQa.ts`
- Create: `apps/web/src/game/world/terrainQa.test.ts`

**Purpose:** Pure helpers that inspect decoded RGBA buffers (or file paths via Node in tests). Not imported by `PlazaScene`.

**Step 1: Write failing tests for QA predicates**

Cover at least:

- rejects non-32×32 tile
- rejects transparent outer row/column
- rejects dark frame (outer ring avg luminance far below interior, or near-black opaque edge)
- accepts a synthetic seamless solid tile

Use tiny in-test buffers / synthetic PNGs written under `apps/web/src/game/world/__fixtures__/` if needed — do not depend on production art yet.

**Step 2: Run → FAIL**

```bash
cd apps/web && npm test -- terrainQa
```

**Step 3: Implement `inspectTileRgba` / `assertTilesetQa` helpers**

Return structured `{ ok: boolean; reasons: string[] }` — never throw from inspect; tests assert.

**Step 4: Run → PASS**

**Step 5: Commit**

```bash
git add apps/web/src/game/world/terrainQa.ts apps/web/src/game/world/terrainQa.test.ts
git commit -m "test(terrain): add spritesheet edge QA tooling"
```

---

### Task 3: Generate grass ↔ plaza-stone tileset (PixelLab)

**Files:**
- Create dir: `assets/art/tiles/plaza_stone_wang_v01/`
- Create: `assets/art/tiles/plaza_stone_wang_v01/README.md`
- Mirror approved sheet to: `apps/web/public/assets/art/tiles/plaza_stone_wang_v01/`
- Update: `assets/art/README.md` (manifest row + deprecate `path_stone_v01`)

**Step 1: Generate**

Via PixelLab MCP:

```text
create_topdown_tileset
  lower_description: dense dark early-evening grass for NimWorld plaza, deep greens #002010–#104010, subtle texture, no props, no flowers as separate objects, no text, no checkerboard, no black frame
  upper_description: cool blue-grey plaza stone masonry #304060–#405070 with soft stone highlights, subdued contrast, seamless cobble/blocks, no props, no text, no baked rectangular border
  tile_size: { width: 32, height: 32 }
  view: high top-down
  outline: selective outline (or lineless if selective adds frames — prefer no frame)
  shading: medium shading
  detail: medium detail
  transition_size: 0.25 (or 0 if flat blend looks better — pick after first result)
```

Poll with `get_topdown_tileset` until complete. Download tileset image + example map if provided.

**Step 2: Edge QA before promotion**

Run `terrainQa` against every tile in the sheet. Reject and regenerate if any of these fail:

- full grass / full stone / straights / convex / concave / enclosed stone / grass islands
- transparent outer rows/cols, baked frame, dark border, checkerboard

Save rejected attempts under `assets/art/rejected/` with reason — never delete.

**Step 3: Produce indexed contact sheet**

Generate `plaza_stone_wang_v01/contact_sheet_indexed.png` (4×4 with index labels 0–15) for documentation. Record in README:

- tileset id
- confirmed topology (16-corner Wang or actual layout)
- corner bit order (TL/TR/BL/BR)
- lower/upper ownership semantics
- index layout (row-major vs PixelLab order)

**Step 4: Deprecate path set**

In `assets/art/README.md` and `assets/art/tiles/path_stone_v01/README.md`:

- status: **rejected / deprecated**
- reason: measured 2px transparent top/bottom, dark `#1c1e25` side edges, grass-backed sprite seams; unsuitable for TilemapLayer

Optionally move PNGs to `assets/art/rejected/path_stone_v01/` (keep copies; do not delete). Remove or stop mirroring into `apps/web/public` once loader is gone (Task 7).

**Step 5: Commit assets + docs only**

```bash
git add assets/art apps/web/public/assets/art/tiles/plaza_stone_wang_v01
git commit -m "feat(art): add plaza stone Wang tileset; deprecate path_stone_v01"
```

---

### Task 4: terrainResolver — lock mapping from verified sheet

**Files:**
- Create: `apps/web/src/game/world/terrainResolver.ts`
- Create: `apps/web/src/game/world/terrainResolver.test.ts`
- Create: `apps/web/src/game/world/terrainTopology.ts` (constants: corner order, `CORNER_TO_INDEX` table documented from Task 3)

**Do not invent majority voting.** Ownership rule must match the README from Task 3.

**Step 1: Write canonical mapping tests**

For **every supported corner/terrain-state combination** in the verified topology (typically all 16 Wang masks), assert `resolveTerrainTile(semanticNeighbourhood) === expectedIndex`.

Also add named supplements:

- isolated stone cell in grass
- horizontal / vertical straight
- each outer corner
- each T-junction
- full intersection
- map-edge cells (missing neighbours = grass)

**Step 2: Run → FAIL**

```bash
cd apps/web && npm test -- terrainResolver
```

**Step 3: Implement resolver**

```text
semanticTerrain[y][x]
  → sample four corners with explicit ownership (no majority)
  → look up documented index
  → renderTileIndexes[y][x]
```

Export:

- `resolveCornerMask(grid, col, row): number`
- `resolveTileIndex(grid, col, row): number`
- `resolveTerrainLayer(grid): number[][]`

**Step 4: Run → PASS**

**Step 5: Commit**

```bash
git add apps/web/src/game/world/terrainResolver.ts apps/web/src/game/world/terrainResolver.test.ts apps/web/src/game/world/terrainTopology.ts
git commit -m "feat(terrain): lock terrainResolver to verified PixelLab topology"
```

---

### Task 5: plazaTerrainMap — semantic layout + flood-fill

**Files:**
- Create: `apps/web/src/game/world/plazaTerrainMap.ts`
- Create: `apps/web/src/game/world/plazaTerrainMap.test.ts`
- Keep temporarily: `plazaPathMap.ts` / `pathAutotile.ts` until Task 7 removes them

**Step 1: Write failing tests**

1. Grid is `TERRAIN_ROWS × TERRAIN_COLS`.
2. Fountain forecourt cells are stone-family and larger than a thin ribbon.
3. **Semantic flood-fill:** start from fountain forecourt cell; BFS/DFS over `isStoneFamily`; assert Arcade, Arena, Town Hall, Social Club, Marketplace landing cells are reachable.
4. Landings near each landmark use `entrance` (Marketplace may use `construction`).
5. Stone does not fill the entire world (stone cell count well below total cells).

**Step 2: Run → FAIL**

**Step 3: Implement `buildPlazaTerrainGrid()`**

Port organic curve/disk/rect stamping ideas from `plazaPathMap.ts`, but write **semantic** values:

- forecourt → `TERRAIN_PLAZA`
- routes → `TERRAIN_PLAZA`
- Arcade/Arena/Town Hall/Social landings → `TERRAIN_ENTRANCE`
- Marketplace approach → `TERRAIN_CONSTRUCTION`
- default → `TERRAIN_GRASS`

Keep landmark world positions from `locations.ts`. Prefer organic bends and varied widths; avoid perfect X.

Export `stoneFloodReachable(grid, startCol, startRow): Set<string>` for the test (or keep helper private to test file).

**Step 4: Run → PASS**

**Step 5: Commit**

```bash
git add apps/web/src/game/world/plazaTerrainMap.ts apps/web/src/game/world/plazaTerrainMap.test.ts
git commit -m "feat(terrain): build semantic plaza terrain with reachable landings"
```

---

### Task 6: Load tileset + paint TilemapLayer

**Files:**
- Create: `apps/web/src/game/assets/loadTerrainTileset.ts`
- Modify: `apps/web/src/game/createGame.ts` (preload terrain sheet; remove `loadPathTiles`)
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (`paintEnvironment`)

**Step 1: Loader**

Load spritesheet key e.g. `terrain-plaza-wang` from  
`/assets/art/tiles/plaza_stone_wang_v01/<sheet>.png`  
with `frameWidth/frameHeight = 32`. After load, set texture filter to NEAREST if not already covered by game `pixelArt: true`.

**Step 2: Replace `paintEnvironment` ground**

1. Remove grass `Image` grid **unless** QA proved the tileset needs a transparent grass underlay (default: single opaque layer covering all cells).
2. Remove path placement `Image` loop.
3. Remove procedural fountain `tile-stone` disk once forecourt is semantic plaza.
4. Build semantic grid → `resolveTerrainLayer` → Phaser `make.tilemap` / blank map `30×23`, add tileset, `createLayer`, `setDepth` below landmarks (~0–2), integer positions at `(0,0)`.
5. Keep rim water / vignette / props / buildings as today.

**Step 3: Manual smoke**

```bash
cd apps/web && npm run dev
```

Visually confirm: no dark tile boxes, forecourt reads as one space, routes reach five landmarks.

**Step 4: Commit**

```bash
git add apps/web/src/game/assets/loadTerrainTileset.ts apps/web/src/game/createGame.ts apps/web/src/game/scenes/PlazaScene.ts
git commit -m "feat(plaza): render semantic terrain via TilemapLayer"
```

---

### Task 7: Remove deprecated path runtime

**Files:**
- Delete or stop using: `apps/web/src/game/assets/loadPathTiles.ts`
- Delete or archive tests that assert `path-auto-*`: `pathAutotile.test.ts`, `plazaPathMap.test.ts` (replace coverage already in terrain tests)
- Remove: `pathAutotile.ts`, `plazaPathMap.ts` if nothing else imports them
- Remove public copies of `path_stone_v01` under `apps/web/public/` (sources may remain under `assets/art/rejected/`)

**Step 1:** Grep for `path-auto`, `loadPathTiles`, `pathAutotile`, `plazaPathMap` — zero runtime refs.

**Step 2:**

```bash
cd apps/web && npm test && npm run build
```

Expected: all green.

**Step 3: Commit**

```bash
git add -A apps/web/src/game apps/web/public/assets/art/tiles
git commit -m "chore(terrain): remove deprecated path_stone sprite pipeline"
```

---

### Task 8: Screenshots + follow-up note + stop

**Files:**
- Update: `docs/screenshots/` via `scripts/capture-screenshots.mjs` (at least 390×844 and 1440×900)
- Create: `docs/plans/2026-08-02-ground-terrain-pass-followups.md` (short deferred list only)

**Step 1: Capture**

Follow existing script / README flow (dev server + `node scripts/capture-screenshots.mjs`). Ensure captures show plaza ground with landmarks; characters may be present but success criteria is ground quality with them mentally “hidden”.

**Step 2: Visual QA checklist**

Confirm design §11–12: no tile borders/gaps/dark grid, junctions correct, forecourt designed, ground quieter than landmarks, mobile readable, interactions still reachable.

If checklist fails → fix terrain map or regenerate art; do **not** paper over with props.

**Step 3: Follow-ups note**

List only deferred items (cobble set, distinct entrance/construction art, characters, props, FX). No implementation.

**Step 4: Final verify**

```bash
cd apps/web && npm test && npm run build
```

**Step 5: Commit**

```bash
git add docs/screenshots docs/plans/2026-08-02-ground-terrain-pass-followups.md
git commit -m "docs(art): ground terrain pass screenshots and follow-ups"
```

**Step 6: STOP**

Present desktop + mobile screenshots and wait for review. Do not generate cobblestone. Do not start character/prop work.

---

## Execution notes

- Prefer TDD for Tasks 1, 2, 4, 5.
- Task 3 may require multiple PixelLab generations; budget carefully; reject freely.
- If the sheet is **not** classic 16-Wang, document actual topology in `terrainTopology.ts` and test every supported state — do not force a false Wang model.
- Integer placement + clip: map height 736 vs world 720 is intentional; camera bounds stay `WORLD.height`.

---

## Plan complete checklist

| Task | Outcome |
| ---: | --- |
| 1 | Semantic types + 30×23 constants |
| 2 | `terrainQa` tooling |
| 3 | Approved Wang sheet + deprecate path_stone_v01 |
| 4 | Locked `terrainResolver` + full-state tests |
| 5 | Semantic map + flood-fill reachability |
| 6 | `TilemapLayer` in PlazaScene |
| 7 | Remove old path pipeline |
| 8 | Screenshots + stop for review |
