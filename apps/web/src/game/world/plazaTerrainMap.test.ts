import { describe, expect, it } from 'vitest'
import { LOCATIONS, PLAZA_CENTER } from './locations'
import {
  TERRAIN_COLS,
  TERRAIN_CONSTRUCTION,
  TERRAIN_ENTRANCE,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  isStoneFamily,
  type TerrainCell,
} from './terrainTypes'
import { buildPlazaTerrainGrid, stoneFloodReachable } from './plazaTerrainMap'

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

describe('plazaTerrainMap', () => {
  it('builds a TERRAIN_ROWS × TERRAIN_COLS semantic grid', () => {
    const grid = buildPlazaTerrainGrid()
    expect(grid).toHaveLength(TERRAIN_ROWS)
    expect(grid.every((row) => row.length === TERRAIN_COLS)).toBe(true)
  })

  it('has a fountain forecourt larger than a thin ribbon', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    expect(isStoneFamily(grid[fc.r]![fc.c]!)).toBe(true)
    // Disk radius 3 → up to 29 cells; a thin ribbon would be ~7–12
    expect(countStoneInDisk(grid, fc.c, fc.r, 3)).toBeGreaterThan(12)
  })

  it('flood-fills stone family from forecourt to every landmark landing', () => {
    const grid = buildPlazaTerrainGrid()
    const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
    const reachable = stoneFloodReachable(grid, fc.c, fc.r)

    const landings: Array<{ id: string; yBias: number; kinds: number[] }> = [
      { id: 'arcade', yBias: 36, kinds: [TERRAIN_ENTRANCE] },
      { id: 'arena', yBias: 36, kinds: [TERRAIN_ENTRANCE] },
      { id: 'town-hall', yBias: 0, kinds: [TERRAIN_ENTRANCE] },
      { id: 'social-club', yBias: 0, kinds: [TERRAIN_ENTRANCE] },
      { id: 'marketplace', yBias: 36, kinds: [TERRAIN_CONSTRUCTION, TERRAIN_ENTRANCE] },
    ]

    for (const { id, yBias, kinds } of landings) {
      const loc = LOCATIONS.find((l) => l.id === id)!
      const near = toCell(loc.x, loc.y + yBias)
      const landing = findLandingNear(grid, near.c, near.r, new Set(kinds))
      expect(landing, `expected landing near ${id}`).not.toBeNull()
      expect(reachable.has(`${landing!.c},${landing!.r}`), `${id} landing reachable`).toBe(true)
    }
  })

  it('does not pave the entire world with stone', () => {
    const grid = buildPlazaTerrainGrid()
    const total = TERRAIN_ROWS * TERRAIN_COLS
    const stone = grid.flat().filter((c) => isStoneFamily(c)).length
    expect(stone).toBeGreaterThan(0)
    expect(stone / total).toBeLessThan(0.4)
  })
})
