import { describe, expect, it } from 'vitest'
import { fountainOverrideIncludesCrystal, resolveArtOverride } from './artManifest'

describe('artManifest', () => {
  it('maps approved fountain to fountain-base key', () => {
    expect(resolveArtOverride('fountain-base')).toMatch(/fountain_.*_final\.png$/)
  })

  it('returns null when no approved override', () => {
    expect(resolveArtOverride('tile-grass')).toBeNull()
  })

  it('treats approved fountain as combined crystal sprite', () => {
    expect(fountainOverrideIncludesCrystal()).toBe(true)
  })

  it('maps V4 character sheets to Phaser keys', () => {
    expect(resolveArtOverride('char-player')).toBe('characters/player_sheet_v01.png')
    expect(resolveArtOverride('char-npc-a')).toBe('characters/guide_sheet_v01.png')
    expect(resolveArtOverride('char-npc-c')).toBe('characters/courier_sheet_v01.png')
    expect(resolveArtOverride('char-npc-d')).toBe('characters/tournament_master_sheet_v01.png')
    expect(resolveArtOverride('char-npc-e')).toBe('characters/builder_sheet_v01.png')
    // Gardener stays procedural until a V4 sheet exists.
    expect(resolveArtOverride('char-npc-b')).toBeNull()
  })
})
