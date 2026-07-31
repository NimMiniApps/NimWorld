/** Approved PixelLab overrides. Keys = Phaser texture keys. Paths relative to /assets/art/. */
export const ART_OVERRIDES: Record<string, string | null> = {
  'fountain-base': null,
  'fountain-crystal': null,
  'building-arcade': null,
  'building-arena': null,
  'building-townhall': null,
  'building-social': null,
  'building-construction': null,
  'fx-arcade-portal': null,
  // props / chars filled as approved
}

export function resolveArtOverride(key: string): string | null {
  return ART_OVERRIDES[key] ?? null
}

/** Non-null overrides ready for Phaser load.image. */
export function listArtOverrides(): Array<{ key: string; path: string }> {
  return Object.entries(ART_OVERRIDES)
    .filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0)
    .map(([key, path]) => ({ key, path }))
}
