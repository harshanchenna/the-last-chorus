/**
 * Loader planning — pure helpers that decide what real files to load from the
 * manifest (seed §8). An asset with a non-null `file` is loaded as a real
 * spritesheet/audio; everything else falls back to a programmatic placeholder.
 *
 * Keeping the decision pure means the placeholder→real swap is testable: flipping
 * a manifest `file` from null to a path moves an asset from "placeholder" to
 * "load list" with NO gameplay-code change — exactly the contract we promise.
 */

import { SPRITES, AUDIO, type SpriteAsset, type AudioAsset } from './manifest';

export interface SpriteLoad {
  key: string;
  file: string;
  frameWidth: number;
  frameHeight: number;
}

export interface AudioLoad {
  key: string;
  /** Stem files keyed by stem id (ambient beds load one file per stem). */
  files: Record<string, string>;
}

/** Real sprite files to hand to Phaser's loader. */
export function spritesToLoad(sprites: Record<string, SpriteAsset> = SPRITES): SpriteLoad[] {
  return Object.values(sprites)
    .filter((s): s is SpriteAsset & { file: string } => s.file !== null)
    .map((s) => ({
      key: s.id,
      file: s.file,
      frameWidth: s.frame.w,
      frameHeight: s.frame.h,
    }));
}

/**
 * Real audio to load. Ambient beds carry one file per stem; the manifest stores a
 * single base path and the stems are derived by suffix (asset spec §7 naming).
 */
export function audioToLoad(audio: Record<string, AudioAsset> = AUDIO): AudioLoad[] {
  return Object.values(audio)
    .filter((a): a is AudioAsset & { file: string } => a.file !== null)
    .map((a) => {
      const files: Record<string, string> = {};
      const dot = a.file.lastIndexOf('.');
      const base = dot >= 0 ? a.file.slice(0, dot) : a.file;
      const ext = dot >= 0 ? a.file.slice(dot) : '';
      for (const stem of a.stems) {
        // `one_shot` is a single track; layered beds get a per-stem suffix.
        files[stem] = stem === 'one_shot' ? a.file : `${base}_${stem}${ext}`;
      }
      return { key: a.id, files };
    });
}

/** True if nothing needs the network loader (pure placeholder build). */
export function loadListEmpty(): boolean {
  return spritesToLoad().length === 0 && audioToLoad().length === 0;
}
