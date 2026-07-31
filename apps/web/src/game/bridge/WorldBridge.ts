import type { UiCommand, WorldEvent } from '@/domain/types'

type WorldListener = (event: WorldEvent) => void
type UiListener = (command: UiCommand) => void

/** Tiny typed bus between Phaser and Vue. No shared mutable state. */
export class WorldBridge {
  private worldListeners = new Set<WorldListener>()
  private uiListeners = new Set<UiListener>()

  emitWorld(event: WorldEvent) {
    for (const listener of this.worldListeners) listener(event)
  }

  onWorld(listener: WorldListener) {
    this.worldListeners.add(listener)
    return () => this.worldListeners.delete(listener)
  }

  emitUi(command: UiCommand) {
    for (const listener of this.uiListeners) listener(command)
  }

  onUi(listener: UiListener) {
    this.uiListeners.add(listener)
    return () => this.uiListeners.delete(listener)
  }
}

export const worldBridge = new WorldBridge()
