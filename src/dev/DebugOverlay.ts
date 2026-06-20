/**
 * DebugOverlay — always-available FPS + input-latency + state readout (seed §5).
 *
 * Rendered as a fixed Phaser text object so it rides the camera. Input latency is
 * measured as the time between a keydown event and the next game-step that
 * consumed it — a real, honest number we tune game-feel against (Pillar 3).
 */

import Phaser from 'phaser';

export class DebugOverlay {
  private text: Phaser.GameObjects.Text;
  private lastKeyDownAt = 0;
  private latencyMs = 0;
  private visible = true;
  private lines: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(4, 4, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#9ad8ff',
        backgroundColor: '#00000066',
      })
      .setScrollFactor(0)
      .setDepth(10000);

    // Capture the moment a key goes down to measure end-to-end input latency.
    scene.input.keyboard?.on('keydown', () => {
      this.lastKeyDownAt = performance.now();
    });
  }

  /** Root text — so the scene can route the overlay to the UI camera. */
  get root(): Phaser.GameObjects.GameObject {
    return this.text;
  }

  /** Call at the start of the scene's update with the consumed-input flag. */
  markInputConsumed(hadInput: boolean): void {
    if (hadInput && this.lastKeyDownAt > 0) {
      this.latencyMs = performance.now() - this.lastKeyDownAt;
      this.lastKeyDownAt = 0;
    }
  }

  setExtraLines(lines: string[]): void {
    this.lines = lines;
  }

  update(game: Phaser.Game): void {
    if (!this.visible) {
      this.text.setText('');
      return;
    }
    const fps = game.loop.actualFps.toFixed(0);
    const base = [`FPS ${fps}`, `input-latency ${this.latencyMs.toFixed(1)}ms`, ...this.lines];
    this.text.setText(base.join('\n'));
  }

  toggle(): void {
    this.visible = !this.visible;
  }
}
