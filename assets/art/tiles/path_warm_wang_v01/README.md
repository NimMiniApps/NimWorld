# Warm path Wang tileset (v01)

**Status:** approved (edge QA + topology verified)
**PixelLab id:** `ad5422c5-7915-46ed-ba98-009023292f19`
**Phaser path:** `/assets/art/tiles/path_warm_wang_v01/tileset.png` (key `terrain-path-warm`)

Warm tan spokes against the cool grey hub stone. The two-tone ground is the single largest
contributor to the plaza's perceived density — see `docs/plans/2026-08-03-art-pass-c-design.md`.

## Generation

Chained off `plaza_stone_wang_v01`'s grass base tile (`d27ac40e-47cd-452b-a69a-c163089ef307`)
via `lower_base_tile_id`, so the grass here is pixel-identical to the stone sheet's.

Params: 32×32, high top-down, lineless, medium shading, medium detail, `transition_size=0.25`,
16 tiles, `tile_strength=1.0`, `tileset_adherence=100`, `tileset_adherence_freedom=500`.

## Topology (confirmed 16-corner Wang)

- **Lower = grass · Upper = warm tan path** — same orientation as the stone sheet.
- Corner bit order, sheet layout, and array→Wang mapping are **identical** to
  `plaza_stone_wang_v01` — see `../plaza_stone_wang_v01/README.md`.
- Full grass = array **6** (`wang_0`) · full path = array **12** (`wang_15`)

## Palette remap

Raw PixelLab output is a cream path with a neon-orange fringe. Remapped per pixel by hue
class, mapping HSV value through a ramp:

| Class | Ramp | Value window |
| --- | --- | --- |
| grass (hue 70–175, sat ≥ 0.30) | `#002010` → `#104010` | 0.30 – 0.90 |
| fringe (warm hue, sat ≥ 0.50) | `#43301f` → `#7a5c3c` | 0.35 – 0.98 |
| path (warm hue, sat < 0.50) | `#4e4030` → `#9a8264` | 0.35 – 0.95 |

Splitting the warm pixels by saturation keeps the path edge as a darker warm kerb instead of
flattening it into the path body — the fringe is what gives the spokes their silhouette.

## Edge QA

Port of `apps/web/src/game/world/terrainQa.ts` (`inspectTileRgba`) over all 16 cells: **PASS**.

## Files

| File | Notes |
| --- | --- |
| `tileset.png` | Approved 128×128 (4×4 × 32) sheet |
| `tileset_pixellab_raw.png` | Unmodified PixelLab download |
| `contact_sheet_indexed.png` | 3× scale with array indices 0–15 |
| `metadata.json` | PixelLab metadata (corners per tile) |
| `topology.json` | Corner → index mapping |

Mirrored to `apps/web/public/assets/art/tiles/path_warm_wang_v01/`.
