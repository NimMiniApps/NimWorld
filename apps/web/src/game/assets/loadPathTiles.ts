import type Phaser from 'phaser'
import { pathTileKey, pathTilePublicPath } from '@/game/world/pathAutotile'

const ART_PUBLIC_BASE = '/assets/art'

/** Preload the 18-tile stone-on-grass path set (indices 0–17). */
export function loadPathTiles(scene: Phaser.Scene): void {
  for (let i = 0; i <= 17; i++) {
    const key = pathTileKey(i)
    if (scene.textures.exists(key)) continue
    scene.load.image(key, `${ART_PUBLIC_BASE}/${pathTilePublicPath(i)}`)
  }
}
