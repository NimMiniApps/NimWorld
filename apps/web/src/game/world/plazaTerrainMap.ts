import { LOCATIONS, PLAZA_CENTER, SPAWN_POINT } from './locations'
import type { CellPredicate } from './terrainResolver'
import {
  TERRAIN_COLS,
  TERRAIN_CONSTRUCTION,
  TERRAIN_ENTRANCE,
  TERRAIN_PATH,
  TERRAIN_PLAZA,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  TERRAIN_WATER,
  createEmptyTerrainGrid,
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

/**
 * Fill everything outside an ellipse. Elliptical rather than circular because
 * the world is wider than it is tall — a circle would leave large dead grass
 * margins at the left and right edges.
 *
 * ponytail: fills to the world edge rather than stamping a fixed-width ring.
 * A ring would need a second walkable-margin check to stop the player
 * slipping behind it; "outside is water" is sealed by construction. The
 * visible band is bounded by the camera, not by a thickness parameter.
 */
function stampOutsideEllipse(
  grid: TerrainCell[][],
  col: number,
  row: number,
  rx: number,
  ry: number,
  value: TerrainCell,
): void {
  for (let r = 0; r < TERRAIN_ROWS; r++) {
    for (let c = 0; c < TERRAIN_COLS; c++) {
      const dx = c - col
      const dy = r - row
      if ((dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) >= 1) grid[r]![c] = value
    }
  }
}

function toCell(x: number, y: number) {
  return {
    c: Math.round(x / TERRAIN_TILE),
    r: Math.round(y / TERRAIN_TILE),
  }
}

/** BFS over cells matching `passable`; keys are `"col,row"`. */
export function floodReachable(
  grid: TerrainCell[][],
  startCol: number,
  startRow: number,
  passable: CellPredicate,
): Set<string> {
  const seen = new Set<string>()
  if (startRow < 0 || startCol < 0 || startRow >= grid.length || startCol >= grid[0]!.length) {
    return seen
  }
  if (!passable(grid[startRow]![startCol]!)) return seen

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
      if (!passable(grid[nr]![nc]!)) continue
      seen.add(key)
      queue.push([nc, nr])
    }
  }
  return seen
}

/** Hub radius in cells. */
const HUB_RADIUS = 5
/** Canal ellipse, in cells from the center cell. Outside it is water. */
const CANAL_RX = 16
const CANAL_RY = 11.5

/**
 * Circular hub with radial path spokes to each landmark, enclosed by a canal.
 * Semantic cells for Wang dual-grid sampling (not autotile masks).
 */
export function buildPlazaTerrainGrid(): TerrainCell[][] {
  const grid = createEmptyTerrainGrid()

  const center = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)

  // Canal first — everything paved afterwards wins over water, which
  // guarantees no spoke or landing can be drowned by the ring.
  stampOutsideEllipse(grid, center.c, center.r, CANAL_RX, CANAL_RY, TERRAIN_WATER)

  // Spokes: straight paths from hub edge to each landmark.
  const spokes: Array<{ id: string; pad: { w: number; h: number }; kind: TerrainCell }> = [
    { id: 'arcade', pad: { w: 5, h: 3 }, kind: TERRAIN_ENTRANCE },
    { id: 'arena', pad: { w: 4, h: 3 }, kind: TERRAIN_ENTRANCE },
    { id: 'marketplace', pad: { w: 2, h: 2 }, kind: TERRAIN_CONSTRUCTION },
    { id: 'social-club', pad: { w: 3, h: 2 }, kind: TERRAIN_ENTRANCE },
    { id: 'town-hall', pad: { w: 3, h: 3 }, kind: TERRAIN_ENTRANCE },
  ]

  for (const { id, pad, kind } of spokes) {
    const loc = LOCATIONS.find((l) => l.id === id)!
    // bulge 0 → straight spoke.
    stampCurve(grid, PLAZA_CENTER.x, PLAZA_CENTER.y, loc.x, loc.y, 0, 1, TERRAIN_PATH, 32)
    const cell = toCell(loc.x, loc.y)
    stampLandingPad(grid, cell.c, cell.r, pad.w, pad.h, kind)
  }

  // Spawn approach — a sixth spoke running south from the hub.
  stampCurve(
    grid,
    PLAZA_CENTER.x,
    PLAZA_CENTER.y,
    SPAWN_POINT.x,
    SPAWN_POINT.y,
    0,
    1,
    TERRAIN_PATH,
    16,
  )

  // Hub last so it always reads as one clean disk over the spoke stubs.
  stampDisk(grid, center.c, center.r, HUB_RADIUS, TERRAIN_PLAZA)

  return grid
}
