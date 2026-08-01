# Rejected (raw): plaza_stone_wang attempt 1

- PixelLab id: `c8ad0281-da70-4794-a0f3-90510c818182`
- Edge QA (`inspectTileRgba` heuristics): **PASS** (no transparent outer, no neutral dark border, no checkerboard)
- Raw palette miss (kept for archive):
  - Full grass center RGB ≈ `(5, 175, 2)` — bright neon green, not dense early-evening `#002010–#104010`
  - Full stone center RGB ≈ `(130, 171, 197)` — too light vs cool `#304060–#405070`
- **Promoted after palette remap** → `assets/art/tiles/plaza_stone_wang_v01/tileset.png` (topology unchanged; raw also at `tileset_pixellab_raw.png`)
- Topology: complete 16-corner Wang; sheet = array order 4×4 (not wang_N order)
