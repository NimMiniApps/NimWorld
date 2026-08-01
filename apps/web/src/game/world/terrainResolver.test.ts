import { describe, expect, it } from 'vitest'
import {
  TERRAIN_CONSTRUCTION,
  TERRAIN_ENTRANCE,
  TERRAIN_GRASS,
  TERRAIN_PLAZA,
  type TerrainCell,
} from './terrainTypes'
import {
  ARRAY_FULL_GRASS,
  ARRAY_FULL_STONE,
  CORNER_NE,
  CORNER_NW,
  CORNER_SE,
  CORNER_SW,
  WANG_TO_ARRAY,
} from './terrainTopology'
import { resolveCornerMask, resolveTerrainLayer, resolveTileIndex } from './terrainResolver'

/** Build a grass-filled grid of the given size. */
function grassGrid(cols: number, rows: number): TerrainCell[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => TERRAIN_GRASS as TerrainCell),
  )
}

/**
 * Minimal 2×2 neighbourhood for wang mask at tile (0,0) under tile-owns-NW:
 *   NW=cell(0,0) NE=cell(1,0) / SW=cell(0,1) SE=cell(1,1)
 */
function neighbourhoodForWang(wang: number): TerrainCell[][] {
  const nw = (wang & CORNER_NW) !== 0
  const ne = (wang & CORNER_NE) !== 0
  const sw = (wang & CORNER_SW) !== 0
  const se = (wang & CORNER_SE) !== 0
  const u = (stone: boolean): TerrainCell => (stone ? TERRAIN_PLAZA : TERRAIN_GRASS)
  return [
    [u(nw), u(ne)],
    [u(sw), u(se)],
  ]
}

describe('terrainResolver — verified Wang topology', () => {
  describe('canonical wang → array mapping', () => {
    it.each(
      WANG_TO_ARRAY.map((arrayIndex, wang) => ({ wang, arrayIndex })),
    )('wang $wang resolves to array index $arrayIndex', ({ wang, arrayIndex }) => {
      const grid = neighbourhoodForWang(wang)
      expect(resolveCornerMask(grid, 0, 0)).toBe(wang)
      expect(resolveTileIndex(grid, 0, 0)).toBe(arrayIndex)
    })
  })

  describe('named supplements', () => {
    it('isolated stone: four surrounding tiles get single-corner masks', () => {
      // Stone at (1,1); probe the four dual-grid tiles that sample it.
      const grid = grassGrid(3, 3)
      grid[1][1] = TERRAIN_PLAZA

      // tile(1,1): NW=stone → wang 8 → array 5
      expect(resolveCornerMask(grid, 1, 1)).toBe(CORNER_NW)
      expect(resolveTileIndex(grid, 1, 1)).toBe(5)

      // tile(0,1): NE=stone → wang 4 → array 2
      expect(resolveCornerMask(grid, 0, 1)).toBe(CORNER_NE)
      expect(resolveTileIndex(grid, 0, 1)).toBe(2)

      // tile(1,0): SW=stone → wang 2 → array 10
      expect(resolveCornerMask(grid, 1, 0)).toBe(CORNER_SW)
      expect(resolveTileIndex(grid, 1, 0)).toBe(10)

      // tile(0,0): SE=stone → wang 1 → array 7
      expect(resolveCornerMask(grid, 0, 0)).toBe(CORNER_SE)
      expect(resolveTileIndex(grid, 0, 0)).toBe(7)
    })

    it('horizontal straight: stone row yields top/bottom half-masks', () => {
      // Row of stone at r=1, cols 0..3
      const grid = grassGrid(4, 3)
      for (let c = 0; c < 4; c++) grid[1][c] = TERRAIN_PLAZA

      // Interior tile on the stone row: NW+NE = wang 12 → array 3
      expect(resolveCornerMask(grid, 1, 1)).toBe(CORNER_NW | CORNER_NE)
      expect(resolveTileIndex(grid, 1, 1)).toBe(3)

      // Tile above the strip: SW+SE = wang 3 → array 9
      expect(resolveCornerMask(grid, 1, 0)).toBe(CORNER_SW | CORNER_SE)
      expect(resolveTileIndex(grid, 1, 0)).toBe(9)
    })

    it('vertical straight: stone column yields left/right half-masks', () => {
      const grid = grassGrid(3, 4)
      for (let r = 0; r < 4; r++) grid[r][1] = TERRAIN_PLAZA

      // Interior tile on the stone column: NW+SW = wang 10 → array 1
      expect(resolveCornerMask(grid, 1, 1)).toBe(CORNER_NW | CORNER_SW)
      expect(resolveTileIndex(grid, 1, 1)).toBe(1)

      // Tile left of the strip: NE+SE = wang 5 → array 11
      expect(resolveCornerMask(grid, 0, 1)).toBe(CORNER_NE | CORNER_SE)
      expect(resolveTileIndex(grid, 0, 1)).toBe(11)
    })

    it('convex outer corner (2×2 stone block, NW tile of the block)', () => {
      // Stone at (1,1)(2,1)(1,2)(2,2) — solid 2×2
      const grid = grassGrid(4, 4)
      for (let r = 1; r <= 2; r++) {
        for (let c = 1; c <= 2; c++) grid[r][c] = TERRAIN_PLAZA
      }

      // Tile (1,1) samples all four stone cells → full stone wang 15 → array 12
      expect(resolveCornerMask(grid, 1, 1)).toBe(15)
      expect(resolveTileIndex(grid, 1, 1)).toBe(ARRAY_FULL_STONE)

      // Tile (0,0) only SE touches the block → wang 1 → array 7 (convex outer)
      expect(resolveCornerMask(grid, 0, 0)).toBe(CORNER_SE)
      expect(resolveTileIndex(grid, 0, 0)).toBe(7)
    })

    it('concave inner corner (L-shape missing SE of a 2×2)', () => {
      // Stone NW, NE, SW of a 2×2 at (1,1) — missing SE cell (2,2)
      const grid = grassGrid(4, 4)
      grid[1][1] = TERRAIN_PLAZA
      grid[1][2] = TERRAIN_PLAZA
      grid[2][1] = TERRAIN_PLAZA

      // Tile (1,1): NW+NE+SW = wang 14 → array 13 (concave / missing SE)
      expect(resolveCornerMask(grid, 1, 1)).toBe(CORNER_NW | CORNER_NE | CORNER_SW)
      expect(resolveTileIndex(grid, 1, 1)).toBe(13)
    })

    it('T-junction: three arms of a cross', () => {
      // Vertical arm cols=1 rows 0..2, plus east arm at row 1 col 2
      // (missing west arm) — classic T opening west at tile (1,1) sampling.
      const grid = grassGrid(4, 4)
      grid[0][1] = TERRAIN_PLAZA
      grid[1][1] = TERRAIN_PLAZA
      grid[2][1] = TERRAIN_PLAZA
      grid[1][2] = TERRAIN_PLAZA
      // Also need SE for a fuller T sample at (1,1):
      // NW=stone, NE=stone, SW=stone, SE=grass → wang 14 → array 13
      expect(resolveCornerMask(grid, 1, 1)).toBe(CORNER_NW | CORNER_NE | CORNER_SW)
      expect(resolveTileIndex(grid, 1, 1)).toBe(13)
    })

    it('full intersection: 3×3 stone cross / block interior', () => {
      const grid = grassGrid(5, 5)
      for (let r = 1; r <= 3; r++) {
        for (let c = 1; c <= 3; c++) grid[r][c] = TERRAIN_PLAZA
      }
      expect(resolveCornerMask(grid, 2, 2)).toBe(15)
      expect(resolveTileIndex(grid, 2, 2)).toBe(ARRAY_FULL_STONE)
    })

    it('map-edge: out-of-bounds corners count as grass', () => {
      const grid = grassGrid(2, 2)
      grid[0][0] = TERRAIN_PLAZA

      // Tile (0,0): NW=stone, NE/SW/SE in-bounds grass → wang 8
      expect(resolveCornerMask(grid, 0, 0)).toBe(CORNER_NW)

      // Tile (1,0): NW=grass, NE=OOB=grass, SW=grass, SE=OOB=grass → wang 0
      expect(resolveCornerMask(grid, 1, 0)).toBe(0)
      expect(resolveTileIndex(grid, 1, 0)).toBe(ARRAY_FULL_GRASS)

      // Tile (0,1): NW=grass, NE=grass, SW=OOB, SE=OOB → wang 0
      expect(resolveCornerMask(grid, 0, 1)).toBe(0)
    })

    it('treats entrance/construction as stone-family upper corners', () => {
      const grid = neighbourhoodForWang(15)
      grid[0][0] = TERRAIN_ENTRANCE
      grid[0][1] = TERRAIN_CONSTRUCTION
      grid[1][0] = TERRAIN_PLAZA
      grid[1][1] = TERRAIN_ENTRANCE
      expect(resolveCornerMask(grid, 0, 0)).toBe(15)
      expect(resolveTileIndex(grid, 0, 0)).toBe(ARRAY_FULL_STONE)
    })
  })

  describe('full-layer resolveTerrainLayer', () => {
    it('full grass grid → every tile is array index 6', () => {
      const grid = grassGrid(4, 3)
      const layer = resolveTerrainLayer(grid)
      expect(layer).toHaveLength(3)
      for (const row of layer) {
        expect(row).toHaveLength(4)
        for (const idx of row) expect(idx).toBe(ARRAY_FULL_GRASS)
      }
    })

    it('full stone grid: interior is 12; eastern/southern edges expose grass OOB', () => {
      const cols = 4
      const rows = 3
      const grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => TERRAIN_PLAZA as TerrainCell),
      )
      const layer = resolveTerrainLayer(grid)

      // Interior: c < cols-1 && r < rows-1 → full stone
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          expect(layer[r][c]).toBe(ARRAY_FULL_STONE)
        }
      }

      // Eastern edge (not SE corner): NW+SW stone, NE+SE OOB grass → wang 10 → array 1
      for (let r = 0; r < rows - 1; r++) {
        expect(resolveCornerMask(grid, cols - 1, r)).toBe(CORNER_NW | CORNER_SW)
        expect(layer[r][cols - 1]).toBe(1)
      }

      // Southern edge (not SE corner): NW+NE stone, SW+SE OOB grass → wang 12 → array 3
      for (let c = 0; c < cols - 1; c++) {
        expect(resolveCornerMask(grid, c, rows - 1)).toBe(CORNER_NW | CORNER_NE)
        expect(layer[rows - 1][c]).toBe(3)
      }

      // SE corner: only NW stone → wang 8 → array 5
      expect(resolveCornerMask(grid, cols - 1, rows - 1)).toBe(CORNER_NW)
      expect(layer[rows - 1][cols - 1]).toBe(5)
    })
  })
})
