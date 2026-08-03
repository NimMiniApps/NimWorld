import { describe, expect, it } from 'vitest'
import { LOCATIONS, PLAZA_CENTER, SPAWN_POINT, VIEW_FRAME, WORLD, DECOR } from './locations'
import { TERRAIN_COLS, TERRAIN_ROWS, TERRAIN_TILE } from './terrainTypes'

describe('world layout', () => {
  it('matches the terrain grid footprint', () => {
    expect(WORLD.width).toBe(TERRAIN_COLS * TERRAIN_TILE)
    expect(WORLD.height).toBe(TERRAIN_ROWS * TERRAIN_TILE)
  })

  it('centers the plaza in the world', () => {
    expect(PLAZA_CENTER).toEqual({ x: WORLD.width / 2, y: WORLD.height / 2 })
  })

  it('never shows the whole world at once', () => {
    expect(VIEW_FRAME.width).toBeLessThan(WORLD.width)
    expect(VIEW_FRAME.height).toBeLessThan(WORLD.height)
  })

  it('places every landmark well inside the canal ellipse', () => {
    // The canal is elliptical (rx 16 cells, ry 11.5) because the world is
    // wider than it is tall. Require 0.8 of the way out at most, so buildings
    // and their landing pads keep clearance from the water.
    const rx = 16 * TERRAIN_TILE
    const ry = 11.5 * TERRAIN_TILE
    for (const loc of LOCATIONS) {
      const dx = loc.x - PLAZA_CENTER.x
      const dy = loc.y - PLAZA_CENTER.y
      const t = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry)
      expect(t, `${loc.id} ellipse position`).toBeLessThan(0.8)
    }
  })

  it('arranges landmarks on distinct compass bearings', () => {
    const bearings = LOCATIONS.filter((l) => l.id !== 'fountain').map((l) =>
      Math.round((Math.atan2(l.y - PLAZA_CENTER.y, l.x - PLAZA_CENTER.x) * 180) / Math.PI),
    )
    expect(new Set(bearings).size).toBe(bearings.length)
  })

  it('spawns the player south of the fountain, inside the world', () => {
    expect(SPAWN_POINT.x).toBe(PLAZA_CENTER.x)
    expect(SPAWN_POINT.y).toBeGreaterThan(PLAZA_CENTER.y)
    expect(SPAWN_POINT.y).toBeLessThan(WORLD.height)
  })

  it('keeps every decor prop inside the world bounds', () => {
    for (const prop of DECOR) {
      expect(prop.x, `${prop.key} x`).toBeGreaterThanOrEqual(0)
      expect(prop.x, `${prop.key} x`).toBeLessThanOrEqual(WORLD.width)
      expect(prop.y, `${prop.key} y`).toBeGreaterThanOrEqual(0)
      expect(prop.y, `${prop.key} y`).toBeLessThanOrEqual(WORLD.height)
    }
  })
})
