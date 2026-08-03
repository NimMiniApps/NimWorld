import { describe, expect, it } from 'vitest'
import { getLocationToAutoOpen } from './locationEntry'

describe('getLocationToAutoOpen', () => {
  it('opens a fixed location when entering its zone', () => {
    expect(getLocationToAutoOpen(null, 'town-hall')).toBe('town-hall')
  })

  it('does not reopen while the same location remains active', () => {
    expect(getLocationToAutoOpen('town-hall', 'town-hall')).toBeNull()
  })

  it('opens a location again after exit clears the active target', () => {
    const activeAfterExit = null

    expect(getLocationToAutoOpen(activeAfterExit, 'town-hall')).toBe('town-hall')
  })

  it('opens the newly entered location when targets change', () => {
    expect(getLocationToAutoOpen('arcade', 'arena')).toBe('arena')
  })

  it('does not auto-open for a ghost-only proximity target', () => {
    expect(getLocationToAutoOpen('ghost:Luna', null)).toBeNull()
  })
})
