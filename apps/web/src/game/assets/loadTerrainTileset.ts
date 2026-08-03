import Phaser from 'phaser'
import { TERRAIN_TILE } from '@/game/world/terrainTypes'

const ART_PUBLIC_BASE = '/assets/art'

/** Phaser texture / tileset key for plaza_stone_wang_v01 (grass ↔ plaza stone). */
export const TERRAIN_TILESET_KEY = 'terrain-plaza-wang'

/** canal_water_wang_v01 — note water is the *lower* terrain, grass the upper. */
export const WATER_TILESET_KEY = 'terrain-canal-water'

/** path_warm_wang_v01 (grass ↔ warm tan path). */
export const PATH_TILESET_KEY = 'terrain-path-warm'

const TILESET_PATHS: Record<string, string> = {
  [TERRAIN_TILESET_KEY]: `${ART_PUBLIC_BASE}/tiles/plaza_stone_wang_v01/tileset.png`,
  [WATER_TILESET_KEY]: `${ART_PUBLIC_BASE}/tiles/canal_water_wang_v01/tileset.png`,
  [PATH_TILESET_KEY]: `${ART_PUBLIC_BASE}/tiles/path_warm_wang_v01/tileset.png`,
}

/**
 * Preload the 4×4 Wang terrain spritesheets (16 frames @ 32×32 each).
 * Call from BootScene.preload. Game already sets `pixelArt: true` (NEAREST);
 * we reinforce the filter after each file loads for safety.
 */
export function loadTerrainTileset(scene: Phaser.Scene): void {
  for (const [key, path] of Object.entries(TILESET_PATHS)) {
    if (scene.textures.exists(key)) continue

    scene.load.spritesheet(key, path, {
      frameWidth: TERRAIN_TILE,
      frameHeight: TERRAIN_TILE,
    })

    scene.load.once(`filecomplete-spritesheet-${key}`, () => {
      if (!scene.textures.exists(key)) return
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST)
    })
  }
}
