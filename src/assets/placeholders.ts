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

/** Per-zone tileset key: index 0 = ground, 1 = wall. Drop-in for a real tilesheet. */
export function tilesetKey(zoneId: string): string {
  return `placeholder.tiles.${zoneId}`;
}

/** A small drifting particle texture for the "unraveling" overlay. */
export const MOTE_KEY = 'placeholder.mote';

function lighten(color: number, amt: number): number {
  return Phaser.Display.Color.IntegerToColor(color).lighten(amt).color;
}
function darken(color: number, amt: number): number {
  return Phaser.Display.Color.IntegerToColor(color).darken(amt).color;
}

/** Generate a 2-tile tileset tinted to a region's palette (asset spec §2). */
export function generateTileset(
  scene: Phaser.Scene,
  zoneId: string,
  ground: number,
  wall: number,
): void {
  const key = tilesetKey(zoneId);
  if (scene.textures.exists(key)) return;
  const t = 16;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Tile 0 — ground: region color with a faint checker so motion reads.
  g.fillStyle(ground, 1).fillRect(0, 0, t, t);
  g.fillStyle(lighten(ground, 6), 1).fillRect(0, 0, t / 2, t / 2);
  g.fillStyle(lighten(ground, 6), 1).fillRect(t / 2, t / 2, t / 2, t / 2);
  // Tile 1 — wall: region color block with a beveled edge.
  g.fillStyle(wall, 1).fillRect(t, 0, t, t);
  g.fillStyle(lighten(wall, 12), 1).fillRect(t, 0, t, 2);
  g.fillStyle(darken(wall, 25), 1).fillRect(t, t - 2, t, 2);
  g.generateTexture(key, t * 2, t);
  g.destroy();
}

export function generateMote(scene: Phaser.Scene): void {
  if (scene.textures.exists(MOTE_KEY)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffffff, 1).fillRect(0, 0, 2, 2);
  g.generateTexture(MOTE_KEY, 2, 2);
  g.destroy();
}
