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
  generateMote,
} from '../assets/placeholders';
import { ZONES, STARTING_ZONE } from '../data/zones';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generatePlaceholders(this);
    generateWorldPlaceholders(this);
    generateMote(this);
    // One tinted tileset per region so each dead god's domain reads distinctly.
    for (const zone of Object.values(ZONES)) {
      generateTileset(this, zone.id, zone.tilePalette.ground, zone.tilePalette.wall);
    }
    this.scene.start('Game', { zoneId: STARTING_ZONE });
  }
}
