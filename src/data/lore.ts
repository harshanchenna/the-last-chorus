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
  ashchoir_choir: {
    id: 'ashchoir_choir',
    title: 'The Choir Stalls',
    text: 'Rows of seats face an empty dais. The wood is worn smooth where hands gripped it, bracing to sing one last time.',
  },
  ashchoir_secret: {
    id: 'ashchoir_secret',
    title: 'Behind the Screen',
    text: 'Past the silence, a single unburnt candle. It was lit recently. You are not the first to come back.',
  },
  glass_reflection: {
    id: 'glass_reflection',
    title: 'Your Own Reflection, Older',
    text: 'The glass shows you a moment that has not happened yet — and you, in it, are tired of carrying the light.',
  },
  drowned_bell: {
    id: 'drowned_bell',
    title: 'A Bell Underwater',
    text: 'It still rings on the tide, slow and muffled, keeping time for a god who has forgotten how to breathe.',
  },
};

export function getLore(id: string): LoreDef {
  const l = LORE[id];
  if (!l) throw new Error(`Unknown lore: ${id}`);
  return l;
}
