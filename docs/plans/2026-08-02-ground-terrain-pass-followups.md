# Ground Terrain Pass — Deferred Follow-ups

**Date:** 2026-08-02  
**Status:** After visual review of Wang terrain pass only.

Do **not** implement these until the ground screenshots are approved.

## Deferred

1. **Optional rough cobblestone ↔ grass** second material (only if review asks for route vs plaza material contrast).
2. **Distinct art** for semantic `entrance` / `construction` (same stone family this pass).
3. Character / animation polish.
4. Prop placement refinement on the new terrain.
5. Ambient FX beyond ground evaluation.
6. Map expansion / UI redesign / bridge-adapter changes.

## Known notes from this pass

- Approved sheet is PixelLab attempt 1 topology with an art-bible palette remap (`tileset_pixellab_raw.png` retained).
- Dual-grid `tile-owns-NW` sampling means eastern/southern map edges blend to grass when OOB = grass — intentional.
- Terrain grid is 30×23 (736px tall); last row may extend 16px past `WORLD.height` 720 and is clipped by camera bounds.
