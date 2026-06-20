/**
 * Unraveling — the signature "a god is dying" overlay (asset spec §4).
 *
 * Where a god's voice falls silent the land comes apart into ash / glass / tide.
 * This is a camera-fixed particle drift that gives each region its decaying
 * atmosphere without touching gameplay. Purely cosmetic; safe to omit.
 */

import Phaser from 'phaser';
import { MOTE_KEY } from '../assets/placeholders';
import { UI } from '../core/config';

export type UnravelingType = 'ash' | 'glass' | 'tide' | null;

export class Unraveling {
  private emitter?: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene, type: UnravelingType) {
    if (!type) return;
    // The unraveling drift is a UI-space overlay (drawn by the origin-zoomed UI
    // camera), so it spans the UI logical space and scales up with the rest of the UI.
    const w = UI.width;
    const h = UI.height;
    const cfg = CONFIGS[type](w, h);
    this.emitter = scene.add.particles(0, 0, MOTE_KEY, cfg).setScrollFactor(0).setDepth(9000);
  }

  /** Root emitter (screen overlay) — routed to the UI camera; may be undefined. */
  get root(): Phaser.GameObjects.GameObject | undefined {
    return this.emitter;
  }

  destroy(): void {
    this.emitter?.destroy();
  }
}

type ConfigFn = (w: number, h: number) => Phaser.Types.GameObjects.Particles.ParticleEmitterConfig;

const CONFIGS: Record<'ash' | 'glass' | 'tide', ConfigFn> = {
  // Embers that hum: warm motes rising and guttering out.
  ash: (w, h) => ({
    x: { min: 0, max: w },
    y: h + 4,
    lifespan: 4200,
    speedY: { min: -22, max: -8 },
    speedX: { min: -8, max: 8 },
    scale: { start: 1, end: 0 },
    alpha: { start: 0.55, end: 0 },
    tint: [0xff7a3c, 0xffae5c, 0xcfa84a],
    frequency: 150,
    blendMode: 'ADD',
  }),
  // Singing glass: cold glints sifting down.
  glass: (w) => ({
    x: { min: 0, max: w },
    y: -4,
    lifespan: 5200,
    speedY: { min: 8, max: 20 },
    speedX: { min: -4, max: 4 },
    scale: { start: 1, end: 0.4 },
    alpha: { start: 0.5, end: 0 },
    tint: [0x9fd8e6, 0xffffff, 0xbfe6ff],
    frequency: 220,
    blendMode: 'ADD',
  }),
  // Drowned hymn: slow silver drift on the tide.
  tide: (w, h) => ({
    x: { min: 0, max: w },
    y: { min: 0, max: h },
    lifespan: 6000,
    speedX: { min: -14, max: 14 },
    speedY: { min: -4, max: 4 },
    scale: { start: 0.8, end: 0 },
    alpha: { start: 0.32, end: 0 },
    tint: [0x4fb6a0, 0x9fd8e6, 0xc9d8e6],
    frequency: 280,
    blendMode: 'ADD',
  }),
};
