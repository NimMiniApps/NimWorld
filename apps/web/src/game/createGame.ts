import Phaser from 'phaser'
import type { PlazaActor } from '@/adapters/presence/PresenceAdapter'
import type { WorldPosition } from '@/domain/types'
import type { WorldBridge } from '@/game/bridge/WorldBridge'
import { generatePlazaAtlas } from '@/game/assets/generatePlazaAtlas'
import { loadArtOverrides } from '@/game/assets/loadArtOverrides'
import { loadPathTiles } from '@/game/assets/loadPathTiles'
import { PlazaScene } from '@/game/scenes/PlazaScene'
import { WORLD } from '@/game/world/locations'

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene')
  }

  preload() {
    loadArtOverrides(this)
    loadPathTiles(this)
  }

  create() {
    generatePlazaAtlas(this)

    const data = this.registry.get('plazaData') as {
      bridge: WorldBridge
      actors: PlazaActor[]
      spawn?: WorldPosition | null
      playerLabel?: string
    }

    this.scene.start('PlazaScene', data)
  }
}

export function createPlazaGame(
  parent: HTMLElement,
  options: {
    bridge: WorldBridge
    actors: PlazaActor[]
    spawn?: WorldPosition | null
    playerLabel?: string
  },
) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: '#0a0f24',
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      expandParent: true,
    },
    scene: [BootScene, PlazaScene],
    input: {
      keyboard: true,
    },
    render: {
      antialias: false,
      pixelArt: true,
      roundPixels: true,
    },
    audio: {
      // Ambient hooks may register later; keep muted by default.
      noAudio: false,
      disableWebAudio: false,
    },
  })

  game.registry.set('plazaData', options)
  game.registry.set('soundEnabled', false)
  return game
}
