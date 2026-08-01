import { describe, expect, it } from 'vitest'
import { TERRAIN_TILE } from './terrainTypes'
import { assertTilesetQa, inspectTileRgba } from './terrainQa'

/** Build a packed RGBA buffer (row-major). */
function makeRgba(
  width: number,
  height: number,
  fill: (x: number, y: number) => [number, number, number, number],
): Uint8ClampedArray {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = fill(x, y)
      const i = (y * width + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = a
    }
  }
  return data
}

function solidTile(
  r: number,
  g: number,
  b: number,
  size = TERRAIN_TILE,
): Uint8ClampedArray {
  return makeRgba(size, size, () => [r, g, b, 255])
}

describe('inspectTileRgba', () => {
  it('rejects non-32×32 tile', () => {
    const rgba = solidTile(40, 80, 40, 16)
    const result = inspectTileRgba(rgba, 16, 16)
    expect(result.ok).toBe(false)
    expect(result.reasons.some((r) => /32/.test(r))).toBe(true)
  })

  it('rejects transparent outer row/column', () => {
    const rgba = makeRgba(TERRAIN_TILE, TERRAIN_TILE, (x, y) => {
      // 2px transparent top/bottom — measured defect class from path_stone_v01
      if (y < 2 || y >= TERRAIN_TILE - 2) return [0, 0, 0, 0]
      return [16, 64, 32, 255]
    })
    const result = inspectTileRgba(rgba, TERRAIN_TILE, TERRAIN_TILE)
    expect(result.ok).toBe(false)
    expect(result.reasons.some((r) => /transparent/i.test(r))).toBe(true)
  })

  it('rejects dark frame (near-black opaque edge)', () => {
    const rgba = makeRgba(TERRAIN_TILE, TERRAIN_TILE, (x, y) => {
      const onEdge = x === 0 || y === 0 || x === TERRAIN_TILE - 1 || y === TERRAIN_TILE - 1
      // #1c1e25 side edges — measured defect class
      if (onEdge) return [28, 30, 37, 255]
      return [64, 96, 80, 255]
    })
    const result = inspectTileRgba(rgba, TERRAIN_TILE, TERRAIN_TILE)
    expect(result.ok).toBe(false)
    expect(result.reasons.some((r) => /dark|frame|border|rim/i.test(r))).toBe(true)
  })

  it('rejects dark frame (outer ring avg luminance far below interior)', () => {
    const rgba = makeRgba(TERRAIN_TILE, TERRAIN_TILE, (x, y) => {
      const onRing = x === 0 || y === 0 || x === TERRAIN_TILE - 1 || y === TERRAIN_TILE - 1
      if (onRing) return [20, 24, 28, 255]
      return [90, 110, 70, 255]
    })
    const result = inspectTileRgba(rgba, TERRAIN_TILE, TERRAIN_TILE)
    expect(result.ok).toBe(false)
    expect(result.reasons.some((r) => /dark|frame|border|rim|luminance/i.test(r))).toBe(true)
  })

  it('accepts a synthetic seamless solid tile', () => {
    const rgba = solidTile(48, 96, 56)
    const result = inspectTileRgba(rgba, TERRAIN_TILE, TERRAIN_TILE)
    expect(result.ok).toBe(true)
    expect(result.reasons).toEqual([])
  })
})

describe('assertTilesetQa', () => {
  it('aggregates per-tile failures across a set', () => {
    const good = solidTile(48, 96, 56)
    const bad = makeRgba(TERRAIN_TILE, TERRAIN_TILE, (x, y) => {
      if (x === 0) return [0, 0, 0, 0]
      return [48, 96, 56, 255]
    })
    const result = assertTilesetQa([
      { rgba: good, width: TERRAIN_TILE, height: TERRAIN_TILE, label: 'solid' },
      { rgba: bad, width: TERRAIN_TILE, height: TERRAIN_TILE, label: 'hole' },
    ])
    expect(result.ok).toBe(false)
    expect(result.reasons.some((r) => /hole/i.test(r))).toBe(true)
  })

  it('passes when every tile is seamless', () => {
    const tiles = [solidTile(40, 70, 40), solidTile(50, 80, 90)].map((rgba, i) => ({
      rgba,
      width: TERRAIN_TILE,
      height: TERRAIN_TILE,
      label: `tile-${i}`,
    }))
    const result = assertTilesetQa(tiles)
    expect(result.ok).toBe(true)
    expect(result.reasons).toEqual([])
  })
})
