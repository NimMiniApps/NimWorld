import { describe, expect, it } from 'vitest'
import { nimbomberManifest } from './mocks'
import { validateAppManifest } from './validate'

describe('validateAppManifest', () => {
  it('accepts a valid v1 manifest', () => {
    const result = validateAppManifest(nimbomberManifest)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.manifest.id).toBe('nimbomber')
    }
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
