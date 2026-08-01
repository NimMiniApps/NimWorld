import {
  PATH_TILE_SIZE,
  createEmptyPathGrid,
  resolvePathPlacements,
  stampCurve,
  stampDisk,
  stampRect,
  type PathGrid,
  type PathPlacement,
} from './pathAutotile'
import { LOCATIONS, PLAZA_CENTER, SPAWN_POINT, WORLD } from './locations'

export function plazaPathGridSize() {
  return {
    cols: Math.floor(WORLD.width / PATH_TILE_SIZE),
    rows: Math.floor(WORLD.height / PATH_TILE_SIZE),
    tile: PATH_TILE_SIZE,
  }
}

/**
 * Organic plaza paths: spawn → fountain → each landmark.
 * Wider fountain forecourt; larger Arcade / Arena entrance landings.
 * Avoids perfect symmetry via uneven bulges and irregular disks.
 */
export function buildPlazaPathGrid(): PathGrid {
  const { cols, rows } = plazaPathGridSize()
  const grid = createEmptyPathGrid(cols, rows)
  const tile = PATH_TILE_SIZE

  const toCell = (x: number, y: number) => ({
    c: Math.round(x / tile),
    r: Math.round(y / tile),
  })

  const fountain = LOCATIONS.find((l) => l.id === 'fountain')!
  const arcade = LOCATIONS.find((l) => l.id === 'arcade')!
  const arena = LOCATIONS.find((l) => l.id === 'arena')!
  const market = LOCATIONS.find((l) => l.id === 'marketplace')!
  const social = LOCATIONS.find((l) => l.id === 'social-club')!
  const town = LOCATIONS.find((l) => l.id === 'town-hall')!

  // Fountain forecourt — wider than ribbons
  const fc = toCell(PLAZA_CENTER.x, PLAZA_CENTER.y)
  stampDisk(grid, fc.c, fc.r, 3)
  stampDisk(grid, fc.c - 1, fc.r + 1, 2)
  stampDisk(grid, fc.c + 1, fc.r - 1, 2)

  // Spawn approach (slightly meandering)
  stampCurve(grid, SPAWN_POINT.x, SPAWN_POINT.y, fountain.x, fountain.y + 24, 18, 1, 22)

  // Arcade — north, larger entrance plaza
  stampCurve(grid, fountain.x, fountain.y - 10, arcade.x + 8, arcade.y + 36, -22, 1, 26)
  stampRect(grid, toCell(arcade.x - 36, arcade.y + 20).c, toCell(arcade.x - 36, arcade.y + 20).r, toCell(arcade.x + 40, arcade.y + 52).c, toCell(arcade.x + 40, arcade.y + 52).r)
  stampDisk(grid, toCell(arcade.x, arcade.y + 40).c, toCell(arcade.x, arcade.y + 40).r, 2)

  // Arena — NW, larger entrance
  stampCurve(grid, fountain.x - 16, fountain.y, arena.x + 20, arena.y + 28, -48, 1, 24)
  stampRect(grid, toCell(arena.x - 20, arena.y + 18).c, toCell(arena.x - 20, arena.y + 18).r, toCell(arena.x + 36, arena.y + 48).c, toCell(arena.x + 36, arena.y + 48).r)
  stampDisk(grid, toCell(arena.x + 8, arena.y + 34).c, toCell(arena.x + 8, arena.y + 34).r, 2)

  // Marketplace construction — NE, modest landing
  stampCurve(grid, fountain.x + 18, fountain.y, market.x - 16, market.y + 30, 52, 1, 24)
  stampDisk(grid, toCell(market.x - 4, market.y + 36).c, toCell(market.x - 4, market.y + 36).r, 1)

  // Social Club — SW
  stampCurve(grid, fountain.x - 8, fountain.y + 16, social.x + 12, social.y - 10, 36, 1, 24)
  stampDisk(grid, toCell(social.x + 4, social.y - 8).c, toCell(social.x + 4, social.y - 8).r, 1)

  // Town Hall — SE
  stampCurve(grid, fountain.x + 10, fountain.y + 18, town.x - 10, town.y - 12, -40, 1, 24)
  stampDisk(grid, toCell(town.x - 6, town.y - 10).c, toCell(town.x - 6, town.y - 10).r, 1)

  return grid
}

export function buildPlazaPathPlacements(): PathPlacement[] {
  return resolvePathPlacements(buildPlazaPathGrid())
}
