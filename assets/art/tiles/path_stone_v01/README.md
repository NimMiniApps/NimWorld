# Path tiles — grass + stone cobble (v01)

PixelLab `create_path_tiles` id: `d8bce053-efed-4da8-ae32-1a7c7095d9bd`

- Type: square_topdown 32×32
- 18 connectable configs (straights, corners, T, cross, dead-ends, ground)
- Edge rules: bit0=N bit1=E bit2=S bit3=W (feature continues across edge)
- Not wired into Phaser yet — keep procedural ground until autotiler pass

Use for organic curved paths + plaza widenings (Art Bible path polish note).
