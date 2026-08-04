import { describe, expect, it } from 'vitest'
import {
  TERRAIN_GRASS,
  TERRAIN_PLAZA,
  TERRAIN_ENTRANCE,
  TERRAIN_CONSTRUCTION,
  TERRAIN_WATER,
  TERRAIN_PATH,
  TERRAIN_COLS,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  isStoneFamily,
  isPath,
  isWater,
  isWalkable,
} from './terrainTypes'

describe('terrainTypes', () => {
  it('uses a 36×27 grid of 32px cells covering the 1152×864 world', () => {
    expect(TERRAIN_COLS).toBe(36)
    expect(TERRAIN_ROWS).toBe(27)
    expect(TERRAIN_TILE).toBe(32)
    expect(TERRAIN_COLS * TERRAIN_TILE).toBe(1152)
    expect(TERRAIN_ROWS * TERRAIN_TILE).toBe(864)
  })

  it('treats plaza/entrance/construction as stone family', () => {
    expect(isStoneFamily(TERRAIN_GRASS)).toBe(false)
    expect(isStoneFamily(TERRAIN_PLAZA)).toBe(true)
    expect(isStoneFamily(TERRAIN_ENTRANCE)).toBe(true)
    expect(isStoneFamily(TERRAIN_CONSTRUCTION)).toBe(true)
  })

  it('keeps path out of the stone family so it gets its own Wang layer', () => {
    expect(isStoneFamily(TERRAIN_PATH)).toBe(false)
    expect(isPath(TERRAIN_PATH)).toBe(true)
    expect(isPath(TERRAIN_PLAZA)).toBe(false)
  })

  it('identifies water', () => {
    expect(isWater(TERRAIN_WATER)).toBe(true)
    expect(isWater(TERRAIN_GRASS)).toBe(false)
  })

  it('treats water as the only impassable terrain', () => {
    expect(isWalkable(TERRAIN_WATER)).toBe(false)
    expect(isWalkable(TERRAIN_GRASS)).toBe(true)
    expect(isWalkable(TERRAIN_PATH)).toBe(true)
    expect(isWalkable(TERRAIN_PLAZA)).toBe(true)
    expect(isWalkable(TERRAIN_ENTRANCE)).toBe(true)
    expect(isWalkable(TERRAIN_CONSTRUCTION)).toBe(true)
  })
})
