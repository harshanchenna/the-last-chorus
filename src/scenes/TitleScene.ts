/**
 * TitleScene — the demo's front door (seed §0.7, §7 polish).
 *
 * A quiet, reverent main menu: the title, a tagline, and New Game / Continue.
 * Boot flow is Boot → Title → Game. Kept deliberately sparse (Pillar 5: melancholic,
 * never spectacle). Real title music drops in later via `music.title` in the manifest.
 */

import Phaser from 'phaser';
import { GAME_TITLE, UI } from '../core/config';
import { STARTING_ZONE } from '../data/zones';
import { SaveSystem } from '../core/SaveSystem';

interface MenuItem {
  label: string;
  action: () => void;
}

export class TitleScene extends Phaser.Scene {
  private saves!: SaveSystem;
  private items: MenuItem[] = [];
  private texts: Phaser.GameObjects.Text[] = [];
  private selected = 0;

  constructor() {
    super('Title');
  }

  create(): void {
    // Author in the UI logical space; an origin-anchored camera zoom scales it up to
    // the 1080p canvas so the menu looks identical at any render resolution.
    const { width, height } = UI;
    this.cameras.main.setOrigin(0, 0).setZoom(UI.scale);
    this.cameras.main.setBackgroundColor('#05060a');
    this.saves = new SaveSystem(window.localStorage);

    // Title + tagline.
    this.add
      .text(width / 2, height * 0.3, GAME_TITLE, {
        fontFamily: 'monospace',
        fontSize: '28px',
        color: '#cfa84a',
      })
      .setOrigin(0.5);
    this.add
      .text(width / 2, height * 0.3 + 26, 'the world is a dying song', {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#6f7d8c',
      })
      .setOrigin(0.5)
      .setAlpha(0.85);

    // A faint drifting mote so the title breathes (the held note, not yet silent).
    this.spawnTitleMotes();

    // Menu — Continue first only when a save exists.
    this.items = [];
    if (this.saves.has()) {
      this.items.push({ label: 'Continue', action: () => this.continueGame() });
    }
    this.items.push({ label: 'New Game', action: () => this.newGame() });

    this.texts = this.items.map((it, i) =>
      this.add
        .text(width / 2, height * 0.58 + i * 16, it.label, {
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#e8f4ff',
        })
        .setOrigin(0.5),
    );
    this.selected = 0;
    this.refreshSelection();

    // Controls hint.
    this.add
      .text(
        width / 2,
        height - 22,
        '↑/↓ select   ·   Enter / E confirm\nWASD move · Space dash · J blade · K sung-light · P journal',
        {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: '#54606e',
          align: 'center',
        },
      )
      .setOrigin(0.5);

    const kb = this.input.keyboard;
    if (kb) {
      kb.on('keydown-UP', () => this.move(-1));
      kb.on('keydown-W', () => this.move(-1));
      kb.on('keydown-DOWN', () => this.move(1));
      kb.on('keydown-S', () => this.move(1));
      kb.on('keydown-ENTER', () => this.confirm());
      kb.on('keydown-SPACE', () => this.confirm());
      kb.on('keydown-E', () => this.confirm());
    }

    // DEV-only hook for the playtest harness to drive the menu deterministically.
    if (import.meta.env.DEV) {
      (window as unknown as { __lastChorusTitle?: unknown }).__lastChorusTitle = {
        newGame: () => this.newGame(),
        continueGame: () => this.continueGame(),
        hasSave: this.saves.has(),
      };
    }
  }

  private move(dir: number): void {
    this.selected = Phaser.Math.Wrap(this.selected + dir, 0, this.items.length);
    this.refreshSelection();
  }

  private refreshSelection(): void {
    this.texts.forEach((t, i) => {
      const on = i === this.selected;
      t.setColor(on ? '#fff2c4' : '#e8f4ff');
      t.setText(`${on ? '› ' : '  '}${this.items[i]!.label}${on ? ' ‹' : '  '}`);
    });
  }

  private confirm(): void {
    this.items[this.selected]?.action();
  }

  private newGame(): void {
    this.saves.clear();
    this.scene.start('Game', { zoneId: STARTING_ZONE, intro: true });
  }

  private continueGame(): void {
    const save = this.saves.load();
    this.scene.start('Game', { zoneId: save?.zoneId ?? STARTING_ZONE });
  }

  private spawnTitleMotes(): void {
    const { width, height } = UI;
    for (let i = 0; i < 14; i++) {
      const x = ((i * 53) % width) + 8;
      const y = height - ((i * 37) % height);
      const mote = this.add.rectangle(x, y, 2, 2, 0xfff2c4, 0.5).setDepth(1);
      this.tweens.add({
        targets: mote,
        y: y - 40 - (i % 5) * 10,
        alpha: 0,
        duration: 4000 + (i % 6) * 600,
        repeat: -1,
        delay: i * 220,
        ease: 'Sine.inOut',
      });
    }
  }
}
