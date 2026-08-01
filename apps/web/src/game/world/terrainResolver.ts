import { isStoneFamily, type TerrainCell } from './terrainTypes'
import {
  CORNER_NE,
  CORNER_NW,
  CORNER_SE,
  CORNER_SW,
  wangToArrayIndex,
} from './terrainTopology'

/**
 * Dual-grid Wang resolver for plaza_stone_wang_v01.
 *
 * Ownership (locked in terrainTopology.ts as `tile-owns-NW`):
 *   NW ← cell(col, row) · NE ← cell(col+1, row)
 *   SW ← cell(col, row+1) · SE ← cell(col+1, row+1)
 * Out of bounds = grass (lower / 0). No majority voting.
 */

function cellIsUpper(grid: TerrainCell[][], col: number, row: number): boolean {
  if (row < 0 || col < 0 || row >= grid.length) return false
  const line = grid[row]
  if (!line || col >= line.length) return false
  return isStoneFamily(line[col]!)
}

/** Wang corner mask 0–15 for the display tile at (col, row). */
export function resolveCornerMask(grid: TerrainCell[][], col: number, row: number): number {
  let mask = 0
  if (cellIsUpper(grid, col, row)) mask |= CORNER_NW
  if (cellIsUpper(grid, col + 1, row)) mask |= CORNER_NE
  if (cellIsUpper(grid, col, row + 1)) mask |= CORNER_SW
  if (cellIsUpper(grid, col + 1, row + 1)) mask |= CORNER_SE
  return mask
}

/** Spritesheet array index 0–15 for the display tile at (col, row). */
export function resolveTileIndex(grid: TerrainCell[][], col: number, row: number): number {
  return wangToArrayIndex(resolveCornerMask(grid, col, row))
}

/** Full layer of spritesheet array indexes matching the semantic grid shape. */
export function resolveTerrainLayer(grid: TerrainCell[][]): number[][] {
  const rows = grid.length
  const cols = rows > 0 ? (grid[0]?.length ?? 0) : 0
  const layer: number[][] = []
  for (let r = 0; r < rows; r++) {
    const out: number[] = []
    for (let c = 0; c < cols; c++) {
      out.push(resolveTileIndex(grid, c, r))
    }
    layer.push(out)
  }
  return layer
}
