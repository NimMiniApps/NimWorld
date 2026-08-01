import Phaser from 'phaser'
import { TERRAIN_TILE } from '@/game/world/terrainTypes'

const ART_PUBLIC_BASE = '/assets/art'

/** Phaser texture / tileset key for plaza_stone_wang_v01. */
export const TERRAIN_TILESET_KEY = 'terrain-plaza-wang'

const TERRAIN_TILESET_PATH = `${ART_PUBLIC_BASE}/tiles/plaza_stone_wang_v01/tileset.png`

/**
 * Preload the 4×4 Wang terrain spritesheet (16 frames @ 32×32).
 * Call from BootScene.preload. Game already sets `pixelArt: true` (NEAREST);
 * we reinforce the filter after this file loads for safety.
 */
export function loadTerrainTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TERRAIN_TILESET_KEY)) return

  scene.load.spritesheet(TERRAIN_TILESET_KEY, TERRAIN_TILESET_PATH, {
    frameWidth: TERRAIN_TILE,
    frameHeight: TERRAIN_TILE,
  })

  scene.load.once(`filecomplete-spritesheet-${TERRAIN_TILESET_KEY}`, () => {
    if (!scene.textures.exists(TERRAIN_TILESET_KEY)) return
    scene.textures.get(TERRAIN_TILESET_KEY).setFilter(Phaser.Textures.FilterMode.NEAREST)
  })
}
