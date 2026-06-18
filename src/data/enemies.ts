/**
 * Enemy definitions — data-driven (seed §5). Engine code reads these; it never
 * hardcodes a specific enemy. Combat reads depend on the telegraph, so every
 * enemy carries explicit telegraph timing (asset spec §3.2).
 */

export interface EnemyDef {
  id: string;
  name: string;
  /** Sprite frame size on the 16px grid (asset spec §3.2). */
  frame: { w: number; h: number };
  maxHealth: number;
  moveSpeed: number;
  /** Contact / attack damage. */
  damage: number;
  /** Wind-up before an attack lands, in ms — the player's read window. */
  telegraphMs: number;
  /** Placeholder tint for the programmatic sprite. */
  color: number;
  vibe: string;
}

export const ENEMIES: Record<string, EnemyDef> = {
  ashling: {
    id: 'ashling',
    name: 'Ashling',
    frame: { w: 24, h: 24 },
    maxHealth: 20,
    moveSpeed: 70,
    damage: 8,
    telegraphMs: 280,
    color: 0xff7a3c,
    vibe: 'Small ember-wisp; fast, swarms.',
  },
  reliquary_warden: {
    id: 'reliquary_warden',
    name: 'Reliquary Warden',
    frame: { w: 32, h: 32 },
    maxHealth: 80,
    moveSpeed: 30,
    damage: 18,
    telegraphMs: 650,
    color: 0x9fd8e6,
    vibe: 'Slow glass sentinel; heavy telegraph.',
  },
  tideborn: {
    id: 'tideborn',
    name: 'Tideborn',
    frame: { w: 32, h: 32 },
    maxHealth: 55,
    moveSpeed: 55,
    damage: 14,
    telegraphMs: 420,
    color: 0x4fb6a0,
    vibe: 'Drowned figure; lunges.',
  },
};

export function getEnemy(id: string): EnemyDef {
  const e = ENEMIES[id];
  if (!e) throw new Error(`Unknown enemy: ${id}`);
  return e;
}
