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
})
