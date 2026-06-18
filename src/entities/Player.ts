/**
 * Player entity — wraps a Phaser arcade sprite around the pure mover state.
 *
 * All feel/timing lives in `systems/movement.ts` (testable); this class is just
 * the bridge to Phaser physics + rendering. Placeholder texture comes from the
 * manifest-driven generator, sized to the final 32×32 frame (asset spec §3.1).
 */

import Phaser from 'phaser';
import { createMoverState, stepMover, type MoverState } from '../systems/movement';
import type { InputManager } from '../core/Input';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly scene: Phaser.Scene;
  private readonly textureKey: string;
  private readonly mover: MoverState;
  private invulnerable = false;
  private trailTimer = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, textureKey = 'player') {
    this.scene = scene;
    this.textureKey = textureKey;
    this.mover = createMoverState();
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);
    // Hitbox a touch smaller than the 32px frame — the character occupies ~20px.
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 18).setOffset(7, 10);
    this.sprite.setData('entity', this);
  }

  /** Advance one frame. dtMs is Phaser's delta. */
  update(input: InputManager, dtMs: number): void {
    const result = stepMover(this.mover, input.sample(), dtMs);
    this.sprite.setVelocity(result.velocity.x, result.velocity.y);
    this.invulnerable = result.invulnerable;
    this.sprite.setFlipX(result.facing.flipX);

    // Light-trail tell during a dash: brighten the body + leave fading afterimages.
    const dashing = this.mover.phase === 'dashing';
    this.sprite.setAlpha(dashing ? 0.85 : 1);
    if (dashing) {
      this.trailTimer -= dtMs;
      if (this.trailTimer <= 0) {
        this.trailTimer = 28; // ms between afterimages
        this.emitAfterimage();
      }
    } else {
      this.trailTimer = 0;
    }
  }

  /** A faded, decaying copy of the sprite — the dash light-trail (asset spec fx.dash_trail). */
  private emitAfterimage(): void {
    const ghost = this.scene.add
      .image(this.sprite.x, this.sprite.y, this.textureKey)
      .setFlipX(this.sprite.flipX)
      .setAlpha(0.5)
      .setTint(0xbfe6ff)
      .setDepth(this.sprite.depth - 1);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 180,
      onComplete: () => ghost.destroy(),
    });
  }

  get isInvulnerable(): boolean {
    return this.invulnerable;
  }

  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }
}
