/**
 * Verified plaza_stone_wang_v01 topology (Task 3).
 * Source: assets/art/tiles/plaza_stone_wang_v01/topology.json
 *
 * Corner bit order: wang = NW×8 + NE×4 + SW×2 + SE×1 (upper=1, lower=0)
 * Sheet layout: array order 4×4 — col = i%4, row = i//4 — NOT wang-sorted.
 * Lower = grass · Upper = plaza stone (stone-family semantic cells).
 */

/** Corner order used when packing the Wang mask. */
export const CORNER_ORDER = ['NW', 'NE', 'SW', 'SE'] as const

export const CORNER_NW = 8
export const CORNER_NE = 4
export const CORNER_SW = 2
export const CORNER_SE = 1

/**
 * Dual-grid ownership for the display tile at (col, row).
 *
 * Locked rule (cell-anchored / tile-owns-NW):
 *   NW ← cell(col,     row)      // out of bounds = grass (lower)
 *   NE ← cell(col + 1, row)
 *   SW ← cell(col,     row + 1)
 *   SE ← cell(col + 1, row + 1)
 *
 * A corner is upper (1) iff isStoneFamily(cell), else lower (0).
 * No majority voting — each corner samples exactly one semantic cell.
 *
 * Alternate (not used): NW←(col-1,row-1) … SE←(col,row). Rejected in favor of
 * this rule so a painted semantic cell contributes to the tile at the same
 * (col,row) as NW, matching contact-sheet sanity on 2×2 paints.
 */
export const OWNERSHIP_RULE = 'tile-owns-NW' as const

/**
 * Wang mask (0–15) → spritesheet array index (0–15).
 * Bijective map from verified topology sheet.
 *
 *   wang:  0  1  2  3  4  5  6  7  8  9 10 11 12 13 14 15
 *   array: 6  7 10  9  2 11  4 15  5 14  1  8  3  0 13 12
 */
export const WANG_TO_ARRAY: readonly number[] = [
  6, 7, 10, 9, 2, 11, 4, 15, 5, 14, 1, 8, 3, 0, 13, 12,
] as const

/** Full grass (wang 0) and full stone (wang 15) array indexes. */
export const ARRAY_FULL_GRASS = 6
export const ARRAY_FULL_STONE = 12

export function wangToArrayIndex(wang: number): number {
  return WANG_TO_ARRAY[wang & 0xf]!
}
