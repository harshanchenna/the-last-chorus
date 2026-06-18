/**
 * BossBar — a top-of-screen health + phase readout shown only during a boss
 * fight. Diegetic-ish and muted until it matters (asset spec §5).
 */

import Phaser from 'phaser';

export class BossBar {
  private g: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private readonly x = 60;
  private readonly y = 16;
  private readonly w: number;
  private readonly h = 5;

  constructor(scene: Phaser.Scene) {
    this.w = scene.scale.width - 120;
    this.g = scene.add.graphics().setScrollFactor(0).setDepth(9600).setVisible(false);
    this.label = scene.add
      .text(scene.scale.width / 2, this.y - 9, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#e0c07a',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(9600)
      .setVisible(false);
  }

  show(name: string, fraction: number, phase: string): void {
    const f = Phaser.Math.Clamp(fraction, 0, 1);
    this.g.setVisible(true).clear();
    this.g.fillStyle(0x000000, 0.5).fillRect(this.x - 1, this.y - 1, this.w + 2, this.h + 2);
    this.g.fillStyle(0x2a2018, 1).fillRect(this.x, this.y, this.w, this.h);
    // Boss "light" drains warm amber → ember as it dies.
    this.g
      .fillStyle(f > 0.33 ? 0xe0a85a : 0xd8542a, 1)
      .fillRect(this.x, this.y, this.w * f, this.h);
    this.label.setVisible(true).setText(phase ? `${name} — ${phase}` : name);
  }

  hide(): void {
    this.g.setVisible(false);
    this.label.setVisible(false);
  }
}
