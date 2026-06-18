/**
 * Programmatic placeholder textures (seed §8).
 *
 * Until real art exists, every sprite is a distinct flat-color shape sized to its
 * FINAL frame dimensions and color-coded by type. Because they match the manifest
 * frame sizes, swapping in real art is a manifest edit, not a code change.
 *
 * This is the only asset file that touches Phaser; it runs once in BootScene.
 */

import Phaser from 'phaser';
import { SPRITES } from './manifest';

/** Build a single flat-color texture with a subtle border so facing is legible. */
function makeBlock(scene: Phaser.Scene, key: string, w: number, h: number, color: number): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(color, 1);
  g.fillRect(0, 0, w, h);
  // Darker rim — reads as a silhouette edge at low res (asset spec §0).
  g.lineStyle(1, 0x000000, 0.5);
  g.strokeRect(0, 0, w, h);
  // A facing pip near the top so direction is parseable even as a placeholder.
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(Math.floor(w / 2) - 1, 2, 2, 2);
  g.generateTexture(key, w, h);
  g.destroy();
}

/** Generate placeholder textures for every sprite asset still lacking a file. */
export function generatePlaceholders(scene: Phaser.Scene): void {
  for (const def of Object.values(SPRITES)) {
    if (def.file !== null) continue; // real art present — loader handles it.
    makeBlock(scene, def.id, def.frame.w, def.frame.h, def.color);
  }
}

/** Key used for a generic interactable / rest-point glyph placeholder. */
export const REST_POINT_KEY = 'placeholder.rest_point';
export const LORE_KEY = 'placeholder.lore';
export const GATE_KEY = 'placeholder.gate';
export const EXIT_KEY = 'placeholder.exit';
export const REFRAIN_KEY = 'placeholder.refrain';

export function generateWorldPlaceholders(scene: Phaser.Scene): void {
  makeBlock(scene, REST_POINT_KEY, 16, 16, 0x7fe3ff);
  makeBlock(scene, LORE_KEY, 16, 16, 0xc9a24a);
  makeBlock(scene, GATE_KEY, 16, 16, 0x6a4f8a); // silence-void barrier (ability-gated)
  makeBlock(scene, EXIT_KEY, 16, 16, 0x3c6f4a); // zone transition trigger
  makeBlock(scene, REFRAIN_KEY, 16, 16, 0xfff2c4); // a fragment of the song (light)
}

/** Tileset placeholder: index 0 = ground, 1 = wall. Drop-in for a real tilesheet. */
export const TILESET_KEY = 'placeholder.tiles';

export function generateTileset(scene: Phaser.Scene): void {
  if (scene.textures.exists(TILESET_KEY)) return;
  const t = 16;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Tile 0 — ground: dark stone with a faint checker so motion reads.
  g.fillStyle(0x161b22, 1).fillRect(0, 0, t, t);
  g.fillStyle(0x1b212b, 1).fillRect(0, 0, t / 2, t / 2);
  g.fillStyle(0x1b212b, 1).fillRect(t / 2, t / 2, t / 2, t / 2);
  // Tile 1 — wall: lighter stone block with a beveled edge.
  g.fillStyle(0x3a434f, 1).fillRect(t, 0, t, t);
  g.fillStyle(0x4a5562, 1).fillRect(t, 0, t, 2);
  g.fillStyle(0x262d36, 1).fillRect(t, t - 2, t, 2);
  g.generateTexture(TILESET_KEY, t * 2, t);
  g.destroy();
}
