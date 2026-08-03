export interface PlazaLocation {
  id: string
  label: string
  interactionLabel: string
  x: number
  y: number
  /** Proximity radius for interaction. */
  radius: number
  /** Collision box size. */
  collideW: number
  collideH: number
  /** Building texture key. */
  texture?: string
  subtitle: string
  accent: number
}

export interface FutureLandmark {
  id: string
  x: number
  y: number
  texture: string
  title: string
  lines: string[]
  collideW: number
  collideH: number
}

/** Compact world bounds — physics / scroll limits. Matches the 36×27 terrain grid. */
export const WORLD = {
  width: 1152,
  height: 864,
  padding: 24,
}

/**
 * Content frame used for cover-zoom. Tighter than WORLD so the paved plaza
 * fills the viewport instead of showing large empty grass/water margins.
 * Sized so the player never sees the entire world at once.
 */
export const VIEW_FRAME = {
  width: 780,
  height: 600,
}

export const PLAZA_CENTER = { x: 576, y: 432 }

/**
 * Organic composition: Arcade as largest rear landmark, Arena left,
 * construction Marketplace right, Social + Town Hall foreground, fountain center.
 * Buildings frame the plaza; fountain stays partially visible from major paths.
 */
export const LOCATIONS: PlazaLocation[] = [
  {
    id: 'fountain',
    label: 'NimConnect Fountain',
    interactionLabel: 'Open Profile',
    x: PLAZA_CENTER.x,
    y: PLAZA_CENTER.y + 8,
    radius: 40,
    collideW: 40,
    collideH: 28,
    subtitle: 'Identity hub',
    accent: 0xf5a623,
  },
  {
    id: 'arcade',
    label: 'Arcade',
    interactionLabel: 'Open Arcade',
    x: 576,
    y: 150,
    radius: 52,
    collideW: 130,
    collideH: 78,
    texture: 'building-arcade',
    subtitle: 'PlayNimiq',
    accent: 0x3de7ff,
  },
  {
    id: 'arena',
    label: 'Arena',
    interactionLabel: 'Enter Arena',
    x: 210,
    y: 400,
    radius: 46,
    collideW: 96,
    collideH: 68,
    texture: 'building-arena',
    subtitle: 'NimBomber',
    accent: 0xff5a4a,
  },
  {
    id: 'marketplace',
    label: 'Marketplace',
    interactionLabel: 'View Construction',
    x: 942,
    y: 400,
    radius: 42,
    collideW: 96,
    collideH: 58,
    texture: 'building-construction',
    subtitle: 'Opening Soon',
    accent: 0xf5c542,
  },
  {
    id: 'social-club',
    label: 'Social Club',
    interactionLabel: 'Enter Social Club',
    x: 300,
    y: 660,
    radius: 42,
    collideW: 88,
    collideH: 58,
    texture: 'building-social',
    subtitle: 'Friends & messages',
    accent: 0xa78bfa,
  },
  {
    id: 'town-hall',
    label: 'Town Hall',
    interactionLabel: 'Enter Town Hall',
    x: 852,
    y: 660,
    radius: 42,
    collideW: 90,
    collideH: 60,
    texture: 'building-townhall',
    subtitle: 'Mini Apps catalog',
    accent: 0x4aa8ff,
  },
]

export const SPAWN_POINT = { x: PLAZA_CENTER.x, y: PLAZA_CENTER.y + 160 }

/**
 * Future world landmarks — rim teases with in-world story copy.
 * Non-playable; block travel; do not expand the playable plaza.
 */
export const FUTURE_LANDMARKS: FutureLandmark[] = [
  {
    id: 'harbor',
    x: 576,
    y: 814,
    texture: 'prop-harbor-closed',
    title: 'Harbor',
    lines: ['Closed for repairs', 'Expected reopening soon'],
    collideW: 70,
    collideH: 28,
  },
  {
    id: 'mountain',
    x: 576,
    y: 50,
    texture: 'prop-mountain-gate',
    title: 'Mountain Trail',
    lines: ['Unsafe', 'Access restricted'],
    collideW: 70,
    collideH: 30,
  },
  {
    id: 'tunnel',
    x: 58,
    y: 432,
    texture: 'prop-tunnel',
    title: 'Old Tunnel',
    lines: ['Sealed', 'District planned'],
    collideW: 48,
    collideH: 40,
  },
]

/** Prop placements authored against the original 960×720 plaza. */
const DECOR_960: Array<{ key: string; x: number; y: number; depthBias?: number }> = [
  // perimeter trees
  { key: 'prop-tree', x: 100, y: 150 },
  { key: 'prop-tree', x: 860, y: 145 },
  { key: 'prop-tree', x: 70, y: 420 },
  { key: 'prop-tree', x: 900, y: 430 },
  { key: 'prop-tree', x: 130, y: 620 },
  { key: 'prop-tree', x: 840, y: 640 },
  { key: 'prop-tree', x: 200, y: 380 },
  { key: 'prop-tree', x: 760, y: 390 },

  // vegetation breaks along paths
  { key: 'prop-bush', x: 340, y: 190 },
  { key: 'prop-bush', x: 620, y: 185 },
  { key: 'prop-bush', x: 160, y: 360 },
  { key: 'prop-bush', x: 800, y: 370 },
  { key: 'prop-bush', x: 400, y: 600 },
  { key: 'prop-bush', x: 560, y: 610 },
  { key: 'prop-bush', x: 450, y: 280 },
  { key: 'prop-bush', x: 510, y: 280 },
  { key: 'prop-bush', x: 380, y: 420 },
  { key: 'prop-bush', x: 580, y: 430 },
  { key: 'prop-bush', x: 300, y: 480 },
  { key: 'prop-bush', x: 660, y: 490 },

  // seating / social
  { key: 'prop-bench', x: 360, y: 310 },
  { key: 'prop-bench', x: 600, y: 315 },
  { key: 'prop-bench', x: 480, y: 470 },
  { key: 'prop-picnic', x: 200, y: 560 },
  { key: 'prop-bench', x: 290, y: 560 },

  // lanterns (light pools)
  { key: 'prop-lantern', x: 330, y: 270 },
  { key: 'prop-lantern', x: 630, y: 265 },
  { key: 'prop-lantern', x: 300, y: 430 },
  { key: 'prop-lantern', x: 660, y: 440 },
  { key: 'prop-lantern', x: 400, y: 540 },
  { key: 'prop-lantern', x: 580, y: 545 },
  { key: 'prop-lantern', x: 480, y: 240 },

  // revisit-hook banners (physical world slots)
  { key: 'prop-banner-red', x: 155, y: 195 },
  { key: 'prop-banner-cyan', x: 400, y: 95 },
  { key: 'prop-banner-purple', x: 300, y: 480 },
  { key: 'prop-banner-green', x: 820, y: 200 },

  // micro-landmarks
  { key: 'prop-firepit', x: 145, y: 300 },
  { key: 'prop-joystick', x: 560, y: 175 },
  { key: 'prop-coffee', x: 175, y: 500 },
  { key: 'prop-statue', x: 800, y: 500 },
  { key: 'prop-crates', x: 820, y: 300 },
  { key: 'prop-crates', x: 700, y: 290 },

  // market district fences leading east
  { key: 'prop-fence', x: 860, y: 260 },
  { key: 'prop-fence', x: 890, y: 300 },
  { key: 'prop-fence', x: 870, y: 340 },

  // usable bridges (not harbor)
  { key: 'prop-bridge', x: 100, y: 300 },
  { key: 'prop-bridge', x: 860, y: 400 },
]

/**
 * ponytail: uniform 1.2× rescale of the original placements, not a fresh
 * composition. C3 re-authors prop placement against the new layout with real
 * art; this only keeps props on-screen and out of the canal until then.
 */
const DECOR_SCALE = 1.2
const CANAL_INNER_RADIUS = 11 * 32

export const DECOR = DECOR_960.map((p) => ({
  ...p,
  x: Math.round(p.x * DECOR_SCALE),
  y: Math.round(p.y * DECOR_SCALE),
})).filter((p) => Math.hypot(p.x - PLAZA_CENTER.x, p.y - PLAZA_CENTER.y) < CANAL_INNER_RADIUS)
