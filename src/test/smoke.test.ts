/**
 * Headless boot-contract smoke test (seed §4/§5).
 *
 * Proves the render contract + content layer are coherent WITHOUT booting WebGL
 * (which is flaky under jsdom and proves little). The *real* boot proof is
 * `npm run build` (tsc strict + a full Vite/Phaser bundle) and `npm run dev`.
 * If this is green AND the build passes, a stranger can clone and play.
 *
 * Determinism-friendly: pure data assertions only.
 */
import { describe, it, expect } from 'vitest';
import { RENDER, GAME_TITLE, SAVE_VERSION, MOVEMENT } from '../core/config';
import { ZONES, STARTING_ZONE, getZone } from '../data/zones';
import { SPRITES, AUDIO, allPlaceholder } from '../assets/manifest';
import { ENEMIES } from '../data/enemies';

describe('render contract', () => {
  it('matches the asset spec internal resolution (480×270, 16px tiles)', () => {
    expect(RENDER.width).toBe(480);
    expect(RENDER.height).toBe(270);
    expect(RENDER.tileSize).toBe(16);
  });

  it('has a configured game title and a versioned save', () => {
    expect(GAME_TITLE).toBe('The Last Chorus');
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(1);
  });

  it('dash is faster than walk and grants i-frames within its duration', () => {
    expect(MOVEMENT.dashSpeed).toBeGreaterThan(MOVEMENT.walkSpeed);
    expect(MOVEMENT.dashIFramesMs).toBeLessThanOrEqual(MOVEMENT.dashDurationMs);
  });
});

describe('content integrity', () => {
  it('starting zone exists and has a rest-point', () => {
    expect(ZONES[STARTING_ZONE]).toBeDefined();
    expect(getZone(STARTING_ZONE).restPoints.length).toBeGreaterThan(0);
  });

  it('every zone has a default spawn within bounds', () => {
    for (const z of Object.values(ZONES)) {
      expect(z.defaultSpawn.x).toBeGreaterThanOrEqual(0);
      expect(z.defaultSpawn.x).toBeLessThanOrEqual(z.bounds.width);
      expect(z.defaultSpawn.y).toBeGreaterThanOrEqual(0);
      expect(z.defaultSpawn.y).toBeLessThanOrEqual(z.bounds.height);
    }
  });

  it('manifest frame sizes match the asset spec contract', () => {
    expect(SPRITES.player!.frame).toEqual({ w: 32, h: 32 });
    expect(SPRITES['enemy.ashling']!.frame).toEqual({ w: 24, h: 24 });
  });

  it('ambient beds declare three in-sync stems', () => {
    expect(AUDIO['zone.ashchoir.ambient']!.stems).toEqual(['base', 'melody', 'tension']);
  });

  it('every enemy declares a telegraph window (combat reads depend on it)', () => {
    for (const e of Object.values(ENEMIES)) {
      expect(e.telegraphMs).toBeGreaterThan(0);
    }
  });

  it('starts fully on placeholders', () => {
    expect(allPlaceholder()).toBe(true);
  });
});
