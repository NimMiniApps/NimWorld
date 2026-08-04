import { describe, expect, it } from 'vitest'
import { buildBlockingRects } from './terrainCollision'
import { TERRAIN_GRASS, TERRAIN_WATER, TERRAIN_TILE, type TerrainCell } from './terrainTypes'

const G = TERRAIN_GRASS as TerrainCell
const W = TERRAIN_WATER as TerrainCell

describe('buildBlockingRects', () => {
  it('returns nothing for a grid with no water', () => {
    expect(
      buildBlockingRects([
        [G, G],
        [G, G],
      ]),
    ).toEqual([])
  })

  it('emits one rect per water cell when they are isolated', () => {
    const rects = buildBlockingRects([
      [W, G],
      [G, W],
    ])
    expect(rects).toHaveLength(2)
    expect(rects[0]).toEqual({ x: 0, y: 0, width: TERRAIN_TILE, height: TERRAIN_TILE })
    expect(rects[1]).toEqual({
      x: TERRAIN_TILE,
      y: TERRAIN_TILE,
      width: TERRAIN_TILE,
      height: TERRAIN_TILE,
    })
  })

  it('merges a horizontal run into a single rect', () => {
    const rects = buildBlockingRects([[W, W, W, G]])
    expect(rects).toHaveLength(1)
    expect(rects[0]).toEqual({ x: 0, y: 0, width: TERRAIN_TILE * 3, height: TERRAIN_TILE })
  })

  it('breaks runs at gaps and at row ends', () => {
    const rects = buildBlockingRects([[W, W, G, W]])
    expect(rects).toHaveLength(2)
    expect(rects[0]!.width).toBe(TERRAIN_TILE * 2)
    expect(rects[1]!.width).toBe(TERRAIN_TILE)
    expect(rects[1]!.x).toBe(TERRAIN_TILE * 3)
  })

  it('does not merge across rows', () => {
    const rects = buildBlockingRects([
      [W, W],
      [W, W],
    ])
    expect(rects).toHaveLength(2)
    expect(rects.every((r) => r.height === TERRAIN_TILE)).toBe(true)
  })

  it('accepts a custom blocking predicate', () => {
    const rects = buildBlockingRects([[G, G]], (cell) => cell === TERRAIN_GRASS)
    expect(rects).toHaveLength(1)
    expect(rects[0]!.width).toBe(TERRAIN_TILE * 2)
  })

  it('produces far fewer rects than blocking cells on a large ring', () => {
    // 30-wide rows of solid water: 1 rect per row, not 30.
    const grid: TerrainCell[][] = Array.from({ length: 10 }, () =>
      Array.from({ length: 30 }, () => W),
    )
    expect(buildBlockingRects(grid)).toHaveLength(10)
  })
})
