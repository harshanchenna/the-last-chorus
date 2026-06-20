/**
 * HUD — minimal, diegetic (asset spec §5). The health readout is a **light meter**:
 * it reads as light filling/draining, never a red bar. Light is the player's power,
 * so losing it dims the world's one source of color.
 */

import Phaser from 'phaser';

export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private slotText: Phaser.GameObjects.Text;
  private readonly x = 8;
  private readonly y: number;
  private readonly w = 64;
  private readonly h = 6;

  constructor(scene: Phaser.Scene) {
    // Anchor near the bottom-left, above the screen edge.
    this.y = scene.scale.height - 14;
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(9500);
    // Equipped-Refrain slot label, just above the light meter.
    this.slotText = scene.add
      .text(this.x, this.y - 12, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#9ad8ff',
      })
      .setScrollFactor(0)
      .setDepth(9500);
  }

  /** Display objects — so the scene can route the HUD to the UI camera. */
  get roots(): Phaser.GameObjects.GameObject[] {
    return [this.g, this.slotText];
  }

  /**
   * @param fraction light remaining, 0..1
   * @param refrainCount number of Refrains collected
   * @param equippedName name of the equipped Refrain, or null
   */
  update(fraction: number, refrainCount = 0, equippedName: string | null = null): void {
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

    // Refrain slot: a small frame + equipped name (asset spec ui.refrain_slot).
    const slotY = this.y - 12;
    this.g.lineStyle(1, 0x33424f, 1).strokeRect(this.x, slotY, 7, 7);
    if (refrainCount > 0) this.g.fillStyle(0xcfa84a, 1).fillRect(this.x + 2, slotY + 2, 3, 3);
    this.slotText.setPosition(this.x + 10, slotY);
    this.slotText.setText(equippedName ? `${equippedName} (${refrainCount})` : '');
  }
}
