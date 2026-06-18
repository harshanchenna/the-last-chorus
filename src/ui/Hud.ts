/**
 * HUD — minimal, diegetic (asset spec §5). The health readout is a **light meter**:
 * it reads as light filling/draining, never a red bar. Light is the player's power,
 * so losing it dims the world's one source of color.
 */

import Phaser from 'phaser';

export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private readonly x = 8;
  private readonly y: number;
  private readonly w = 64;
  private readonly h = 6;

  constructor(scene: Phaser.Scene) {
    // Anchor near the bottom-left, above the screen edge.
    this.y = scene.scale.height - 14;
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(9500);
  }

  /** @param fraction light remaining, 0..1 */
  update(fraction: number): void {
    const f = Phaser.Math.Clamp(fraction, 0, 1);
    this.g.clear();
    // Track (the drained dark).
    this.g.fillStyle(0x10141a, 0.85).fillRect(this.x - 1, this.y - 1, this.w + 2, this.h + 2);
    this.g.fillStyle(0x05070a, 1).fillRect(this.x, this.y, this.w, this.h);
    // Light fill — brightest element on screen; dims toward ember as it runs low.
    const color = f > 0.33 ? 0xfff2c4 : 0xffae5c;
    this.g.fillStyle(color, 1).fillRect(this.x, this.y, this.w * f, this.h);
    // A faint glow cap at the leading edge.
    if (f > 0) {
      this.g.fillStyle(0xffffff, 0.7).fillRect(this.x + this.w * f - 1, this.y, 1, this.h);
    }
  }
}
