import Phaser from 'phaser'
import { Palette as P } from './palette'

/**
 * What is left of the procedural atlas.
 *
 * Every texture the art pass replaced with a PixelLab PNG used to keep its
 * draw function here as a fallback, but `loadArtOverrides` runs in preload and
 * `makeTex` skips any key that already exists — so those functions shipped in
 * the bundle and never executed once. Same for the props `decorPlacement`
 * stopped placing (banners, fence, joystick, coffee, statue, firepit, picnic,
 * the v01 tree) and the flat tiles the Wang tilesets replaced.
 *
 * Only the three future-landmark signs and the two ambient sprites are still
 * drawn in code, because no art exists for them yet.
 */

function outlineRect(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: number,
  edge = P.outline,
) {
  g.fillStyle(edge, 1)
  g.fillRect(x, y, w, h)
  g.fillStyle(fill, 1)
  g.fillRect(x + 1, y + 1, w - 2, h - 2)
}

function makeTex(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return
  const g = scene.make.graphics({ x: 0, y: 0 })
  draw(g)
  g.generateTexture(key, w, h)
  g.destroy()
}

function drawSignBoard(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number) {
  outlineRect(g, x, y, w, h, P.stoneDark)
  g.fillStyle(fill, 1)
  g.fillRect(x + 2, y + 2, w - 4, h - 4)
  g.fillStyle(P.white, 0.35)
  g.fillRect(x + 4, y + 3, Math.max(6, w / 3), 2)
}

function drawHarborClosed(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(P.waterDeep, 0.55)
  g.fillRect(0, 28, 80, 20)
  outlineRect(g, 4, 18, 72, 16, P.wood)
  g.fillStyle(P.woodDark, 1)
  for (let i = 0; i < 8; i++) g.fillRect(8 + i * 9, 20, 2, 12)
  // barrier
  g.fillStyle(P.constructYellow, 1)
  g.fillRect(10, 14, 60, 4)
  g.fillStyle(P.arenaRed, 1)
  for (let i = 0; i < 5; i++) g.fillRect(14 + i * 12, 10, 6, 4)
  drawSignBoard(g, 22, 0, 36, 14, P.stoneDark)
  g.fillStyle(P.townBlue, 1)
  g.fillRect(26, 4, 28, 2)
  g.fillStyle(P.goldLight, 0.7)
  g.fillRect(28, 8, 20, 2)
}

function drawMountainGate(g: Phaser.GameObjects.Graphics) {
  // rocks
  g.fillStyle(P.stoneDark, 1)
  g.fillTriangle(4, 48, 24, 10, 44, 48)
  g.fillTriangle(36, 48, 56, 16, 76, 48)
  g.fillStyle(P.stone, 1)
  g.fillTriangle(12, 48, 28, 20, 40, 48)
  // gate
  outlineRect(g, 28, 28, 24, 20, P.woodDark)
  g.fillStyle(P.constructYellow, 1)
  g.fillRect(30, 36, 20, 3)
  drawSignBoard(g, 22, 0, 36, 16, P.stoneDark)
  g.fillStyle(P.arenaOrange, 1)
  g.fillRect(26, 4, 28, 2)
  g.fillStyle(P.goldLight, 0.7)
  g.fillRect(28, 9, 22, 2)
}

function drawTunnel(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(P.stoneDark, 1)
  g.fillRect(4, 16, 56, 36)
  g.fillStyle(P.outline, 1)
  g.fillEllipse(32, 34, 36, 28)
  g.fillStyle(0x050810, 1)
  g.fillEllipse(32, 34, 28, 22)
  // rails hint
  g.fillStyle(P.stoneLight, 1)
  g.fillRect(18, 44, 28, 2)
  g.fillRect(18, 48, 28, 2)
  drawSignBoard(g, 14, 0, 36, 14, P.stoneDark)
  g.fillStyle(P.purple, 1)
  g.fillRect(18, 4, 28, 2)
  g.fillStyle(P.goldLight, 0.7)
  g.fillRect(20, 8, 22, 2)
}

function drawButterfly(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(P.flowerPink, 1)
  g.fillEllipse(4, 4, 6, 4)
  g.fillEllipse(10, 4, 6, 4)
  g.fillStyle(P.outline, 1)
  g.fillRect(6, 3, 2, 4)
}

function drawBird(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(P.stoneLight, 1)
  g.fillEllipse(8, 6, 10, 5)
  g.fillStyle(P.outline, 1)
  g.fillTriangle(2, 6, 0, 4, 2, 8)
  g.fillTriangle(14, 4, 20, 6, 14, 8)
}

export function generatePlazaAtlas(scene: Phaser.Scene) {
  makeTex(scene, 'prop-harbor-closed', 80, 52, drawHarborClosed)
  makeTex(scene, 'prop-mountain-gate', 80, 52, drawMountainGate)
  makeTex(scene, 'prop-tunnel', 64, 56, drawTunnel)
  makeTex(scene, 'fx-butterfly', 14, 10, drawButterfly)
  makeTex(scene, 'fx-bird', 22, 12, drawBird)

  registerCharacterAnims(scene)
}

function characterFrameSize(texture: Phaser.Textures.Texture): { fw: number; fh: number } {
  const src = texture.getSourceImage() as { width?: number; height?: number }
  const w = src.width ?? 128
  const h = src.height ?? 192
  // Sheets are always 4×4 cells (V4 PixelLab 48×48 on 192×192).
  return { fw: Math.round(w / 4), fh: Math.round(h / 4) }
}

function registerCharacterAnims(scene: Phaser.Scene) {
  const sheets = [
    'char-player',
    'char-npc-a',
    'char-npc-b',
    'char-npc-c',
    'char-npc-d',
    'char-npc-e',
    'char-ghost',
  ] as const
  const dirs = ['down', 'left', 'right', 'up'] as const

  for (const sheet of sheets) {
    // ponytail: sheets are same-origin static PNGs, so a miss means the deploy
    // is broken — skip rather than slice frames out of Phaser's __MISSING texture.
    if (!scene.textures.exists(sheet)) continue
    const texture = scene.textures.get(sheet)
    const { fw, fh } = characterFrameSize(texture)
    if (texture.frameTotal <= 1) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const index = row * 4 + col
          texture.add(index, 0, col * fw, row * fh, fw, fh)
        }
      }
    }

    for (let d = 0; d < dirs.length; d++) {
      const idleKey = `${sheet}-idle-${dirs[d]}`
      const walkKey = `${sheet}-walk-${dirs[d]}`
      if (!scene.anims.exists(idleKey)) {
        scene.anims.create({
          key: idleKey,
          frames: [{ key: sheet, frame: d * 4 }],
          frameRate: 1,
          repeat: -1,
        })
      }
      if (!scene.anims.exists(walkKey)) {
        scene.anims.create({
          key: walkKey,
          frames: [
            { key: sheet, frame: d * 4 + 1 },
            { key: sheet, frame: d * 4 + 2 },
            { key: sheet, frame: d * 4 + 3 },
            { key: sheet, frame: d * 4 + 2 },
          ],
          frameRate: 8,
          repeat: -1,
        })
      }
    }
  }
}

export type CharSheet =
  | 'char-player'
  | 'char-npc-a'
  | 'char-npc-b'
  | 'char-npc-c'
  | 'char-npc-d'
  | 'char-npc-e'
  | 'char-ghost'
export type Facing = 'down' | 'left' | 'right' | 'up'

export function facingFromVector(x: number, y: number, fallback: Facing = 'down'): Facing {
  if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) return fallback
  if (Math.abs(x) > Math.abs(y)) return x < 0 ? 'left' : 'right'
  return y < 0 ? 'up' : 'down'
}
