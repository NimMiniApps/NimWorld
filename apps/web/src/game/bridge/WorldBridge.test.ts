import { describe, expect, it, vi } from 'vitest'
import { WorldBridge } from './WorldBridge'

describe('WorldBridge', () => {
  it('delivers world events to listeners', () => {
    const bridge = new WorldBridge()
    const spy = vi.fn()
    bridge.onWorld(spy)
    bridge.emitWorld({ type: 'INTERACTION_CLEARED' })
    expect(spy).toHaveBeenCalledWith({ type: 'INTERACTION_CLEARED' })
  })

  it('delivers ui commands to listeners', () => {
    const bridge = new WorldBridge()
    const spy = vi.fn()
    bridge.onUi(spy)
    bridge.emitUi({ type: 'PAUSE_MOVEMENT' })
    expect(spy).toHaveBeenCalledWith({ type: 'PAUSE_MOVEMENT' })
  })
})
