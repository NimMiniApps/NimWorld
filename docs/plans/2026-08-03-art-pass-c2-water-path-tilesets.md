# Art Pass C2 — Water and Path Tilesets Implementation Plan

**Goal:** Replace C1's tinted placeholder layers with real canal-water and warm-path Wang tilesets that seam against `plaza_stone_wang_v01`.

**Spec:** `docs/plans/2026-08-03-art-pass-c-design.md` (phase C2)

**Tech Stack:** PixelLab `create_topdown_tileset`, TypeScript, Phaser 3, Vitest.

## Global Constraints

- **Seaming is the load-bearing detail.** Both tilesets chain off the grass base tile of `plaza_stone_wang_v01` (`d27ac40e-47cd-452b-a69a-c163089ef307`) so their grass is pixel-identical to the stone sheet's.
- Every sheet is palette-remapped into the art-bible blue-hour ramps before promotion, exactly as `plaza_stone_wang_v01` was. Raw PixelLab downloads are kept as `tileset_pixellab_raw.png`.
- Edge QA (`terrainQa.inspectTileRgba` semantics: no transparent outer ring, no baked dark border, no dark frame) gates every sheet.
- No layout changes. `buildPlazaTerrainGrid()`, collision, and QA are C1's and stay untouched.

---

## Generated assets

| Tileset | PixelLab id | Lower | Upper | Chain |
| --- | --- | --- | --- | --- |
| `canal_water_wang_v01` | `9ab13560-dc3e-456a-9b38-6bc6bfd54d6c` | canal water | grass | `upper_base_tile_id` = grass |
| `path_warm_wang_v01` | `ad5422c5-7915-46ed-ba98-009023292f19` | grass | warm tan path | `lower_base_tile_id` = grass |

Water is generated with **water as the lower terrain** — PixelLab's canonical ocean→beach direction. Asking for water as the elevated terrain produces a raised water slab with drop-shadow rims, which is what failed edge QA three times during the stone pass. The cost is that the water layer's Wang predicate is inverted (`(cell) => !isWater(cell)`) and its transparent tile is full-**upper** rather than full-lower.

Both sheets came back with the same array→Wang order as the stone sheet, so `WANG_TO_ARRAY` stays a single shared table.

## Palette remap

Applied per pixel by hue class, mapping HSV value through a ramp:

| Sheet | Class | Ramp | Value window |
| --- | --- | --- | --- |
| both | grass (hue 70–175, sat ≥ 0.30) | `#002010` → `#104010` | 0.30 – 0.90 |
| water | water (hue 175–265) | `#071c33` → `#1e5a84` | 0.20 – 0.92 |
| water | bank (rest) | `#0b1a14` → `#2e3828` | 0.15 – 0.75 |
| path | fringe (warm, sat ≥ 0.50) | `#43301f` → `#7a5c3c` | 0.35 – 0.98 |
| path | path (warm, sat < 0.50) | `#4e4030` → `#9a8264` | 0.35 – 0.95 |

The grass ramp and window are chosen to reproduce the approved stone sheet's grass from the same raw colors, which is what makes the three sheets seam.

---

## Task 1: Promote the tilesets

**Files:**
- Create: `assets/art/tiles/canal_water_wang_v01/{tileset.png,tileset_pixellab_raw.png,metadata.json,topology.json,README.md}`
- Create: `assets/art/tiles/path_warm_wang_v01/` (same set)
- Mirror `tileset.png`, `metadata.json`, `topology.json` into `apps/web/public/assets/art/tiles/<name>/`
- Modify: `assets/art/README.md` (manifest rows + credit log)

- [ ] Write both sheets, their raws, metadata, and derived `topology.json` (same schema as the stone sheet's).
- [ ] README per tileset: PixelLab id, chaining source, remap ramps, QA result, and which terrain is lower.

## Task 2: Load three tilesets

**Files:**
- Modify: `apps/web/src/game/assets/loadTerrainTileset.ts`

- [ ] Export one key per sheet (`terrain-plaza-wang`, `terrain-canal-water`, `terrain-path-warm`) and load all three as 32×32 spritesheets with NEAREST filtering.
- [ ] Keep `loadTerrainTileset(scene)` as the single call site so `BootScene` does not change.

## Task 3: Render real water and path

**Files:**
- Modify: `apps/web/src/game/scenes/PlazaScene.ts` (`paintEnvironment`)

- [ ] `makeWangLayer` takes the tileset key and the array index to blank, alongside the existing predicate and depth.
- [ ] Layers: opaque grass base (stone sheet, full-grass fill) → water (inverted predicate, blank full-upper) → path → stone.
- [ ] Delete both `setTint` calls and the C1 placeholder comments.

## Task 4: Verify

- [ ] `npm test -w @nimworld/web` green; `npx vue-tsc -b` clean.
- [ ] Manual: canal reads as deep evening water, spokes read warm against the cool hub, no seam or hue break where grass meets any of the three surfaces.
- [ ] Refresh `docs/screenshots/1440x900.png`.

## Task 5: Record the phase

- [ ] Mark C2 done in `docs/plans/2026-08-03-art-pass-c-design.md`.

`docs/ROADMAP.md` is left alone: it is still untracked in-flight work, so the Art Pass C entries
go into its shipped list whenever it first lands.
