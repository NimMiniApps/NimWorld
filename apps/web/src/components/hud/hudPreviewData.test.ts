import { describe, expect, it } from 'vitest'
import { formatNim, PREVIEW_NIM_BALANCE, PREVIEW_PROFILE_STATS } from './hudPreviewData'

describe('hudPreviewData', () => {
  it('formats NIM with two decimals', () => {
    expect(formatNim(PREVIEW_NIM_BALANCE)).toBe('1,250.45')
    expect(formatNim(0)).toBe('0.00')
  })

  it('keeps preview profile stats matching the mockup numbers', () => {
    expect(PREVIEW_PROFILE_STATS).toMatchObject({
      level: 42,
      xp: 8420,
      xpMax: 12500,
      trophies: 184,
      apps: 8,
    })
  })
})
