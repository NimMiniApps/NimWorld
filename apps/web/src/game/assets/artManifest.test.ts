import { describe, expect, it } from 'vitest'
import { resolveArtOverride } from './artManifest'

describe('artManifest', () => {
  it('maps approved fountain to fountain-base key', () => {
    const path = resolveArtOverride('fountain-base')
    // Task 2: all overrides null (procedural fallback). When Phase B approves a
    // fountain, the path must match the final naming convention.
    if (path === null) {
      expect(path).toBeNull()
    } else {
      expect(path).toMatch(/fountain_.*_final\.png$/)
    }
  })

  it('returns null when no approved override', () => {
    expect(resolveArtOverride('tile-grass')).toBeNull()
  })
})
