import { describe, expect, it } from 'vitest'
import {
  TERRAIN_GRASS,
  TERRAIN_PLAZA,
  TERRAIN_ENTRANCE,
  TERRAIN_CONSTRUCTION,
  TERRAIN_COLS,
  TERRAIN_ROWS,
  TERRAIN_TILE,
  isStoneFamily,
} from './terrainTypes'

describe('terrainTypes', () => {
  it('uses a 30×23 grid of 32px cells', () => {
    expect(TERRAIN_COLS).toBe(30)
    expect(TERRAIN_ROWS).toBe(23)
    expect(TERRAIN_TILE).toBe(32)
    expect(TERRAIN_COLS * TERRAIN_TILE).toBe(960)
    expect(TERRAIN_ROWS * TERRAIN_TILE).toBe(736) // 16px past WORLD.height 720
  })

  it('treats plaza/entrance/construction as stone family', () => {
    expect(isStoneFamily(TERRAIN_GRASS)).toBe(false)
    expect(isStoneFamily(TERRAIN_PLAZA)).toBe(true)
    expect(isStoneFamily(TERRAIN_ENTRANCE)).toBe(true)
    expect(isStoneFamily(TERRAIN_CONSTRUCTION)).toBe(true)
  })
})
