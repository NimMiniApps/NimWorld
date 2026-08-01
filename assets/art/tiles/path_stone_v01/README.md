# Path tiles — grass + stone cobble (v01)

PixelLab `create_path_tiles` id: `d8bce053-efed-4da8-ae32-1a7c7095d9bd`

- Type: square_topdown 32×32
- 18 connectable configs (straights, corners, T, cross, dead-ends, ground)
- Edge rules: bit0=N bit1=E bit2=S bit3=W (feature continues across edge)
- Wired via `pathAutotile.ts` + `plazaPathMap.ts` → Phaser keys `path-auto-0`…`path-auto-17`
- Mirrored to `apps/web/public/assets/art/tiles/path_stone_v01/`

Organic routes: spawn→fountain→Arcade/Arena/Town Hall/Social/Marketplace with wider fountain forecourt and Arcade/Arena landings.
