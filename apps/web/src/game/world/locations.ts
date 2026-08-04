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

/** Prop placement is derived from the terrain — see `decorPlacement.ts`. */
