/**
 * Player entity — wraps a Phaser arcade sprite around the pure mover state.
 *
 * All feel/timing lives in `systems/movement.ts` (testable); this class is just
 * the bridge to Phaser physics + rendering. Placeholder texture comes from the
 * manifest-driven generator, sized to the final 32×32 frame (asset spec §3.1).
 */

import Phaser from 'phaser';
import { createMoverState, stepMover, facingToVector, type MoverState } from '../systems/movement';
import { makeHealth, applyDamage, heal, fraction, type Health } from '../systems/health';
import { COMBAT } from '../core/config';
import type { Vec2, Facing } from '../core/types';
import type { InputManager } from '../core/Input';

export class Player {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  private readonly scene: Phaser.Scene;
  /** Render layer for the world camera (so dash afterimages render there too). */
  private readonly layer?: Phaser.GameObjects.Layer;
  private readonly textureKey: string;
  private readonly mover: MoverState;
  private readonly light: Health;
  private dashInvuln = false;
  private hurtIframes = 0;
  private trailTimer = 0;
  /** When true (godmode), the player never takes damage. */
  godmode = false;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    maxLight: number,
    textureKey = 'player',
    layer?: Phaser.GameObjects.Layer,
  ) {
    this.scene = scene;
    this.layer = layer;
    this.textureKey = textureKey;
    this.mover = createMoverState();
    this.light = makeHealth(maxLight);
    this.sprite = scene.physics.add.sprite(x, y, textureKey);
    this.sprite.setCollideWorldBounds(true);
    // Hitbox a touch smaller than the 32px frame — the character occupies ~20px.
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    body.setSize(18, 18).setOffset(7, 10);
    this.sprite.setData('entity', this);
    this.layer?.add(this.sprite);
  }

  /** Advance one frame. dtMs is Phaser's delta. */
  update(input: InputManager, dtMs: number): void {
    const result = stepMover(this.mover, input.sample(), dtMs);
    this.sprite.setVelocity(result.velocity.x, result.velocity.y);
    this.dashInvuln = result.invulnerable;
    // The player art faces LEFT by default, but the mover's flipX convention assumes
    // right-facing art (flipX=true ⇒ facing left). Invert here so the sprite mirrors
    // to match the direction of travel; aim (facingToVector) is unaffected.
    this.sprite.setFlipX(!result.facing.flipX);

    if (this.hurtIframes > 0) {
      this.hurtIframes -= dtMs;
      // Blink while invulnerable from a hit.
      this.sprite.setVisible(Math.floor(this.hurtIframes / 80) % 2 === 0);
    } else {
      this.sprite.setVisible(true);
    }

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
    this.layer?.add(ghost);
    this.scene.tweens.add({
      targets: ghost,
      alpha: 0,
      duration: 180,
      onComplete: () => ghost.destroy(),
    });
  }

  get isInvulnerable(): boolean {
    return this.dashInvuln || this.hurtIframes > 0 || this.godmode;
  }

  /** True only while mid-dash — used to leap chasm gates (light_dash grant). */
  get isDashing(): boolean {
    return this.mover.phase === 'dashing';
  }

  /** Current facing as a unit vector — the direction attacks fire (Pillar 3). */
  get aimVector(): Vec2 {
    return facingToVector(this.mover.facing);
  }

  get facing(): Facing {
    return this.mover.facing;
  }

  /** Light remaining as a 0..1 fraction — drives the HUD light meter. */
  get lightFraction(): number {
    return fraction(this.light);
  }

  get lightValue(): number {
    return this.light.current;
  }

  /** Take damage unless currently invulnerable. Returns true if this was lethal. */
  takeDamage(amount: number): boolean {
    if (this.isInvulnerable) return false;
    const { dead } = applyDamage(this.light, amount);
    this.hurtIframes = COMBAT.playerHurtIFramesMs;
    this.scene.cameras.main.shake(120, 0.006);
    return dead;
  }

  /** Restore light to full (rest-point / respawn). */
  restoreLight(): void {
    heal(this.light, this.light.max);
  }

  get isDead(): boolean {
    return this.light.current <= 0;
  }

  get position(): { x: number; y: number } {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setPosition(x: number, y: number): void {
    this.sprite.setPosition(x, y);
  }
}
