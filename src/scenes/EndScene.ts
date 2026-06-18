/**
 * EndScene — the demo's closing beat (MVP demo: a real ending + a teaser).
 *
 * Reached once every god's altar in the demo has been answered. It reflects the
 * choices back to the player (bittersweet, never good/evil — Pillar 5), then teases
 * the bigger picture: the world is larger than this slice, and still unraveling.
 * Returns to the title; the save is kept so Continue still works.
 */

import Phaser from 'phaser';
import { SaveSystem } from '../core/SaveSystem';
import { GAME_TITLE } from '../core/config';

export class EndScene extends Phaser.Scene {
  constructor() {
    super('End');
  }

  create(): void {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#05060a');
    this.cameras.main.fadeIn(900, 5, 6, 10);

    const save = new SaveSystem(window.localStorage).load();
    const choices = save ? Object.values(save.choices) : [];
    const relit = choices.filter((c) => c === 'relight').length;
    const rested = choices.filter((c) => c === 'rest').length;

    const reflection =
      relit > 0 && rested > 0
        ? 'One god you woke; one you let sleep. You are learning the weight of it — that there is no clean way to carry a dying song.'
        : rested > 0
          ? 'You let the gods rest. The quiet you leave behind is gentler than the one you found. Perhaps that is the kindest thing left to give.'
          : 'You gave your light to the sleeping gods. For a few breaths the Chorus swelled — then thinned again. Warmth is not the same as song.';

    this.add
      .text(width / 2, height * 0.26, 'The light goes on, elsewhere', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#cfa84a',
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.44, reflection, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#dfeaf2',
        align: 'center',
        wordWrap: { width: width - 140 },
        lineSpacing: 4,
      })
      .setOrigin(0.5);

    // The teaser — the world is larger than this slice, and still failing.
    this.add
      .text(
        width / 2,
        height * 0.66,
        'Far to the south, the Drowned Hymn still keeps time for a god that no longer breathes.\nThe Chorus is not done failing. Nor are you done choosing.',
        {
          fontFamily: 'monospace',
          fontSize: '8px',
          color: '#6f7d8c',
          align: 'center',
          wordWrap: { width: width - 120 },
          lineSpacing: 4,
        },
      )
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.84, `— ${GAME_TITLE} · End of Demo —`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#8a95a2',
      })
      .setOrigin(0.5);

    const prompt = this.add
      .text(width / 2, height - 20, 'Enter / E — return to the title', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#54606e',
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.3, yoyo: true, repeat: -1, duration: 1100 });

    const back = (): void => {
      this.scene.start('Title');
    };
    const kb = this.input.keyboard;
    if (kb) {
      kb.once('keydown-ENTER', back);
      kb.once('keydown-SPACE', back);
      kb.once('keydown-E', back);
    }

    if (import.meta.env.DEV) {
      (window as unknown as { __lastChorusEnd?: unknown }).__lastChorusEnd = {
        relit,
        rested,
        returnToTitle: back,
      };
    }
  }
}
