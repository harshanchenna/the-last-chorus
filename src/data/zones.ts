/**
 * Zone definitions — data-driven world metadata (seed §5).
 *
 * Geography = dead gods. Each region is the body/domain of a fallen god with its
 * own palette, motif, music key, and unraveling-state (seed §2). Tiled maps will
 * be referenced here later; for M0 we describe an empty bounded room.
 */

export interface RestPoint {
  id: string;
  x: number;
  y: number;
}

/** A walk-on trigger that transitions to another zone (autosaves first). */
export interface ZoneExit {
  id: string;
  x: number;
  y: number;
  toZone: string;
}

/** A silence-void barrier that blocks passage until a Refrain is owned (Pillar 4). */
export interface Gate {
  id: string;
  x: number;
  y: number;
  /** Refrain id required to pass. */
  requiresRefrain: string;
}

/** A discoverable lore object placed in the world (Pillar 1). */
export interface LoreObject {
  x: number;
  y: number;
  loreId: string;
}

/** An in-world Refrain fragment the player can pick up. */
export interface RefrainPickup {
  /** Unique id so a collected pickup never respawns. */
  id: string;
  x: number;
  y: number;
  refrainId: string;
}

export interface ZoneDef {
  id: string;
  name: string;
  /** One-line mood, surfaced in dev tools. Lore lives in the world, not text dumps. */
  blurb: string;
  /** Bounds of the playable area in source pixels (placeholder until Tiled maps). */
  bounds: { width: number; height: number };
  /** Background color of the void (desaturated per region palette). */
  bgColor: number;
  /** Where the player starts if no save exists. */
  defaultSpawn: { x: number; y: number };
  restPoints: RestPoint[];
  exits: ZoneExit[];
  gates: Gate[];
  loreObjects: LoreObject[];
  refrainPickups: RefrainPickup[];
  /** AudioDirector zone id for the ambient stem set. */
  ambientId: string;
}

export const ZONES: Record<string, ZoneDef> = {
  ashchoir: {
    id: 'ashchoir',
    name: 'Ashchoir',
    blurb: 'A smoldering cathedral-forest; embers that hum a grief they cannot finish.',
    bounds: { width: 960, height: 540 },
    bgColor: 0x1a1210,
    defaultSpawn: { x: 240, y: 160 },
    restPoints: [{ id: 'ashchoir.first_pew', x: 200, y: 140 }],
    exits: [{ id: 'ashchoir.east', x: 920, y: 272, toZone: 'glass_reliquary' }],
    // Silence-void barring the chancel doorway — needs the first Refrain to cross.
    gates: [{ id: 'ashchoir.silence_gate', x: 584, y: 248, requiresRefrain: 'first_refrain' }],
    loreObjects: [
      { x: 248, y: 140, loreId: 'ashchoir_pew' },
      // The secret beyond the gate (Pillar 4 payoff).
      { x: 820, y: 272, loreId: 'ashchoir_secret' },
    ],
    // The first Refrain sits on the near side of the silence-gate it opens (BOTW loop).
    refrainPickups: [{ id: 'ashchoir.first_refrain', x: 260, y: 384, refrainId: 'first_refrain' }],
    ambientId: 'ashchoir',
  },
  glass_reliquary: {
    id: 'glass_reliquary',
    name: 'The Glass Reliquary',
    blurb: 'Fields of singing glass — a god of memory, shattered into brittle light.',
    bounds: { width: 960, height: 540 },
    bgColor: 0x0e1620,
    defaultSpawn: { x: 240, y: 160 },
    restPoints: [{ id: 'glass.alcove', x: 220, y: 150 }],
    exits: [{ id: 'glass.west', x: 40, y: 272, toZone: 'ashchoir' }],
    gates: [],
    loreObjects: [{ x: 300, y: 150, loreId: 'glass_reflection' }],
    refrainPickups: [],
    ambientId: 'glass_reliquary',
  },
  drowned_hymn: {
    id: 'drowned_hymn',
    name: 'The Drowned Hymn',
    blurb: 'Flooded ruins where the tide still keeps time for a god that no longer breathes.',
    bounds: { width: 960, height: 540 },
    bgColor: 0x0a1414,
    defaultSpawn: { x: 240, y: 160 },
    restPoints: [{ id: 'drowned.bell', x: 220, y: 150 }],
    exits: [],
    gates: [],
    loreObjects: [{ x: 300, y: 150, loreId: 'drowned_bell' }],
    refrainPickups: [],
    ambientId: 'drowned_hymn',
  },
};

export const STARTING_ZONE = 'ashchoir';

export function getZone(id: string): ZoneDef {
  const z = ZONES[id];
  if (!z) throw new Error(`Unknown zone: ${id}`);
  return z;
}
