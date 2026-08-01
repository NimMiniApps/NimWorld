/** Edge bitmask: path continues across this edge. */
export const PATH_N = 1
export const PATH_E = 2
export const PATH_S = 4
export const PATH_W = 8

export const PATH_TILE_SIZE = 32

/**
 * PixelLab path set masks → tile index (0–17).
 * From create_path_tiles placement_rules; tile_14 listed twice as mask=9 —
 * treat 14 as NEW (11) so all 15 path configs resolve.
 */
const MASK_TO_TILE: Record<number, number> = {
  0: 0,
  [PATH_N]: 2,
  [PATH_E]: 3,
  [PATH_S]: 4,
  [PATH_W]: 5,
  [PATH_E | PATH_W]: 6, // horizontal
  [PATH_N | PATH_S]: 7, // vertical
  [PATH_E | PATH_S]: 8,
  [PATH_S | PATH_W]: 9,
  [PATH_N | PATH_E]: 10,
  [PATH_N | PATH_W]: 11,
  [PATH_E | PATH_S | PATH_W]: 12, // T missing N
  [PATH_N | PATH_S | PATH_W]: 13, // T missing E
  [PATH_N | PATH_E | PATH_W]: 14, // T missing S
  [PATH_N | PATH_E | PATH_S]: 15, // T missing W
  [PATH_N | PATH_E | PATH_S | PATH_W]: 16, // cross
}

/** Phaser texture key for a path-set tile index. */
export function pathTileKey(index: number): string {
  return `path-auto-${index}`
}

export function pathTilePublicPath(index: number): string {
  return `tiles/path_stone_v01/evening_plaza_grass_with_cool_blue-grey_stone_cobb_${index}.png`
}

/** Resolve bitmask → tileset index (falls back to closest known config). */
export function tileIndexForMask(mask: number): number {
  const m = mask & 0xf
  if (MASK_TO_TILE[m] !== undefined) return MASK_TO_TILE[m]
  // Should not happen for 0–15; prefer cross for unknown dense masks.
  return MASK_TO_TILE[PATH_N | PATH_E | PATH_S | PATH_W]
}

export type PathGrid = boolean[][]

export function createEmptyPathGrid(cols: number, rows: number): PathGrid {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => false))
}

export function isPathCell(grid: PathGrid, col: number, row: number): boolean {
  if (row < 0 || col < 0 || row >= grid.length || col >= grid[0].length) return false
  return grid[row][col]
}

/** Neighbour mask for a path cell (only counts orthogonal path neighbours). */
export function neighbourMask(grid: PathGrid, col: number, row: number): number {
  let mask = 0
  if (isPathCell(grid, col, row - 1)) mask |= PATH_N
  if (isPathCell(grid, col + 1, row)) mask |= PATH_E
  if (isPathCell(grid, col, row + 1)) mask |= PATH_S
  if (isPathCell(grid, col - 1, row)) mask |= PATH_W
  return mask
}

export function selectPathTile(grid: PathGrid, col: number, row: number): number | null {
  if (!isPathCell(grid, col, row)) return null
  return tileIndexForMask(neighbourMask(grid, col, row))
}

export function stampDisk(grid: PathGrid, col: number, row: number, radius: number): void {
  const r2 = radius * radius
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue
      const c = col + dx
      const r = row + dy
      if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) continue
      grid[r][c] = true
    }
  }
}

export function stampRect(
  grid: PathGrid,
  col0: number,
  row0: number,
  col1: number,
  row1: number,
): void {
  const minC = Math.min(col0, col1)
  const maxC = Math.max(col0, col1)
  const minR = Math.min(row0, row1)
  const maxR = Math.max(row0, row1)
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) continue
      grid[r][c] = true
    }
  }
}

/**
 * Sample a quadratic Bezier and stamp a path of `halfWidth` cells.
 * `bulge` offsets the control point perpendicular-ish for organic curves.
 */
export function stampCurve(
  grid: PathGrid,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bulge: number,
  halfWidth: number,
  steps = 28,
): void {
  const tile = PATH_TILE_SIZE
  const xc = (x0 + x1) / 2 + bulge
  const yc = (y0 + y1) / 2 - Math.abs(bulge) * 0.22
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * xc + t * t * x1
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * yc + t * t * y1
    // Slight irregularity — avoid ruler-straight ribbons
    const jitter = Math.sin(i * 1.7 + bulge * 0.01) * 6
    const col = Math.round((x + jitter) / tile)
    const row = Math.round(y / tile)
    stampDisk(grid, col, row, halfWidth)
  }
}

export type PathPlacement = { col: number; row: number; tileIndex: number; key: string }

/** Enumerate all path cells with resolved tile keys for rendering. */
export function resolvePathPlacements(grid: PathGrid): PathPlacement[] {
  const out: PathPlacement[] = []
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const idx = selectPathTile(grid, col, row)
      if (idx === null) continue
      out.push({ col, row, tileIndex: idx, key: pathTileKey(idx) })
    }
  }
  return out
}
