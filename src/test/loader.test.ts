import { describe, it, expect } from 'vitest';
import { spritesToLoad, audioToLoad } from '../assets/loader';
import type { SpriteAsset, AudioAsset } from '../assets/manifest';
import { SPRITES } from '../assets/manifest';

describe('asset loader planning (the placeholder → real swap)', () => {
  it('ignores placeholder sprites (file: null) and loads only real files', () => {
    const sprites: Record<string, SpriteAsset> = {
      player: {
        kind: 'sprite',
        id: 'player',
        frame: { w: 32, h: 32 },
        anims: { idle: 4 },
        color: 0xffffff,
        file: null, // still a placeholder
      },
      'enemy.ashling': {
        kind: 'sprite',
        id: 'enemy.ashling',
        frame: { w: 24, h: 24 },
        anims: { walk: 4 },
        color: 0xff7a3c,
        file: 'assets/enemy_ashling.png', // a real file dropped in
      },
    };
    const load = spritesToLoad(sprites);
    expect(load).toHaveLength(1);
    expect(load[0]).toEqual({
      key: 'enemy.ashling',
      file: 'assets/enemy_ashling.png',
      frameWidth: 24,
      frameHeight: 24,
    });
  });

  it('derives per-stem files for a layered ambient bed by suffix', () => {
    const audio: Record<string, AudioAsset> = {
      'zone.ashchoir.ambient': {
        kind: 'audio',
        id: 'zone.ashchoir.ambient',
        stems: ['base', 'melody', 'tension'],
        file: 'assets/zone_ashchoir_ambient.ogg',
      },
    };
    const [bed] = audioToLoad(audio);
    expect(bed!.files).toEqual({
      base: 'assets/zone_ashchoir_ambient_base.ogg',
      melody: 'assets/zone_ashchoir_ambient_melody.ogg',
      tension: 'assets/zone_ashchoir_ambient_tension.ogg',
    });
  });

  it('treats a one_shot track as a single file', () => {
    const audio: Record<string, AudioAsset> = {
      'music.title': {
        kind: 'audio',
        id: 'music.title',
        stems: ['one_shot'],
        file: 'assets/music_title.ogg',
      },
    };
    const [track] = audioToLoad(audio);
    expect(track!.files).toEqual({ one_shot: 'assets/music_title.ogg' });
  });

  it('ships the real player sprite end-to-end (the placeholder→real proof)', () => {
    // The player is the first real asset shipped (public/assets/player.png).
    expect(SPRITES.player!.file).toBe('assets/player.png');
    const planned = spritesToLoad();
    const player = planned.find((s) => s.key === 'player');
    expect(player).toBeDefined();
    expect(player!.file).toBe('assets/player.png');
    expect(player!.frameWidth).toBe(32);
    expect(player!.frameHeight).toBe(32);
  });
});
