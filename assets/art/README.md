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
| C3 foliage + border wall | ~20 | 17 gens | 12 in use; 3 style rejects; wall kit (2) cut on review — a straight-on sprite cannot follow a curved bank |
| D Characters | 5 | 5 | Player/Guide/Builder/TM/Courier + walk 4-dir |
| D2 Gardener + walk repair | 1 | 12 | gardener v01 rejected (off-style), v02 approved; player/courier south walk regenerated (v3) |
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
| `props/tree_v01_final.png` | — | superseded | C (pale mint canopy outside the `#002010`–`#104010` vegetation range; replaced by `oak_v01`) |
| `props/bush_v01_final.png` | `prop-bush` | final | C |
| `props/crates_v01_final.png` | `prop-crates` | final | C |
| `props/bench_v01_final.png` | `prop-bench` | final | C |
| `props/lantern_v01_final.png` | `prop-lantern` | final | C |
| `props/door_v01_candidate.png` | — | candidate | C |
| `props/conifer_v02_final.png` | `prop-conifer` | final | C3 |
| `props/broadleaf_v02_final.png` | `prop-broadleaf` | final | C3 |
| `props/blossom_tree_v01_final.png` | `prop-blossom` | final | C3 |
| `props/shrub_v01_final.png` | `prop-shrub` | final | C3 |
| `props/fern_v01_final.png` | `prop-fern` | final | C3 |
| `props/boulder_v01_final.png` | `prop-boulder` | final | C3 |
| `props/flowerbed_v03_final.png` | `prop-flowerbed` | final | C3 |
| `props/hedge_v01_final.png` | `prop-hedge` | final | C3 |
| `props/oak_v01_final.png` | `prop-oak` | final | C3 |
| `props/poplar_v01_final.png` | `prop-poplar` | final | C3 |
| `props/willow_v01_final.png` | `prop-willow` | final | C3 |
| `rejected/border_wall_v01/wall_straight_v01_final.png` | — | rejected | C3 (straight-on sprite cannot follow a curved bank; needs an oriented kit — see REASON.md) |
| `rejected/border_wall_v01/wall_pillar_v01_final.png` | — | rejected | C3 (same) |
| `rejected/conifer_v01_blue_shadow_rejected.png` | — | rejected | C3 (pale blue contact shadow read as a puddle) |
| `rejected/broadleaf_v01_blue_shadow_rejected.png` | — | rejected | C3 (same baked shadow) |
| `rejected/flowerbed_v01_warm_rejected.png` | — | rejected | C3 (warm orange against a cool palette) |
| `rejected/flowerbed_v02_sparse_rejected.png` | — | rejected | C3 (negative prompts left it near-empty) |
| `landmarks/arena_v02_final.png` | `building-arena` | final | B |
| `landmarks/townhall_v01_final.png` | `building-townhall` | final | B |
| `landmarks/social_v01_final.png` | `building-social` | final | B |
| `landmarks/marketplace_v01_final.png` | `building-construction` | final | B |
| `effects/arcade_portal_v01_final.png` | `fx-arcade-portal` | final | B |
| `effects/arcade_portal_cabinet_v01_candidate.png` | — | candidate | B |
| `rejected/arena_v01_house_rejected.png` | — | rejected | B |
| `concepts/characters_v04_citizen_refine.png` | — | concept | dir |
| `characters/guide_sheet_v01.png` | `char-npc-a` | final | B |
| `characters/tournament_master_sheet_v01.png` | `char-npc-d` | final | B |
| `characters/builder_sheet_v01.png` | `char-npc-e` | final | B |
| `characters/gardener_sheet_v02.png` | `char-npc-b` | final | D2 |
| `characters/player_sheet_v02.png` | `char-player`, `char-ghost` | final | D2 (ghost reuses it faded + gold-tinted) |
| `characters/courier_sheet_v02.png` | `char-npc-c` | final | D2 |
| `rejected/characters/player_sheet_v01_backfacing_walk_rejected.png` | — | rejected | D2 (south walk frame 1 rendered as a rear view) |
| `rejected/characters/courier_sheet_v01_backfacing_walk_rejected.png` | — | rejected | D2 (same defect) |
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
