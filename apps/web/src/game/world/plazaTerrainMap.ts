import { ART_DISPLAY_SIZE } from '../assets/artManifest'
import { LOCATIONS, PLAZA_CENTER, SPAWN_POINT, type PlazaLocation } from './locations'
import type { CellPredicate } from './terrainResolver'
import {
  TERRAIN_COLS,
  TERRAIN_CONSTRUCTION,
  TERRAIN_ENTRANCE,
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

/** Stamp an inclusive cell-space rectangle. */
function stampRect(
  grid: TerrainCell[][],
  col0: number,
  row0: number,
  col1: number,
  row1: number,
  value: TerrainCell,
): void {
  for (let r = row0; r <= row1; r++) {
    for (let c = col0; c <= col1; c++) {
      if (r < 0 || c < 0 || r >= TERRAIN_ROWS || c >= TERRAIN_COLS) continue
      grid[r]![c] = value
    }
  }
}

/** Vertical origin PlazaScene draws landmark sprites with. */
const BUILDING_ORIGIN_Y = 0.82
/** Forecourt depth in cells below a building's base. */
const PAD_FORECOURT = 1

/**
 * The cells a landmark's landing pad must cover, derived from the sprite the
 * scene will actually draw.
 *
 * These were hand-authored cell counts carried over from the 960×720 plaza, and
 * the buildings outgrew them: every pad ended up narrower than the building
 * standing on it, so each one hung off its own paving into the grass. Deriving
 * the rect from `ART_DISPLAY_SIZE` means re-sizing a sprite re-sizes its pad.
 *
 * The pad reaches one row above the building's base as well as below it. That
 * row is hidden behind the sprite, and it guarantees no grass shows at the
 * building's feet when the footprint straddles a cell boundary.
 */
function landingPadRect(loc: PlazaLocation): {
  col0: number
  row0: number
  col1: number
  row1: number
} {
  const size = ART_DISPLAY_SIZE[loc.texture ?? ''] ?? { w: loc.collideW, h: loc.collideH }
  const base = loc.y + (1 - BUILDING_ORIGIN_Y) * size.h
  const baseRow = Math.round(base / TERRAIN_TILE)
  return {
    col0: Math.floor((loc.x - size.w / 2) / TERRAIN_TILE),
    col1: Math.ceil((loc.x + size.w / 2) / TERRAIN_TILE) - 1,
    row0: baseRow - 1,
    row1: baseRow + PAD_FORECOURT,
  }
}

/**
 * Snap a road axis so a band of `width` cells lands on exactly that many cells.
 * Odd widths straddle a cell, even widths straddle the seam between two.
 */
function snapAxis(axis: number, width: number): number {
  return width % 2 === 0 ? Math.round(axis - 0.5) + 0.5 : Math.round(axis)
}

/**
 * Stamp a straight road `width` cells wide between two world-space points.
 *
 * Rasterized by perpendicular distance rather than by stamping a brush along
 * the line: a brush rounds its position to a cell at every step, so its edges
 * alternate between full and narrow runs and the road reads as a torn ribbon.
 *
 * A road renders one display tile wider than its cell count, because the Wang
 * layer needs a transition tile on each side. `width: 2` is the narrowest road
 * with a solid core — at width 1 every tile is a transition and the road has
 * no middle.
 */
function stampRoad(
  grid: TerrainCell[][],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  width: number,
  value: TerrainCell,
): void {
  let ax = x0 / TERRAIN_TILE
  let ay = y0 / TERRAIN_TILE
  let bx = x1 / TERRAIN_TILE
  let by = y1 / TERRAIN_TILE

  // Straighten near-axis-aligned roads. The Arena and Marketplace sit one cell
  // off the hub's row, which rasterizes as a single jog partway along an
  // otherwise straight avenue — worse than the 32px of drift it corrects.
  if (Math.abs(by - ay) < 1.5) {
    ay = by = snapAxis(ay, width)
  } else if (Math.abs(bx - ax) < 1.5) {
    ax = bx = snapAxis(ax, width)
  }

  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  if (len2 === 0) return

  // A cell is road when the band covers its center. Measuring to the center
  // rather than to the cell's near edge is what keeps a diagonal road
  // connected: its neighbours sit 0.707 out, so a tighter reach leaves holes.
  const reach = width / 2
  const margin = Math.ceil(reach) + 1
  const c0 = Math.max(0, Math.floor(Math.min(ax, bx) - margin))
  const c1 = Math.min(TERRAIN_COLS - 1, Math.ceil(Math.max(ax, bx) + margin))
  const r0 = Math.max(0, Math.floor(Math.min(ay, by) - margin))
  const r1 = Math.min(TERRAIN_ROWS - 1, Math.ceil(Math.max(ay, by) + margin))

  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      // Squared-off ends: the hub disk and the landing pads cover the joins.
      const t = ((c - ax) * dx + (r - ay) * dy) / len2
      if (t < 0 || t > 1) continue
      if (Math.hypot(c - (ax + t * dx), r - (ay + t * dy)) > reach) continue
      grid[r]![c] = value
    }
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

/** Hub radius in cells. Wide enough that the disk still reads as a circle once
 * six avenues meet it — at radius 4 the junction swallowed the hub and the
 * whole plaza read as an asterisk. */
export const HUB_RADIUS = 6
/**
 * Avenue width in cells, cardinal and diagonal alike. Renders one display tile
 * wider — see `stampRoad` — so 2 is already a three-tile road; wider reads as a
 * courtyard rather than a street.
 */
const AVENUE_WIDTH = 2
/**
 * How far the south approach runs past SPAWN_POINT, toward the Harbor tease.
 * Long enough that it clears the wider hub and still reads as an avenue rather
 * than a stub; it stops short of the canal at CANAL_RY.
 */
const SOUTH_APPROACH_RUN = 160
/** Canal ellipse, in cells from the center cell. Outside it is water. */
const CANAL_RX = 16
const CANAL_RY = 11.5

/**
 * Circular hub with radial stone avenues to each landmark, enclosed by a canal.
 * Semantic cells for Wang dual-grid sampling (not autotile masks).
 *
 * Hub, avenues and landing pads are all one paved material on purpose. Each
 * terrain family is its own Wang layer and every layer only knows how to
 * transition to grass, so two paved materials cannot abut: the upper one paints
 * its material→grass edge tile over the lower one, leaving a grass channel and
 * a second outline between them. A tan avenue meeting the stone hub detached
 * from it visibly. The warm path tileset is kept for C3 garden trails, which
 * only ever touch grass — the case a grass↔path Wang set is built for.
 */
export function buildPlazaTerrainGrid(): TerrainCell[][] {
  const grid = createEmptyTerrainGrid()

  const center = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)

  // Canal first — everything paved afterwards wins over water, which
  // guarantees no spoke or landing can be drowned by the ring.
  stampOutsideEllipse(grid, center.c, center.r, CANAL_RX, CANAL_RY, TERRAIN_WATER)

  // Avenues: straight runs from the hub edge to each landmark.
  const spokes: Array<{ id: string; kind: TerrainCell }> = [
    { id: 'arcade', kind: TERRAIN_ENTRANCE },
    { id: 'arena', kind: TERRAIN_ENTRANCE },
    { id: 'marketplace', kind: TERRAIN_CONSTRUCTION },
    { id: 'social-club', kind: TERRAIN_ENTRANCE },
    { id: 'town-hall', kind: TERRAIN_ENTRANCE },
  ]

  for (const { id, kind } of spokes) {
    const loc = LOCATIONS.find((l) => l.id === id)!
    stampRoad(grid, PLAZA_CENTER.x, PLAZA_CENTER.y, loc.x, loc.y, AVENUE_WIDTH, TERRAIN_PLAZA)
    const { col0, row0, col1, row1 } = landingPadRect(loc)
    stampRect(grid, col0, row0, col1, row1, kind)
  }

  // Spawn approach — a sixth avenue running south from the hub. It runs well
  // past SPAWN_POINT, which sits on the hub itself: a road that stopped there
  // would be swallowed whole by the hub disk.
  stampRoad(
    grid,
    PLAZA_CENTER.x,
    PLAZA_CENTER.y,
    SPAWN_POINT.x,
    SPAWN_POINT.y + SOUTH_APPROACH_RUN,
    AVENUE_WIDTH,
    TERRAIN_PLAZA,
  )

  stampDisk(grid, center.c, center.r, HUB_RADIUS, TERRAIN_PLAZA)

  return grid
}
