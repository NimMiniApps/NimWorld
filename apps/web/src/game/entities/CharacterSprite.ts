import Phaser from 'phaser'
import {
  facingFromVector,
  type CharSheet,
  type Facing,
} from '@/game/assets/generatePlazaAtlas'

export class CharacterSprite {
  readonly sprite: Phaser.Physics.Arcade.Sprite
  private facing: Facing = 'down'
  private sheet: CharSheet
  private moving = false

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    sheet: CharSheet,
    private readonly ghost = false,
  ) {
    this.sheet = sheet
    this.sprite = scene.physics.add.sprite(x, y, sheet, 0)
    this.sprite.setCollideWorldBounds(true)
    this.sprite.setSize(14, 12)
    this.sprite.setOffset(9, 32)
    if (ghost) this.sprite.setAlpha(0.62)
    this.playIdle()
  }

  get x() {
    return this.sprite.x
  }

  get y() {
    return this.sprite.y
  }

  setVelocity(vx: number, vy: number) {
    this.sprite.setVelocity(vx, vy)
    const speed = Math.hypot(vx, vy)
    if (speed > 8) {
      this.facing = facingFromVector(vx, vy, this.facing)
      if (!this.moving) {
        this.moving = true
        this.playWalk()
      } else {
        // refresh facing anim if direction changed
        const key = `${this.sheet}-walk-${this.facing}`
        if (this.sprite.anims.currentAnim?.key !== key) this.playWalk()
      }
    } else {
      this.sprite.setVelocity(0, 0)
      if (this.moving) {
        this.moving = false
        this.playIdle()
      }
    }
  }

  setPosition(x: number, y: number) {
    this.sprite.setPosition(x, y)
  }

  /** Soft ambient stroll without fighting the physics body every frame. */
  ambientStep(x: number, y: number, prevX: number, prevY: number) {
    this.sprite.setVelocity(0, 0)
    this.sprite.setPosition(x, y)
    const dx = x - prevX
    const dy = y - prevY
    if (Math.hypot(dx, dy) > 0.15) {
      this.facing = facingFromVector(dx, dy, this.facing)
      this.moving = true
      this.playWalk()
    } else if (this.moving) {
      this.moving = false
      this.playIdle()
    }
  }

  /** Glance toward a point (player) — no AI, just facing. */
  faceToward(x: number, y: number) {
    this.facing = facingFromVector(x - this.sprite.x, y - this.sprite.y, this.facing)
    this.moving = false
    this.sprite.setVelocity(0, 0)
    this.playIdle()
  }

  updateDepth(base = 100) {
    this.sprite.setDepth(base + this.sprite.y)
  }

  private playIdle() {
    this.sprite.anims.play(`${this.sheet}-idle-${this.facing}`, true)
  }

  private playWalk() {
    this.sprite.anims.play(`${this.sheet}-walk-${this.facing}`, true)
  }
}
