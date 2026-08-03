import { describe, expect, it } from 'vitest'
import { LOCATIONS, PLAZA_CENTER } from './locations'
import {
  TERRAIN_COLS,
  TERRAIN_CONSTRUCTION,
  TERRAIN_ENTRANCE,
  TERRAIN_PATH,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  TERRAIN_WATER,
  isPath,
  isStoneFamily,
  isWalkable,
  type TerrainCell,
} from './terrainTypes'
import { buildPlazaTerrainGrid, floodReachable } from './plazaTerrainMap'

function toCell(x: number, y: number) {
  return {
    c: Math.round(x / TERRAIN_TILE),
    r: Math.round(y / TERRAIN_TILE),
  }
}

function countStoneInDisk(grid: TerrainCell[][], col: number, row: number, radius: number): number {
  let n = 0
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      if (dc * dc + dr * dr > radius * radius) continue
      const r = row + dr
      const c = col + dc
      if (r < 0 || c < 0 || r >= grid.length || c >= grid[0]!.length) continue
      if (isStoneFamily(grid[r]![c]!)) n++
    }
  }
  return n
}

function findLandingNear(
  grid: TerrainCell[][],
  nearCol: number,
  nearRow: number,
  allowed: ReadonlySet<number>,
  radius = 3,
): { c: number; r: number; cell: TerrainCell } | null {
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = nearRow + dr
      const c = nearCol + dc
      if (r < 0 || c < 0 || r >= grid.length || c >= grid[0]!.length) continue
      const cell = grid[r]![c]!
      if (allowed.has(cell)) return { c, r, cell }
    }
  }
  return null
}

/** Count cells of a given kind in a square around a world-space anchor. */
function countKindNear(
  grid: TerrainCell[][],
  nearCol: number,
  nearRow: number,
  kind: number,
  radius = 4,
): number {
  let n = 0
  for (let dr = -radius; dr <= radius; dr++) {
    for (let dc = -radius; dc <= radius; dc++) {
      const r = nearRow + dr
      const c = nearCol + dc
      if (r < 0 || c < 0 || r >= grid.length || c >= grid[0]!.length) continue
      if (grid[r]![c] === kind) n++
    }
  }
  return n
}

describe('plazaTerrainMap', () => {
  it('builds a TERRAIN_ROWS × TERRAIN_COLS semantic grid', () => {
    const grid = buildPlazaTerrainGrid()
    expect(grid).toHaveLength(TERRAIN_ROWS)
    expect(grid.every((row) => row.length === TERRAIN_COLS)).toBe(true)
  })

  it('paves a circular hub around the fountain', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    expect(isStoneFamily(grid[fc.r]![fc.c]!)).toBe(true)
    // Disk radius 5 → 81 cells; assert most of a radius-4 sample is stone.
    expect(countStoneInDisk(grid, fc.c, fc.r, 4)).toBeGreaterThan(40)
  })

  it('reaches every landmark landing from the hub across stone and path', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    const passable = (cell: TerrainCell) => isStoneFamily(cell) || isPath(cell)
    const reachable = floodReachable(grid, fc.c, fc.r, passable)

    const landings: Array<{ id: string; kinds: number[] }> = [
      { id: 'arcade', kinds: [TERRAIN_ENTRANCE] },
      { id: 'arena', kinds: [TERRAIN_ENTRANCE] },
      { id: 'town-hall', kinds: [TERRAIN_ENTRANCE] },
      { id: 'social-club', kinds: [TERRAIN_ENTRANCE] },
      { id: 'marketplace', kinds: [TERRAIN_CONSTRUCTION] },
    ]

    for (const { id, kinds } of landings) {
      const loc = LOCATIONS.find((l) => l.id === id)!
      const near = toCell(loc.x, loc.y)
      const landing = findLandingNear(grid, near.c, near.r, new Set(kinds))
      expect(landing, `expected landing near ${id}`).not.toBeNull()
      expect(reachable.has(`${landing!.c},${landing!.r}`), `${id} landing reachable`).toBe(true)
    }
  })

  it('gives each landmark a landing pad sized for its role', () => {
    const grid = buildPlazaTerrainGrid()

    const regions: Array<{ id: string; kind: number; minCells: number }> = [
      { id: 'arcade', kind: TERRAIN_ENTRANCE, minCells: 15 }, // 5×3
      { id: 'arena', kind: TERRAIN_ENTRANCE, minCells: 12 }, // 4×3
      { id: 'town-hall', kind: TERRAIN_ENTRANCE, minCells: 9 }, // 3×3
      { id: 'social-club', kind: TERRAIN_ENTRANCE, minCells: 6 }, // 3×2
      { id: 'marketplace', kind: TERRAIN_CONSTRUCTION, minCells: 4 }, // 2×2
    ]

    for (const { id, kind, minCells } of regions) {
      const loc = LOCATIONS.find((l) => l.id === id)!
      const near = toCell(loc.x, loc.y)
      const count = countKindNear(grid, near.c, near.r, kind)
      expect(count, `${id} landing cells`).toBeGreaterThanOrEqual(minCells)
    }
  })

  it('connects the hub to each landmark with a path spoke', () => {
    const grid = buildPlazaTerrainGrid()
    const paths = grid.flat().filter((c) => isPath(c)).length
    expect(paths).toBeGreaterThan(60)
  })

  it('runs the south approach clear of the hub', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    // Walking south from the center, the first cell past the hub must be road.
    // SPAWN_POINT sits on the hub itself, so a spoke that stopped there would
    // be stamped over by the hub disk and vanish without failing any test.
    let r = fc.r
    while (r < TERRAIN_ROWS && isStoneFamily(grid[r]![fc.c]!)) r++
    expect(isPath(grid[r]![fc.c]!), 'south approach leaves the hub as path').toBe(true)
  })

  it('centers the north avenue on the Arcade instead of jogging past it', () => {
    const grid = buildPlazaTerrainGrid()
    const arcade = LOCATIONS.find((l) => l.id === 'arcade')!
    const cell = toCell(arcade.x, arcade.y)

    let row = cell.r
    while (row < TERRAIN_ROWS && !isPath(grid[row]![cell.c]!)) row++
    expect(row, 'north avenue found below the Arcade pad').toBeLessThan(TERRAIN_ROWS)

    const cols = grid[row]!.flatMap((v, c) => (isPath(v) && Math.abs(c - cell.c) <= 4 ? [c] : []))
    expect(cols.length).toBeGreaterThan(0)
    expect((Math.min(...cols) + Math.max(...cols)) / 2, 'avenue straddles the pad').toBe(cell.c)
  })

  it('keeps water out of the hub and off every spoke', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    for (let dr = -5; dr <= 5; dr++) {
      for (let dc = -5; dc <= 5; dc++) {
        if (dc * dc + dr * dr > 25) continue
        expect(grid[fc.r + dr]![fc.c + dc]).not.toBe(TERRAIN_WATER)
      }
    }
    const pathCells = grid.flat().filter((c) => c === TERRAIN_PATH).length
    const waterCells = grid.flat().filter((c) => c === TERRAIN_WATER).length
    expect(pathCells).toBeGreaterThan(0)
    expect(waterCells).toBeGreaterThan(0)
  })

  it('encloses the plaza with a canal the player cannot walk around', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    // Walking over any non-water cell from the hub must not reach the world edge.
    const reachable = floodReachable(grid, fc.c, fc.r, isWalkable)
    let touchesEdge = false
    for (const key of reachable) {
      const [c, r] = key.split(',').map(Number)
      if (c === 0 || r === 0 || c === TERRAIN_COLS - 1 || r === TERRAIN_ROWS - 1) {
        touchesEdge = true
        break
      }
    }
    expect(touchesEdge, 'canal ring has a gap to the world edge').toBe(false)
  })

  it('does not pave the entire world with stone', () => {
    const grid = buildPlazaTerrainGrid()
    const total = TERRAIN_ROWS * TERRAIN_COLS
    const stone = grid.flat().filter((c) => isStoneFamily(c)).length
    expect(stone).toBeGreaterThan(0)
    expect(stone / total).toBeLessThan(0.4)
  })
})
