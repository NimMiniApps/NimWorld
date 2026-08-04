# Canal water Wang tileset (v01)

**Status:** approved (edge QA + topology verified)
**PixelLab id:** `9ab13560-dc3e-456a-9b38-6bc6bfd54d6c`
**Phaser path:** `/assets/art/tiles/canal_water_wang_v01/tileset.png` (key `terrain-canal-water`)

## Generation

Chained off `plaza_stone_wang_v01`'s grass base tile (`d27ac40e-47cd-452b-a69a-c163089ef307`)
via `upper_base_tile_id`, so the grass here is pixel-identical to the stone sheet's and the
two seam without a visible join.

Params: 32×32, high top-down, lineless, medium shading, medium detail, `transition_size=0.25`,
16 tiles, `tile_strength=1.0`, `tileset_adherence=100`, `tileset_adherence_freedom=500`.

## Topology (confirmed 16-corner Wang)

- **Lower = canal water · Upper = grass** — inverted relative to the stone sheet.

Water is the lower terrain because that is PixelLab's canonical ocean→beach direction.
Requesting water as the elevated terrain produces a raised water slab with drop-shadow rims,
which is the failure mode that rejected three attempts during the stone pass.

The consequence for callers: the water layer's Wang predicate is `(cell) => !isWater(cell)`
and its transparent tile is full-**upper** (array index 12), not full-lower.

- Corner bit order, sheet layout, and array→Wang mapping are **identical** to
  `plaza_stone_wang_v01` — see that README's table and `../plaza_stone_wang_v01/README.md`.
- Full water = array **6** (`wang_0`) · full grass = array **12** (`wang_15`)

## Palette remap

Raw PixelLab output is bright daytime blue and green. Remapped per pixel by hue class,
mapping HSV value through a ramp (same technique as the stone sheet):

| Class | Ramp | Value window |
| --- | --- | --- |
| grass (hue 70–175, sat ≥ 0.30) | `#002010` → `#104010` | 0.30 – 0.90 |
| water (hue 175–265) | `#071c33` → `#1e5a84` | 0.20 – 0.92 |
| bank (rest) | `#0b1a14` → `#2e3828` | 0.15 – 0.75 |

The grass ramp and window reproduce the approved stone sheet's grass from the same raw
colors — that is what makes the sheets seam.

## Edge QA

Port of `apps/web/src/game/world/terrainQa.ts` (`inspectTileRgba`) over all 16 cells: **PASS**
(no transparent outer ring, no near-neutral dark border, no baked dark frame).

## Files

| File | Notes |
| --- | --- |
| `tileset.png` | Approved 128×128 (4×4 × 32) sheet |
| `tileset_pixellab_raw.png` | Unmodified PixelLab download |
| `contact_sheet_indexed.png` | 3× scale with array indices 0–15 |
| `metadata.json` | PixelLab metadata (corners per tile) |
| `topology.json` | Corner → index mapping |

Mirrored to `apps/web/public/assets/art/tiles/canal_water_wang_v01/`.
