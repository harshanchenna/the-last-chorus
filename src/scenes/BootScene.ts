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
} from '../assets/placeholders';
import { STARTING_ZONE } from '../data/zones';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generatePlaceholders(this);
    generateWorldPlaceholders(this);
    generateTileset(this);
    this.scene.start('Game', { zoneId: STARTING_ZONE });
  }
}
