/**
 * BootScene — generate placeholder textures, then hand off to GameScene.
 *
 * Real-asset loading will also live here later (loader reads manifest entries
 * whose `file` is non-null). For M0 everything is a programmatic placeholder.
 */

import Phaser from 'phaser';
import {
  generatePlaceholders,
  generateWorldPlaceholders,
  generateTileset,
  generateFloorTexture,
  floorKey,
  wallTexKey,
  generateMote,
  generateGlow,
  generateVignette,
} from '../assets/placeholders';
import { ZONES } from '../data/zones';
import { TILES } from '../assets/manifest';
import { RENDER } from '../core/config';
import { spritesToLoad, audioToLoad } from '../assets/loader';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  /**
   * Load any REAL assets the manifest points at (entries with a non-null `file`).
   * Anything still null is generated as a placeholder in create(). This is the
   * drop-in path: set a manifest `file` and the asset loads here — no scene change.
   */
  preload(): void {
    for (const s of spritesToLoad()) {
      this.load.spritesheet(s.key, s.file, {
        frameWidth: s.frameWidth,
        frameHeight: s.frameHeight,
      });
    }
    for (const a of audioToLoad()) {
      for (const [stem, file] of Object.entries(a.files)) {
        // Layered beds register one key per stem: `<id>.<stem>`.
        this.load.audio(stem === 'one_shot' ? a.key : `${a.key}.${stem}`, file);
      }
    }
    // Real tile art (floor + wall) where a manifest path exists; null stays a
    // programmatic fallback. Loaded under the keys generateTileset/floor expect.
    for (const tile of Object.values(TILES)) {
      if (tile.floor) this.load.image(floorKey(tile.zoneId), tile.floor);
      if (tile.wall) this.load.image(wallTexKey(tile.zoneId), tile.wall);
    }
  }

  create(): void {
    generatePlaceholders(this);
    generateWorldPlaceholders(this);
    generateMote(this);
    generateGlow(this);
    generateVignette(this, RENDER.width, RENDER.height);
    // One floor texture + tinted tileset per region so each dead god's domain reads
    // distinctly. Floor first (the TileSprite ground plane), then the wall sheet
    // (which composes real wall art over a transparent ground cell when present).
    for (const zone of Object.values(ZONES)) {
      generateFloorTexture(this, zone.id, zone.tilePalette.ground);
      generateTileset(this, zone.id, zone.tilePalette.ground, zone.tilePalette.wall);
    }
    this.scene.start('Title');
  }
}
