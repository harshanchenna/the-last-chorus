/**
 * DialoguePanel — a minimal, muted reveal panel for lore + dialogue
 * (asset spec ui.dialogue_box). Atmosphere over exposition: short fragments, a
 * quiet box, dismissed with the same Interact key. No walls of text (Pillar 1).
 */

import Phaser from 'phaser';
import { UI } from '../core/config';

export class DialoguePanel {
  private container: Phaser.GameObjects.Container;
  private titleText: Phaser.GameObjects.Text;
  private bodyText: Phaser.GameObjects.Text;
  private open = false;

  constructor(scene: Phaser.Scene) {
    const w = UI.width;
    const h = UI.height;
    const panelW = w - 32;
    const panelH = 70;
    const x = 16;
    const y = h - panelH - 12;

    const bg = scene.add.graphics();
    bg.fillStyle(0x05070a, 0.9).fillRect(0, 0, panelW, panelH);
    bg.lineStyle(1, 0x33424f, 1).strokeRect(0.5, 0.5, panelW - 1, panelH - 1);
    // A thin "light" accent line at the top edge.
    bg.fillStyle(0xcfa84a, 0.8).fillRect(0, 0, panelW, 1);

    this.titleText = scene.add.text(8, 6, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#cfa84a',
    });
    this.bodyText = scene.add.text(8, 20, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#dfeaf2',
      wordWrap: { width: panelW - 16 },
      lineSpacing: 3,
    });
    const hint = scene.add
      .text(panelW - 8, panelH - 4, 'E to close', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#5a6a78',
      })
      .setOrigin(1, 1);

    this.container = scene.add
      .container(x, y, [bg, this.titleText, this.bodyText, hint])
      .setScrollFactor(0)
      .setDepth(9800)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** Root container — so the scene can route the panel to the UI camera. */
  get root(): Phaser.GameObjects.GameObject {
    return this.container;
  }

  show(title: string, body: string): void {
    this.titleText.setText(title);
    this.bodyText.setText(body);
    this.container.setVisible(true);
    this.open = true;
  }

  hide(): void {
    this.container.setVisible(false);
    this.open = false;
  }
}
