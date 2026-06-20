/**
 * Lightweight onboarding UI (MVP demo: tutorial + readability).
 *
 * - `InteractPrompt` — a small floating "E" glyph drawn in world-space above
 *   whatever the player can interact with right now (rest-points, lore, NPCs,
 *   altars). Teaches the verb and makes the world legible to a first-time player.
 * - `HintLine` — a quiet, persistent line near the top for the opening tutorial
 *   beats. Sparse and dismissable by progress, never a wall of text (Pillar 1).
 */

import Phaser from 'phaser';

export class InteractPrompt {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(0, 0, 'E', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#fff2c4',
        backgroundColor: '#05070acc',
        padding: { x: 2, y: 1 },
      })
      .setOrigin(0.5, 1)
      .setDepth(8000)
      .setVisible(false);
  }

  /** Root — world-space, so it rides the WORLD camera (floats above targets). */
  get root(): Phaser.GameObjects.GameObject {
    return this.text;
  }

  /** Show the glyph in world-space, bobbing just above (x, y). */
  showAt(x: number, y: number): void {
    this.text.setPosition(x, y);
    if (!this.text.visible) this.text.setVisible(true);
  }

  hide(): void {
    if (this.text.visible) this.text.setVisible(false);
  }
}

export class HintLine {
  private text: Phaser.GameObjects.Text;
  private current = '';

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(scene.scale.width / 2, 28, '', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#cfd8e2',
        backgroundColor: '#05070aaa',
        padding: { x: 5, y: 3 },
        align: 'center',
      })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(9400)
      .setVisible(false);
  }

  /** Root — screen-space, so it rides the UI camera. */
  get root(): Phaser.GameObjects.GameObject {
    return this.text;
  }

  show(msg: string): void {
    if (msg === this.current) return;
    this.current = msg;
    this.text.setText(msg).setVisible(true);
  }

  hide(): void {
    this.current = '';
    this.text.setVisible(false);
  }
}
