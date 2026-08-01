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

/** Cheap chroma: max–min channel spread. Near-grey ≈ low; grass ≈ high. */
function chroma(r: number, g: number, b: number): number {
  return Math.max(r, g, b) - Math.min(r, g, b)
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

const OPAQUE_ALPHA = 250

/**
 * Baked grey/black frame pixels (path_stone_v01 ~#1c1e25) are dark and near-neutral.
 * Chromatic dark greens (#002010–#104010) stay above this chroma floor.
 */
const NEUTRAL_DARK_LUMA = 45
const NEUTRAL_CHROMA_MAX = 18

/** Opaque outer ring: near-neutral AND much darker than interior ⇒ rectangular frame. */
const RIM_LUMA_DELTA = 28

function isNeutralDark(r: number, g: number, b: number, a: number): boolean {
  return (
    a >= OPAQUE_ALPHA &&
    luminance(r, g, b) <= NEUTRAL_DARK_LUMA &&
    chroma(r, g, b) <= NEUTRAL_CHROMA_MAX
  )
}

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
  let neutralDarkOpaqueEdge = 0
  let rimLumaSum = 0
  let rimChromaSum = 0
  let rimOpaqueCount = 0
  let interiorLumaSum = 0
  let interiorCount = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelAt(rgba, width, x, y)
      const luma = luminance(r, g, b)
      const outer = isOuter(x, y, width, height)

      if (outer) {
        if (a < OPAQUE_ALPHA) {
          transparentOuter++
        } else {
          rimLumaSum += luma
          rimChromaSum += chroma(r, g, b)
          rimOpaqueCount++
          if (isNeutralDark(r, g, b, a)) neutralDarkOpaqueEdge++
        }
      } else if (a >= OPAQUE_ALPHA) {
        interiorLumaSum += luma
        interiorCount++
      }
    }
  }

  if (transparentOuter > 0) {
    reasons.push(
      `transparent outer row/column (${transparentOuter} pixels with alpha < ${OPAQUE_ALPHA})`,
    )
  }

  if (neutralDarkOpaqueEdge > 0) {
    reasons.push(
      `dark border: ${neutralDarkOpaqueEdge} near-neutral dark opaque edge pixels ` +
        `(luma ≤ ${NEUTRAL_DARK_LUMA}, chroma ≤ ${NEUTRAL_CHROMA_MAX})`,
    )
  }

  // Frame heuristic: only when opaque rim is near-neutral (baked grey/black),
  // not chromatic grass abutting lighter stone (legitimate Wang topology).
  if (rimOpaqueCount > 0 && interiorCount > 0) {
    const rimAvgLuma = rimLumaSum / rimOpaqueCount
    const rimAvgChroma = rimChromaSum / rimOpaqueCount
    const interiorAvg = interiorLumaSum / interiorCount
    if (
      rimAvgChroma <= NEUTRAL_CHROMA_MAX &&
      interiorAvg - rimAvgLuma >= RIM_LUMA_DELTA
    ) {
      reasons.push(
        `dark frame: opaque outer ring avg luminance ${rimAvgLuma.toFixed(1)} is ${(
          interiorAvg - rimAvgLuma
        ).toFixed(1)} below interior ${interiorAvg.toFixed(1)} ` +
          `(near-neutral rim chroma ${rimAvgChroma.toFixed(1)})`,
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
