import { describe, expect, it } from 'vitest'
import { mockManifests, nimbomberManifest } from './mocks'
import { validateAchievement, validateAppManifest } from './validate'

const validAchievement = {
  schemaVersion: 1,
  appId: 'nimbomber',
  achievementId: 'first-blast',
  title: 'First Blast',
  description: 'Win your first match.',
  rarity: 'common',
}

describe('validateAchievement', () => {
  it('accepts a valid §9 achievement', () => {
    const result = validateAchievement(validAchievement)
    expect(result.ok).toBe(true)
  })

  it('rejects missing required fields', () => {
    expect(validateAchievement({ schemaVersion: 1, appId: 'x' }).ok).toBe(false)
  })

  it('rejects bad rarity', () => {
    const result = validateAchievement({ ...validAchievement, rarity: 'mythic' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors.some((e) => e.includes('rarity'))).toBe(true)
  })

  it('allows omitted rarity', () => {
    const { rarity: _, ...rest } = validAchievement
    expect(validateAchievement(rest).ok).toBe(true)
  })

  it('rejects empty rarity string', () => {
    expect(validateAchievement({ ...validAchievement, rarity: '' }).ok).toBe(false)
  })
})

describe('validateAppManifest', () => {
  it('accepts a valid v1 manifest', () => {
    const result = validateAppManifest(nimbomberManifest)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.id).toBe('nimbomber')
    }
  })

  // The manifests are JSON now, cast rather than type-checked, and the Go API
  // serves the same files — so every shipped one goes through the validator.
  it.each(mockManifests.map((m) => [m.id, m] as const))('ships a valid %s.json', (_id, manifest) => {
    expect(validateAppManifest(manifest).ok).toBe(true)
  })

  it('rejects unsupported schema versions gracefully', () => {
    const result = validateAppManifest({
      ...nimbomberManifest,
      schemaVersion: 99,
    })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes('Unsupported schemaVersion'))).toBe(true)
    }
  })

  it('rejects missing required fields', () => {
    const result = validateAppManifest({ schemaVersion: 1, id: 'x' })
    expect(result.ok).toBe(false)
  })
})
