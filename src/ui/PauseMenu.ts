/**
 * PauseMenu — a quiet inventory/journal overlay (asset spec §5: minimal, muted).
 *
 * Surfaces what the player has gathered — Refrains, lore fragments, and the
 * choices they've made at the gods' altars. Reading the journal is itself part of
 * the atmosphere (Pillar 1), so it stays sparse and reverent, not stat-heavy.
 */

import Phaser from 'phaser';
import type { SaveData } from '../core/SaveSystem';
import { REFRAINS } from '../data/refrains';
import { LORE } from '../data/lore';

export class PauseMenu {
  private container: Phaser.GameObjects.Container;
  private body: Phaser.GameObjects.Text;
  private open = false;

  constructor(scene: Phaser.Scene) {
    const w = scene.scale.width;
    const h = scene.scale.height;

    const bg = scene.add.graphics();
    bg.fillStyle(0x05070a, 0.92).fillRect(0, 0, w, h);
    bg.lineStyle(1, 0x33424f, 1).strokeRect(8.5, 8.5, w - 17, h - 17);
    bg.fillStyle(0xcfa84a, 0.8).fillRect(8, 8, w - 16, 1);

    const title = scene.add.text(16, 14, 'The Last Chorus — Journal', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#cfa84a',
    });
    this.body = scene.add.text(16, 30, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#dfeaf2',
      lineSpacing: 3,
      wordWrap: { width: w - 32 },
    });
    const hint = scene.add
      .text(w - 16, h - 12, 'P / Esc to resume', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#5a6a78',
      })
      .setOrigin(1, 1);

    this.container = scene.add
      .container(0, 0, [bg, title, this.body, hint])
      .setScrollFactor(0)
      .setDepth(11000)
      .setVisible(false);
  }

  get isOpen(): boolean {
    return this.open;
  }

  /** Root container — so the scene can route the journal to the UI camera. */
  get root(): Phaser.GameObjects.GameObject {
    return this.container;
  }

  toggle(save: SaveData): void {
    if (this.open) this.hide();
    else this.show(save);
  }

  show(save: SaveData): void {
    this.body.setText(this.compose(save));
    this.container.setVisible(true);
    this.open = true;
  }

  hide(): void {
    this.container.setVisible(false);
    this.open = false;
  }

  private compose(save: SaveData): string {
    const lines: string[] = [];

    lines.push('REFRAINS');
    if (save.refrains.length === 0) lines.push('  (none yet — the song is still scattered)');
    for (const id of save.refrains) {
      const r = REFRAINS[id];
      lines.push(r ? `  ${r.name}` : `  ${id}`);
      if (r) lines.push(`    "${r.description}"`);
    }

    lines.push('');
    lines.push('LORE GATHERED');
    if (save.lore.length === 0) lines.push('  (nothing yet — read the world)');
    for (const id of save.lore) {
      const l = LORE[id];
      lines.push(l ? `  ${l.title}` : `  ${id}`);
    }

    const choiceIds = Object.keys(save.choices);
    if (choiceIds.length > 0) {
      lines.push('');
      lines.push('CHOICES MADE');
      for (const id of choiceIds) {
        const verb = save.choices[id] === 'relight' ? 'relit' : 'let rest';
        lines.push(`  ${id}: ${verb}`);
      }
    }

    return lines.join('\n');
  }
}
