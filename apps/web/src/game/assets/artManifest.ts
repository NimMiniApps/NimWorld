/** Approved PixelLab overrides. Keys = Phaser texture keys. Paths relative to /assets/art/. */
export const ART_OVERRIDES: Record<string, string> = {
  // The v02 sprite includes the crystal, so there is no separate crystal key.
  'fountain-base': 'landmarks/fountain_v02_final.png',
  'building-arcade': 'landmarks/arcade_v03_final.png',
  'building-arena': 'landmarks/arena_v02_final.png',
  'building-townhall': 'landmarks/townhall_v01_final.png',
  'building-social': 'landmarks/social_v01_final.png',
  'building-construction': 'landmarks/marketplace_v01_final.png',
  'fx-arcade-portal': 'effects/arcade_portal_v01_final.png',
  'prop-bush': 'props/bush_v01_final.png',
  'prop-crates': 'props/crates_v01_final.png',
  'prop-bench': 'props/bench_v01_final.png',
  'prop-lantern': 'props/lantern_v01_final.png',
  // C3 foliage kit — variety, so the plaza stops reading as one tree copied.
  // tree_v01 is deliberately absent: its pale mint canopy sits well outside the
  // #002010–#104010 vegetation range and read as a sprite from another game
  // wherever it landed. oak_v01 replaces it in the same silhouette.
  'prop-conifer': 'props/conifer_v02_final.png',
  'prop-broadleaf': 'props/broadleaf_v02_final.png',
  'prop-blossom': 'props/blossom_tree_v01_final.png',
  'prop-oak': 'props/oak_v01_final.png',
  'prop-poplar': 'props/poplar_v01_final.png',
  'prop-willow': 'props/willow_v01_final.png',
  'prop-shrub': 'props/shrub_v01_final.png',
  'prop-fern': 'props/fern_v01_final.png',
  'prop-boulder': 'props/boulder_v01_final.png',
  'prop-flowerbed': 'props/flowerbed_v03_final.png',
  'prop-hedge': 'props/hedge_v01_final.png',
  // V4 character sheets (48×48 cells, 4 dirs × idle+3 walk)
  // v02 player/courier sheets repair a walk-down frame PixelLab rendered as a
  // rear view, which made both flip front/back every stride.
  'char-player': 'characters/player_sheet_v02.png',
  'char-npc-a': 'characters/guide_sheet_v01.png',
  'char-npc-b': 'characters/gardener_sheet_v02.png',
  'char-npc-c': 'characters/courier_sheet_v02.png',
  'char-npc-d': 'characters/tournament_master_sheet_v01.png',
  'char-npc-e': 'characters/builder_sheet_v01.png',
  // Recently-visited echoes reuse the player sheet; CharacterSprite fades and
  // gold-tints them, which beats the blocky procedural ghost placeholder.
  'char-ghost': 'characters/player_sheet_v02.png',
}

/** Target display size so PixelLab canvases match plaza layout footprint. */
export const ART_DISPLAY_SIZE: Partial<Record<string, { w: number; h: number }>> = {
  'fountain-base': { w: 104, h: 104 },
  'building-arcade': { w: 190, h: 170 },
  'building-arena': { w: 160, h: 150 },
  'building-townhall': { w: 140, h: 142 },
  'building-social': { w: 128, h: 126 },
  'building-construction': { w: 140, h: 118 },
  'prop-bush': { w: 32, h: 28 },
  'prop-bench': { w: 44, h: 28 },
  'prop-lantern': { w: 20, h: 40 },
  'prop-crates': { w: 44, h: 32 },
  // Canopy heights vary deliberately: a uniform skyline is what made the old
  // single-tree scatter read as wallpaper.
  'prop-conifer': { w: 44, h: 66 },
  'prop-broadleaf': { w: 60, h: 52 },
  'prop-blossom': { w: 44, h: 52 },
  'prop-oak': { w: 52, h: 64 },
  'prop-poplar': { w: 30, h: 66 },
  'prop-willow': { w: 58, h: 58 },
  'prop-shrub': { w: 30, h: 30 },
  'prop-fern': { w: 28, h: 28 },
  'prop-boulder': { w: 38, h: 30 },
  'prop-flowerbed': { w: 46, h: 30 },
  'prop-hedge': { w: 48, h: 30 },
}

export function resolveArtOverride(key: string): string | null {
  return ART_OVERRIDES[key] ?? null
}

/** Overrides ready for Phaser load.image. */
export function listArtOverrides(): Array<{ key: string; path: string }> {
  return Object.entries(ART_OVERRIDES).map(([key, path]) => ({ key, path }))
}
