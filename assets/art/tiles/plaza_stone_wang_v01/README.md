# Plaza stone Wang tileset (v01)

**Status:** approved (edge QA + topology verified)  
**PixelLab id:** `c8ad0281-da70-4794-a0f3-90510c818182`  
**Phaser path (Task 6):** `/assets/art/tiles/plaza_stone_wang_v01/tileset.png`

## Generation

| Attempt | PixelLab id | Result |
| --- | --- | --- |
| 1 | `c8ad0281-…` | Edge QA **PASS**; bright daytime grass → palette-remapped (promoted) |
| 2 | `9adecb3b-…` | Evening palette closer; edge QA **FAIL** (drop-shadow dark rims) → `rejected/plaza_stone_wang_attempt2_9adecb3b/` |
| 3 | `36cc3077-…` | Flat prompt; edge QA **FAIL** (rims) + light stone → `rejected/plaza_stone_wang_attempt3_36cc3077/` |
| 4 | `f1c28508-…` | Edge QA **FAIL** 7/16; bright grass → `rejected/plaza_stone_wang_attempt4_f1c28508/` |

**Approved sheet:** attempt 1 topology + art-bible palette remap (greens → `#002010–#104010`, stone → cool `#304060–#405070`). Raw PixelLab sheet kept as `tileset_pixellab_raw.png`. Rejected raw attempt 1 also under `rejected/plaza_stone_wang_attempt1_c8ad0281/` (pre-remap).

Params (attempt 1): 32×32, high top-down, lineless, medium shading, medium detail, `transition_size=0.25`, 16 tiles.

## Topology (confirmed 16-corner Wang)

- **Lower** = grass · **Upper** = plaza stone  
- **Corner bit order:** `wang = NW×8 + NE×4 + SW×2 + SE×1` with `upper=1`, `lower=0` (TL/TR/BL/BR ≡ NW/NE/SW/SE)  
- **Sheet layout:** PixelLab **array order**, 4 columns — `col = i % 4`, `row = i // 4`  
  - **Not** sorted by `wang_N` name / Wang index (using `wang_N` or `original_position` as sheet coords produces banding)  
- Full grass = array **6** (`wang_0`) · Full stone = array **12** (`wang_15`)  
- All 16 corner combinations present (see `topology.json`)

### Array index → Wang mask

| i | wang | NW NE / SW SE |
| ---: | ---: | --- |
| 0 | 13 | U U / L U |
| 1 | 10 | U L / U L |
| 2 | 4 | L U / L L |
| 3 | 12 | U U / L L |
| 4 | 6 | L U / U L |
| 5 | 8 | U L / L L |
| 6 | 0 | L L / L L (full grass) |
| 7 | 1 | L L / L U |
| 8 | 11 | U L / U U |
| 9 | 3 | L L / U U |
| 10 | 2 | L L / U L |
| 11 | 5 | L U / L U |
| 12 | 15 | U U / U U (full stone) |
| 13 | 14 | U U / U L |
| 14 | 9 | U L / L U |
| 15 | 7 | L U / U U |

## Edge QA

Port of `apps/web/src/game/world/terrainQa.ts` (`inspectTileRgba`) over all 16 cells:

- No transparent outer rows/cols (fully opaque sheet)  
- No near-neutral dark border / baked frame  
- No checkerboard  
- Visual: full grass, full stone, H/V straights, convex/concave corners, enclosed stone, grass islands expressible

## Files

| File | Notes |
| --- | --- |
| `tileset.png` | Approved 128×128 (4×4 × 32) sheet |
| `tileset_pixellab_raw.png` | Unmodified PixelLab download |
| `contact_sheet_indexed.png` | 3× scale with array indices 0–15 |
| `metadata.json` | PixelLab metadata (corners per tile) |
| `topology.json` | Corner → index mapping for Task 4 |

Mirrored to `apps/web/public/assets/art/tiles/plaza_stone_wang_v01/` (not wired into Phaser yet).
