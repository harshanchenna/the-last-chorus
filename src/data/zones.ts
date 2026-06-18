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

/** A placed boss encounter. */
export interface BossSpawn {
  id: string;
  x: number;
  y: number;
  bossId: string;
}

/** A placed enemy at zone load. */
export interface EnemySpawn {
  enemyId: string;
  x: number;
  y: number;
}

/** A placed NPC (rare, quiet figure). */
export interface NpcSpawn {
  id: string;
  x: number;
  y: number;
  npcId: string;
}

/**
 * A god's altar: after the region's boss falls, the player chooses to **relight**
 * the sleeping god or **let it rest** — a real moral weight, never good/evil
 * (Pillar 5). The choice persists.
 */
export interface Altar {
  id: string;
  x: number;
  y: number;
  /** Boss spawn id that must be defeated before the altar wakes. */
  bossSpawnId: string;
  godName: string;
  /** Flavor shown after each choice. */
  relightText: string;
  restText: string;
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
  /** Ground/wall tile colors — each dead god's domain reads distinctly (asset spec §2). */
  tilePalette: { ground: number; wall: number };
  /** The signature decay visual creeping into the region, or null (asset spec §4). */
  unraveling: 'ash' | 'glass' | 'tide' | null;
  /** Where the player starts if no save exists. */
  defaultSpawn: { x: number; y: number };
  restPoints: RestPoint[];
  exits: ZoneExit[];
  gates: Gate[];
  loreObjects: LoreObject[];
  refrainPickups: RefrainPickup[];
  bosses: BossSpawn[];
  enemySpawns: EnemySpawn[];
  npcs: NpcSpawn[];
  /** Optional god's altar (relight-vs-rest choice). */
  altar?: Altar;
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
    tilePalette: { ground: 0x1c1512, wall: 0x4a382c },
    unraveling: 'ash',
    defaultSpawn: { x: 240, y: 160 },
    restPoints: [{ id: 'ashchoir.first_pew', x: 200, y: 140 }],
    exits: [{ id: 'ashchoir.east', x: 920, y: 272, toZone: 'glass_reliquary' }],
    // Silence-void barring the chancel doorway — needs the first Refrain to cross.
    gates: [{ id: 'ashchoir.silence_gate', x: 584, y: 248, requiresRefrain: 'first_refrain' }],
    loreObjects: [
      { x: 248, y: 140, loreId: 'ashchoir_pew' },
      // A trail of fragments leading east toward the arena.
      { x: 520, y: 200, loreId: 'ashchoir_choir' },
      // The secret beyond the gate (Pillar 4 payoff).
      { x: 820, y: 272, loreId: 'ashchoir_secret' },
    ],
    // The first Refrain sits on the near side of the silence-gate it opens (BOTW loop).
    refrainPickups: [{ id: 'ashchoir.first_refrain', x: 260, y: 384, refrainId: 'first_refrain' }],
    // The region climax: the Choirmaster holds the eastern hall beyond the gate.
    bosses: [{ id: 'ashchoir.choirmaster', x: 740, y: 272, bossId: 'miniboss_choirmaster' }],
    // A swarm by the nave, then a heavier sentinel guarding the gated arena.
    enemySpawns: [
      { enemyId: 'ashling', x: 420, y: 200 },
      { enemyId: 'ashling', x: 470, y: 320 },
      { enemyId: 'ashling', x: 640, y: 220 },
      { enemyId: 'ashling', x: 660, y: 330 },
      { enemyId: 'reliquary_warden', x: 700, y: 272 },
    ],
    npcs: [],
    altar: {
      id: 'ashchoir.dais',
      x: 800,
      y: 180,
      bossSpawnId: 'ashchoir.choirmaster',
      godName: 'the god of fire & grief',
      relightText:
        'You give the last of your light to the dais. For one breath the choir sings again — then gutters, grateful and gone.',
      restText:
        'You close the hymnal and let the silence in. It is not defeat. It is the kindest thing left to give.',
    },
    ambientId: 'ashchoir',
  },
  glass_reliquary: {
    id: 'glass_reliquary',
    name: 'The Glass Reliquary',
    blurb: 'Fields of singing glass — a god of memory, shattered into brittle light.',
    bounds: { width: 960, height: 540 },
    bgColor: 0x0e1620,
    tilePalette: { ground: 0x101a26, wall: 0x33506a },
    unraveling: 'glass',
    defaultSpawn: { x: 240, y: 160 },
    restPoints: [{ id: 'glass.alcove', x: 220, y: 150 }],
    exits: [{ id: 'glass.west', x: 40, y: 272, toZone: 'ashchoir' }],
    gates: [],
    loreObjects: [{ x: 300, y: 150, loreId: 'glass_reflection' }],
    refrainPickups: [],
    enemySpawns: [{ enemyId: 'reliquary_warden', x: 520, y: 300 }],
    // A rare, haunting figure near the western approach.
    npcs: [{ id: 'glass.wisp', x: 140, y: 180, npcId: 'glass_wisp' }],
    bosses: [{ id: 'glass.echo', x: 760, y: 272, bossId: 'reliquary_echo' }],
    altar: {
      id: 'glass.reliquary',
      x: 820,
      y: 200,
      bossSpawnId: 'glass.echo',
      godName: 'the god of memory',
      relightText:
        'You feed the reliquary your light and it remembers — every face it ever held, all at once, then none. A mercy and a cruelty in one breath.',
      restText:
        'You let the reflections still. The glass stops repeating. What it forgets, this time, stays forgotten — and that is its own kind of peace.',
    },
    ambientId: 'glass_reliquary',
  },
  drowned_hymn: {
    id: 'drowned_hymn',
    name: 'The Drowned Hymn',
    blurb: 'Flooded ruins where the tide still keeps time for a god that no longer breathes.',
    bounds: { width: 960, height: 540 },
    bgColor: 0x0a1414,
    tilePalette: { ground: 0x0a1618, wall: 0x244a4a },
    unraveling: 'tide',
    defaultSpawn: { x: 240, y: 160 },
    restPoints: [{ id: 'drowned.bell', x: 220, y: 150 }],
    exits: [],
    gates: [],
    loreObjects: [{ x: 300, y: 150, loreId: 'drowned_bell' }],
    refrainPickups: [],
    bosses: [],
    // A traversal/atmosphere zone — minimal fighting honours Pillar 4 (seed §3).
    enemySpawns: [],
    npcs: [],
    ambientId: 'drowned_hymn',
  },
};

export const STARTING_ZONE = 'ashchoir';

export function getZone(id: string): ZoneDef {
  const z = ZONES[id];
  if (!z) throw new Error(`Unknown zone: ${id}`);
  return z;
}
