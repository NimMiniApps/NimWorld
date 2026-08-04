import { ART_DISPLAY_SIZE } from '../assets/artManifest'
import { FUTURE_LANDMARKS, LOCATIONS, PLAZA_CENTER, SPAWN_POINT, WORLD } from './locations'
import { CANAL_RX, CANAL_RY, buildPlazaTerrainGrid } from './plazaTerrainMap'
import { TERRAIN_GRASS, TERRAIN_TILE, type TerrainCell } from './terrainTypes'

export interface DecorItem {
  key: string
  x: number
  y: number
  depthBias?: number
}

/**
 * Props are scattered against the terrain rather than authored as pixel
 * coordinates. The previous set was written for the 960×720 cross-shaped plaza
 * and survived into the radial layout as a blanket 1.2× rescale, which left
 * props standing on paving and in the canal — the layout had moved twice since
 * the coordinates were written and nothing recomputed them.
 *
 * Deriving placement from the grid means re-tuning the hub or the canal
 * re-scatters correctly, the same reason landmark landing pads are derived from
 * their sprite instead of authored.
 */

/** Fixed so the composition is identical every run: reviewable, and testable. */
const SCATTER_SEED = 0x4e696d57

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Position in the world's own elliptical shape: 0 at the fountain, 1 at the
 * canal. The world is wider than it is tall, so banding by this instead of by
 * plain radius follows the shape of the dry land rather than cutting corners
 * off it.
 */
export function canalT(x: number, y: number): number {
  const dx = (x - PLAZA_CENTER.x) / (CANAL_RX * TERRAIN_TILE)
  const dy = (y - PLAZA_CENTER.y) / (CANAL_RY * TERRAIN_TILE)
  return Math.hypot(dx, dy)
}

function cellAt(grid: TerrainCell[][], x: number, y: number): TerrainCell | null {
  const c = Math.floor(x / TERRAIN_TILE)
  const r = Math.floor(y / TERRAIN_TILE)
  if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length) return null
  return grid[r][c]
}

/** Props stand on grass only — never on paving, never in the water. */
function standsOnGrass(grid: TerrainCell[][], x: number, y: number): boolean {
  return cellAt(grid, x, y) === TERRAIN_GRASS
}

function clearsLandmarks(x: number, y: number, margin: number): boolean {
  for (const loc of LOCATIONS) {
    const size = ART_DISPLAY_SIZE[loc.texture ?? ''] ?? { w: loc.collideW, h: loc.collideH }
    const halfW = size.w / 2 + margin
    const halfH = size.h / 2 + margin
    if (Math.abs(x - loc.x) < halfW && Math.abs(y - loc.y) < halfH) return false
  }
  for (const loc of FUTURE_LANDMARKS) {
    if (
      Math.abs(x - loc.x) < loc.collideW / 2 + margin &&
      Math.abs(y - loc.y) < loc.collideH / 2 + margin
    ) {
      return false
    }
  }
  // Keep the spawn tile clear so the player never materialises inside a bush.
  return Math.hypot(x - SPAWN_POINT.x, y - SPAWN_POINT.y) > 48
}

interface ScatterBand {
  /** Inclusive lower and exclusive upper bound in `canalT` space. */
  from: number
  to: number
  /** Weighted key table; repeated keys are more likely. */
  keys: string[]
  count: number
}

/**
 * Density ramps outward. Near the hub there is nothing to fill: each Wang layer
 * paints a transition tile beyond its own cells, so the six avenues' edges fuse
 * close to the center and the grass wedges between them close up. The wedges
 * only open out toward the canal, and the band just inside the water is the
 * largest uninterrupted grass in the world.
 */
/**
 * Canopy bands run before ground cover, because rejection sampling quietly
 * favours whatever is smallest: a fern almost always clears the spacing test, a
 * broad tree rarely does, so mixing them in one pass spent the attempt budget on
 * ferns and left barely a tree standing. Big footprints claim their room first.
 *
 * No canopy inside 0.66 — a tree that close to the hub hides the avenue the
 * player is trying to read. The treeline also stops at 0.93, short of the bank,
 * so it is not competing with the border wall for the same cells.
 */
const BANDS: ScatterBand[] = [
  {
    from: 0.66,
    to: 0.82,
    keys: ['prop-broadleaf', 'prop-blossom', 'prop-tree'],
    count: 14,
  },
  {
    from: 0.82,
    to: 0.93,
    keys: ['prop-conifer', 'prop-conifer', 'prop-broadleaf', 'prop-tree', 'prop-blossom'],
    count: 28,
  },
  {
    from: 0.42,
    to: 0.66,
    keys: ['prop-shrub', 'prop-bush', 'prop-fern', 'prop-flowerbed', 'prop-boulder'],
    count: 20,
  },
  {
    from: 0.66,
    to: 0.82,
    keys: [
      'prop-shrub',
      'prop-bush',
      'prop-fern',
      'prop-flowerbed',
      'prop-hedge',
      'prop-boulder',
    ],
    count: 24,
  },
  {
    from: 0.82,
    to: 0.93,
    keys: ['prop-fern', 'prop-shrub', 'prop-hedge', 'prop-boulder'],
    count: 16,
  },
]

/** Minimum gap between prop centers, by key. Canopies need the most room. */
const SPACING: Record<string, number> = {
  'prop-tree': 44,
  'prop-conifer': 40,
  'prop-broadleaf': 44,
  'prop-blossom': 42,
  'prop-bush': 28,
  'prop-shrub': 26,
  'prop-fern': 24,
  'prop-flowerbed': 34,
  'prop-boulder': 32,
  'prop-hedge': 40,
  'prop-wall': 30,
  'prop-crates': 40,
  'prop-lantern': 24,
  'prop-bench': 36,
}

function spacingFor(key: string): number {
  return SPACING[key] ?? 32
}

function tooClose(placed: DecorItem[], key: string, x: number, y: number): boolean {
  for (const p of placed) {
    const min = Math.max(spacingFor(key), spacingFor(p.key))
    if (Math.hypot(p.x - x, p.y - y) < min) return true
  }
  return false
}

/** Rejection-sample one band, bounded so it always terminates. */
function scatterBand(
  grid: TerrainCell[][],
  band: ScatterBand,
  rand: () => number,
  placed: DecorItem[],
): void {
  const maxAttempts = band.count * 60
  let taken = 0
  for (let attempt = 0; attempt < maxAttempts && taken < band.count; attempt++) {
    const angle = rand() * Math.PI * 2
    const t = band.from + rand() * (band.to - band.from)
    const x = Math.round(PLAZA_CENTER.x + Math.cos(angle) * t * CANAL_RX * TERRAIN_TILE)
    const y = Math.round(PLAZA_CENTER.y + Math.sin(angle) * t * CANAL_RY * TERRAIN_TILE)
    if (x < 16 || y < 16 || x > WORLD.width - 16 || y > WORLD.height - 16) continue
    if (!standsOnGrass(grid, x, y)) continue
    if (!clearsLandmarks(x, y, 12)) continue

    const key = band.keys[Math.floor(rand() * band.keys.length)]
    if (tooClose(placed, key, x, y)) continue
    placed.push({ key, x, y })
    taken++
  }
}

/**
 * Compositional props, anchored to the geometry they belong to rather than to
 * absolute pixels. These are deliberately not scattered: a lantern reads as
 * civic lighting only if it lines an avenue, and a banner only means something
 * beside its own landmark.
 */
function placeAnchored(grid: TerrainCell[][], placed: DecorItem[]): void {
  const bearings = LOCATIONS.filter((l) => l.id !== 'fountain').map((l) =>
    Math.atan2(l.y - PLAZA_CENTER.y, l.x - PLAZA_CENTER.x),
  )
  // The south approach carries no landmark but is the player's first avenue.
  bearings.push(Math.PI / 2)

  // Lantern pairs flanking each avenue, at two distances out from the hub.
  for (const angle of bearings) {
    for (const t of [0.52, 0.74]) {
      for (const side of [-1, 1]) {
        const px = Math.cos(angle) * t * CANAL_RX * TERRAIN_TILE
        const py = Math.sin(angle) * t * CANAL_RY * TERRAIN_TILE
        const len = Math.hypot(px, py) || 1
        // Step perpendicular until off the paving, so the lantern lines the
        // avenue from the grass instead of standing in the road.
        for (let offset = 44; offset <= 84; offset += 8) {
          const x = Math.round(PLAZA_CENTER.x + px + (-py / len) * offset * side)
          const y = Math.round(PLAZA_CENTER.y + py + (px / len) * offset * side)
          if (!standsOnGrass(grid, x, y)) continue
          if (!clearsLandmarks(x, y, 10)) continue
          if (tooClose(placed, 'prop-lantern', x, y)) continue
          placed.push({ key: 'prop-lantern', x, y })
          break
        }
      }
    }
  }

  // A banner beside each landmark, on whichever flank has grass.
  const banners: Record<string, string> = {
    arcade: 'prop-banner-cyan',
    arena: 'prop-banner-red',
    'social-club': 'prop-banner-purple',
    'town-hall': 'prop-banner-cyan',
    marketplace: 'prop-banner-green',
  }
  for (const loc of LOCATIONS) {
    const key = banners[loc.id]
    if (!key) continue
    const size = ART_DISPLAY_SIZE[loc.texture ?? ''] ?? { w: loc.collideW, h: loc.collideH }
    for (const side of [-1, 1]) {
      const x = Math.round(loc.x + side * (size.w / 2 + 22))
      const y = Math.round(loc.y + 6)
      if (!standsOnGrass(grid, x, y)) continue
      if (tooClose(placed, key, x, y)) continue
      placed.push({ key, x, y })
      break
    }
  }

  // Seating and micro-landmarks at the fountain's own grass margin.
  const micro: Array<{ key: string; angle: number }> = [
    { key: 'prop-bench', angle: -Math.PI / 4 },
    { key: 'prop-bench', angle: (-3 * Math.PI) / 4 },
    { key: 'prop-picnic', angle: (3 * Math.PI) / 4 },
    { key: 'prop-firepit', angle: Math.PI / 4 },
  ]
  for (const { key, angle } of micro) {
    for (let t = 0.34; t <= 0.6; t += 0.03) {
      const x = Math.round(PLAZA_CENTER.x + Math.cos(angle) * t * CANAL_RX * TERRAIN_TILE)
      const y = Math.round(PLAZA_CENTER.y + Math.sin(angle) * t * CANAL_RY * TERRAIN_TILE)
      if (!standsOnGrass(grid, x, y)) continue
      if (!clearsLandmarks(x, y, 10)) continue
      if (tooClose(placed, key, x, y)) continue
      placed.push({ key, x, y })
      break
    }
  }

  // Micro-landmarks that say something about the building they stand beside
  // (design principle #3). Placed outward of the landmark so they read as its
  // forecourt rather than as scenery that happens to be nearby.
  const themed: Array<{ locId: string; key: string }> = [
    { locId: 'arcade', key: 'prop-joystick' },
    { locId: 'social-club', key: 'prop-coffee' },
    { locId: 'town-hall', key: 'prop-statue' },
    { locId: 'marketplace', key: 'prop-fence' },
    { locId: 'arena', key: 'prop-crates' },
  ]
  for (const { locId, key } of themed) {
    const loc = LOCATIONS.find((l) => l.id === locId)
    if (!loc) continue
    const size = ART_DISPLAY_SIZE[loc.texture ?? ''] ?? { w: loc.collideW, h: loc.collideH }
    // Start clear of the building's own footprint. The Arcade is 190px wide, so
    // any smaller offset lands inside it and is rejected outright.
    const start = Math.max(size.w, size.h) / 2 + 20
    const angle = Math.atan2(loc.y - PLAZA_CENTER.y, loc.x - PLAZA_CENTER.x)
    let done = false
    for (const side of [1, -1]) {
      if (done) break
      for (let out = start; out <= start + 72 && !done; out += 8) {
        const x = Math.round(loc.x + Math.cos(angle + (side * Math.PI) / 2) * out)
        const y = Math.round(loc.y + Math.sin(angle + (side * Math.PI) / 2) * out)
        if (!standsOnGrass(grid, x, y)) continue
        if (!clearsLandmarks(x, y, 8)) continue
        if (tooClose(placed, key, x, y)) continue
        placed.push({ key, x, y })
        done = true
      }
    }
  }
}

/**
 * A low wall following the canal bank, so the plaza reads as deliberately
 * enclosed rather than as ground that happens to stop.
 *
 * There is no `TERRAIN_WALL` cell type by design — water is the only blocking
 * terrain, and the wall blocks through prop collision the way trees already do.
 * Every eighth segment is a lantern pillar, which breaks up what would
 * otherwise be the most repetitive run in the world.
 */
function placeBorderWall(grid: TerrainCell[][], placed: DecorItem[]): void {
  const steps = 96
  let segment = 0
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    // Walk inward from the water until the first dry cell: the bank itself.
    // The search stops at 0.94 so the wall stays outside the treeline band.
    for (let t = 0.995; t > 0.94; t -= 0.005) {
      const x = Math.round(PLAZA_CENTER.x + Math.cos(angle) * t * CANAL_RX * TERRAIN_TILE)
      const y = Math.round(PLAZA_CENTER.y + Math.sin(angle) * t * CANAL_RY * TERRAIN_TILE)
      if (!standsOnGrass(grid, x, y)) continue
      if (!clearsLandmarks(x, y, 8)) break
      const key = segment % 8 === 7 ? 'prop-wall-pillar' : 'prop-wall'
      if (tooClose(placed, key, x, y)) break
      placed.push({ key, x, y })
      segment++
      break
    }
  }
}

export function buildDecor(): DecorItem[] {
  const grid = buildPlazaTerrainGrid()
  const rand = mulberry32(SCATTER_SEED)
  const placed: DecorItem[] = []

  // Order matters: the wall claims the bank, anchored props claim the avenues
  // and landmarks, and scattered foliage fills whatever grass is left.
  placeBorderWall(grid, placed)
  placeAnchored(grid, placed)
  for (const band of BANDS) scatterBand(grid, band, rand, placed)

  return placed
}

/** The plaza's composition. Deterministic, so it is safe to share. */
export const DECOR: readonly DecorItem[] = buildDecor()
