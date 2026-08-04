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
    const fw = this.sprite.frame.width
    const fh = this.sprite.frame.height
    // Foot-centered body scales with sheet cell size (32×48 procedural or 48×48 V4).
    this.sprite.setSize(Math.round(fw * 0.44), Math.round(fh * 0.25))
    this.sprite.setOffset(Math.round(fw * 0.28), Math.round(fh * 0.67))
    if (ghost) {
      this.sprite.setAlpha(0.62)
      // Gold wash so a recently-visited echo reads as a memory, not a twin.
      this.sprite.setTint(0xffe0a0)
    }
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
      this.moving = true
      // Cheap to call every frame — anims.play ignores a replay of the same key,
      // and this keeps the mirrored right-facing row in sync on every turn.
      this.playWalk()
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

  /**
   * PixelLab ships the `east` rotation drawn facing left, exactly like `west`,
   * so every V4 sheet's right-hand row moonwalks. Mirror the left row instead —
   * one fix covers every sheet, procedural ones included.
   */
  private animRow(): Facing {
    this.sprite.setFlipX(this.facing === 'right')
    return this.facing === 'right' ? 'left' : this.facing
  }

  private playIdle() {
    this.sprite.anims.play(`${this.sheet}-idle-${this.animRow()}`, true)
  }

  private playWalk() {
    this.sprite.anims.play(`${this.sheet}-walk-${this.animRow()}`, true)
  }
}
