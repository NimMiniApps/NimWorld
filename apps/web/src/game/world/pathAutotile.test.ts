import { describe, expect, it } from 'vitest'
import {
  PATH_E,
  PATH_N,
  PATH_S,
  PATH_W,
  createEmptyPathGrid,
  neighbourMask,
  selectPathTile,
  stampCurve,
  stampDisk,
  stampRect,
  tileIndexForMask,
} from './pathAutotile'

describe('pathAutotile', () => {
  it('maps every 4-bit mask to a tileset index', () => {
    for (let mask = 0; mask < 16; mask++) {
      const idx = tileIndexForMask(mask)
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThanOrEqual(16)
    }
  })

  it('uses horizontal tile for E|W neighbours', () => {
    expect(tileIndexForMask(PATH_E | PATH_W)).toBe(6)
  })

  it('uses vertical tile for N|S neighbours', () => {
    expect(tileIndexForMask(PATH_N | PATH_S)).toBe(7)
  })

  it('uses cross tile for all four neighbours', () => {
    expect(tileIndexForMask(PATH_N | PATH_E | PATH_S | PATH_W)).toBe(16)
  })

  it('computes neighbour mask from adjacent path cells', () => {
    const grid = createEmptyPathGrid(5, 5)
    grid[2][2] = true
    grid[1][2] = true // N
    grid[2][3] = true // E
    expect(neighbourMask(grid, 2, 2)).toBe(PATH_N | PATH_E)
    expect(selectPathTile(grid, 2, 2)).toBe(10) // NE corner
  })

  it('returns null for grass cells', () => {
    const grid = createEmptyPathGrid(3, 3)
    expect(selectPathTile(grid, 1, 1)).toBeNull()
  })

  it('stamps a filled landing disk', () => {
    const grid = createEmptyPathGrid(12, 12)
    stampDisk(grid, 6, 6, 2)
    let count = 0
    for (const row of grid) for (const cell of row) if (cell) count++
    expect(count).toBeGreaterThan(8)
    expect(selectPathTile(grid, 6, 6)).toBe(16)
  })

  it('stamps curve without leaving an empty corridor', () => {
    const grid = createEmptyPathGrid(30, 22)
    stampCurve(grid, 0, 176, 480, 360, 40, 1, 20)
    const placements = grid.flat().filter(Boolean).length
    expect(placements).toBeGreaterThan(15)
  })

  it('stamps rectangular entrance plaza', () => {
    const grid = createEmptyPathGrid(20, 20)
    stampRect(grid, 8, 4, 11, 7)
    expect(grid[4][8]).toBe(true)
    expect(grid[7][11]).toBe(true)
    expect(grid[3][8]).toBe(false)
  })
})
