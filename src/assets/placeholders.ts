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
export const ALTAR_KEY = 'placeholder.altar';

export function generateWorldPlaceholders(scene: Phaser.Scene): void {
  makeBlock(scene, REST_POINT_KEY, 16, 16, 0x7fe3ff);
  makeBlock(scene, LORE_KEY, 16, 16, 0xc9a24a);
  makeBlock(scene, GATE_KEY, 16, 16, 0x6a4f8a); // silence-void barrier (ability-gated)
  makeBlock(scene, EXIT_KEY, 16, 16, 0x3c6f4a); // zone transition trigger
  makeBlock(scene, REFRAIN_KEY, 16, 16, 0xfff2c4); // a fragment of the song (light)
  makeBlock(scene, ALTAR_KEY, 16, 16, 0xb89cf0); // a sleeping god's altar (relight/rest)
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

/** Soft radial glow (white, tint per use) — additive bloom for light sources. */
export const GLOW_KEY = 'fx.glow';
/** Screen-space darkening at the edges — instant atmosphere (Dead Cells aura). */
export const VIGNETTE_KEY = 'fx.vignette';

export function generateGlow(scene: Phaser.Scene): void {
  if (scene.textures.exists(GLOW_KEY)) return;
  const s = 128;
  const tex = scene.textures.createCanvas(GLOW_KEY, s, s);
  if (!tex) return;
  const c = tex.getContext();
  const g = c.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.95)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, s, s);
  tex.refresh();
}

export function generateVignette(scene: Phaser.Scene, w: number, h: number): void {
  if (scene.textures.exists(VIGNETTE_KEY)) return;
  const tex = scene.textures.createCanvas(VIGNETTE_KEY, w, h);
  if (!tex) return;
  const c = tex.getContext();
  const g = c.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.32,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.62,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(3,4,8,0.72)');
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  tex.refresh();
}
