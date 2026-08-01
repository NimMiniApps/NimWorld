# Rejected: plaza_stone_wang attempt 2

- PixelLab id: `9adecb3b-b1f9-41cc-bdd2-44aed59e6dbe`
- Palette: improved — grass ≈ `(14,58,46)`, stone ≈ `(81,95,127)` (evening-ish)
- Edge QA: **FAIL** — 10/16 tiles have near-neutral dark opaque edge pixels
  - Sample offenders: `(16,13,27)` / `(15,8,24)` on outer rows — baked elevated stone drop-shadow / mortar rim
  - Same defect class as path_stone dark side edges for TilemapLayer seam risk
- Topology: complete 16-corner Wang; array-order 4×4 sheet
