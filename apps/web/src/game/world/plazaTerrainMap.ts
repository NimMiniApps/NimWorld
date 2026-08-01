import { LOCATIONS, PLAZA_CENTER, SPAWN_POINT } from './locations'
import {
  TERRAIN_COLS,
  TERRAIN_CONSTRUCTION,
  TERRAIN_ENTRANCE,
  TERRAIN_PLAZA,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  createEmptyTerrainGrid,
  isStoneFamily,
  type TerrainCell,
} from './terrainTypes'

function stampDisk(
  grid: TerrainCell[][],
  col: number,
  row: number,
  radius: number,
  value: TerrainCell,
): void {
  const r2 = radius * radius
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > r2) continue
      const c = col + dx
      const r = row + dy
      if (r < 0 || c < 0 || r >= TERRAIN_ROWS || c >= TERRAIN_COLS) continue
      grid[r]![c] = value
    }
  }
}

/**
 * Stamp a rectangular pad in cell space, centered on (centerCol, centerRow).
 * `width`/`height` are inclusive cell counts (must be ≥ 1).
 */
function stampLandingPad(
  grid: TerrainCell[][],
  centerCol: number,
  centerRow: number,
  width: number,
  height: number,
  value: TerrainCell,
): void {
  const halfW = Math.floor((width - 1) / 2)
  const halfH = Math.floor((height - 1) / 2)
  const col0 = centerCol - halfW
  const row0 = centerRow - halfH
  const col1 = col0 + width - 1
  const row1 = row0 + height - 1
  for (let r = row0; r <= row1; r++) {
    for (let c = col0; c <= col1; c++) {
      if (r < 0 || c < 0 || r >= TERRAIN_ROWS || c >= TERRAIN_COLS) continue
      grid[r]![c] = value
    }
  }
}

/** Quadratic Bezier ribbon with organic bulge / jitter. */
function stampCurve(
  grid: TerrainCell[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  bulge: number,
  halfWidth: number,
  value: TerrainCell,
  steps = 28,
): void {
  const tile = TERRAIN_TILE
  const xc = (x0 + x1) / 2 + bulge
  const yc = (y0 + y1) / 2 - Math.abs(bulge) * 0.22
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * xc + t * t * x1
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * yc + t * t * y1
    const jitter = Math.sin(i * 1.7 + bulge * 0.01) * 6
    const col = Math.round((x + jitter) / tile)
    const row = Math.round(y / tile)
    stampDisk(grid, col, row, halfWidth, value)
  }
}

function toCell(x: number, y: number) {
  return {
    c: Math.round(x / TERRAIN_TILE),
    r: Math.round(y / TERRAIN_TILE),
  }
}

/** BFS over stone-family cells; keys are `"col,row"`. */
export function stoneFloodReachable(
  grid: TerrainCell[][],
  startCol: number,
  startRow: number,
): Set<string> {
  const seen = new Set<string>()
  if (startRow < 0 || startCol < 0 || startRow >= grid.length || startCol >= grid[0]!.length) {
    return seen
  }
  if (!isStoneFamily(grid[startRow]![startCol]!)) return seen

  const queue: Array<[number, number]> = [[startCol, startRow]]
  seen.add(`${startCol},${startRow}`)
  const dirs: Array<[number, number]> = [
    [0, -1],
    [1, 0],
    [0, 1],
    [-1, 0],
  ]

  while (queue.length > 0) {
    const [c, r] = queue.shift()!
    for (const [dc, dr] of dirs) {
      const nc = c + dc
      const nr = r + dr
      const key = `${nc},${nr}`
      if (seen.has(key)) continue
      if (nr < 0 || nc < 0 || nr >= grid.length || nc >= grid[0]!.length) continue
      if (!isStoneFamily(grid[nr]![nc]!)) continue
      seen.add(key)
      queue.push([nc, nr])
    }
  }
  return seen
}

/**
 * Organic plaza terrain: fountain forecourt + routes + landmark landings.
 * Semantic cells for Wang dual-grid sampling (not autotile masks).
 */
export function buildPlazaTerrainGrid(): TerrainCell[][] {
  const grid = createEmptyTerrainGrid()

  const fountain = LOCATIONS.find((l) => l.id === 'fountain')!
  const arcade = LOCATIONS.find((l) => l.id === 'arcade')!
  const arena = LOCATIONS.find((l) => l.id === 'arena')!
  const market = LOCATIONS.find((l) => l.id === 'marketplace')!
  const social = LOCATIONS.find((l) => l.id === 'social-club')!
  const town = LOCATIONS.find((l) => l.id === 'town-hall')!

  // Fountain forecourt — wider than ribbons
  const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
  stampDisk(grid, fc.c, fc.r, 3, TERRAIN_PLAZA)
  stampDisk(grid, fc.c - 1, fc.r + 1, 2, TERRAIN_PLAZA)
  stampDisk(grid, fc.c + 1, fc.r - 1, 2, TERRAIN_PLAZA)

  // Spawn approach
  stampCurve(
    grid,
    SPAWN_POINT.x,
    SPAWN_POINT.y,
    fountain.x,
    fountain.y + 24,
    18,
    1,
    TERRAIN_PLAZA,
    22,
  )

  // Arcade — north, largest entrance pad (~5×3)
  stampCurve(
    grid,
    fountain.x,
    fountain.y - 10,
    arcade.x + 8,
    arcade.y + 36,
    -22,
    1,
    TERRAIN_PLAZA,
    26,
  )
  {
    const pad = toCell(arcade.x, arcade.y + 40)
    stampLandingPad(grid, pad.c, pad.r, 5, 3, TERRAIN_ENTRANCE)
  }

  // Arena — NW, broader formal pad (~4×3)
  stampCurve(
    grid,
    fountain.x - 16,
    fountain.y,
    arena.x + 20,
    arena.y + 28,
    -48,
    1,
    TERRAIN_PLAZA,
    24,
  )
  {
    const pad = toCell(arena.x + 8, arena.y + 34)
    stampLandingPad(grid, pad.c, pad.r, 4, 3, TERRAIN_ENTRANCE)
  }

  // Marketplace — NE, modest construction pad (~2×2)
  stampCurve(
    grid,
    fountain.x + 18,
    fountain.y,
    market.x - 16,
    market.y + 30,
    52,
    1,
    TERRAIN_PLAZA,
    24,
  )
  {
    const pad = toCell(market.x - 4, market.y + 36)
    stampLandingPad(grid, pad.c, pad.r, 2, 2, TERRAIN_CONSTRUCTION)
  }

  // Social Club — SW, smaller warmer pad (~3×2)
  stampCurve(
    grid,
    fountain.x - 8,
    fountain.y + 16,
    social.x + 12,
    social.y - 10,
    36,
    1,
    TERRAIN_PLAZA,
    24,
  )
  {
    const pad = toCell(social.x + 4, social.y - 8)
    stampLandingPad(grid, pad.c, pad.r, 3, 2, TERRAIN_ENTRANCE)
  }

  // Town Hall — SE, clean civic pad (~3×3)
  stampCurve(
    grid,
    fountain.x + 10,
    fountain.y + 18,
    town.x - 10,
    town.y - 12,
    -40,
    1,
    TERRAIN_PLAZA,
    24,
  )
  {
    const pad = toCell(town.x - 6, town.y - 10)
    stampLandingPad(grid, pad.c, pad.r, 3, 3, TERRAIN_ENTRANCE)
  }

  return grid
}
