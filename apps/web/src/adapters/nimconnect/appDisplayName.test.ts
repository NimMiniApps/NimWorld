import { describe, expect, it } from 'vitest'
import { pickAppDisplayName } from './appDisplayName'

describe('pickAppDisplayName', () => {
  it('prefers registered, then authorized, then catalog, then raw appId', () => {
    expect(
      pickAppDisplayName({
        appId: 'nimbomber',
        registeredName: 'NimBomber Live',
        authorizedName: 'NimBomber Grant',
        catalogName: 'NimBomber Catalog',
      }),
    ).toBe('NimBomber Live')

    expect(
      pickAppDisplayName({
        appId: 'nimbomber',
        authorizedName: 'NimBomber Grant',
        catalogName: 'NimBomber Catalog',
      }),
    ).toBe('NimBomber Grant')

    expect(
      pickAppDisplayName({
        appId: 'nimbomber',
        catalogName: 'NimBomber Catalog',
      }),
    ).toBe('NimBomber Catalog')

    expect(pickAppDisplayName({ appId: 'nimbomber' })).toBe('nimbomber')
  })

  it('ignores blank strings rather than inventing a label', () => {
    expect(
      pickAppDisplayName({
        appId: 'playnimiq',
        registeredName: '  ',
        authorizedName: '',
        catalogName: null,
      }),
    ).toBe('playnimiq')
  })
})
