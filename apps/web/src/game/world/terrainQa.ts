import { TERRAIN_TILE } from './terrainTypes'

export type TerrainQaResult = {
  ok: boolean
  reasons: string[]
}

export type TerrainQaTile = {
  rgba: Uint8ClampedArray | Uint8Array
  width: number
  height: number
  label?: string
}

/** Relative luminance (sRGB, 0–255 scale). */
function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function pixelAt(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  x: number,
  y: number,
): [number, number, number, number] {
  const i = (y * width + x) * 4
  return [rgba[i]!, rgba[i + 1]!, rgba[i + 2]!, rgba[i + 3]!]
}

function isOuter(x: number, y: number, width: number, height: number): boolean {
  return x === 0 || y === 0 || x === width - 1 || y === height - 1
}

/** Near-black opaque edge (path_stone_v01 measured ~#1c1e25). */
const NEAR_BLACK_LUMA = 45
const NEAR_BLACK_ALPHA = 240

/** Outer-ring avg luminance this far below interior ⇒ baked dark frame. */
const RIM_LUMA_DELTA = 28

/**
 * Inspect one decoded RGBA tile. Never throws — returns structured reasons.
 */
export function inspectTileRgba(
  rgba: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number,
): TerrainQaResult {
  const reasons: string[] = []

  if (width !== TERRAIN_TILE || height !== TERRAIN_TILE) {
    reasons.push(`expected ${TERRAIN_TILE}×${TERRAIN_TILE} tile, got ${width}×${height}`)
    return { ok: false, reasons }
  }

  const expectedBytes = width * height * 4
  if (rgba.length < expectedBytes) {
    reasons.push(`RGBA buffer too short: ${rgba.length} < ${expectedBytes}`)
    return { ok: false, reasons }
  }

  let transparentOuter = 0
  let nearBlackOpaqueEdge = 0
  let rimLumaSum = 0
  let rimCount = 0
  let interiorLumaSum = 0
  let interiorCount = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelAt(rgba, width, x, y)
      const luma = luminance(r, g, b)
      const outer = isOuter(x, y, width, height)

      if (outer) {
        rimLumaSum += luma
        rimCount++
        if (a < 250) transparentOuter++
        if (a >= NEAR_BLACK_ALPHA && luma <= NEAR_BLACK_LUMA) nearBlackOpaqueEdge++
      } else {
        interiorLumaSum += luma
        interiorCount++
      }
    }
  }

  if (transparentOuter > 0) {
    reasons.push(`transparent outer row/column (${transparentOuter} pixels with alpha < 250)`)
  }

  if (nearBlackOpaqueEdge > 0) {
    reasons.push(
      `dark border: ${nearBlackOpaqueEdge} near-black opaque edge pixels (luma ≤ ${NEAR_BLACK_LUMA})`,
    )
  }

  if (rimCount > 0 && interiorCount > 0) {
    const rimAvg = rimLumaSum / rimCount
    const interiorAvg = interiorLumaSum / interiorCount
    if (interiorAvg - rimAvg >= RIM_LUMA_DELTA) {
      reasons.push(
        `dark frame: outer ring avg luminance ${rimAvg.toFixed(1)} is ${
          (interiorAvg - rimAvg).toFixed(1)
        } below interior ${interiorAvg.toFixed(1)}`,
      )
    }
  }

  return { ok: reasons.length === 0, reasons }
}

/**
 * Run QA over a set of tiles (e.g. every cell in a spritesheet). Never throws.
 */
export function assertTilesetQa(tiles: TerrainQaTile[]): TerrainQaResult {
  const reasons: string[] = []

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]!
    const label = tile.label ?? `tile[${i}]`
    const result = inspectTileRgba(tile.rgba, tile.width, tile.height)
    if (!result.ok) {
      for (const reason of result.reasons) {
        reasons.push(`${label}: ${reason}`)
      }
    }
  }

  return { ok: reasons.length === 0, reasons }
}
