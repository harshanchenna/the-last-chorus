/**
 * Asset manifest — the single source of truth mapping logical IDs to files
 * (seed §8 / asset spec §7).
 *
 * Until a real file exists, an entry's `file` is null and the engine builds a
 * programmatic placeholder at the exact `frame` dimensions. Dropping in real art
 * later = set `file` to the path and rebuild atlas — ZERO gameplay-code changes.
 *
 * The `frame`/`anim`/`stem` names here ARE the contract with the asset spec.
 */

export type AssetKind = 'sprite' | 'tileset' | 'ui' | 'audio';

export interface SpriteAsset {
  kind: 'sprite';
  id: string;
  /** Frame dimensions in source px — must match the asset spec exactly. */
  frame: { w: number; h: number };
  /** Animation strips, keyed by anim id → suggested frame count. */
  anims: Record<string, number>;
  /** Placeholder fill color. */
  color: number;
  /** Real file path once produced; null = use placeholder. */
  file: string | null;
}

export interface AudioAsset {
  kind: 'audio';
  id: string;
  /** Stem ids for layered ambient beds, or ['one_shot'] for SFX. */
  stems: string[];
  file: string | null;
}

export type AssetDef = SpriteAsset | AudioAsset;

/**
 * Sprite assets. Frame sizes mirror the asset spec §3 exactly so produced art
 * drops straight in.
 */
export const SPRITES: Record<string, SpriteAsset> = {
  player: {
    kind: 'sprite',
    id: 'player',
    frame: { w: 32, h: 32 },
    anims: {
      idle: 4,
      walk: 6,
      dash: 3,
      attack_light: 4,
      attack_cast: 5,
      hurt: 2,
      death: 6,
      interact: 3,
    },
    color: 0xfff2c4, // light reads as the brightest element on screen (asset spec §2)
    file: null,
  },
  'enemy.ashling': {
    kind: 'sprite',
    id: 'enemy.ashling',
    frame: { w: 24, h: 24 },
    anims: { idle: 4, walk: 4, telegraph: 3, attack: 4, hurt: 2, death: 5 },
    color: 0xff7a3c,
    file: null,
  },
};

/**
 * Audio assets. Ambient beds are 3 in-sync stems (asset spec §6.1); the
 * AudioDirector mixes them reactively.
 */
export const AUDIO: Record<string, AudioAsset> = {
  'zone.ashchoir.ambient': {
    kind: 'audio',
    id: 'zone.ashchoir.ambient',
    stems: ['base', 'melody', 'tension'],
    file: null,
  },
  'zone.glass_reliquary.ambient': {
    kind: 'audio',
    id: 'zone.glass_reliquary.ambient',
    stems: ['base', 'melody', 'tension'],
    file: null,
  },
  'zone.drowned_hymn.ambient': {
    kind: 'audio',
    id: 'zone.drowned_hymn.ambient',
    stems: ['base', 'melody', 'tension'],
    file: null,
  },
  'music.title': { kind: 'audio', id: 'music.title', stems: ['one_shot'], file: null },
  'music.rest': { kind: 'audio', id: 'music.rest', stems: ['one_shot'], file: null },
};

/** True while every asset is still a placeholder (handy for the debug overlay). */
export function allPlaceholder(): boolean {
  const sprites = Object.values(SPRITES).every((s) => s.file === null);
  const audio = Object.values(AUDIO).every((a) => a.file === null);
  return sprites && audio;
}
