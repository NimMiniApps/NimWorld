# NimWorld Art Assets

Source of truth for PixelLab PNGs used by Art Pass B. Approved files may be mirrored into `apps/web/public/assets/art/` for Phaser loading.

## Naming convention

```text
{subject}_v{NN}_{status}.png
```

**Statuses:** `concept` · `candidate` · `approved` · `deprecated` · `rejected`

Examples:

- `fountain_v01_concept.png`
- `fountain_v02_candidate.png`
- `fountain_v03_final.png` (production-ready; prefer `approved` / `final` in filename per promotion)
- `arcade_portal_v02_final.png`

## Folders

| Folder | Purpose |
| --- | --- |
| `concepts/` | Phase A Art Bible style studies |
| `landmarks/` | Landmark Assets (buildings + fountain production) |
| `props/` | Environment Assets (trees, benches, flowers, doors, …) |
| `characters/` | Character Assets |
| `effects/` | Animated Icon FX (portal, crystal pulse helpers) |
| `rejected/` | Failed reviews — never delete |

## Taxonomy (prefer over “Hero Landmark Kit”)

| Bucket | Examples |
| --- | --- |
| **Icon Assets** | Fountain, Portal, Crystal, Lantern, Window, Roof, Doors |
| **Environment Assets** | Trees, Flowers, Benches, Barrels/crates, stone ring accents |
| **Landmark Assets** | Arcade, Arena, Town Hall, Social Club, Marketplace |
| **Character Assets** | Player, Guide, Builder, Tournament Master |

Environment style **frozen** — see `docs/art/nimworld-art-bible.md`.

## Credit log

| Phase | Planned | Actual | Notes |
| --- | ---: | ---: | --- |
| A Art Bible | 8 | 8 | pixen×7 + pixflux×1 |
| Character direction | 2–3 | 3 | v02–v04 exploration (not locked) |
| Fountain production | — | 2 | candidate + larger-crystal final |
| Portal production | — | 2 | cabinet miss + pure portal final |
| Landmark kit | 18 | 8 | + arcade v03 true-alpha |
| Character lock | — | 0 | V4 locked from prior exploration |
| C Props | 8 | 6 | tree/bush/crates/bench/lantern + door candidate |
| Path tiles (maps) | — | ~20–40 | `path_stone_v01` deprecated (edge QA fail) |
| Plaza Wang tiles | — | 4 gens | `plaza_stone_wang_v01` approved (attempt 1 + palette remap) |
| C2 water + path tiles | ~10 | 2 gens | both approved on attempt 1 (chained off the grass base tile + palette remap) |
| D Characters | 5 | 5 | Player/Guide/Builder/TM/Courier + walk 4-dir |
| Reserve | 2 | | |
| **Total** | was 40 trial | ~60+ | Tier 1: 2000 gens |

## Phase A concepts

| File | Status | Notes |
| --- | --- | --- |
| `concepts/fountain_v01_concept.png` | concept | Brand pass |
| `concepts/plaza_v01_concept.png` | concept | Brand pass |
| `concepts/arcade_portal_v01_concept.png` | concept | Brand pass |
| `concepts/materials_v01_concept.png` | concept | Support |
| `concepts/character_scale_v01_concept.png` | concept | Family pass |
| `concepts/lighting_v02_concept.png` | concept | Refined; crystal still soft |
| `concepts/style_lock_v01_final.png` | final | Style freeze frame |
| `rejected/lighting_v01_blue_crystal_rejected.png` | rejected | Blue crystal brand fail |

## Manifest (file → Phaser key → status → phase)

| File | Phaser key | Status | Phase |
| --- | --- | --- | --- |
| `landmarks/fountain_v02_final.png` | `fountain-base` | final | B |
| `landmarks/arcade_v03_final.png` | `building-arcade` | final | B |
| `landmarks/arcade_v01_final.png` | — | superseded | B |
| `rejected/arcade_v02_checkerboard_rejected.png` | — | rejected | B (baked checkerboard, 0% alpha) |
| `props/tree_v01_final.png` | `prop-tree` | final | C |
| `props/bush_v01_final.png` | `prop-bush` | final | C |
| `props/crates_v01_final.png` | `prop-crates` | final | C |
| `props/bench_v01_final.png` | `prop-bench` | final | C |
| `props/lantern_v01_final.png` | `prop-lantern` | final | C |
| `props/door_v01_candidate.png` | — | candidate | C |
| `landmarks/arena_v02_final.png` | `building-arena` | final | B |
| `landmarks/townhall_v01_final.png` | `building-townhall` | final | B |
| `landmarks/social_v01_final.png` | `building-social` | final | B |
| `landmarks/marketplace_v01_final.png` | `building-construction` | final | B |
| `effects/arcade_portal_v01_final.png` | `fx-arcade-portal` | final | B |
| `effects/arcade_portal_cabinet_v01_candidate.png` | — | candidate | B |
| `rejected/arena_v01_house_rejected.png` | — | rejected | B |
| `concepts/characters_v04_citizen_refine.png` | — | concept | dir |
| `characters/player_sheet_v01.png` | `char-player` | final | B |
| `characters/guide_sheet_v01.png` | `char-npc-a` | final | B |
| `characters/courier_sheet_v01.png` | `char-npc-c` | final | B |
| `characters/tournament_master_sheet_v01.png` | `char-npc-d` | final | B |
| `characters/builder_sheet_v01.png` | `char-npc-e` | final | B |
| `tiles/plaza_stone_wang_v01/tileset.png` | `terrain-plaza-wang` (Task 6) | approved | terrain |
| `tiles/canal_water_wang_v01/tileset.png` | `terrain-canal-water` | approved | C2 |
| `tiles/path_warm_wang_v01/tileset.png` | `terrain-path-warm` | approved | C2 |
| `tiles/path_stone_v01/*` | `path-auto-*` | deprecated | terrain |
| `rejected/path_stone_v01/*` | — | rejected | terrain (transparent edges + `#1c1e25` borders) |

Character sheets: 4×4 @ 48×48 (idle + 3 walk × 4 dirs). See `docs/art/character-bible.md`.

Approved files are mirrored under `apps/web/public/assets/art/` for Phaser `load.image`.

### QA gate before wiring any PNG

1. Must be true RGBA with transparent pixels outside the subject (not editor checkerboard baked into RGB).  
2. Do not overlay standalone portal/icon assets on building façades — keep FX as separate keys for transitions/UI.  
3. Spot-check in-game at plaza scale before promoting `_final`.
