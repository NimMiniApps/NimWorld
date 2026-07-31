import Phaser from 'phaser'
import { Palette as P } from './palette'

function px(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number,
  size = 1,
  alpha = 1,
) {
  g.fillStyle(color, alpha)
  g.fillRect(x, y, size, size)
}

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

function drawShadowEllipse(g: Phaser.GameObjects.Graphics, cx: number, cy: number, w: number, h: number, a = 0.28) {
  g.fillStyle(0x000000, a)
  g.fillEllipse(cx, cy, w, h)
}

function drawWindowGlow(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, color: number) {
  outlineRect(g, x, y, w, h, P.outline)
  g.fillStyle(color, 0.85)
  g.fillRect(x + 2, y + 2, w - 4, h - 4)
  g.fillStyle(P.white, 0.25)
  g.fillRect(x + 3, y + 3, (w - 6) / 2, 2)
}

function drawTorch(g: Phaser.GameObjects.Graphics, x: number, y: number) {
  outlineRect(g, x, y + 6, 3, 10, P.woodDark)
  g.fillStyle(P.arenaOrange, 1)
  g.fillRect(x - 1, y, 5, 7)
  g.fillStyle(P.goldLight, 0.9)
  g.fillRect(x, y + 1, 3, 4)
}

function drawSignBoard(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, fill: number) {
  outlineRect(g, x, y, w, h, P.stoneDark)
  g.fillStyle(fill, 1)
  g.fillRect(x + 2, y + 2, w - 4, h - 4)
  g.fillStyle(P.white, 0.35)
  g.fillRect(x + 4, y + 3, Math.max(6, w / 3), 2)
}

function drawScaffoldSegment(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number) {
  g.fillStyle(P.constructYellow, 1)
  g.fillRect(x, y, 3, h)
  g.fillRect(x + w - 3, y, 3, h)
  g.fillRect(x, y + 4, w, 2)
  g.fillRect(x, y + h / 2, w, 2)
  g.fillStyle(P.outline, 0.5)
  for (let i = 0; i < 4; i++) {
    g.fillRect(x + 4 + i * ((w - 8) / 4), y + 6, 2, h - 10)
  }
}

function drawStoneTile(g: Phaser.GameObjects.Graphics, size: number) {
  g.fillStyle(P.stone, 1)
  g.fillRect(0, 0, size, size)
  g.fillStyle(P.stoneLight, 0.35)
  g.fillRect(1, 1, size / 2 - 1, size / 2 - 1)
  g.fillStyle(P.stoneDark, 0.45)
  g.fillRect(size / 2, size / 2, size / 2 - 1, size / 2 - 1)
  g.lineStyle(1, P.pathEdge, 0.55)
  g.strokeRect(0.5, 0.5, size - 1, size - 1)
}

function drawPathTile(g: Phaser.GameObjects.Graphics, size: number) {
  g.fillStyle(P.path, 1)
  g.fillRect(0, 0, size, size)
  g.fillStyle(P.pathLight, 0.4)
  g.fillRect(2, 2, size - 6, size / 3)
  g.fillStyle(P.pathEdge, 0.55)
  g.fillRect(0, 0, size, 1)
  g.fillRect(0, size - 1, size, 1)
}

function drawGrassTile(g: Phaser.GameObjects.Graphics, size: number) {
  g.fillStyle(P.grassDark, 1)
  g.fillRect(0, 0, size, size)
  for (let i = 0; i < 18; i++) {
    const x = (i * 7 + 3) % size
    const y = (i * 11 + 5) % size
    px(g, x, y, i % 3 === 0 ? P.grassLight : P.grass)
  }
  if (size > 16) {
    px(g, 6, 8, P.flowerPink, 2)
    px(g, 20, 14, P.flowerGold, 2)
    px(g, 12, 22, P.flowerPink, 2)
  }
}

function drawWaterTile(g: Phaser.GameObjects.Graphics, size: number) {
  g.fillStyle(P.waterDeep, 1)
  g.fillRect(0, 0, size, size)
  g.fillStyle(P.water, 0.85)
  g.fillRect(2, 4, size - 4, size - 8)
  g.fillStyle(P.waterHighlight, 0.35)
  g.fillRect(4, 6, size / 2, 3)
  g.fillRect(size / 3, size / 2, size / 2, 2)
}

function drawTree(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 24, 54, 28, 10, 0.25)
  outlineRect(g, 20, 34, 8, 18, P.wood)
  g.fillStyle(P.outline, 1)
  g.fillCircle(24, 26, 16)
  g.fillStyle(P.grassDark, 1)
  g.fillCircle(24, 26, 15)
  g.fillStyle(P.grass, 1)
  g.fillCircle(18, 24, 10)
  g.fillCircle(30, 22, 11)
  g.fillStyle(P.grassLight, 0.7)
  g.fillCircle(22, 18, 7)
  px(g, 16, 20, P.flowerPink, 2)
  px(g, 30, 16, P.flowerGold, 2)
}

function drawBush(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 16, 22, 26, 8, 0.2)
  g.fillStyle(P.outline, 1)
  g.fillCircle(12, 14, 9)
  g.fillCircle(20, 14, 9)
  g.fillStyle(P.grass, 1)
  g.fillCircle(12, 14, 8)
  g.fillCircle(20, 14, 8)
  g.fillStyle(P.grassLight, 0.65)
  g.fillCircle(16, 11, 6)
  px(g, 10, 12, P.flowerPink, 2)
  px(g, 22, 13, P.flowerGold, 2)
}

function drawBench(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 22, 22, 34, 8, 0.2)
  outlineRect(g, 4, 10, 36, 6, P.wood)
  outlineRect(g, 6, 16, 4, 8, P.woodDark)
  outlineRect(g, 34, 16, 4, 8, P.woodDark)
  g.fillStyle(P.stoneLight, 0.5)
  g.fillRect(6, 11, 32, 2)
}

function drawLantern(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 10, 36, 14, 6, 0.2)
  outlineRect(g, 8, 14, 4, 20, P.stoneDark)
  outlineRect(g, 4, 6, 12, 10, P.lantern)
  g.fillStyle(P.lanternGlow, 0.9)
  g.fillRect(6, 8, 8, 6)
  g.fillStyle(P.lantern, 0.35)
  g.fillCircle(10, 11, 12)
}

function drawBanner(g: Phaser.GameObjects.Graphics, color: number) {
  outlineRect(g, 6, 2, 3, 36, P.stoneLight)
  g.fillStyle(P.outline, 1)
  g.fillRect(9, 4, 18, 14)
  g.fillStyle(color, 1)
  g.fillRect(10, 5, 16, 12)
  g.fillStyle(P.goldLight, 0.5)
  g.fillRect(12, 7, 6, 3)
}

function drawBridge(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(P.waterDeep, 0.5)
  g.fillRect(0, 18, 64, 16)
  outlineRect(g, 4, 12, 56, 18, P.wood)
  g.fillStyle(P.woodDark, 1)
  for (let i = 0; i < 7; i++) g.fillRect(8 + i * 8, 14, 2, 14)
  outlineRect(g, 2, 10, 6, 8, P.stone)
  outlineRect(g, 56, 10, 6, 8, P.stone)
}

/** Arcade — largest funhouse; cyan portal; marquee; posters; machines. */
function drawArcade(g: Phaser.GameObjects.Graphics) {
  const w = 190
  const h = 170
  drawShadowEllipse(g, w / 2, h - 6, w * 0.92, 16, 0.32)

  // grand stairs
  for (let i = 0; i < 4; i++) {
    outlineRect(g, 40 + i * 4, h - 28 + i * 4, w - 80 - i * 8, 5, P.stoneLight)
  }

  // side depth
  g.fillStyle(P.outline, 1)
  g.fillRect(w - 22, 40, 14, h - 70)
  g.fillStyle(P.purpleDark, 0.75)
  g.fillRect(w - 21, 41, 12, h - 72)

  // main mass
  outlineRect(g, 14, 38, w - 36, h - 70, P.purpleDark)

  // roof / marquee crown
  g.fillStyle(P.outline, 1)
  g.fillRect(8, 28, w - 20, 18)
  g.fillStyle(P.arcadeCyan, 1)
  g.fillRect(10, 30, w - 24, 14)
  // animated-looking marquee bulbs
  for (let i = 0; i < 14; i++) {
    g.fillStyle(i % 2 === 0 ? P.goldLight : P.white, 0.9)
    g.fillCircle(18 + i * 12, 37, 2)
  }

  // roof peak / antenna
  g.fillStyle(P.outline, 1)
  g.fillTriangle(w / 2 - 28, 30, w / 2, 4, w / 2 + 28, 30)
  g.fillStyle(P.purple, 1)
  g.fillTriangle(w / 2 - 24, 29, w / 2, 8, w / 2 + 24, 29)
  outlineRect(g, w / 2 - 2, 0, 4, 10, P.arcadeCyan)
  g.fillStyle(P.gold, 1)
  g.fillCircle(w / 2, 2, 3)

  // game posters
  drawSignBoard(g, 22, 52, 28, 36, P.cyanDark)
  g.fillStyle(P.arcadeCyan, 0.8)
  g.fillRect(26, 58, 20, 12)
  drawSignBoard(g, w - 66, 52, 28, 36, P.purple)
  g.fillStyle(P.gold, 0.8)
  g.fillRect(w - 62, 58, 20, 12)

  // arcade machines in windows
  drawWindowGlow(g, 56, 56, 22, 28, P.arcadeCyan)
  outlineRect(g, 60, 68, 14, 12, P.stoneDark)
  drawWindowGlow(g, 112, 56, 22, 28, P.socialPurple)
  outlineRect(g, 116, 68, 14, 12, P.stoneDark)

  // trophy niche
  outlineRect(g, w / 2 - 14, 52, 28, 22, P.stoneDark)
  g.fillStyle(P.gold, 1)
  g.fillTriangle(w / 2, 54, w / 2 - 8, 70, w / 2 + 8, 70)
  g.fillStyle(P.goldLight, 1)
  g.fillRect(w / 2 - 3, 70, 6, 4)

  // giant cyan portal
  const doorW = 44
  const groundY = h - 28
  outlineRect(g, w / 2 - doorW / 2, groundY - 48, doorW, 48, P.outline)
  g.fillStyle(P.arcadeCyan, 0.95)
  g.fillRect(w / 2 - doorW / 2 + 2, groundY - 46, doorW - 4, 44)
  g.fillStyle(P.white, 0.35)
  g.fillEllipse(w / 2 - 4, groundY - 28, 18, 28)
  g.fillStyle(P.cyan, 0.5)
  g.fillEllipse(w / 2, groundY - 24, 28, 10)

  // ARCADE sign
  drawSignBoard(g, w / 2 - 32, 88, 64, 14, P.arcadeCyan)
}

/** Arena — battlements, tower, bomb rack, cannon, leaderboard, red glow. */
function drawArena(g: Phaser.GameObjects.Graphics) {
  const w = 140
  const h = 148
  drawShadowEllipse(g, w / 2, h - 4, w * 0.9, 14, 0.3)

  // tower (left)
  outlineRect(g, 8, 8, 28, 90, P.redDark)
  g.fillStyle(P.arenaRed, 0.5)
  g.fillRect(10, 10, 24, 20)
  // battlements
  for (let i = 0; i < 4; i++) {
    outlineRect(g, 8 + i * 7, 2, 5, 10, P.stoneDark)
  }
  // chimney smoke base
  outlineRect(g, 18, 0, 8, 10, P.stoneDark)

  // main hall
  outlineRect(g, 32, 40, w - 44, h - 56, P.redDark)
  g.fillStyle(P.outline, 0.2)
  for (let row = 48; row < h - 30; row += 8) g.fillRect(34, row, w - 48, 1)

  // roof
  g.fillStyle(P.outline, 1)
  g.fillTriangle(28, 42, w / 2 + 10, 12, w - 8, 42)
  g.fillStyle(P.arenaRed, 1)
  g.fillTriangle(32, 41, w / 2 + 10, 16, w - 12, 41)
  g.fillStyle(P.arenaOrange, 0.55)
  g.fillTriangle(w / 2, 38, w / 2 + 10, 20, w / 2 + 22, 38)

  // tournament banner
  g.fillStyle(P.arenaOrange, 1)
  g.fillRect(70, 18, 18, 28)
  g.fillStyle(P.goldLight, 0.7)
  g.fillRect(74, 22, 10, 6)
  outlineRect(g, 78, 14, 3, 36, P.stoneLight)

  // windows with red glow
  drawWindowGlow(g, 48, 56, 16, 16, P.arenaOrange)
  drawWindowGlow(g, 100, 56, 16, 16, P.arenaOrange)

  // leaderboard board
  drawSignBoard(g, 44, 78, 36, 22, P.stoneDark)
  g.fillStyle(P.arenaRed, 1)
  g.fillRect(48, 82, 28, 3)
  g.fillStyle(P.goldLight, 0.7)
  g.fillRect(48, 88, 20, 2)
  g.fillRect(48, 92, 16, 2)

  // bomb rack (left of door)
  outlineRect(g, 40, h - 48, 14, 20, P.stoneDark)
  g.fillStyle(P.outline, 1)
  g.fillCircle(47, h - 40, 4)
  g.fillCircle(47, h - 32, 4)
  g.fillStyle(P.arenaRed, 1)
  g.fillCircle(47, h - 40, 3)
  g.fillCircle(47, h - 32, 3)

  // cannon (right)
  outlineRect(g, w - 40, h - 42, 22, 10, P.stoneDark)
  g.fillStyle(P.stoneLight, 1)
  g.fillRect(w - 22, h - 40, 14, 6)
  outlineRect(g, w - 36, h - 32, 6, 10, P.woodDark)

  // torches
  drawTorch(g, 36, 50)
  drawTorch(g, w - 28, 50)

  // red glowing door
  const groundY = h - 16
  outlineRect(g, w / 2 - 12, groundY - 36, 24, 36, P.outline)
  g.fillStyle(P.arenaRed, 0.95)
  g.fillRect(w / 2 - 10, groundY - 34, 20, 32)
  g.fillStyle(P.arenaOrange, 0.55)
  g.fillEllipse(w / 2 - 2, groundY - 18, 12, 18)
}

/** Town Hall — columns, steps, Mini App Bulletin, cupola, blue glow. */
function drawTownHall(g: Phaser.GameObjects.Graphics) {
  const w = 128
  const h = 130
  drawShadowEllipse(g, w / 2, h - 4, w * 0.88, 14, 0.28)

  // steps
  for (let i = 0; i < 3; i++) {
    outlineRect(g, 28 + i * 3, h - 22 + i * 4, w - 56 - i * 6, 5, P.stoneLight)
  }

  // body
  outlineRect(g, 16, 36, w - 32, h - 58, P.cyanDark)

  // columns
  for (const cx of [28, 48, w - 52, w - 32]) {
    outlineRect(g, cx, 48, 8, h - 78, P.stoneLight)
    g.fillStyle(P.white, 0.2)
    g.fillRect(cx + 2, 50, 2, h - 82)
  }

  // pediment
  g.fillStyle(P.outline, 1)
  g.fillTriangle(14, 40, w / 2, 8, w - 14, 40)
  g.fillStyle(P.townBlue, 1)
  g.fillTriangle(18, 39, w / 2, 12, w - 18, 39)

  // cupola / clock
  outlineRect(g, w / 2 - 10, 0, 20, 16, P.stoneDark)
  g.fillStyle(P.townBlue, 0.9)
  g.fillCircle(w / 2, 8, 7)
  g.fillStyle(P.white, 0.8)
  g.fillRect(w / 2 - 1, 4, 2, 5)
  g.fillRect(w / 2 - 1, 8, 4, 2)

  // flags
  outlineRect(g, 22, 14, 3, 28, P.stoneLight)
  g.fillStyle(P.townBlue, 1)
  g.fillRect(25, 14, 14, 10)
  outlineRect(g, w - 28, 14, 3, 28, P.stoneLight)
  g.fillStyle(P.gold, 1)
  g.fillRect(w - 25, 14, 14, 10)

  // Mini App Bulletin
  drawSignBoard(g, w - 48, 70, 30, 28, P.stoneDark)
  g.fillStyle(P.townBlue, 1)
  g.fillRect(w - 44, 74, 22, 3)
  g.fillStyle(P.goldLight, 0.75)
  g.fillRect(w - 44, 80, 18, 2)
  g.fillRect(w - 44, 85, 14, 2)
  g.fillRect(w - 44, 90, 16, 2)

  // windows
  drawWindowGlow(g, 40, 58, 14, 16, P.townBlue)
  drawWindowGlow(g, 74, 58, 14, 16, P.townBlue)

  // door
  const groundY = h - 22
  outlineRect(g, w / 2 - 12, groundY - 32, 24, 32, P.outline)
  g.fillStyle(P.townBlue, 0.85)
  g.fillRect(w / 2 - 10, groundY - 30, 20, 28)
  g.fillStyle(P.gold, 1)
  g.fillCircle(w / 2 + 4, groundY - 16, 2)
}

/** Social Club — benches energy, mailbox, message board, purple warmth. */
function drawSocialClub(g: Phaser.GameObjects.Graphics) {
  const w = 120
  const h = 118
  drawShadowEllipse(g, w / 2, h - 4, w * 0.9, 12, 0.28)

  // body
  outlineRect(g, 12, 34, w - 24, h - 50, P.purpleDark)

  // friendly roof
  g.fillStyle(P.outline, 1)
  g.fillTriangle(6, 38, w / 2, 8, w - 6, 38)
  g.fillStyle(P.socialPurple, 1)
  g.fillTriangle(10, 37, w / 2, 12, w - 10, 37)

  // striped awning
  g.fillStyle(P.outline, 1)
  g.fillRect(18, 44, w - 36, 12)
  for (let i = 0; i < 8; i++) {
    g.fillStyle(i % 2 === 0 ? P.socialPurple : P.white, 1)
    g.fillRect(20 + i * ((w - 40) / 8), 46, (w - 40) / 8 - 1, 8)
  }

  // café windows
  drawWindowGlow(g, 24, 62, 22, 20, P.lanternGlow)
  drawWindowGlow(g, 74, 62, 22, 20, P.lanternGlow)
  // silhouettes chatting
  g.fillStyle(P.outline, 0.45)
  g.fillRect(30, 72, 4, 8)
  g.fillRect(38, 72, 4, 8)
  g.fillRect(80, 72, 4, 8)

  // mailbox
  outlineRect(g, 8, h - 40, 12, 16, P.socialPurple)
  g.fillStyle(P.goldLight, 0.7)
  g.fillRect(10, h - 36, 8, 3)

  // message board
  drawSignBoard(g, w - 40, 70, 26, 22, P.stoneDark)
  g.fillStyle(P.socialPurple, 1)
  g.fillRect(w - 36, 74, 18, 2)
  g.fillStyle(P.goldLight, 0.6)
  g.fillRect(w - 36, 80, 14, 2)
  g.fillRect(w - 36, 85, 10, 2)

  // purple lanterns
  g.fillStyle(P.socialPurple, 0.8)
  g.fillCircle(28, 40, 4)
  g.fillCircle(w - 28, 40, 4)

  // door
  const groundY = h - 16
  outlineRect(g, w / 2 - 11, groundY - 30, 22, 30, P.outline)
  g.fillStyle(P.socialPurple, 0.9)
  g.fillRect(w / 2 - 9, groundY - 28, 18, 26)
}

/** Marketplace construction site — scaffolding, crane, Opening Soon. */
function drawConstructionSite(g: Phaser.GameObjects.Graphics) {
  const w = 132
  const h = 110
  drawShadowEllipse(g, w / 2, h - 4, w * 0.9, 12, 0.28)

  // incomplete walls
  outlineRect(g, 20, 48, w - 40, h - 64, P.stoneDark)
  g.fillStyle(P.constructGreen, 0.25)
  g.fillRect(22, 50, w - 44, h - 68)

  // scaffolding
  drawScaffoldSegment(g, 16, 30, 40, 60)
  drawScaffoldSegment(g, w - 56, 36, 40, 54)

  // tarp
  g.fillStyle(P.constructYellow, 0.85)
  g.fillTriangle(30, 40, 70, 28, 110, 44)
  g.fillStyle(P.constructGreen, 0.5)
  g.fillTriangle(40, 42, 75, 32, 100, 46)

  // crane arm
  outlineRect(g, w / 2 - 2, 4, 4, 50, P.constructYellow)
  g.fillStyle(P.constructYellow, 1)
  g.fillRect(w / 2 - 2, 8, 48, 3)
  g.fillStyle(P.outline, 1)
  g.fillRect(w / 2 + 42, 8, 2, 18)
  outlineRect(g, w / 2 + 36, 24, 12, 10, P.stoneDark)

  // fence
  for (let i = 0; i < 8; i++) {
    outlineRect(g, 14 + i * 14, h - 28, 3, 16, P.wood)
  }
  g.fillStyle(P.constructYellow, 1)
  g.fillRect(14, h - 22, 110, 3)

  // crates
  outlineRect(g, 28, h - 40, 16, 14, P.wood)
  outlineRect(g, 48, h - 36, 12, 10, P.woodDark)

  // Construction / Opening Soon board
  drawSignBoard(g, w / 2 - 36, 52, 72, 28, P.constructYellow)
  g.fillStyle(P.outline, 1)
  g.fillRect(w / 2 - 28, 58, 56, 3)
  g.fillRect(w / 2 - 24, 66, 48, 3)
  g.fillStyle(P.constructGreen, 1)
  g.fillRect(w / 2 - 20, 72, 40, 3)
}

function drawFountain(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 44, 78, 78, 18, 0.3)
  // outer basin
  g.fillStyle(P.outline, 1)
  g.fillEllipse(44, 62, 84, 32)
  g.fillStyle(P.stone, 1)
  g.fillEllipse(44, 62, 80, 28)
  g.fillStyle(P.stoneLight, 1)
  g.fillEllipse(44, 60, 72, 22)
  // water
  g.fillStyle(P.water, 0.95)
  g.fillEllipse(44, 58, 58, 16)
  g.fillStyle(P.arcadeCyan, 0.35)
  g.fillEllipse(44, 56, 48, 12)
  g.fillStyle(P.waterHighlight, 0.45)
  g.fillEllipse(36, 54, 22, 6)
  // gold rim accents
  g.fillStyle(P.fountainGold, 0.7)
  g.fillEllipse(44, 66, 76, 6)
  // pedestal
  outlineRect(g, 36, 38, 16, 22, P.stoneLight)
  g.fillStyle(P.fountainGold, 0.5)
  g.fillRect(38, 40, 12, 4)
  // crystal core (gold + cyan)
  g.fillStyle(P.outline, 1)
  g.fillTriangle(44, 4, 28, 40, 60, 40)
  g.fillStyle(P.fountainGold, 1)
  g.fillTriangle(44, 8, 31, 38, 57, 38)
  g.fillStyle(P.arcadeCyan, 0.75)
  g.fillTriangle(44, 14, 36, 34, 48, 34)
  g.fillStyle(P.goldLight, 0.95)
  g.fillTriangle(44, 12, 40, 28, 46, 28)
}

function drawCrystal(g: Phaser.GameObjects.Graphics) {
  g.fillStyle(P.outline, 1)
  g.fillTriangle(18, 0, 2, 30, 34, 30)
  g.fillStyle(P.fountainGold, 1)
  g.fillTriangle(18, 3, 5, 28, 31, 28)
  g.fillStyle(P.arcadeCyan, 0.8)
  g.fillTriangle(18, 10, 10, 26, 24, 26)
  g.fillStyle(P.goldLight, 0.95)
  g.fillTriangle(18, 8, 14, 22, 20, 22)
}

// --- Micro-landmarks & future world props ---

function drawFirepit(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 20, 30, 30, 10, 0.25)
  outlineRect(g, 6, 18, 28, 10, P.stoneDark)
  g.fillStyle(P.arenaOrange, 1)
  g.fillCircle(20, 16, 8)
  g.fillStyle(P.goldLight, 0.9)
  g.fillCircle(20, 14, 4)
  g.fillStyle(P.arenaRed, 0.6)
  g.fillCircle(16, 12, 3)
}

function drawCoffeeStand(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 22, 36, 36, 10, 0.22)
  outlineRect(g, 4, 16, 36, 18, P.wood)
  g.fillStyle(P.socialPurple, 1)
  g.fillRect(6, 10, 32, 8)
  outlineRect(g, 14, 20, 8, 10, P.stoneDark)
  g.fillStyle(P.lanternGlow, 0.8)
  g.fillRect(16, 22, 4, 4)
}

function drawCivicStatue(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 16, 44, 24, 8, 0.22)
  outlineRect(g, 8, 34, 16, 8, P.stone)
  outlineRect(g, 12, 16, 8, 20, P.stoneLight)
  g.fillStyle(P.townBlue, 0.7)
  g.fillCircle(16, 12, 8)
  g.fillStyle(P.gold, 1)
  g.fillRect(14, 4, 4, 6)
}

function drawJoystick(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 18, 40, 28, 10, 0.25)
  outlineRect(g, 4, 24, 28, 14, P.stoneDark)
  g.fillStyle(P.arcadeCyan, 1)
  g.fillRect(6, 26, 24, 10)
  outlineRect(g, 15, 8, 6, 20, P.outline)
  g.fillStyle(P.arcadeCyan, 1)
  g.fillCircle(18, 8, 7)
  g.fillStyle(P.white, 0.4)
  g.fillCircle(16, 6, 2)
}

function drawCrates(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 22, 28, 36, 10, 0.22)
  outlineRect(g, 4, 10, 20, 16, P.wood)
  outlineRect(g, 20, 14, 18, 14, P.woodDark)
  g.fillStyle(P.constructYellow, 0.7)
  g.fillRect(8, 14, 12, 2)
}

function drawPicnic(g: Phaser.GameObjects.Graphics) {
  drawShadowEllipse(g, 24, 26, 40, 10, 0.2)
  outlineRect(g, 4, 10, 40, 6, P.wood)
  outlineRect(g, 8, 16, 4, 10, P.woodDark)
  outlineRect(g, 36, 16, 4, 10, P.woodDark)
  outlineRect(g, 2, 6, 14, 4, P.wood)
  outlineRect(g, 32, 6, 14, 4, P.wood)
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

function drawFence(g: Phaser.GameObjects.Graphics) {
  for (let i = 0; i < 5; i++) {
    outlineRect(g, 2 + i * 12, 4, 3, 20, P.wood)
  }
  g.fillStyle(P.constructYellow, 1)
  g.fillRect(2, 8, 58, 3)
  g.fillRect(2, 16, 58, 3)
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

/** 4-direction character sheet: rows = down,left,right,up; cols = idle, walk1, walk2, walk3 */
function drawCharacterSheet(
  g: Phaser.GameObjects.Graphics,
  body: number,
  accent: number,
  ghost = false,
) {
  const fw = 32
  const fh = 48
  const alpha = ghost ? 0.55 : 1
  const dirs = ['down', 'left', 'right', 'up'] as const

  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const ox = col * fw
      const oy = row * fh
      const bob = col === 0 ? 0 : col % 2 === 0 ? -1 : 1
      const leg = col === 0 ? 0 : col === 1 ? -2 : col === 2 ? 0 : 2

      g.fillStyle(0x000000, ghost ? 0.12 : 0.22)
      g.fillEllipse(ox + 16, oy + 44, 16, 6)

      g.fillStyle(P.outline, alpha)
      g.fillRect(ox + 11, oy + 30 + bob, 4, 10 + (leg > 0 ? 1 : 0))
      g.fillRect(ox + 17, oy + 30 + bob, 4, 10 + (leg < 0 ? 1 : 0))
      g.fillStyle(body, alpha * 0.85)
      g.fillRect(ox + 12, oy + 31 + bob, 2, 8)
      g.fillRect(ox + 18, oy + 31 + bob, 2, 8)

      g.fillStyle(P.outline, alpha)
      g.fillRect(ox + 10, oy + 18 + bob, 12, 14)
      g.fillStyle(body, alpha)
      g.fillRect(ox + 11, oy + 19 + bob, 10, 12)
      g.fillStyle(accent, alpha)
      g.fillRect(ox + 13, oy + 22 + bob, 6, 3)

      g.fillStyle(P.outline, alpha)
      g.fillRect(ox + 11, oy + 8 + bob, 10, 10)
      g.fillStyle(ghost ? P.ghost : 0xf0d2b0, alpha)
      g.fillRect(ox + 12, oy + 9 + bob, 8, 8)

      g.fillStyle(P.outline, alpha)
      if (dirs[row] === 'down') {
        px(g, ox + 14, oy + 12 + bob, P.outline, 2, alpha)
        px(g, ox + 18, oy + 12 + bob, P.outline, 2, alpha)
      } else if (dirs[row] === 'up') {
        g.fillStyle(body, alpha)
        g.fillRect(ox + 12, oy + 8 + bob, 8, 3)
      } else if (dirs[row] === 'left') {
        px(g, ox + 13, oy + 12 + bob, P.outline, 2, alpha)
      } else {
        px(g, ox + 19, oy + 12 + bob, P.outline, 2, alpha)
      }

      if (ghost) {
        g.fillStyle(P.goldLight, 0.15)
        g.fillRect(ox + 8, oy + 6, 16, 36)
      }
    }
  }
}

export function generatePlazaAtlas(scene: Phaser.Scene) {
  makeTex(scene, 'tile-stone', 32, 32, (g) => drawStoneTile(g, 32))
  makeTex(scene, 'tile-path', 32, 32, (g) => drawPathTile(g, 32))
  makeTex(scene, 'tile-grass', 32, 32, (g) => drawGrassTile(g, 32))
  makeTex(scene, 'tile-water', 32, 32, (g) => drawWaterTile(g, 32))
  makeTex(scene, 'prop-tree', 48, 60, drawTree)
  makeTex(scene, 'prop-bush', 32, 28, drawBush)
  makeTex(scene, 'prop-bench', 44, 28, drawBench)
  makeTex(scene, 'prop-lantern', 20, 40, drawLantern)
  makeTex(scene, 'prop-bridge', 64, 36, drawBridge)
  makeTex(scene, 'prop-banner-purple', 30, 40, (g) => drawBanner(g, P.socialPurple))
  makeTex(scene, 'prop-banner-red', 30, 40, (g) => drawBanner(g, P.arenaRed))
  makeTex(scene, 'prop-banner-green', 30, 40, (g) => drawBanner(g, P.constructGreen))
  makeTex(scene, 'prop-banner-cyan', 30, 40, (g) => drawBanner(g, P.arcadeCyan))
  makeTex(scene, 'prop-firepit', 40, 36, drawFirepit)
  makeTex(scene, 'prop-coffee', 44, 40, drawCoffeeStand)
  makeTex(scene, 'prop-statue', 32, 48, drawCivicStatue)
  makeTex(scene, 'prop-joystick', 36, 44, drawJoystick)
  makeTex(scene, 'prop-crates', 44, 32, drawCrates)
  makeTex(scene, 'prop-picnic', 48, 32, drawPicnic)
  makeTex(scene, 'prop-harbor-closed', 80, 52, drawHarborClosed)
  makeTex(scene, 'prop-mountain-gate', 80, 52, drawMountainGate)
  makeTex(scene, 'prop-tunnel', 64, 56, drawTunnel)
  makeTex(scene, 'prop-fence', 64, 28, drawFence)
  makeTex(scene, 'fx-butterfly', 14, 10, drawButterfly)
  makeTex(scene, 'fx-bird', 22, 12, drawBird)

  makeTex(scene, 'building-arcade', 190, 170, drawArcade)
  makeTex(scene, 'building-arena', 140, 148, drawArena)
  makeTex(scene, 'building-construction', 132, 110, drawConstructionSite)
  makeTex(scene, 'building-social', 120, 118, drawSocialClub)
  makeTex(scene, 'building-townhall', 128, 130, drawTownHall)

  makeTex(scene, 'fountain-base', 88, 88, drawFountain)
  makeTex(scene, 'fountain-crystal', 36, 34, drawCrystal)

  makeTex(scene, 'char-player', 128, 192, (g) => drawCharacterSheet(g, P.playerBody, P.playerAccent))
  makeTex(scene, 'char-npc-a', 128, 192, (g) => drawCharacterSheet(g, P.npcA, P.gold))
  makeTex(scene, 'char-npc-b', 128, 192, (g) => drawCharacterSheet(g, P.npcB, P.cyan))
  makeTex(scene, 'char-npc-c', 128, 192, (g) => drawCharacterSheet(g, P.npcC, P.purple))
  makeTex(scene, 'char-npc-d', 128, 192, (g) => drawCharacterSheet(g, P.npcD, P.arenaRed))
  makeTex(scene, 'char-npc-e', 128, 192, (g) => drawCharacterSheet(g, P.npcE, P.constructGreen))
  makeTex(scene, 'char-ghost', 128, 192, (g) => drawCharacterSheet(g, P.ghost, P.goldLight, true))

  registerCharacterAnims(scene)
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
    const texture = scene.textures.get(sheet)
    if (texture.frameTotal <= 1) {
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          const index = row * 4 + col
          texture.add(index, 0, col * 32, row * 48, 32, 48)
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
