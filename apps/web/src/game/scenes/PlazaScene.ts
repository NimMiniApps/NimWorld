import Phaser from 'phaser'
import type { PlazaActor } from '@/adapters/presence/PresenceAdapter'
import type { UiCommand, WorldPosition } from '@/domain/types'
import type { WorldBridge } from '@/game/bridge/WorldBridge'
import { CharacterSprite } from '@/game/entities/CharacterSprite'
import type { CharSheet } from '@/game/assets/generatePlazaAtlas'
import {
  ART_DISPLAY_SIZE,
  fountainOverrideIncludesCrystal,
} from '@/game/assets/artManifest'
import {
  DECOR,
  FUTURE_LANDMARKS,
  LOCATIONS,
  PLAZA_CENTER,
  SPAWN_POINT,
  VIEW_FRAME,
  WORLD,
  type PlazaLocation,
} from '@/game/world/locations'

export interface PlazaSceneData {
  bridge: WorldBridge
  actors: PlazaActor[]
  spawn?: WorldPosition | null
  playerLabel?: string
}

type AmbientActor = {
  character: CharacterSprite
  label: Phaser.GameObjects.Text
  kind: PlazaActor['kind']
  statusLabel: string
  home: WorldPosition
  phase: number
  displayName: string
  waypoints?: WorldPosition[]
  glanceUntil: number
}

export class PlazaScene extends Phaser.Scene {
  private bridge!: WorldBridge
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: {
    W: Phaser.Input.Keyboard.Key
    A: Phaser.Input.Keyboard.Key
    S: Phaser.Input.Keyboard.Key
    D: Phaser.Input.Keyboard.Key
  }
  private player!: CharacterSprite
  private playerLabelText!: Phaser.GameObjects.Text
  private movementPaused = false
  private externalVector = { x: 0, y: 0 }
  private activeLocationId: string | null = null
  private ambientActors: AmbientActor[] = []
  private depthSprites: Phaser.GameObjects.Image[] = []
  private crystal: Phaser.GameObjects.Image | null = null
  private unsubUi: (() => boolean) | null = null
  private readonly speed = 155
  private hasMoved = false
  private waterTiles: Phaser.GameObjects.Image[] = []
  private flags: Phaser.GameObjects.Image[] = []
  private trees: Phaser.GameObjects.Image[] = []

  constructor() {
    super('PlazaScene')
  }

  init(data: PlazaSceneData) {
    this.bridge = data.bridge
    this.registry.set('actors', data.actors)
    this.registry.set('spawn', data.spawn ?? null)
    this.registry.set('playerLabel', data.playerLabel ?? '@you')
  }

  create() {
    const actors = this.registry.get('actors') as PlazaActor[]
    const spawn = this.registry.get('spawn') as WorldPosition | null
    const playerLabel = this.registry.get('playerLabel') as string

    // Early evening / blue hour
    this.cameras.main.setBackgroundColor('#0b1228')
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height)

    this.paintEnvironment()
    this.placeDecor()
    this.placeFutureLandmarks()
    this.placeBuildings()
    this.placeFountain()
    this.spawnAmbientLife()

    const start = spawn && this.isInsideWorld(spawn) ? spawn : SPAWN_POINT
    this.player = new CharacterSprite(this, start.x, start.y, 'char-player')
    this.player.sprite.setDepth(200)

    this.playerLabelText = this.add
      .text(start.x, start.y - 36, playerLabel, {
        fontFamily: 'Sora, sans-serif',
        fontSize: '11px',
        color: '#fff7e0',
        stroke: '#0c1020',
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(10000)

    this.spawnActors(actors)
    this.createCollisionBodies()

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.wasd
    this.input.keyboard?.on('keydown-ENTER', () => this.tryInteract())
    this.input.keyboard?.on('keydown-SPACE', () => this.tryInteract())
    this.unsubUi = this.bridge.onUi((command) => this.handleUi(command))

    this.setupCamera()
    this.input.keyboard?.addCapture([
      'W',
      'A',
      'S',
      'D',
      'UP',
      'DOWN',
      'LEFT',
      'RIGHT',
      'SPACE',
    ])

    this.scale.on('resize', () => this.fitCameraToPlaza())
    this.time.delayedCall(0, () => {
      this.scale.refresh()
      this.fitCameraToPlaza(true)
    })
    this.time.delayedCall(120, () => this.fitCameraToPlaza(true))

    this.bridge.emitWorld({
      type: 'PLAYER_READY',
      position: { x: this.player.x, y: this.player.y },
    })
  }

  private isInsideWorld(pos: WorldPosition) {
    return pos.x > 40 && pos.x < WORLD.width - 40 && pos.y > 40 && pos.y < WORLD.height - 40
  }

  private setupCamera() {
    const cam = this.cameras.main
    cam.setBounds(0, 0, WORLD.width, WORLD.height)
    cam.startFollow(this.player.sprite, true, 0.14, 0.14)
    cam.setDeadzone(64, 48)
    this.fitCameraToPlaza(true)
  }

  private viewportSize() {
    const parent = this.game.scale.parent as HTMLElement | undefined
    const rect = parent?.getBoundingClientRect()
    const viewW = Math.max(
      this.scale.gameSize.width,
      this.scale.width,
      rect?.width ?? 0,
      320,
    )
    const viewH = Math.max(
      this.scale.gameSize.height,
      this.scale.height,
      rect?.height ?? 0,
      480,
    )
    return { viewW, viewH }
  }

  /** Cover zoom — never show the entire world at once; landmarks keep orientation. */
  private fitCameraToPlaza(initial = false) {
    const cam = this.cameras.main
    const { viewW, viewH } = this.viewportSize()

    const minCover = Math.max(viewW / WORLD.width, viewH / WORLD.height)
    const contentCover = Math.max(viewW / VIEW_FRAME.width, viewH / VIEW_FRAME.height)
    // Slight boost only — keep Arcade/Arena/Town Hall readable from spawn.
    const mobileBoost = viewH / viewW > 1.35 ? 1.04 : 1.0
    const nextZoom = Phaser.Math.Clamp(Math.max(minCover, contentCover) * mobileBoost, 1.15, 3.2)
    cam.setZoom(nextZoom)

    if (initial) {
      // Bias north so fountain + Arcade silhouette share the first frame.
      cam.centerOn(PLAZA_CENTER.x, PLAZA_CENTER.y - 24)
    }
  }

  private paintEnvironment() {
    // Grass base
    for (let y = 0; y < WORLD.height; y += 32) {
      for (let x = 0; x < WORLD.width; x += 32) {
        this.add.image(x + 16, y + 16, 'tile-grass').setDepth(0)
      }
    }

    // Rim water only (ponds / channels) — not a solid frame everywhere
    const waterBand = [
      ...this.rectBand(0, 0, WORLD.width, 40),
      ...this.rectBand(0, WORLD.height - 48, WORLD.width, 48),
      ...this.rectBand(0, 40, 40, WORLD.height - 88),
      ...this.rectBand(WORLD.width - 40, 40, 40, WORLD.height - 88),
    ]
    for (const [x, y] of waterBand) {
      const tile = this.add.image(x, y, 'tile-water').setDepth(1)
      this.waterTiles.push(tile)
    }

    // Fountain stone ring only (not a giant paved square)
    for (let y = PLAZA_CENTER.y - 70; y < PLAZA_CENTER.y + 80; y += 16) {
      for (let x = PLAZA_CENTER.x - 70; x < PLAZA_CENTER.x + 70; x += 16) {
        const dx = (x - PLAZA_CENTER.x) / 68
        const dy = (y - PLAZA_CENTER.y) / 62
        if (dx * dx + dy * dy < 1) {
          this.add.image(x, y, 'tile-stone').setDepth(2)
        }
      }
    }

    // Stone path ribbons spawn → fountain → each building
    const pathPoints = [
      ...this.curvePath(SPAWN_POINT.x, SPAWN_POINT.y, PLAZA_CENTER.x, PLAZA_CENTER.y + 20, 8),
      ...this.curvePath(PLAZA_CENTER.x, PLAZA_CENTER.y, 478, 190, 11),
      ...this.curvePath(PLAZA_CENTER.x - 20, PLAZA_CENTER.y, 220, 270, 11, -36),
      ...this.curvePath(PLAZA_CENTER.x + 20, PLAZA_CENTER.y, 750, 270, 11, 36),
      ...this.curvePath(PLAZA_CENTER.x - 10, PLAZA_CENTER.y + 20, 250, 510, 11, 28),
      ...this.curvePath(PLAZA_CENTER.x + 10, PLAZA_CENTER.y + 20, 710, 520, 11, -28),
    ]
    const seen = new Set<string>()
    for (const [x, y] of pathPoints) {
      const key = `${x},${y}`
      if (seen.has(key)) continue
      seen.add(key)
      this.add.image(x, y, 'tile-path').setDepth(3).setAlpha(0.96)
    }

    // Flower / grass pockets every stretch of path (break identical tiles)
    for (const [fx, fy] of [
      [300, 340],
      [660, 350],
      [420, 500],
      [560, 200],
      [360, 220],
      [600, 520],
      [320, 560],
      [700, 320],
    ] as const) {
      for (let i = 0; i < 4; i++) {
        this.add
          .image(fx + (i % 2) * 16 - 8, fy + Math.floor(i / 2) * 16, 'tile-grass')
          .setDepth(3.5)
      }
    }

    // Soft blue-hour vignette
    const fog = this.add.graphics().setDepth(4)
    fog.fillStyle(0x0b1228, 0.32)
    fog.fillRect(0, 0, WORLD.width, 64)
    fog.fillStyle(0x0b1228, 0.22)
    fog.fillRect(0, WORLD.height - 72, WORLD.width, 72)
    fog.fillStyle(0x0b1228, 0.12)
    fog.fillRect(0, 0, 48, WORLD.height)
    fog.fillRect(WORLD.width - 48, 0, 48, WORLD.height)
  }

  private rectBand(x: number, y: number, w: number, h: number) {
    const pts: Array<[number, number]> = []
    for (let yy = y; yy < y + h; yy += 32) {
      for (let xx = x; xx < x + w; xx += 32) {
        pts.push([xx + 16, yy + 16])
      }
    }
    return pts
  }

  private curvePath(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    steps: number,
    bulge = 0,
  ): Array<[number, number]> {
    const pts: Array<[number, number]> = []
    for (let i = 0; i <= steps; i++) {
      const t = i / steps
      const xc = (x0 + x1) / 2 + bulge
      const yc = (y0 + y1) / 2 - Math.abs(bulge) * 0.25
      const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * xc + t * t * x1
      const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * yc + t * t * y1
      pts.push([Math.round(x / 16) * 16, Math.round(y / 16) * 16])
      pts.push([Math.round(x / 16) * 16 + 16, Math.round(y / 16) * 16])
      pts.push([Math.round(x / 16) * 16 - 16, Math.round(y / 16) * 16])
    }
    return pts
  }

  private placeDecor() {
    for (const item of DECOR) {
      const img = this.add.image(item.x, item.y, item.key)
      img.setOrigin(0.5, 0.85)
      img.setDepth(100 + item.y + (item.depthBias ?? 0))
      this.depthSprites.push(img)

      if (item.key.startsWith('prop-banner')) {
        this.flags.push(img)
        this.tweens.add({
          targets: img,
          scaleX: 0.88,
          duration: 700 + (item.x % 200),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }

      if (item.key === 'prop-tree') {
        this.trees.push(img)
        this.tweens.add({
          targets: img,
          angle: 1.6,
          duration: 2200 + (item.x % 400),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        })
      }

      if (item.key === 'prop-lantern') {
        // Soft light pool — early evening warmth
        const pool = this.add
          .ellipse(item.x, item.y - 4, 70, 42, 0xffc66d, 0.1)
          .setDepth(5)
        const glow = this.add.circle(item.x, item.y - 22, 18, 0xffc66d, 0.14).setDepth(5)
        this.tweens.add({
          targets: [glow, pool],
          alpha: { from: 0.1, to: 0.22 },
          duration: 1100 + (item.x % 300),
          yoyo: true,
          repeat: -1,
        })
      }

      if (item.key === 'prop-firepit') {
        const fire = this.add.circle(item.x, item.y - 14, 12, 0xff8a3d, 0.2).setDepth(5)
        this.tweens.add({
          targets: fire,
          alpha: 0.35,
          scale: 1.15,
          duration: 500,
          yoyo: true,
          repeat: -1,
        })
      }
    }
  }

  private placeFutureLandmarks() {
    for (const mark of FUTURE_LANDMARKS) {
      const img = this.add.image(mark.x, mark.y, mark.texture)
      img.setOrigin(0.5, 0.85)
      img.setDepth(100 + mark.y)
      this.depthSprites.push(img)

      const title = this.add
        .text(mark.x, mark.y - 42, mark.title, {
          fontFamily: 'Sora, sans-serif',
          fontSize: '10px',
          fontStyle: '700',
          color: '#e8eefc',
          stroke: '#0c1020',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(100 + mark.y + 2)

      mark.lines.forEach((line, i) => {
        this.add
          .text(mark.x, mark.y - 30 + i * 11, line, {
            fontFamily: 'Mulish, sans-serif',
            fontSize: '9px',
            color: '#b8c2e0',
            stroke: '#0c1020',
            strokeThickness: 2,
          })
          .setOrigin(0.5)
          .setDepth(100 + mark.y + 2)
      })

      void title
    }
  }

  private placeBuildings() {
    for (const loc of LOCATIONS) {
      if (!loc.texture) continue
      const img = this.add.image(loc.x, loc.y, loc.texture)
      img.setOrigin(0.5, 0.82)
      const size = ART_DISPLAY_SIZE[loc.texture]
      if (size) img.setDisplaySize(size.w, size.h)
      img.setDepth(100 + loc.y)
      this.depthSprites.push(img)

      const labelY = loc.id === 'arcade' ? -78 : loc.id === 'marketplace' ? -52 : -62
      this.add
        .text(loc.x, loc.y + labelY, loc.label.toUpperCase(), {
          fontFamily: 'Sora, sans-serif',
          fontSize: loc.id === 'arcade' ? '13px' : '10px',
          fontStyle: '800',
          color: '#ffffff',
          stroke: '#0c1020',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(100 + loc.y + 1)

      this.add
        .text(loc.x, loc.y + labelY + 12, loc.subtitle, {
          fontFamily: 'Mulish, sans-serif',
          fontSize: '9px',
          color: '#d7deff',
          stroke: '#0c1020',
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(100 + loc.y + 1)

      // Colored portal / door spill (skip heavy pulse on construction)
      if (loc.id !== 'marketplace') {
        const portal = this.add
          .ellipse(
            loc.x,
            loc.y - 6,
            loc.id === 'arcade' ? 34 : 18,
            loc.id === 'arcade' ? 14 : 10,
            loc.accent,
            0.28,
          )
          .setDepth(100 + loc.y - 1)
        this.tweens.add({
          targets: portal,
          alpha: 0.55,
          scaleX: 1.12,
          duration: loc.id === 'arcade' ? 900 : 1200,
          yoyo: true,
          repeat: -1,
        })
      }

      // Arcade sparkles + optional portal FX overlay (icon asset)
      if (loc.id === 'arcade') {
        if (this.textures.exists('fx-arcade-portal')) {
          const portalFx = this.add.image(loc.x - 8, loc.y - 28, 'fx-arcade-portal')
          portalFx.setOrigin(0.5, 0.5)
          portalFx.setDisplaySize(48, 60)
          portalFx.setDepth(100 + loc.y + 2)
          portalFx.setAlpha(0.85)
          this.tweens.add({
            targets: portalFx,
            alpha: 1,
            scaleX: 1.06,
            scaleY: 1.06,
            duration: 1100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          })
        }
        for (let i = 0; i < 5; i++) {
          const spark = this.add
            .circle(loc.x - 10 + i * 6, loc.y - 20, 1.5, 0x3de7ff, 0.7)
            .setDepth(100 + loc.y + 3)
          this.tweens.add({
            targets: spark,
            y: loc.y - 40 - (i % 2) * 8,
            alpha: 0,
            duration: 1400 + i * 100,
            delay: i * 200,
            repeat: -1,
          })
        }
      }

      // Arena chimney smoke (subtle)
      if (loc.id === 'arena') {
        for (let i = 0; i < 3; i++) {
          const smoke = this.add
            .circle(loc.x - 48, loc.y - 70, 3, 0xb8c2e0, 0.25)
            .setDepth(100 + loc.y + 2)
          this.tweens.add({
            targets: smoke,
            y: loc.y - 100 - i * 6,
            x: loc.x - 48 + Math.sin(i) * 8,
            alpha: 0,
            scale: 1.8,
            duration: 2200 + i * 200,
            delay: i * 400,
            repeat: -1,
          })
        }
      }
    }
  }

  private placeFountain() {
    const { x, y } = PLAZA_CENTER
    const combined = fountainOverrideIncludesCrystal()
    const base = this.add.image(x, y + 10, 'fountain-base')
    base.setOrigin(0.5, 0.75)
    const fountainSize = ART_DISPLAY_SIZE['fountain-base']
    if (fountainSize) base.setDisplaySize(fountainSize.w, fountainSize.h)
    base.setDepth(100 + y)
    this.depthSprites.push(base)

    // Soft gold+cyan identity glow
    const glowCyan = this.add.circle(x, y - 10, 40, 0x3de7ff, 0.1).setDepth(6)
    const glowGold = this.add.circle(x, y - 18, 32, 0xf5a623, 0.16).setDepth(6)
    this.tweens.add({
      targets: [glowCyan, glowGold],
      alpha: 0.28,
      scale: 1.15,
      duration: 1600,
      yoyo: true,
      repeat: -1,
    })

    if (!combined) {
      this.crystal = this.add.image(x, y - 22, 'fountain-crystal')
      this.crystal.setDepth(100 + y + 2)
      this.tweens.add({
        targets: this.crystal,
        y: y - 30,
        angle: 8,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // Sparse particles — alive, not busy
    for (let i = 0; i < 6; i++) {
      const p = this.add.circle(x, y, 2, i % 2 === 0 ? 0xffe29a : 0x3de7ff, 0.65).setDepth(100 + y + 3)
      this.tweens.add({
        targets: p,
        y: y - 44 - (i % 3) * 6,
        x: x + Math.sin(i * 1.2) * 14,
        alpha: 0,
        duration: 1800 + i * 100,
        delay: i * 220,
        repeat: -1,
      })
    }
  }

  private spawnAmbientLife() {
    // Butterflies — few, small loops
    for (let i = 0; i < 3; i++) {
      const bx = 320 + i * 120
      const by = 300 + (i % 2) * 80
      const bug = this.add.image(bx, by, 'fx-butterfly').setDepth(400).setAlpha(0.85)
      this.tweens.add({
        targets: bug,
        x: bx + 40,
        y: by - 20,
        duration: 2800 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      })
    }

    // Birds — rim flight, sparse
    for (let i = 0; i < 2; i++) {
      const bird = this.add.image(80 + i * 40, 100 + i * 30, 'fx-bird').setDepth(500).setAlpha(0.7)
      this.tweens.add({
        targets: bird,
        x: WORLD.width - 60,
        y: 80 + i * 40,
        duration: 14000 + i * 2000,
        delay: i * 3000,
        repeat: -1,
        ease: 'Linear',
      })
    }
  }

  private spawnActors(actors: PlazaActor[]) {
    const sheetMap: Record<string, CharSheet> = {
      a: 'char-npc-a',
      b: 'char-npc-b',
      c: 'char-npc-c',
      d: 'char-npc-d',
      e: 'char-npc-e',
    }
    let npcIndex = 0
    const fallbackSheets: CharSheet[] = ['char-npc-a', 'char-npc-b', 'char-npc-c']

    for (const actor of actors) {
      const home = actor.position
      const isGhost = actor.kind === 'ghost'
      const sheet: CharSheet = isGhost
        ? 'char-ghost'
        : actor.sheet
          ? sheetMap[actor.sheet]!
          : fallbackSheets[npcIndex++ % fallbackSheets.length]!

      const character = new CharacterSprite(this, home.x, home.y, sheet, isGhost)
      const body = character.sprite.body as Phaser.Physics.Arcade.Body | null
      if (body) body.enable = false

      const label = this.add
        .text(home.x, home.y - 36, actor.label, {
          fontFamily: 'Mulish, sans-serif',
          fontSize: '10px',
          color: isGhost ? '#ffe29a' : '#d7deff',
          stroke: '#0c1020',
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(10000)
        .setAlpha(0)

      this.ambientActors.push({
        character,
        label,
        kind: actor.kind,
        statusLabel: actor.statusLabel,
        home,
        phase: Math.random() * Math.PI * 2,
        displayName: actor.label,
        waypoints: actor.waypoints,
        glanceUntil: 0,
      })
    }
  }

  private createCollisionBodies() {
    const walls = this.physics.add.staticGroup()
    for (const loc of LOCATIONS) {
      if (loc.id === 'fountain') continue
      const body = this.add.rectangle(loc.x, loc.y - 16, loc.collideW, loc.collideH, 0x000000, 0)
      this.physics.add.existing(body, true)
      walls.add(body)
    }
    for (const mark of FUTURE_LANDMARKS) {
      const body = this.add.rectangle(mark.x, mark.y - 8, mark.collideW, mark.collideH, 0x000000, 0)
      this.physics.add.existing(body, true)
      walls.add(body)
    }
    for (const item of DECOR.filter((d) => d.key === 'prop-tree' || d.key === 'prop-fence')) {
      const body = this.add.rectangle(item.x, item.y - 8, item.key === 'prop-fence' ? 40 : 18, 14, 0x000000, 0)
      this.physics.add.existing(body, true)
      walls.add(body)
    }
    this.physics.add.collider(this.player.sprite, walls)
  }

  private handleUi(command: UiCommand) {
    switch (command.type) {
      case 'PAUSE_MOVEMENT':
        this.movementPaused = true
        this.player.setVelocity(0, 0)
        this.scene.pause()
        break
      case 'RESUME_MOVEMENT':
        this.movementPaused = false
        if (this.scene.isPaused()) this.scene.resume()
        break
      case 'RESTORE_POSITION':
        this.player.setPosition(command.position.x, command.position.y)
        break
      case 'SET_INPUT_VECTOR':
        this.externalVector = { x: command.x, y: command.y }
        break
      case 'TRIGGER_INTERACT':
        this.tryInteract()
        break
    }
  }

  private tryInteract() {
    if (!this.activeLocationId) return
    this.bridge.emitWorld({ type: 'OPEN_LOCATION', locationId: this.activeLocationId })
  }

  update(_time: number, _delta: number) {
    if (this.movementPaused) return

    let vx = this.externalVector.x
    let vy = this.externalVector.y

    if (this.cursors.left?.isDown || this.wasd.A.isDown) vx = -1
    else if (this.cursors.right?.isDown || this.wasd.D.isDown) vx = 1
    if (this.cursors.up?.isDown || this.wasd.W.isDown) vy = -1
    else if (this.cursors.down?.isDown || this.wasd.S.isDown) vy = 1

    if (vx !== 0 || vy !== 0) {
      const len = Math.hypot(vx, vy) || 1
      this.player.setVelocity((vx / len) * this.speed, (vy / len) * this.speed)
      if (!this.hasMoved) {
        this.hasMoved = true
        this.game.events.emit('plaza-first-move')
      }
      this.bridge.emitWorld({
        type: 'PLAYER_MOVED',
        position: { x: this.player.x, y: this.player.y },
      })
    } else {
      this.player.setVelocity(0, 0)
    }

    this.player.updateDepth(100)
    this.playerLabelText.setPosition(this.player.x, this.player.y - 36)
    this.playerLabelText.setDepth(10000)

    this.updateProximity()
    this.updateAmbient()
    this.updateLabels()
    this.animateWater()
  }

  private updateProximity() {
    let nearest: PlazaLocation | null = null
    let nearestDist = Infinity
    for (const loc of LOCATIONS) {
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, loc.x, loc.y)
      if (d < loc.radius && d < nearestDist) {
        nearest = loc
        nearestDist = d
      }
    }

    let ghostTarget: AmbientActor | null = null
    if (!nearest) {
      for (const actor of this.ambientActors) {
        if (actor.kind !== 'ghost') continue
        const d = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          actor.character.x,
          actor.character.y,
        )
        if (d < 42) {
          ghostTarget = actor
          break
        }
      }
    }

    const nextId = nearest?.id ?? (ghostTarget ? `ghost:${ghostTarget.displayName}` : null)
    if (nextId !== this.activeLocationId) {
      this.activeLocationId = nextId
      if (nearest) {
        this.bridge.emitWorld({
          type: 'INTERACTION_AVAILABLE',
          target: {
            locationId: nearest.id,
            label: nearest.interactionLabel,
            kind: nearest.id,
          },
        })
      } else if (ghostTarget) {
        this.bridge.emitWorld({
          type: 'INTERACTION_AVAILABLE',
          target: {
            locationId: 'social-club',
            label: `View ${ghostTarget.displayName}`,
            kind: 'ghost',
          },
        })
      } else {
        this.bridge.emitWorld({ type: 'INTERACTION_CLEARED' })
      }
    }
  }

  private updateAmbient() {
    const t = this.time.now / 1000
    const now = this.time.now

    for (const actor of this.ambientActors) {
      const prevX = actor.character.x
      const prevY = actor.character.y

      // Glance at player when nearby
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, prevX, prevY)
      if (dist < 80 && actor.kind === 'npc') {
        if (now > actor.glanceUntil) {
          actor.glanceUntil = now + 1200
        }
      }

      if (now < actor.glanceUntil && actor.kind === 'npc') {
        actor.character.faceToward(this.player.x, this.player.y)
        actor.character.updateDepth(100)
        continue
      }

      if (actor.waypoints && actor.waypoints.length > 1) {
        // Courier-style path between landmarks
        const seg = actor.waypoints.length
        const speed = 0.12
        const total = t * speed + actor.phase
        const idx = Math.floor(total) % seg
        const next = (idx + 1) % seg
        const localT = total - Math.floor(total)
        const a = actor.waypoints[idx]!
        const b = actor.waypoints[next]!
        const x = a.x + (b.x - a.x) * localT
        const y = a.y + (b.y - a.y) * localT
        actor.character.ambientStep(x, y, prevX, prevY)
      } else {
        const radius = actor.kind === 'npc' ? 18 : 12
        const x = actor.home.x + Math.cos(t * 0.45 + actor.phase) * radius
        const y = actor.home.y + Math.sin(t * 0.35 + actor.phase) * (radius * 0.5)
        actor.character.ambientStep(x, y, prevX, prevY)
      }

      actor.character.updateDepth(100)
      if (actor.kind === 'ghost') {
        actor.character.sprite.setAlpha(0.45 + 0.2 * Math.sin(t * 2 + actor.phase))
      }
    }
  }

  private updateLabels() {
    const shown: Array<{ x: number; y: number }> = [
      { x: this.player.x, y: this.player.y - 36 },
    ]

    for (const actor of this.ambientActors) {
      const d = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        actor.character.x,
        actor.character.y,
      )
      const nearby = d < 90
      let lx = actor.character.x
      let ly = actor.character.y - 36
      if (nearby) {
        for (const other of shown) {
          if (Math.hypot(lx - other.x, ly - other.y) < 26) ly -= 14
        }
        actor.label.setText(
          actor.kind === 'ghost'
            ? `${actor.displayName} · ${actor.statusLabel}`
            : `${actor.displayName}`,
        )
        actor.label.setPosition(lx, ly)
        actor.label.setAlpha(1)
        shown.push({ x: lx, y: ly })
      } else {
        actor.label.setAlpha(0)
      }
    }
  }

  private animateWater() {
    const t = this.time.now / 400
    for (let i = 0; i < this.waterTiles.length; i++) {
      const tile = this.waterTiles[i]!
      tile.setAlpha(0.85 + Math.sin(t + i * 0.35) * 0.08)
    }
  }

  shutdown() {
    this.unsubUi?.()
    this.scale.off('resize')
  }
}
