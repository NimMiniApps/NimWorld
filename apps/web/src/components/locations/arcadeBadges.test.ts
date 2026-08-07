import { describe, expect, it } from 'vitest'
import { isConnected, isPlayed } from './arcadeBadges'

const app = { id: 'uuid-nimbomber', slug: 'nimbomber' }

describe('arcade badges', () => {
  it('marks Connected from audience slug or id independently of Played', () => {
    expect(isConnected(app, new Set(['nimbomber']))).toBe(true)
    expect(isConnected(app, new Set(['uuid-nimbomber']))).toBe(true)
    expect(isConnected(app, new Set(['other']))).toBe(false)
    expect(isPlayed(app, new Set(['nimbomber']))).toBe(true)
  })

  it('allows both Connected and Played at once without merging labels', () => {
    const audiences = new Set(['nimbomber'])
    const played = new Set(['nimbomber'])
    expect(isConnected(app, audiences)).toBe(true)
    expect(isPlayed(app, played)).toBe(true)
    expect(isConnected(app, audiences) && isPlayed(app, played)).toBe(true)
  })

  it('allows neither badge', () => {
    expect(isConnected(app, new Set())).toBe(false)
    expect(isPlayed(app, new Set())).toBe(false)
  })
})
