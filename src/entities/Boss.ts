/**
 * Boss entity — bridges the pure multi-phase boss AI + health to a Phaser sprite.
 *
 * Data-driven from a BossDef. Returns the AI decision each frame so the scene can
 * resolve the chosen attack pattern (strike / radial / volley) into real hitboxes
 * and projectiles. Telegraph tell scales with the wind-up so the read is fair.
 */

import Phaser from 'phaser';
import type { BossDef } from '../data/bosses';
import { makeHealth, applyDamage, fraction, type Health } from '../systems/health';
import { createBossMemory, stepBoss, type BossMemory, type BossDecision } from '../systems/bossAI';

export class Boss {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly def: BossDef;
  private readonly scene: Phaser.Scene;
  private readonly health: Health;
  private readonly ai: BossMemory;
  private dead = false;

  constructor(scene: Phaser.Scene, def: BossDef, x: number, y: number) {
    this.scene = scene;
    this.def = def;
    this.health = makeHealth(def.maxHealth);
    this.ai = createBossMemory();
    this.sprite = scene.physics.add.sprite(x, y, `enemy.${def.id}`);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setData('boss', this);
  }

  get isDead(): boolean {
    return this.dead;
  }

  get healthFraction(): number {
    return fraction(this.health);
  }

  get phaseName(): string {
    return this.ai.phaseName;
  }

  update(dtMs: number, player: { x: number; y: number }): BossDecision {
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    const decision = stepBoss(
      this.ai,
      this.def.ai,
      { distance, healthFraction: this.healthFraction },
      dtMs,
    );

    const dir = distance > 0.001 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 };
    const speed = decision.move === 'toward' ? decision.moveSpeed : 0;
    this.sprite.setVelocity(dir.x * speed, dir.y * speed);

    // Telegraph tell: brighten + swell, harder as phases escalate.
    if (decision.telegraphing) {
      this.sprite.setTint(0xffffff);
      this.sprite.setScale(1.12);
    } else {
      this.sprite.setTint(this.def.color);
      this.sprite.setScale(1);
    }
    return decision;
  }

  /** True if this hit killed the boss. */
  takeHit(amount: number): boolean {
    if (this.dead) return false;
    const { dead } = applyDamage(this.health, amount);
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(60, () => {
      if (!this.dead) this.sprite.setTint(this.def.color);
    });
    if (dead) this.die();
    return dead;
  }

  private die(): void {
    this.dead = true;
    this.sprite.setVelocity(0, 0);
    this.emitDeathMotes();
    this.sprite.destroy();
  }

  private emitDeathMotes(): void {
    const { x, y } = this.sprite;
    for (let i = 0; i < 24; i++) {
      const mote = this.scene.add.rectangle(x, y, 3, 3, 0xfff2c4).setDepth(60);
      const angle = (Math.PI * 2 * i) / 24;
      const dist = 30 + Math.random() * 30;
      this.scene.tweens.add({
        targets: mote,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist,
        alpha: 0,
        duration: 700,
        onComplete: () => mote.destroy(),
      });
    }
  }

  destroy(): void {
    this.sprite.destroy();
  }
}
