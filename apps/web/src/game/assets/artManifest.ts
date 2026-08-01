/** Approved PixelLab overrides. Keys = Phaser texture keys. Paths relative to /assets/art/. */
export const ART_OVERRIDES: Record<string, string | null> = {
  'fountain-base': 'landmarks/fountain_v02_final.png',
  // Combined into fountain-base production sprite; keep null so procedural crystal is skipped in scene.
  'fountain-crystal': null,
  'building-arcade': 'landmarks/arcade_v03_final.png',
  'building-arena': 'landmarks/arena_v02_final.png',
  'building-townhall': 'landmarks/townhall_v01_final.png',
  'building-social': 'landmarks/social_v01_final.png',
  'building-construction': 'landmarks/marketplace_v01_final.png',
  'fx-arcade-portal': 'effects/arcade_portal_v01_final.png',
  'prop-tree': 'props/tree_v01_final.png',
  'prop-bush': 'props/bush_v01_final.png',
  'prop-crates': 'props/crates_v01_final.png',
  'prop-bench': 'props/bench_v01_final.png',
  'prop-lantern': 'props/lantern_v01_final.png',
  // V4 character sheets (48×48 cells, 4 dirs × idle+3 walk)
  'char-player': 'characters/player_sheet_v01.png',
  'char-npc-a': 'characters/guide_sheet_v01.png',
  // Gardener keeps procedural sheet until a V4 gardener is produced.
  'char-npc-c': 'characters/courier_sheet_v01.png',
  'char-npc-d': 'characters/tournament_master_sheet_v01.png',
  'char-npc-e': 'characters/builder_sheet_v01.png',
}

/** Target display size so PixelLab canvases match plaza layout footprint. */
export const ART_DISPLAY_SIZE: Partial<Record<string, { w: number; h: number }>> = {
  'fountain-base': { w: 104, h: 104 },
  'building-arcade': { w: 190, h: 170 },
  'building-arena': { w: 160, h: 150 },
  'building-townhall': { w: 140, h: 142 },
  'building-social': { w: 128, h: 126 },
  'building-construction': { w: 140, h: 118 },
  'prop-tree': { w: 48, h: 60 },
  'prop-bush': { w: 32, h: 28 },
  'prop-bench': { w: 44, h: 28 },
  'prop-lantern': { w: 20, h: 40 },
  'prop-crates': { w: 44, h: 32 },
}

export function resolveArtOverride(key: string): string | null {
  return ART_OVERRIDES[key] ?? null
}

/** True when fountain-base is a combined PixelLab sprite (crystal included). */
export function fountainOverrideIncludesCrystal(): boolean {
  return resolveArtOverride('fountain-base') !== null
}

/** Non-null overrides ready for Phaser load.image. */
export function listArtOverrides(): Array<{ key: string; path: string }> {
  return Object.entries(ART_OVERRIDES)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
    .map(([key, path]) => ({ key, path }))
}
