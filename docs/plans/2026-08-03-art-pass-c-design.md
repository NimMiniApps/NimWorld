# Art Pass C — Plaza Density Design

**Date:** 2026-08-03
**Status:** Approved, ready for planning
**Reference:** mockup of a dense pixel-art NimConnect Plaza (circular hub, radial spokes, canal ring, walled border, layered foliage)
**Supersedes nothing.** Art Passes A and B remain the style authority — see `docs/art/nimworld-art-bible.md`, `docs/art/world-bible.md`, `docs/art/character-bible.md`.

---

## Problem

The current plaza (`docs/screenshots/1440x900.png`) is a cross-shaped stone slab on flat grass with sparse props. The reference mockup reads as a dense, enclosed, layered world. The delta is composition and density, not art quality — the existing tiles, landmarks, and characters are on-style.

## Decisions taken

These were settled during brainstorming. Do not re-litigate them during implementation.

| Question | Decision |
| --- | --- |
| How literally to hit the mockup | **Mood target.** Adopt its density, palette, and signboards. Keep the scrolling follow-cam world; do not rebuild as a fixed single-screen view. |
| Mockup's nine-panel HUD | **Rejected.** Mobile-first HUD only; desktop is the same layout with more breathing room. Honors `docs/art/design-principles.md` #9 ("Build for mobile first"). |
| Plaza layout | **Circular hub with radial spokes**, canal ring, walled border. Landmarks repositioned onto the compass. |
| Location naming | **Keep existing six IDs.** The mockup's names (Profile, Post Office, Developer District) are not adopted — renaming ripples through overlays, adapters, and tests for zero visual gain. |

## Scope

**In scope:** plaza layout rework, water and path terrain families, foliage and border density, larger landmarks with in-world signboards, a small mobile HUD addition.

**Out of scope** — these are product features owned by `docs/ROADMAP.md` Phases 1–4, not art:

- Chat panel, XP and levels, leaderboards / Hall of Fame, daily challenges, events board
- Real Marketplace implementation, Developer District, new districts
- Friends-online panel backed by real presence (Phase 3)

Art Pass C must not add mock data surfaces for any of the above.

---

## Architecture

The terrain system already has the right shape. This is a rewrite of what gets stamped, not of the system that renders it.

Current pipeline:

```
locations.ts        → landmark coords, WORLD bounds, VIEW_FRAME
plazaTerrainMap.ts  → buildPlazaTerrainGrid(): semantic TerrainCell[][]
terrainResolver.ts  → dual-grid Wang resolve → spritesheet indexes
terrainQa.ts        → reachability flood-fill QA
PlazaScene.ts       → renders layers, collision, props, NPCs
```

### Terrain cell types

`terrainTypes.ts` gains two members:

```ts
export const TERRAIN_WATER = 4
export const TERRAIN_PATH = 5
export type TerrainCell = 0 | 1 | 2 | 3 | 4 | 5
```

- **Water** produces the canal ring that encloses the plaza and reads as depth.
- **Path** produces warm tan spokes against the cool grey hub stone. This two-tone ground is the single largest contributor to the mockup's perceived density — a uniform stone floor cannot read the same way regardless of how many props sit on it. **Withdrawn after C2 — see "the two-tone ground plan is withdrawn" below.**

`isStoneFamily` keeps its current members (plaza, entrance, construction). Path is deliberately *not* in the stone family: it is a separate Wang layer with its own tileset, and mixing it into the stone mask would make the hub and spokes indistinguishable.

### Resolver generalization

`terrainResolver.ts` currently hardcodes `isStoneFamily` inside `cellIsUpper`. That predicate becomes a parameter:

```ts
type CellPredicate = (cell: TerrainCell) => boolean

export function resolveTerrainLayer(
  grid: TerrainCell[][],
  isUpper: CellPredicate,
): number[][]
```

The same Wang corner math then serves three binary layers. Ownership (`tile-owns-NW`, locked in `terrainTopology.ts`) and the out-of-bounds-is-lower rule are unchanged. Existing call sites pass `isStoneFamily` and keep their current behavior.

Layers are painted bottom-up in `PlazaScene`:

```
1. water   (water vs land)
2. grass   (base fill, no Wang)
3. path    (path vs non-path)
4. stone   (stone family vs rest)  ← existing layer, unchanged mask
```

### World footprint

`36 × 27` cells at `TERRAIN_TILE = 32` → **1152 × 864** world pixels, up from `30 × 23` / 960 × 736.

A hub disk plus six spokes plus a canal ring does not fit the current footprint without the spokes degenerating into stubs. The growth is modest and deliberate: follow-cam and `VIEW_FRAME` cover-zoom already handle arbitrary world sizes, and 36 × 27 keeps the tile count low enough that mobile render cost is unchanged in practice.

`WORLD` in `locations.ts` updates to match. `VIEW_FRAME` is re-checked so the player still never sees the whole world at once.

### Layout

`buildPlazaTerrainGrid()` is rewritten. Existing helpers (`stampDisk`, `stampCurve`, `stampLandingPad`) are reused as-is; one new helper is added:

```ts
function stampRing(grid, col, row, innerRadius, outerRadius, value): void
```

Composition:

```
           [ARCADE]
              |
   [ARENA]--( O )--[MARKETPLACE]
            / | \
[SOCIAL CLUB] | [TOWN HALL]
              |
        (spawn approach)

O  = circular stone hub, fountain at center
~~ = canal ring between plaza and border
##  = wall band at world edge
```

- **Hub** — `stampDisk` at `PLAZA_CENTER`, radius ~5 cells, `TERRAIN_PLAZA`.
- **Spokes** — six `stampCurve` calls with `bulge: 0` (straight), `TERRAIN_PATH`, hub edge to landmark landing pad.
- **Landing pads** — `stampLandingPad` per landmark, sizes carried over from the current map (Arcade 5×3, Arena 4×3, Marketplace 2×2 construction, Social Club 3×2, Town Hall 3×3). **Superseded — see "landing pads are derived from the sprite" below.**
- **Canal** — `stampRing` of `TERRAIN_WATER` outside the landmark band, with a gap or bridge at each spoke crossing.
- **Border** — wall band at the world edge, backed by collision, dense foliage inside it.

Landmarks are repositioned onto the compass. `locations.ts` coordinate changes break assertions in `locations.test.ts` and `plazaTerrainMap.test.ts`; updating those is part of the work.

### Passability

The canal sits **outside** the landmark band, so no spoke crosses it and no bridges are needed. This is a correction to the earlier sketch: with landmarks at ~9.5 cells from center and the canal at ~11.5, the water is a border element that encloses the plaza, exactly as it reads in the mockup. Dropping bridges removes a whole mechanism from C1.

For the same reason there is **no `TERRAIN_WALL` cell type**. The border wall is decorative props (C3) plus the existing world bounds; water is the only terrain that blocks. One blocking family is enough, and adding a second now would be speculative.

**This requires new collision.** `PlazaScene` currently collides only against per-landmark rectangles (`this.physics.add.collider(this.player.sprite, walls)`) and world bounds — terrain is not collidable, and grass is freely walkable today. Water and the border wall are the first terrain that must block movement.

Implementation: after building the grid, emit static bodies for water and wall cells. Merge horizontal runs of consecutive blocking cells in a row into one rectangle rather than one body per cell — a 36 × 27 grid would otherwise produce hundreds of bodies for the ring alone, which is wasteful on mobile. Run-merging is roughly ten lines and brings it down to tens of bodies.

This is the one genuinely new mechanism in Art Pass C. It lands in C1 so it is exercised by QA before any art depends on it.

---

## PixelLab asset batches

Estimated 40–60 generations against a 1696 balance. All generation follows the Art Bible; the Brand Recognition and Emotional tests (`docs/art/design-principles.md` #7, #8) gate every asset before it is wired in.

| Batch | Tool | Detail |
| --- | --- | --- |
| Canal water | `create_topdown_tileset` | grass → water, `lower_base_tile_id` chained off the existing grass base tile so it seams with `plaza_stone_wang_v01` |
| Warm path | `create_topdown_tileset` | grass → path, same chaining |
| Foliage | `create_map_object` | 3 tree variants, flower bed, hedge — style-matched via `background_image` against a current screenshot |
| Border wall + bridge | `create_map_object` | wall segment kit, canal bridge |
| Signboards | `create_ui_asset` | 6 in-world sign panels, one per landmark |

The base-tile-ID chaining is the load-bearing detail. Tilesets generated independently will not seam against the existing stone, and mismatched seams are more visually damaging than the sparse world we are replacing.

New assets land in `apps/web/public/assets/art/` under the existing category folders and are registered in `apps/web/src/game/assets/artManifest.ts`, which `artManifest.test.ts` already validates.

---

## Landmarks and HUD

**Landmarks.** Buildings scale up. The DOM text labels currently floating over each building are replaced with in-world sign sprites anchored above the entrance — the mockup's strongest identity cue, and it removes a layer of DOM that has to be kept in sync with camera position. Portal glow already exists for the Arcade (`effects/arcade_portal_v01_final.png`); it extends to the other five.

**HUD.** Stays lean, per the mobile-first decision. Additions:

- NIM balance chip
- Bottom nav row wired to overlays that already exist

No new panels. Desktop renders the same layout with more spacing.

---

## Verification

Reachability flood-fill lives in `plazaTerrainMap.ts` as `stoneFloodReachable`, not in `terrainQa.ts` — `terrainQa.ts` is *image* QA over decoded tileset pixels and is untouched by this pass. `stoneFloodReachable` generalizes the same way the resolver does: take a passability predicate instead of hardcoding `isStoneFamily`.

QA assertions for the new layout:

1. Every landmark landing pad is reachable from `SPAWN_POINT` across stone ∪ path cells.
2. No water cell falls inside the hub disk or on any spoke.
3. The canal ring is closed — it fully encloses the plaza.
4. Grid dimensions and world bounds agree.

Tests updated: `terrainTypes.test.ts` (new constants, new grid size), `plazaTerrainMap.test.ts` (new layout), plus a new `terrainCollision.test.ts`. `terrainResolver.test.ts` is left untouched by making the new predicate an **optional** parameter defaulting to `isStoneFamily` — roughly 25 existing call sites keep working unchanged. `locations.test.ts` asserts only interaction radii and is unaffected by repositioning.

---

## Phasing

Each phase gets its own implementation plan.

| Phase | Content | PixelLab spend |
| --- | --- | --- |
| **C1** | Terrain foundation — new cell types, resolver predicate, rewritten layout, run-merged terrain collision, QA generalization, tests green. Renders in placeholder colors. — **done** | none |
| **C2** | Water and path tilesets generated, chained, and wired in. — **done** (2 gens) | ~10 |
| **C3** | Foliage, border wall, bridges, density pass. | ~20 |
| **C4** | Landmark scale-up and in-world signboards. | ~15 |
| **C5** | Mobile HUD trim — NIM balance chip, bottom nav. — **done** (extended with desktop-only preview shells; see `docs/plans/2026-08-04-plaza-hud-design.md`) | none |

C1 lands with tests green and zero credits spent, so the new ground plan can be reviewed in placeholder colors before any art is commissioned.

## Correction after C2 review

The spokes shipped in C1 read as slabs rather than roads. Three causes, all in
`plazaTerrainMap.ts`, all fixed before C3:

1. `stampCurve` painted by stamping a brush along the line and rounding to a cell at
   every step, so road edges alternated between full and narrow runs. Replaced by
   `stampRoad`, which rasterizes by perpendicular distance and has clean edges at any
   angle. The Bezier bulge and jitter went with it — every spoke was straight.
2. The hub disk at radius 5 left only 2–3 cells between itself and each landing pad, so
   no spoke was long enough to read as an avenue. Hub is now radius 4.
3. The south approach ran from the center to `SPAWN_POINT`, which sits exactly
   `HUB_RADIUS` away — the hub disk, stamped last, erased it entirely. It now runs past
   the spawn toward the Harbor.

A road renders one display tile wider than its cell count, since the Wang layer needs a
transition tile on each side.

## Correction: the two-tone ground plan is withdrawn

The "warm tan spokes against the cool grey hub" above does not work, and no amount of
palette tuning fixes it. Each terrain family is its own Wang layer, and every layer knows
only one transition: to grass. Where the tan avenue met the stone hub, the stone layer
painted its stone→grass edge tile on top of the road, leaving a grass channel and a second
outline between them. Every avenue detached from the hub, and every landing pad detached
from its avenue. Two paved materials cannot abut.

Inlaying tan inside a shared stone silhouette — folding path into the stone mask and
painting only the road's full-upper interior cells — was tested and rejected: a 3-cell road
has almost no interior, so the tan broke into disconnected patches.

The ground plan is therefore **one paved material**: hub, avenues and landing pads are all
stone family, so the plaza is a single continuous silhouette with one outline against the
grass. Density comes from C3 foliage and C4 landmarks instead.

`path_warm_wang_v01` is not wasted. A grass↔path Wang set is exactly right for C3 garden
trails through the foliage band, which only ever touch grass. The path layer stays wired in
`PlazaScene` for that.

Widths settled with the material: hub radius 6 — at 4 the six-way junction swallowed the
disk and the plaza read as an asterisk — and avenues 2 cells, cardinal and diagonal alike.
The earlier 3-cell cardinal / 2-cell diagonal split existed to stop diagonals reading as
wedges; at 2 cells both, that problem does not arise. The south approach was lengthened to
clear the wider hub.

## Correction: landing pads are derived from the sprite, not authored

The pad sizes listed above (Arcade 5×3, Arena 4×3, and so on) were carried over from the
960×720 plaza, and the landmark art outgrew them. Every pad was narrower than the building
standing on it — the Town Hall is 140px wide on a 96px pad — so each building hung off its
own paving into the grass, and the pad's leftover half read as a stone platform parked
beside the door.

`landingPadRect` now derives the rect from `ART_DISPLAY_SIZE` and the sprite origin
`PlazaScene` draws with: full sprite width in cells, from one row above the building's base
to one row below it. Re-sizing a sprite re-sizes its pad. `plazaTerrainMap.test.ts` walks
each sprite's own footprint and demands stone under it, so the two cannot drift apart again.

## Relationship to the product roadmap

Art Pass C is orthogonal to `docs/ROADMAP.md` Phases 1–5 and can proceed in parallel. It does not depend on backend work, real presence, or real NimConnect data, and it must not introduce mock surfaces for features those phases own.
