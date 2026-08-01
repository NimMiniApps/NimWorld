import { describe, expect, it } from 'vitest'
import { PATH_TILE_SIZE, isPathCell } from './pathAutotile'
import { buildPlazaPathGrid, buildPlazaPathPlacements } from './plazaPathMap'
import { LOCATIONS, PLAZA_CENTER, SPAWN_POINT } from './locations'

describe('plazaPathMap', () => {
  it('connects spawn and each landmark approach to the fountain forecourt', () => {
    const grid = buildPlazaPathGrid()
    const cell = (x: number, y: number) => ({
      c: Math.round(x / PATH_TILE_SIZE),
      r: Math.round(y / PATH_TILE_SIZE),
    })

    expect(isPathCell(grid, cell(PLAZA_CENTER.x, PLAZA_CENTER.y).c, cell(PLAZA_CENTER.x, PLAZA_CENTER.y).r)).toBe(
      true,
    )
    expect(isPathCell(grid, cell(SPAWN_POINT.x, SPAWN_POINT.y).c, cell(SPAWN_POINT.x, SPAWN_POINT.y).r)).toBe(
      true,
    )

    for (const id of ['arcade', 'arena', 'marketplace', 'social-club', 'town-hall']) {
      const loc = LOCATIONS.find((l) => l.id === id)!
      // Landing near building foot, not under facade center
      const near = cell(loc.x, loc.y + (id === 'arcade' || id === 'arena' ? 36 : 0))
      let found = false
      for (let dr = -3; dr <= 3 && !found; dr++) {
        for (let dc = -3; dc <= 3 && !found; dc++) {
          if (isPathCell(grid, near.c + dc, near.r + dr)) found = true
        }
      }
      expect(found, `expected path near ${id}`).toBe(true)
    }
  })

  it('emits autotiled placements for every path cell', () => {
    const grid = buildPlazaPathGrid()
    const placements = buildPlazaPathPlacements()
    const pathCount = grid.flat().filter(Boolean).length
    expect(placements.length).toBe(pathCount)
    expect(placements.every((p) => p.key.startsWith('path-auto-'))).toBe(true)
  })

  it('uses corners and junctions (not only straights)', () => {
    const placements = buildPlazaPathPlacements()
    const indexes = new Set(placements.map((p) => p.tileIndex))
    // Expect variety beyond horizontal(6)/vertical(7)
    expect(indexes.size).toBeGreaterThan(4)
  })
})
