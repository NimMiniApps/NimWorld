import { describe, expect, it } from 'vitest'
import { isPayableActor, LocalPresenceAdapter } from './PresenceAdapter'

describe('LocalPresenceAdapter', () => {
  it('marks ghost actors as payable with addresses and NPCs without', async () => {
    const actors = await new LocalPresenceAdapter().getActors()
    const ghosts = actors.filter((a) => a.kind === 'ghost')
    const npcs = actors.filter((a) => a.kind === 'npc')
    expect(ghosts.every((g) => typeof g.address === 'string' && g.address.startsWith('NQ'))).toBe(
      true,
    )
    expect(npcs.every((n) => !n.address)).toBe(true)
  })

  it('isPayableActor requires a non-empty address', () => {
    expect(isPayableActor({ address: 'NQ01 DEMO' })).toBe(true)
    expect(isPayableActor({})).toBe(false)
    expect(isPayableActor({ address: '  ' })).toBe(false)
  })
})
