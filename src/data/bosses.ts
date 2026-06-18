/**
 * Boss definitions — data-driven, like enemies (seed §5). A boss is a 64×64
 * sprite with health phases that change its telegraph timing and attack patterns
 * (asset spec §3.2). The scene reads this; nothing boss-specific is hardcoded.
 */

import type { BossConfig } from '../systems/bossAI';

export interface BossDef {
  id: string;
  name: string;
  frame: { w: number; h: number };
  maxHealth: number;
  /** Contact/strike damage. */
  damage: number;
  /** Projectile damage for ranged patterns. */
  projectileDamage: number;
  color: number;
  ai: BossConfig;
}

export const BOSSES: Record<string, BossDef> = {
  miniboss_choirmaster: {
    id: 'miniboss_choirmaster',
    name: 'The Choirmaster',
    frame: { w: 64, h: 64 },
    maxHealth: 260,
    damage: 20,
    projectileDamage: 12,
    color: 0xe0a85a,
    ai: {
      aggroRange: 260,
      attackMs: 220,
      phases: [
        {
          name: 'Adagio',
          healthAbove: 0.66,
          telegraphMs: 720,
          recoverMs: 820,
          moveSpeed: 34,
          patterns: ['strike', 'radial'],
        },
        {
          name: 'Crescendo',
          healthAbove: 0.33,
          telegraphMs: 560,
          recoverMs: 600,
          moveSpeed: 52,
          patterns: ['strike', 'volley', 'radial'],
        },
        {
          name: 'Finale',
          healthAbove: 0,
          telegraphMs: 420,
          recoverMs: 440,
          moveSpeed: 70,
          patterns: ['radial', 'volley', 'radial', 'strike'],
        },
      ],
    },
  },
};

// The Glass Reliquary's climax — a god of memory. Ranged-heavy: it fights at a
// distance with shards of recollection, closing only as it shatters.
BOSSES.reliquary_echo = {
  id: 'reliquary_echo',
  name: 'The Reliquary Echo',
  frame: { w: 64, h: 64 },
  maxHealth: 240,
  damage: 16,
  projectileDamage: 10,
  color: 0x9fd8e6,
  ai: {
    aggroRange: 300,
    attackMs: 200,
    phases: [
      {
        name: 'Recollection',
        healthAbove: 0.6,
        telegraphMs: 640,
        recoverMs: 760,
        moveSpeed: 28,
        patterns: ['volley', 'radial'],
      },
      {
        name: 'Distortion',
        healthAbove: 0.3,
        telegraphMs: 500,
        recoverMs: 560,
        moveSpeed: 44,
        patterns: ['volley', 'volley', 'radial'],
      },
      {
        name: 'Shatter',
        healthAbove: 0,
        telegraphMs: 380,
        recoverMs: 420,
        moveSpeed: 64,
        patterns: ['radial', 'volley', 'strike'],
      },
    ],
  },
};

export function getBoss(id: string): BossDef {
  const b = BOSSES[id];
  if (!b) throw new Error(`Unknown boss: ${id}`);
  return b;
}
