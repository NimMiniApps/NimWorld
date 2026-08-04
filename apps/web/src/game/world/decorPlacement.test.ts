import { describe, expect, it } from 'vitest'
import { ART_DISPLAY_SIZE } from '../assets/artManifest'
import { DECOR, buildDecor, canalT } from './decorPlacement'
import { FUTURE_LANDMARKS, LOCATIONS, SPAWN_POINT, WORLD } from './locations'
import { buildPlazaTerrainGrid } from './plazaTerrainMap'
import { TERRAIN_GRASS, TERRAIN_TILE } from './terrainTypes'

function cellUnder(x: number, y: number): number {
  const grid = buildPlazaTerrainGrid()
  return grid[Math.floor(y / TERRAIN_TILE)][Math.floor(x / TERRAIN_TILE)]
}

describe('decor placement', () => {
  it('stands every prop on grass', () => {
    // The invariant the old rescaled composition broke: props on paving and in
    // the canal. Nothing may stand on stone or water.
    for (const prop of DECOR) {
      expect(cellUnder(prop.x, prop.y), `${prop.key} at ${prop.x},${prop.y}`).toBe(TERRAIN_GRASS)
    }
  })

  it('keeps props inside the world', () => {
    for (const prop of DECOR) {
      expect(prop.x).toBeGreaterThan(0)
      expect(prop.y).toBeGreaterThan(0)
      expect(prop.x).toBeLessThan(WORLD.width)
      expect(prop.y).toBeLessThan(WORLD.height)
    }
  })

  it('clears every landmark footprint', () => {
    for (const prop of DECOR) {
      for (const loc of LOCATIONS) {
        const size = ART_DISPLAY_SIZE[loc.texture ?? ''] ?? { w: loc.collideW, h: loc.collideH }
        const inside =
          Math.abs(prop.x - loc.x) < size.w / 2 && Math.abs(prop.y - loc.y) < size.h / 2
        expect(inside, `${prop.key} overlaps ${loc.id}`).toBe(false)
      }
      for (const loc of FUTURE_LANDMARKS) {
        const inside =
          Math.abs(prop.x - loc.x) < loc.collideW / 2 && Math.abs(prop.y - loc.y) < loc.collideH / 2
        expect(inside, `${prop.key} overlaps ${loc.id}`).toBe(false)
      }
    }
  })

  it('leaves the spawn tile walkable', () => {
    for (const prop of DECOR) {
      expect(Math.hypot(prop.x - SPAWN_POINT.x, prop.y - SPAWN_POINT.y)).toBeGreaterThan(40)
    }
  })

  it('never stacks two props on the same spot', () => {
    for (let i = 0; i < DECOR.length; i++) {
      for (let j = i + 1; j < DECOR.length; j++) {
        const gap = Math.hypot(DECOR[i].x - DECOR[j].x, DECOR[i].y - DECOR[j].y)
        expect(gap, `${DECOR[i].key} and ${DECOR[j].key}`).toBeGreaterThanOrEqual(24)
      }
    }
  })

  it('ramps density outward, where the grass actually is', () => {
    // Close to the hub the avenues' Wang transition tiles fuse and the wedges
    // between them close up, so there is no room for foliage there.
    const inner = DECOR.filter((p) => canalT(p.x, p.y) < 0.68).length
    const outer = DECOR.filter((p) => canalT(p.x, p.y) >= 0.68).length
    expect(outer).toBeGreaterThan(inner)
  })

  it('fills the band just inside the canal', () => {
    // This band was empty before C3 and is what makes the plaza read enclosed.
    const enclosing = DECOR.filter((p) => canalT(p.x, p.y) >= 0.88)
    expect(enclosing.length).toBeGreaterThanOrEqual(20)
  })

  it('is deterministic', () => {
    expect(buildDecor()).toEqual(buildDecor())
    expect(buildDecor()).toEqual([...DECOR])
  })

  it('plants trees, ground cover, and lighting', () => {
    const keys = new Set(DECOR.map((p) => p.key))
    expect(keys).toContain('prop-tree')
    expect(keys).toContain('prop-bush')
    expect(keys).toContain('prop-lantern')
  })

  it('spreads foliage across textures instead of repeating one', () => {
    // Before C3 the whole plaza was 35 copies of one tree and 40 of one bush,
    // which read as copy-paste however well the props were placed.
    const foliage = DECOR.filter((p) => p.key !== 'prop-wall' && p.key !== 'prop-wall-pillar')
    const counts = new Map<string, number>()
    for (const p of foliage) counts.set(p.key, (counts.get(p.key) ?? 0) + 1)
    const most = Math.max(...counts.values())
    expect(most / foliage.length).toBeLessThan(0.3)

    const canopy = ['prop-tree', 'prop-conifer', 'prop-broadleaf', 'prop-blossom']
    for (const key of canopy) {
      expect(counts.get(key) ?? 0, `${key} count`).toBeGreaterThanOrEqual(3)
    }
  })

  it('encloses the plaza with a border wall on the canal bank', () => {
    const wall = DECOR.filter((p) => p.key === 'prop-wall' || p.key === 'prop-wall-pillar')
    expect(wall.length).toBeGreaterThanOrEqual(30)
    // Pillars break up the longest repeated run in the world.
    expect(DECOR.some((p) => p.key === 'prop-wall-pillar')).toBe(true)
    // The wall belongs on the bank, not inland among the trees.
    for (const w of wall) expect(canalT(w.x, w.y)).toBeGreaterThan(0.9)
  })

  it('gives each landmark its themed micro-landmark', () => {
    // These are placed outward of the building, which means the offset has to
    // start clear of its footprint — at a smaller radius every candidate falls
    // inside the sprite and is rejected, silently dropping the prop.
    const keys = new Set(DECOR.map((p) => p.key))
    for (const key of ['prop-joystick', 'prop-coffee', 'prop-statue', 'prop-fence']) {
      expect(keys, key).toContain(key)
    }
  })
})
