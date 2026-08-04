export const TERRAIN_GRASS = 0
export const TERRAIN_PLAZA = 1
export const TERRAIN_ENTRANCE = 2
export const TERRAIN_CONSTRUCTION = 3
export const TERRAIN_WATER = 4
export const TERRAIN_PATH = 5

export type TerrainCell = 0 | 1 | 2 | 3 | 4 | 5

export const TERRAIN_TILE = 32
export const TERRAIN_COLS = 36
export const TERRAIN_ROWS = 27

/**
 * Paved stone: the hub, the avenues, landmark landings, and construction pads.
 * Path is excluded because it is a separate Wang layer with its own tileset —
 * see `buildPlazaTerrainGrid` for why the two never touch.
 */
export function isStoneFamily(cell: number): boolean {
  return cell === TERRAIN_PLAZA || cell === TERRAIN_ENTRANCE || cell === TERRAIN_CONSTRUCTION
}

export function isPath(cell: number): boolean {
  return cell === TERRAIN_PATH
}

export function isWater(cell: number): boolean {
  return cell === TERRAIN_WATER
}

/** Water is the only impassable terrain; the border wall is props + world bounds. */
export function isWalkable(cell: number): boolean {
  return cell !== TERRAIN_WATER
}

export function createEmptyTerrainGrid(): TerrainCell[][] {
  return Array.from({ length: TERRAIN_ROWS }, () =>
    Array.from({ length: TERRAIN_COLS }, () => TERRAIN_GRASS as TerrainCell),
  )
}
