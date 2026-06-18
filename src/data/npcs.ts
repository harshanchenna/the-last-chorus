/**
 * NPC definitions — rare, quiet figures (asset spec §3.3). Keep them few and
 * haunting; their lines are fragments, not exposition (Pillar 1). Dialogue is a
 * short sequence the player advances with Interact.
 */

export interface NpcDef {
  id: string;
  name: string;
  /** A handful of short lines, revealed one at a time. */
  lines: string[];
}

export const NPCS: Record<string, NpcDef> = {
  glass_wisp: {
    id: 'glass_wisp',
    name: 'A Wisp of Someone',
    lines: [
      'You carry light. I remember light.',
      'I was a verse here, once. A small one. The god forgot me first.',
      'If you reach the altar… do not decide for my sake. I am already a memory of a memory.',
      'Go quietly. The glass repeats what it sees.',
    ],
  },
};

export function getNpc(id: string): NpcDef {
  const n = NPCS[id];
  if (!n) throw new Error(`Unknown npc: ${id}`);
  return n;
}
