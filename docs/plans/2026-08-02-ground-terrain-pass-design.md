# Ground & Path Terrain Pass — Design

**Date:** 2026-08-02  
**Status:** Approved  
**Scope:** Visual-only ground/terrain system. Architecture frozen. No characters, props, effects, or product features.

**Authority:** This document supersedes the temporary `path_stone_v01` + standalone-sprite path integration for plaza ground. Art language remains governed by `docs/art/nimworld-art-bible.md`.

---

## 1. Goal

Replace standalone path sprites with one production-quality **grass ↔ plaza-stone** terrain system so the plaza floor feels handcrafted and organic, frames approved landmarks, and never reads as a tile-debug grid.

**Success question:** If every character and UI panel were hidden, would this still look like a believable, polished plaza rather than a collection of path sprites?

Stop after desktop (~1440×900) and mobile (~390×844) visual review. Do not proceed to characters, animations, props, or a second cobblestone material until that review is approved.

---

## 2. Diagnosis (measured)

`path_stone_v01` (PixelLab `create_path_tiles`, wired in `176d3d9`) is not production-viable as seamless terrain:

| Finding | Evidence |
| --- | --- |
| Transparent vertical padding | Every tile 32×32 with content bbox `y=2..29` (2 transparent rows top + bottom) |
| Vertical gaps when abutted | Adjacent tiles leave a 4px gap of underlying grass |
| Dark side edges | Left/right edge pixels solid `#1c1e25` (`28,30,37`) |
| Horizontal seams | Abutting tiles form a double dark line |
| Rim darker than core | Rim luminance ~30–45 below core (baked framing) |
| False edge continuity | Wrap MSE = 0 because edges are uniform dark/transparent, not continuous art |
| Runtime model | Standalone Phaser `Image`s over a separate grass grid + procedural fountain `tile-stone` disk |

**Decision:** Deprecate `path_stone_v01`. Do not compensate with cropping, overlap hacks, or more decorations. Generate a real top-down Wang / terrain tileset and render via one `TilemapLayer`.

---

## 3. Architecture

```text
semanticTerrain[y][x]
        ↓
terrainResolver   (corner ownership from verified sheet topology)
        ↓
renderTileIndexes[y][x]
        ↓
Phaser TilemapLayer
        ↓
existing landmarks / props / actors (unchanged this pass)
```

**Visual hierarchy (unchanged):** Fountain → Arcade → Arena → Player → other buildings → props → ground.

**Out of scope:** Additional buildings, new props, characters/animations, presence, backend, achievements, inventory, payments, dialogue, map expansion, UI redesign, new bridge/adapter APIs, optional cobblestone set.

---

## 4. Semantic terrain

| Value | Name | This pass renders as |
| ---: | --- | --- |
| `0` | grass | Wang / tileset lower terrain |
| `1` | plaza | Stone family (upper) |
| `2` | entrance | Same stone family |
| `3` | construction | Same stone family |

`plaza` / `entrance` / `construction` retain semantic distinction for future styling and gameplay. For this pass they all resolve to the same stone terrain family via `isStoneFamily(cell)`.

Map data expresses semantic terrain only — never raw PixelLab tile indexes in `PlazaScene`.

---

## 5. Components

| Module | Role |
| --- | --- |
| `terrainTypes.ts` | Semantic constants + `isStoneFamily` |
| `plazaTerrainMap.ts` | Builds semantic grid (forecourt, routes, landings) |
| `terrainResolver.ts` | Semantic grid → render indexes using **verified** PixelLab topology |
| `terrainQa.ts` | **Build/test tooling only** — PNG/spritesheet edge QA |
| `loadTerrainTileset.ts` | Load one 32×32 spritesheet for the tileset |
| `PlazaScene.paintEnvironment` | One `Tilemap` + one `TilemapLayer`; remove path `Image` loop and procedural fountain stone disk once forecourt is semantic |

**Naming:** Use `terrainResolver.ts`, not `wangAutotile.ts`, until the generated sheet proves the expected Wang arrangement.

---

## 6. Corner resolution

`terrainResolver.ts` resolves each tile’s four corner states using an **explicit ownership rule derived from the approved PixelLab tileset**.

**Do not use majority voting.** Majority voting can erase narrow one-cell paths and produce inconsistent corners.

Before locking the resolver:

1. Inspect the generated sheet.
2. Determine corner ordering, terrain ownership semantics, tile-index layout.
3. Confirm whether the set is truly 16-corner Wang terrain (or document the actual topology).
4. Document the exact corner-to-index mapping.
5. Visualize an indexed contact sheet.
6. Lock mapping in tests **before** runtime integration.

---

## 7. Rendering

- 32×32 logical tiles
- Nearest-neighbour filtering
- Integer world coordinates
- No standalone terrain `Image`s
- Prefer **one opaque** terrain `TilemapLayer`
- Use a grass base layer only if the generated transitions intentionally require transparency (default: they do not)

Camera already uses `pixelArt` / `roundPixels`. Keep integer-aligned placement; clip overflow via existing world/camera bounds.

---

## 8. World grid geometry

- Logical grid: **30 × 23** cells of 32×32
- Nominal world height remains **720px**
- Last row may extend **16px** beyond 720 (`23 × 32 = 736`)
- Clip through existing world/camera bounds
- All placement stays integer-aligned
- Landmark positions and playable footprint unchanged unless a tiny visual tweak is required

---

## 9. Map geometry (semantic layout)

Retain the same playable routes and landmark locations.

1. **Fountain forecourt** — largest soft/irregular plaza area; heart of the plaza; semantic `plaza`; no procedural stone disk overlay.
2. **Main routes** (`plaza`) — organic curves fountain → Arcade, Arena, Town Hall, Social Club, Marketplace construction. Varied widths, softened corners, limited straight runs. Avoid perfect X/cross and long rectangular corridors.
3. **Landmark landings** (`entrance`, Marketplace may use `construction`):
   - Arcade — largest, most inviting
   - Arena — broader, more formal
   - Town Hall — clean civic
   - Social Club — smaller, warmer
   - Marketplace — rougher temporary approach
4. **Elsewhere** — `grass`

---

## 10. PixelLab generation

Generate **one** grass ↔ plaza-stone set via `create_topdown_tileset`:

- Locked NimWorld Art Bible palette and mood (dark early evening)
- Top-down terrain, not isometric objects
- 32×32 logical tiles preferred
- Subdued ground contrast so landmarks stay dominant
- No black borders, baked frames, checkerboard, text, or props inside terrain tiles
- Readable stone edges; seamless neighbour continuity

**Do not** generate cobblestone, buildings, characters, or props in this pass.

---

## 11. Asset QA gate (before integration)

Reject the generated set if it cannot render without seams, padding, or baked framing:

- Full grass
- Full stone
- Straight boundaries
- Convex corners
- Concave corners
- Enclosed stone areas
- Enclosed grass islands

Also validate every tile / sheet edge for:

- Exact dimensions
- No transparent outer rows/columns
- No baked frame
- No dark border
- Seamless neighbouring edges
- No checkerboard

**Deprecation:** Mark `path_stone_v01` deprecated/rejected in `assets/art/README.md` with the measured failure reason. Remove runtime `path-auto-*` loading.

---

## 12. Testing

### Resolver

- Canonical mapping tests cover **every supported corner/terrain-state combination** from the verified PixelLab topology
- Named path cases (isolated, H/V straights, corners, T-junctions, full intersection, map edges) remain useful supplements
- Deterministic indexes for the same semantic input

### Map builder

- Forecourt present and sized for fountain + movement
- Semantic flood-fill from fountain forecourt across stone-family cells asserts reachability of Arcade, Arena, Town Hall, Social Club, and Marketplace landings

### Tooling & CI

- `terrainQa` harness over approved spritesheet (not runtime)
- `npm test` and `npm run build` remain green
- Tests green alone are insufficient if visible seams remain

---

## 13. Deliverables

1. Written diagnosis (this doc, §2)
2. Updated terrain implementation (`TilemapLayer` + resolver + semantic map)
3. Revised tileset assets + manifest status; `path_stone_v01` deprecated
4. Clean fountain forecourt
5. Organic routes to all five landmarks
6. No visible tile-box grid
7. Desktop screenshot ~1440×900
8. Mobile screenshot ~390×844
9. Tests and build results
10. Concise deferred follow-ups note

---

## 14. Deferred follow-ups (do not implement in this pass)

- Optional rough cobblestone ↔ grass second material
- Distinct art for `entrance` / `construction` semantics
- Character / animation / prop polish
- Ambient FX beyond ground evaluation needs
- Map expansion, UI redesign, bridge/adapter changes

---

## 15. Stop condition

After the ground/path system is visually convincing and screenshots are captured, **stop** and wait for review. Do not automatically proceed to characters, animations, props, effects, or a second terrain set.
