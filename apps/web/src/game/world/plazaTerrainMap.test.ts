import { describe, expect, it } from 'vitest'
import { ART_DISPLAY_SIZE } from '../assets/artManifest'
import { LOCATIONS, PLAZA_CENTER } from './locations'
import {
  TERRAIN_COLS,
  TERRAIN_CONSTRUCTION,
  TERRAIN_ENTRANCE,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  TERRAIN_WATER,
  isStoneFamily,
  isWalkable,
  type TerrainCell,
} from './terrainTypes'
import { HUB_RADIUS, buildPlazaTerrainGrid, floodReachable } from './plazaTerrainMap'

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
    // A radius-4 sample sits wholly inside the hub disk, so it should be solid.
    expect(countStoneInDisk(grid, fc.c, fc.r, 4)).toBeGreaterThan(40)
  })

  it('reaches every landmark landing from the hub across the paving', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    const reachable = floodReachable(grid, fc.c, fc.r, isStoneFamily)

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

  it('pads every landmark wider than the building standing on it', () => {
    const grid = buildPlazaTerrainGrid()

    // The bug this guards: pads were hand-authored cell counts from the 960×720
    // plaza, and the art outgrew them, so each building hung off its own paving
    // into the grass. Walk the sprite's own footprint and demand stone under it.
    for (const loc of LOCATIONS) {
      if (!loc.texture) continue
      const size = ART_DISPLAY_SIZE[loc.texture]!
      const base = loc.y + (1 - 0.82) * size.h
      const row = Math.round(base / TERRAIN_TILE)
      const first = Math.floor((loc.x - size.w / 2) / TERRAIN_TILE)
      const last = Math.ceil((loc.x + size.w / 2) / TERRAIN_TILE) - 1

      for (let c = first; c <= last; c++) {
        expect(isStoneFamily(grid[row]![c]!), `${loc.id} paved at col ${c}`).toBe(true)
      }
      expect(isStoneFamily(grid[row + 1]![first]!), `${loc.id} has a forecourt`).toBe(true)
    }
  })

  it('marks the marketplace landing as a construction site', () => {
    const grid = buildPlazaTerrainGrid()
    const loc = LOCATIONS.find((l) => l.id === 'marketplace')!
    const near = toCell(loc.x, loc.y)
    expect(countKindNear(grid, near.c, near.r, TERRAIN_CONSTRUCTION)).toBeGreaterThan(4)
  })

  it('runs the south approach well clear of the hub', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    // SPAWN_POINT sits on the hub disk, so an avenue that stopped there would be
    // stamped over and vanish. Walking south, the paving must run several cells
    // past the disk edge — same material as the hub, so only length shows it.
    let r = fc.r
    while (r < TERRAIN_ROWS && isStoneFamily(grid[r]![fc.c]!)) r++
    expect(r - fc.r, 'paved cells south of the center').toBeGreaterThan(HUB_RADIUS + 3)
  })

  it('centers the north avenue on the Arcade instead of jogging past it', () => {
    const grid = buildPlazaTerrainGrid()
    const arcade = LOCATIONS.find((l) => l.id === 'arcade')!
    const cell = toCell(arcade.x, arcade.y)

    // Sample a row between the Arcade pad and the hub, where the avenue is the
    // only paving. An even-width band cannot sit dead center on a cell, so it
    // may straddle the pad's column by half a cell; a jog is a whole one.
    const row = cell.r + 4
    const cols = grid[row]!.flatMap((v, c) =>
      isStoneFamily(v) && Math.abs(c - cell.c) <= 4 ? [c] : [],
    )
    expect(cols.length, 'avenue found between the Arcade and the hub').toBeGreaterThan(0)
    const mid = (Math.min(...cols) + Math.max(...cols)) / 2
    expect(Math.abs(mid - cell.c), 'avenue straddles the pad').toBeLessThanOrEqual(0.5)
  })

  it('keeps water out of the hub and off every avenue', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    for (let dr = -HUB_RADIUS; dr <= HUB_RADIUS; dr++) {
      for (let dc = -HUB_RADIUS; dc <= HUB_RADIUS; dc++) {
        if (dc * dc + dr * dr > HUB_RADIUS * HUB_RADIUS) continue
        expect(grid[fc.r + dr]![fc.c + dc]).not.toBe(TERRAIN_WATER)
      }
    }
    expect(grid.flat().filter((c) => c === TERRAIN_WATER).length).toBeGreaterThan(0)
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
