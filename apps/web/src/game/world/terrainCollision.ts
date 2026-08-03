import { TERRAIN_TILE, isWater, type TerrainCell } from './terrainTypes'
import type { CellPredicate } from './terrainResolver'

/** World-space blocking rectangle, top-left origin. */
export type BlockingRect = {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Static collision bodies for impassable terrain.
 *
 * Horizontal runs of consecutive blocking cells merge into one rect. The
 * canal alone spans several hundred cells; one body per cell would be
 * wasteful on mobile, and run-merging brings it down to tens of bodies for
 * about ten lines of work.
 *
 * ponytail: rows only, no rectangle packing. Vertical merging would roughly
 * halve the count again — do it only if profiling says these bodies matter.
 */
export function buildBlockingRects(
  grid: TerrainCell[][],
  isBlocking: CellPredicate = isWater,
): BlockingRect[] {
  const rects: BlockingRect[] = []

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r]!
    let runStart = -1

    // Runs to `row.length` inclusive so a run reaching the row's end is
    // flushed by the final iteration rather than needing a duplicate flush.
    for (let c = 0; c <= row.length; c++) {
      const blocking = c < row.length && isBlocking(row[c]!)

      if (blocking && runStart === -1) {
        runStart = c
      } else if (!blocking && runStart !== -1) {
        rects.push({
          x: runStart * TERRAIN_TILE,
          y: r * TERRAIN_TILE,
          width: (c - runStart) * TERRAIN_TILE,
          height: TERRAIN_TILE,
        })
        runStart = -1
      }
    }
  }

  return rects
}
