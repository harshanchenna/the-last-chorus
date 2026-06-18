/**
 * Enemy entity — bridges the pure AI state machine + health to a Phaser sprite.
 *
 * Data-driven: everything (speed, ranges, telegraph timing, damage, frame size,
 * color) comes from an `EnemyDef`. No enemy-specific code lives here, so new
 * enemies are a data edit (seed §5).
 */

import Phaser from 'phaser';
import type { EnemyDef } from '../data/enemies';
import { makeHealth, applyDamage, fraction, type Health } from '../systems/health';
import { createAIMemory, stepAI, type AIMemory, type AIDecision } from '../systems/enemyAI';

export class Enemy {
  readonly sprite: Phaser.Physics.Arcade.Sprite;
  readonly def: EnemyDef;
  private readonly scene: Phaser.Scene;
  private readonly health: Health;
  private readonly ai: AIMemory;
  private dead = false;
  private hpBar: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, def: EnemyDef, x: number, y: number) {
    this.scene = scene;
    this.def = def;
    this.health = makeHealth(def.maxHealth);
    this.ai = createAIMemory();
    this.sprite = scene.physics.add.sprite(x, y, `enemy.${def.id}`);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setData('enemy', this);
    this.hpBar = scene.add.graphics();
  }

  get isDead(): boolean {
    return this.dead;
  }

  /** Advance one frame; returns the AI decision so the scene can resolve hits. */
  update(dtMs: number, player: { x: number; y: number }): AIDecision {
    const dx = player.x - this.sprite.x;
    const dy = player.y - this.sprite.y;
    const distance = Math.hypot(dx, dy);
    const decision = stepAI(this.ai, this.toAIConfig(), { distance }, dtMs);

    // Translate the decision into motion.
    const dir = distance > 0.001 ? { x: dx / distance, y: dy / distance } : { x: 0, y: 0 };
    let speed = 0;
    if (decision.move === 'toward') speed = this.def.moveSpeed;
    else if (decision.move === 'lunge') speed = this.def.moveSpeed * 2.2;
    this.sprite.setVelocity(dir.x * speed, dir.y * speed);

    // Telegraph tell: flash bright + swell so the wind-up is unmistakable.
    if (decision.telegraphing) {
      this.sprite.setTint(0xffffff);
      this.sprite.setScale(1.18);
    } else {
      this.sprite.clearTint();
      this.sprite.setScale(1);
    }

    this.drawHpBar();
    return decision;
  }

  /** Apply damage; returns true if this killed the enemy. */
  takeHit(amount: number): boolean {
    if (this.dead) return false;
    const { dead } = applyDamage(this.health, amount);
    // Hurt flash.
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(70, () => {
      if (!this.dead) this.sprite.clearTint();
    });
    if (dead) this.die();
    return dead;
  }

  private die(): void {
    this.dead = true;
    this.sprite.setVelocity(0, 0);
    this.emitDeathMotes();
    this.hpBar.destroy();
    this.sprite.destroy();
  }

  /** fx.death_motes placeholder — dissolve into motes of light (asset spec §3.4). */
  private emitDeathMotes(): void {
    const { x, y } = this.sprite;
    for (let i = 0; i < 6; i++) {
      const mote = this.scene.add.rectangle(x, y, 2, 2, 0xfff2c4).setDepth(50);
      const angle = (Math.PI * 2 * i) / 6;
      this.scene.tweens.add({
        targets: mote,
        x: x + Math.cos(angle) * 14,
        y: y + Math.sin(angle) * 14,
        alpha: 0,
        duration: 320,
        onComplete: () => mote.destroy(),
      });
    }
  }

  private drawHpBar(): void {
    const f = fraction(this.health);
    this.hpBar.clear();
    if (f >= 1) return; // only show once damaged — keeps the screen calm
    const w = this.def.frame.w;
    const x = this.sprite.x - w / 2;
    const y = this.sprite.y - this.def.frame.h / 2 - 4;
    this.hpBar.fillStyle(0x000000, 0.6).fillRect(x, y, w, 2);
    this.hpBar.fillStyle(0xff7a3c, 1).fillRect(x, y, w * f, 2);
  }

  destroy(): void {
    this.hpBar.destroy();
    this.sprite.destroy();
  }

  private toAIConfig() {
    return {
      aggroRange: this.def.aggroRange,
      attackRange: this.def.attackRange,
      telegraphMs: this.def.telegraphMs,
      attackMs: this.def.attackMs,
      recoverMs: this.def.recoverMs,
    };
  }
}
