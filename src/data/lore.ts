/**
 * Lore entries — discoverable, environmental, never a wall of text (Pillar 1).
 * Each is a short fragment surfaced when the player interacts with a world object.
 */

export interface LoreDef {
  id: string;
  /** Short title shown in a collected-lore list. */
  title: string;
  /** A few lines, max. Trust the player to read the world. */
  text: string;
}

export const LORE: Record<string, LoreDef> = {
  ashchoir_pew: {
    id: 'ashchoir_pew',
    title: 'A Burnt Hymnal',
    text: 'The pages are ash, but the spine remembers the shape of singing. Someone knelt here a long time.',
  },
};

export function getLore(id: string): LoreDef {
  const l = LORE[id];
  if (!l) throw new Error(`Unknown lore: ${id}`);
  return l;
}
