import type Phaser from 'phaser'
import { listArtOverrides } from './artManifest'

const ART_PUBLIC_BASE = '/assets/art'

/**
 * Queue approved PixelLab PNGs under existing Phaser texture keys.
 * Call from BootScene.preload before generatePlazaAtlas in create.
 * Missing / null overrides leave procedural atlas as fallback.
 */
export function loadArtOverrides(scene: Phaser.Scene): void {
  for (const { key, path } of listArtOverrides()) {
    if (scene.textures.exists(key)) continue
    scene.load.image(key, `${ART_PUBLIC_BASE}/${path}`)
  }
}
