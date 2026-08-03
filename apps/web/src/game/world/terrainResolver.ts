import { isStoneFamily, type TerrainCell } from './terrainTypes'
import {
  CORNER_NE,
  CORNER_NW,
  CORNER_SE,
  CORNER_SW,
  wangToArrayIndex,
} from './terrainTopology'

/**
 * Dual-grid Wang resolver, shared by every terrain layer.
 *
 * Ownership (locked in terrainTopology.ts as `tile-owns-NW`):
 *   NW ← cell(col, row) · NE ← cell(col+1, row)
 *   SW ← cell(col, row+1) · SE ← cell(col+1, row+1)
 * Out of bounds = lower. No majority voting.
 *
 * `isUpper` selects which cell family counts as the upper terrain, so the
 * same corner math drives the stone, path, and water layers. It defaults to
 * the stone family, which is what every pre-existing caller means.
 */
export type CellPredicate = (cell: TerrainCell) => boolean

function cellIsUpper(
  grid: TerrainCell[][],
  col: number,
  row: number,
  isUpper: CellPredicate,
): boolean {
  if (row < 0 || col < 0 || row >= grid.length) return false
  const line = grid[row]
  if (!line || col >= line.length) return false
  return isUpper(line[col]!)
}

/** Wang corner mask 0–15 for the display tile at (col, row). */
export function resolveCornerMask(
  grid: TerrainCell[][],
  col: number,
  row: number,
  isUpper: CellPredicate = isStoneFamily,
): number {
  let mask = 0
  if (cellIsUpper(grid, col, row, isUpper)) mask |= CORNER_NW
  if (cellIsUpper(grid, col + 1, row, isUpper)) mask |= CORNER_NE
  if (cellIsUpper(grid, col, row + 1, isUpper)) mask |= CORNER_SW
  if (cellIsUpper(grid, col + 1, row + 1, isUpper)) mask |= CORNER_SE
  return mask
}

/** Spritesheet array index 0–15 for the display tile at (col, row). */
export function resolveTileIndex(
  grid: TerrainCell[][],
  col: number,
  row: number,
  isUpper: CellPredicate = isStoneFamily,
): number {
  return wangToArrayIndex(resolveCornerMask(grid, col, row, isUpper))
}

/** Full layer of spritesheet array indexes matching the semantic grid shape. */
export function resolveTerrainLayer(
  grid: TerrainCell[][],
  isUpper: CellPredicate = isStoneFamily,
): number[][] {
  const rows = grid.length
  const cols = rows > 0 ? (grid[0]?.length ?? 0) : 0
  const layer: number[][] = []
  for (let r = 0; r < rows; r++) {
    const out: number[] = []
    for (let c = 0; c < cols; c++) {
      out.push(resolveTileIndex(grid, c, r, isUpper))
    }
    layer.push(out)
  }
  return layer
}
