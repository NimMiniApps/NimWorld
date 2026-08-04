import { ART_DISPLAY_SIZE } from '../assets/artManifest'
import { FUTURE_LANDMARKS, LOCATIONS, PLAZA_CENTER, SPAWN_POINT, WORLD } from './locations'
import { CANAL_RX, CANAL_RY, buildPlazaTerrainGrid } from './plazaTerrainMap'
import {
  TERRAIN_GRASS,
  TERRAIN_PATH,
  TERRAIN_PLAZA,
  TERRAIN_TILE,
  type TerrainCell,
} from './terrainTypes'

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

/** Foliage stands on grass only — never on paving, never in the water. */
function standsOnGrass(grid: TerrainCell[][], x: number, y: number): boolean {
  return cellAt(grid, x, y) === TERRAIN_GRASS
}

/** Street furniture stands on the paving: lighting and seating belong to the road. */
function standsOnPaving(grid: TerrainCell[][], x: number, y: number): boolean {
  const cell = cellAt(grid, x, y)
  return cell === TERRAIN_PLAZA || cell === TERRAIN_PATH
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
  /** Props per thicket, inclusive range. See `scatterBand`. */
  clump: [number, number]
  /** How far a thicket's members sit from its seed, in pixels. */
  spread: number
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
    keys: ['prop-broadleaf', 'prop-oak', 'prop-blossom', 'prop-willow'],
    count: 16,
    clump: [1, 2],
    spread: 62,
  },
  {
    from: 0.82,
    to: 0.93,
    keys: ['prop-conifer', 'prop-conifer', 'prop-poplar', 'prop-oak', 'prop-broadleaf'],
    count: 30,
    clump: [2, 4],
    spread: 58,
  },
  {
    from: 0.42,
    to: 0.66,
    keys: ['prop-shrub', 'prop-bush', 'prop-fern', 'prop-flowerbed', 'prop-boulder'],
    count: 22,
    clump: [1, 3],
    spread: 40,
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
    count: 26,
    clump: [2, 4],
    spread: 42,
  },
  {
    from: 0.82,
    to: 0.93,
    keys: ['prop-fern', 'prop-shrub', 'prop-hedge', 'prop-boulder'],
    count: 18,
    clump: [2, 4],
    spread: 40,
  },
]

/** Minimum gap between prop centers, by key. Canopies need the most room. */
const SPACING: Record<string, number> = {
  'prop-conifer': 40,
  'prop-broadleaf': 44,
  'prop-blossom': 42,
  'prop-oak': 44,
  'prop-poplar': 30,
  'prop-willow': 46,
  'prop-bush': 28,
  'prop-shrub': 26,
  'prop-fern': 24,
  'prop-flowerbed': 34,
  'prop-boulder': 32,
  // Under the sprite width, so a clump of hedges closes into one run instead of
  // standing as separate blocks — a lone hedge does not read as a hedge.
  'prop-hedge': 34,
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

function canStand(grid: TerrainCell[][], x: number, y: number): boolean {
  if (x < 16 || y < 16 || x > WORLD.width - 16 || y > WORLD.height - 16) return false
  return standsOnGrass(grid, x, y) && clearsLandmarks(x, y, 12)
}

/**
 * Rejection-sample one band into thickets, bounded so it always terminates.
 *
 * Sampling each prop independently against a minimum spacing produces blue
 * noise — props evenly spread, never touching, never grouped. That is what made
 * the first pass read as the same few sprites pasted across the map: the
 * regularity is the tell, not the sprite count. Vegetation grows in clumps with
 * clearings between, so a seed is drawn per thicket and its members are drawn
 * around it, biased toward the seed's own texture so a thicket reads as one
 * stand of trees rather than an assortment.
 */
function scatterBand(
  grid: TerrainCell[][],
  band: ScatterBand,
  rand: () => number,
  placed: DecorItem[],
): void {
  const maxAttempts = band.count * 60
  let taken = 0
  let seed = 0
  for (let attempt = 0; attempt < maxAttempts && taken < band.count; attempt++) {
    const angle = rand() * Math.PI * 2
    const t = band.from + rand() * (band.to - band.from)
    const sx = Math.round(PLAZA_CENTER.x + Math.cos(angle) * t * CANAL_RX * TERRAIN_TILE)
    const sy = Math.round(PLAZA_CENTER.y + Math.sin(angle) * t * CANAL_RY * TERRAIN_TILE)
    if (!canStand(grid, sx, sy)) continue

    // Thickets take textures in turn rather than at random. Drawing the seed
    // randomly starved whole textures — a band of six thickets could easily miss
    // one of its four trees entirely — and variety is the whole point here. The
    // table stays weighted, so a repeated key still seeds proportionally more.
    const primary = band.keys[seed % band.keys.length]
    if (tooClose(placed, primary, sx, sy)) continue
    seed++
    placed.push({ key: primary, x: sx, y: sy })
    taken++

    const [lo, hi] = band.clump
    const members = lo + Math.floor(rand() * (hi - lo + 1))
    for (let m = 0; m < members && taken < band.count; m++) {
      const key = rand() < 0.6 ? primary : band.keys[Math.floor(rand() * band.keys.length)]
      for (let retry = 0; retry < 10; retry++) {
        const a = rand() * Math.PI * 2
        const r = band.spread * (0.45 + 0.55 * rand())
        const x = Math.round(sx + Math.cos(a) * r)
        const y = Math.round(sy + Math.sin(a) * r)
        if (!canStand(grid, x, y)) continue
        if (tooClose(placed, key, x, y)) continue
        placed.push({ key, x, y })
        taken++
        break
      }
    }
  }
}

/**
 * Street furniture, anchored to the road it belongs to rather than scattered.
 *
 * Only props with real art appear here. The banners, fence, joystick, coffee
 * stand, statue, firepit and picnic table were all procedural placeholders from
 * the pre-art-pass scene, and next to the PixelLab sprites they read as flat
 * coloured blocks. They are better absent than standing in as landmark dressing.
 */
function placeAnchored(grid: TerrainCell[][], placed: DecorItem[]): void {
  const bearings = LOCATIONS.filter((l) => l.id !== 'fountain').map((l) =>
    Math.atan2(l.y - PLAZA_CENTER.y, l.x - PLAZA_CENTER.x),
  )
  // The south approach carries no landmark but is the player's first avenue.
  bearings.push(Math.PI / 2)

  // Lanterns line the avenues from the kerb: on the paving, at its outer edge.
  // They previously stepped perpendicular until they left the road, which put
  // civic lighting out on whatever grass happened to be there.
  for (const angle of bearings) {
    for (const t of [0.45, 0.62, 0.79]) {
      for (const side of [-1, 1]) {
        const px = Math.cos(angle) * t * CANAL_RX * TERRAIN_TILE
        const py = Math.sin(angle) * t * CANAL_RY * TERRAIN_TILE
        const len = Math.hypot(px, py) || 1
        let kerb: { x: number; y: number } | null = null
        for (let offset = 0; offset <= 96; offset += 6) {
          const x = Math.round(PLAZA_CENTER.x + px + (-py / len) * offset * side)
          const y = Math.round(PLAZA_CENTER.y + py + (px / len) * offset * side)
          if (!standsOnPaving(grid, x, y)) break
          kerb = { x, y }
        }
        if (!kerb) continue
        if (!clearsLandmarks(kerb.x, kerb.y, 10)) continue
        if (tooClose(placed, 'prop-lantern', kerb.x, kerb.y)) continue
        placed.push({ key: 'prop-lantern', ...kerb })
      }
    }
  }

  // The bench sprite is a fixed front view: seat toward the camera, back behind.
  // It only reads with its back to the north, so it cannot be placed at an
  // arbitrary bearing — it is set along the fountain's east and west kerbs,
  // where facing south is also facing the square.
  for (const side of [-1, 1]) {
    for (let out = 96; out <= 190; out += 8) {
      const x = Math.round(PLAZA_CENTER.x + side * out)
      const y = Math.round(PLAZA_CENTER.y + 40)
      // The seat overhangs forward of the anchor, so the paving has to continue
      // south of it or the bench sits half off the kerb.
      if (!standsOnPaving(grid, x, y) || !standsOnPaving(grid, x, y + 20)) continue
      if (!clearsLandmarks(x, y, 10)) continue
      if (tooClose(placed, 'prop-bench', x, y)) continue
      placed.push({ key: 'prop-bench', x, y })
      break
    }
  }

  // Crates outside the Arena: the one landmark prop with real art, so the only
  // themed micro-landmark that survives the placeholder cull.
  const arena = LOCATIONS.find((l) => l.id === 'arena')
  if (arena) {
    const size = ART_DISPLAY_SIZE[arena.texture ?? ''] ?? {
      w: arena.collideW,
      h: arena.collideH,
    }
    const start = Math.max(size.w, size.h) / 2 + 20
    const angle = Math.atan2(arena.y - PLAZA_CENTER.y, arena.x - PLAZA_CENTER.x)
    let done = false
    for (const side of [1, -1]) {
      if (done) break
      for (let out = start; out <= start + 72 && !done; out += 8) {
        const x = Math.round(arena.x + Math.cos(angle + (side * Math.PI) / 2) * out)
        const y = Math.round(arena.y + Math.sin(angle + (side * Math.PI) / 2) * out)
        if (!standsOnGrass(grid, x, y)) continue
        if (!clearsLandmarks(x, y, 8)) continue
        if (tooClose(placed, 'prop-crates', x, y)) continue
        placed.push({ key: 'prop-crates', x, y })
        done = true
      }
    }
  }
}

/*
 * There is deliberately no border wall. A run of masonry was tried along the
 * canal bank and cut: the kit is a single straight-on sprite, and a straight-on
 * sprite cannot follow a curved bank. Every segment faces the camera whatever
 * direction the shore is running, so the east and west shores read as stones
 * dropped side-on and the corners do not turn at all. Enclosing the plaza this
 * way needs an oriented kit — north, south, east and west runs plus inner and
 * outer corners — not one sprite repeated around an ellipse. The treeline is
 * carrying the boundary until that kit exists.
 */

export function buildDecor(): DecorItem[] {
  const grid = buildPlazaTerrainGrid()
  const rand = mulberry32(SCATTER_SEED)
  const placed: DecorItem[] = []

  // Order matters: street furniture claims the avenues, then scattered foliage
  // fills whatever grass is left.
  placeAnchored(grid, placed)
  for (const band of BANDS) scatterBand(grid, band, rand, placed)

  return placed
}

/** The plaza's composition. Deterministic, so it is safe to share. */
export const DECOR: readonly DecorItem[] = buildDecor()
