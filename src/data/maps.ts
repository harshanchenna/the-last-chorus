/**
 * Zone map specs — hand-authored geometry (seed §3: interconnected hand-authored
 * rooms). Declared compactly as a border + interior wall rectangles; `world/mapgen`
 * expands them to tile grids. Tile coords are 16px; a 60×34 grid == 960×540 px,
 * matching each zone's bounds.
 *
 * These are deliberately data, not code (seed §5) — and are the stand-in until
 * real Tiled JSON maps are authored (still drop-in via the same loader).
 */

import type { MapSpec } from '../world/mapgen';

export const TILE_SIZE = 16;

export const MAPS: Record<string, MapSpec> = {
  // Ashchoir — a ruined nave: scattered pillars + a broken chancel screen with a gap.
  ashchoir: {
    widthTiles: 60,
    heightTiles: 34,
    walls: [
      // Pillars flanking the nave (player spawns at tile ~15,10, kept clear).
      { x: 10, y: 6, w: 2, h: 2 },
      { x: 10, y: 26, w: 2, h: 2 },
      { x: 22, y: 6, w: 2, h: 2 },
      { x: 22, y: 26, w: 2, h: 2 },
      // A chancel screen across the room with a 4-tile doorway gap.
      { x: 36, y: 2, w: 2, h: 12 },
      { x: 36, y: 18, w: 2, h: 14 },
      // Rubble pocket (forms a small alcove on the right).
      { x: 48, y: 12, w: 8, h: 2 },
      { x: 48, y: 20, w: 8, h: 2 },
      { x: 54, y: 14, w: 2, h: 6 },
    ],
  },
  // Glass Reliquary — colder, more fractured: crystalline shards as obstacles.
  glass_reliquary: {
    widthTiles: 60,
    heightTiles: 34,
    walls: [
      { x: 8, y: 5, w: 3, h: 3 },
      { x: 30, y: 14, w: 3, h: 3 },
      { x: 44, y: 22, w: 3, h: 3 },
      { x: 20, y: 24, w: 3, h: 3 },
      { x: 40, y: 6, w: 3, h: 3 },
    ],
  },
  // Drowned Hymn — open, flooded: a few sunken walls. Low-combat traversal zone.
  drowned_hymn: {
    widthTiles: 60,
    heightTiles: 34,
    walls: [
      { x: 18, y: 4, w: 2, h: 10 },
      { x: 38, y: 20, w: 2, h: 10 },
      { x: 26, y: 16, w: 10, h: 2 },
    ],
  },
};

export function getMapSpec(zoneId: string): MapSpec {
  const m = MAPS[zoneId];
  if (!m) throw new Error(`No map spec for zone: ${zoneId}`);
  return m;
}
