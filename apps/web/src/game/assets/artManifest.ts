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
  // C3 foliage kit — variety, so the plaza stops reading as one tree copied.
  'prop-conifer': 'props/conifer_v02_final.png',
  'prop-broadleaf': 'props/broadleaf_v02_final.png',
  'prop-blossom': 'props/blossom_tree_v01_final.png',
  'prop-shrub': 'props/shrub_v01_final.png',
  'prop-fern': 'props/fern_v01_final.png',
  'prop-boulder': 'props/boulder_v01_final.png',
  'prop-flowerbed': 'props/flowerbed_v03_final.png',
  'prop-hedge': 'props/hedge_v01_final.png',
  'prop-wall': 'props/wall_straight_v01_final.png',
  'prop-wall-pillar': 'props/wall_pillar_v01_final.png',
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
  // Canopy heights vary deliberately: a uniform skyline is what made the old
  // single-tree scatter read as wallpaper.
  'prop-conifer': { w: 44, h: 66 },
  'prop-broadleaf': { w: 60, h: 52 },
  'prop-blossom': { w: 44, h: 52 },
  'prop-shrub': { w: 30, h: 30 },
  'prop-fern': { w: 28, h: 28 },
  'prop-boulder': { w: 38, h: 30 },
  'prop-flowerbed': { w: 46, h: 30 },
  'prop-hedge': { w: 48, h: 30 },
  'prop-wall': { w: 48, h: 38 },
  'prop-wall-pillar': { w: 28, h: 50 },
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
