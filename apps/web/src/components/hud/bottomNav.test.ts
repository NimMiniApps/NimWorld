import { describe, expect, it } from 'vitest'
import {
  BOTTOM_NAV_ITEMS,
  locationIdForNav,
  navIdsForLocation,
  type BottomNavId,
} from './bottomNav'

describe('bottomNav', () => {
  it('lists the six mockup tabs in order', () => {
    expect(BOTTOM_NAV_ITEMS.map((i) => i.id)).toEqual([
      'home',
      'apps',
      'inventory',
      'achievements',
      'friends',
      'wallet',
    ])
  })

  it('maps nav ids to plaza locations', () => {
    expect(locationIdForNav('home')).toBeNull()
    expect(locationIdForNav('apps')).toBe('arcade')
    expect(locationIdForNav('inventory')).toBe('fountain')
    expect(locationIdForNav('achievements')).toBe('fountain')
    expect(locationIdForNav('friends')).toBe('social-club')
    expect(locationIdForNav('wallet')).toBe('marketplace')
  })

  it('highlights home when no overlay is open', () => {
    expect(navIdsForLocation(null)).toEqual(['home'] satisfies BottomNavId[])
  })

  it('highlights both fountain tabs when fountain is open', () => {
    expect(navIdsForLocation('fountain').sort()).toEqual(['achievements', 'inventory'])
  })

  it('maps other locations to a single tab', () => {
    expect(navIdsForLocation('arcade')).toEqual(['apps'])
    expect(navIdsForLocation('social-club')).toEqual(['friends'])
    expect(navIdsForLocation('marketplace')).toEqual(['wallet'])
    expect(navIdsForLocation('arena')).toEqual([])
    expect(navIdsForLocation('town-hall')).toEqual([])
  })
})
