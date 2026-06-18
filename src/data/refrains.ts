/**
 * Refrains — ability/upgrade fragments that gate exploration BOTW-style (seed §2/§4).
 * "Go-anywhere, come-back-stronger" via abilities, not walls (Pillar 4).
 */

export interface RefrainDef {
  id: string;
  name: string;
  /** Item-description-as-lore; atmosphere over exposition (Pillar 1). */
  description: string;
  /** What traversal/combat capability this unlocks (engine reads this tag). */
  grants: 'cross_silence' | 'light_dash' | 'sung_blade';
}

export const REFRAINS: Record<string, RefrainDef> = {
  first_refrain: {
    id: 'first_refrain',
    name: 'Refrain of the Held Breath',
    description: 'The first note a god forgets is the one that let you cross the quiet.',
    grants: 'cross_silence',
  },
  light_dash: {
    id: 'light_dash',
    name: 'Refrain of the Leap',
    description:
      'A note sung in the half-second of a fall. Hold it and the fracture cannot find you — but only while it rings.',
    grants: 'light_dash',
  },
};

export function getRefrain(id: string): RefrainDef {
  const r = REFRAINS[id];
  if (!r) throw new Error(`Unknown refrain: ${id}`);
  return r;
}
