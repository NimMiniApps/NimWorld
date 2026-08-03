import { describe, expect, it } from 'vitest'
import { LOCATIONS } from './locations'

describe('location proximity', () => {
  it('keeps automatic entry close to each landmark', () => {
    const radii = Object.fromEntries(LOCATIONS.map(({ id, radius }) => [id, radius]))

    expect(radii).toEqual({
      fountain: 40,
      arcade: 52,
      arena: 46,
      marketplace: 42,
      'social-club': 42,
      'town-hall': 42,
    })
  })
})
