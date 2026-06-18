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
import { REFRAINS } from '../data/refrains';
import { LORE } from '../data/lore';
import { BOSSES } from '../data/bosses';

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

  it('every zone exit points at a real zone', () => {
    for (const z of Object.values(ZONES)) {
      for (const ex of z.exits) {
        expect(ZONES[ex.toZone], `${z.id} exit → ${ex.toZone}`).toBeDefined();
      }
    }
  });

  it('every gate requires a real Refrain', () => {
    for (const z of Object.values(ZONES)) {
      for (const g of z.gates) {
        expect(REFRAINS[g.requiresRefrain], `${g.id} needs ${g.requiresRefrain}`).toBeDefined();
      }
    }
  });

  it('every placed lore object resolves to a lore entry', () => {
    for (const z of Object.values(ZONES)) {
      for (const lo of z.loreObjects) {
        expect(LORE[lo.loreId], `${z.id} lore ${lo.loreId}`).toBeDefined();
      }
    }
  });

  it('every Refrain pickup references a real Refrain and is reachable before its gate', () => {
    for (const z of Object.values(ZONES)) {
      for (const pk of z.refrainPickups) {
        expect(REFRAINS[pk.refrainId], `${pk.id} → ${pk.refrainId}`).toBeDefined();
        // A pickup that opens a gate must sit on the near (smaller-x) side of it,
        // or the player could never reach it to open the gate (soft-lock guard).
        const gate = z.gates.find((g) => g.requiresRefrain === pk.refrainId);
        if (gate) expect(pk.x, `${pk.id} before ${gate.id}`).toBeLessThan(gate.x);
      }
    }
  });

  it('every placed boss references a real boss def with ordered phases', () => {
    for (const z of Object.values(ZONES)) {
      for (const bs of z.bosses) {
        const def = BOSSES[bs.bossId];
        expect(def, `${bs.id} → ${bs.bossId}`).toBeDefined();
        // Phases must descend by healthAbove and end at 0, or phaseFor breaks.
        const thresholds = def!.ai.phases.map((p) => p.healthAbove);
        const sorted = [...thresholds].sort((a, b) => b - a);
        expect(thresholds).toEqual(sorted);
        expect(thresholds[thresholds.length - 1]).toBe(0);
      }
    }
  });
});
