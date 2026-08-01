# Path tiles — grass + stone cobble (v01)

**Status:** deprecated / rejected  
**Reason:** measured 2px transparent top/bottom, dark `#1c1e25` side edges, grass-backed sprite seams; unsuitable for `TilemapLayer`.

PixelLab `create_path_tiles` id: `d8bce053-efed-4da8-ae32-1a7c7095d9bd`

- Type: square_topdown 32×32  
- 18 connectable configs (straights, corners, T, cross, dead-ends, ground)  
- Edge rules: bit0=N bit1=E bit2=S bit3=W (feature continues across edge)  
- Previously wired via `pathAutotile.ts` + `plazaPathMap.ts` → Phaser keys `path-auto-0`…`path-auto-17`  
- Archive copy: `assets/art/rejected/path_stone_v01/`  
- Public copies may remain until Task 7 teardown  

**Replacement:** `tiles/plaza_stone_wang_v01/` (16-corner Wang grass ↔ plaza stone).
