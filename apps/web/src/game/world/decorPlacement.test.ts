import { describe, expect, it } from 'vitest'
import { ART_DISPLAY_SIZE } from '../assets/artManifest'
import { DECOR, buildDecor, canalT } from './decorPlacement'
import { FUTURE_LANDMARKS, LOCATIONS, SPAWN_POINT, WORLD } from './locations'
import { buildPlazaTerrainGrid } from './plazaTerrainMap'
import { TERRAIN_GRASS, TERRAIN_PATH, TERRAIN_PLAZA, TERRAIN_TILE } from './terrainTypes'

function cellUnder(x: number, y: number): number {
  const grid = buildPlazaTerrainGrid()
  return grid[Math.floor(y / TERRAIN_TILE)][Math.floor(x / TERRAIN_TILE)]
}

describe('decor placement', () => {
  it('stands every plant on grass', () => {
    // The invariant the old rescaled composition broke: props in the canal and
    // out on the paving. Street furniture is the deliberate exception.
    const street = new Set(['prop-lantern', 'prop-bench'])
    for (const prop of DECOR) {
      if (street.has(prop.key)) continue
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
    expect(keys).toContain('prop-oak')
    expect(keys).toContain('prop-bush')
    expect(keys).toContain('prop-lantern')
  })

  it('keeps every canopy inside the evening vegetation palette', () => {
    // tree_v01's pale mint canopy was far outside #002010–#104010 and read as a
    // sprite borrowed from another game wherever it stood. Nothing places it now.
    expect(DECOR.some((p) => p.key === 'prop-tree')).toBe(false)
  })

  it('spreads foliage across textures instead of repeating one', () => {
    // Before C3 the whole plaza was 35 copies of one tree and 40 of one bush,
    // which read as copy-paste however well the props were placed.
    const foliage = DECOR.filter((p) => p.key !== 'prop-lantern')
    const counts = new Map<string, number>()
    for (const p of foliage) counts.set(p.key, (counts.get(p.key) ?? 0) + 1)
    const most = Math.max(...counts.values())
    expect(most / foliage.length).toBeLessThan(0.3)

    const canopy = [
      'prop-conifer',
      'prop-broadleaf',
      'prop-blossom',
      'prop-oak',
      'prop-poplar',
      'prop-willow',
    ]
    for (const key of canopy) {
      expect(counts.get(key) ?? 0, `${key} count`).toBeGreaterThanOrEqual(3)
    }
  })

  it('groups foliage into thickets rather than spreading it evenly', () => {
    // Independent rejection sampling produces blue noise: props evenly spaced and
    // never touching, which is what read as the same sprites pasted everywhere.
    // Most foliage should have a close neighbour, and some should have none.
    const foliage = DECOR.filter((p) => p.key !== 'prop-lantern' && p.key !== 'prop-bench')
    const neighbours = foliage.map(
      (p) =>
        foliage.filter((q) => q !== p && Math.hypot(q.x - p.x, q.y - p.y) < 56).length,
    )
    const clustered = neighbours.filter((n) => n >= 2).length
    expect(clustered / foliage.length).toBeGreaterThan(0.4)
    expect(neighbours.filter((n) => n === 0).length).toBeGreaterThan(0)
  })

  it('places no border wall', () => {
    // A straight-on wall sprite cannot follow a curved bank: it faces the camera
    // whichever way the shore runs, and the corners never turn. Enclosing the
    // plaza needs an oriented kit, so nothing places the v01 run.
    // See assets/art/rejected/border_wall_v01/REASON.md.
    expect(DECOR.some((p) => p.key.startsWith('prop-wall'))).toBe(false)
  })

  it('places only props that have real art', () => {
    // The banners, fence, joystick, coffee stand, statue, firepit and picnic
    // table were procedural placeholders from before the art pass, and beside
    // the PixelLab sprites they read as flat coloured blocks.
    const placeholders = [
      'prop-banner-cyan',
      'prop-banner-red',
      'prop-banner-purple',
      'prop-banner-green',
      'prop-fence',
      'prop-joystick',
      'prop-coffee',
      'prop-statue',
      'prop-firepit',
      'prop-picnic',
    ]
    for (const key of placeholders) {
      expect(DECOR.some((p) => p.key === key), key).toBe(false)
    }
  })

  it('stands street furniture on the street', () => {
    // Lanterns lining an avenue read as civic lighting; the same lanterns out on
    // the grass read as scatter. Benches are a fixed front view, so they also
    // need paving under them rather than an arbitrary bearing.
    const furniture = DECOR.filter((p) => p.key === 'prop-lantern' || p.key === 'prop-bench')
    expect(furniture.length).toBeGreaterThan(8)
    for (const p of furniture) {
      const cell = cellUnder(p.x, p.y)
      expect([TERRAIN_PLAZA, TERRAIN_PATH], `${p.key} at ${p.x},${p.y}`).toContain(cell)
    }
  })

  it('keeps benches upright against their fixed orientation', () => {
    // The sprite's seat overhangs south of its anchor, so the paving has to
    // continue there or the bench hangs off the kerb.
    for (const bench of DECOR.filter((p) => p.key === 'prop-bench')) {
      expect([TERRAIN_PLAZA, TERRAIN_PATH]).toContain(cellUnder(bench.x, bench.y + 20))
    }
  })
})
