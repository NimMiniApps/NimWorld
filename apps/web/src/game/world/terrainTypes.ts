export const TERRAIN_GRASS = 0
export const TERRAIN_PLAZA = 1
export const TERRAIN_ENTRANCE = 2
export const TERRAIN_CONSTRUCTION = 3

export type TerrainCell = 0 | 1 | 2 | 3

export const TERRAIN_TILE = 32
export const TERRAIN_COLS = 30
export const TERRAIN_ROWS = 23

export function isStoneFamily(cell: number): boolean {
  return cell === TERRAIN_PLAZA || cell === TERRAIN_ENTRANCE || cell === TERRAIN_CONSTRUCTION
}

export function createEmptyTerrainGrid(): TerrainCell[][] {
  return Array.from({ length: TERRAIN_ROWS }, () =>
    Array.from({ length: TERRAIN_COLS }, () => TERRAIN_GRASS as TerrainCell),
  )
}
