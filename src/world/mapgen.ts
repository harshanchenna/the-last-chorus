/**
 * mapgen — pure tile-grid construction from a compact, hand-authored MapSpec.
 *
 * Authoring a 60×34 array by hand is unreadable, so zones declare geometry as a
 * border + a list of wall rectangles (and later: Tiled JSON in M3+). This module
 * expands that into the 2D index grid Phaser's tilemap API consumes — and it's
 * pure, so layouts are unit-testable (no walling yourself into spawn, etc.).
 *
 * Tile indices: 0 = ground, 1 = wall. (More variants can be added without
 * changing this contract.)
 */

export interface TileRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MapSpec {
  widthTiles: number;
  heightTiles: number;
  /** Interior wall rectangles in tile coords. The outer border is always wall. */
  walls?: TileRect[];
}

export const TILE = { ground: 0, wall: 1 } as const;

export function buildTileGrid(spec: MapSpec): number[][] {
  const { widthTiles: w, heightTiles: h } = spec;
  const grid: number[][] = [];
  for (let y = 0; y < h; y++) {
    const row: number[] = [];
    for (let x = 0; x < w; x++) {
      const border = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      row.push(border ? TILE.wall : TILE.ground);
    }
    grid.push(row);
  }
  for (const r of spec.walls ?? []) {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (y >= 0 && y < h && x >= 0 && x < w) grid[y]![x] = TILE.wall;
      }
    }
  }
  return grid;
}

/** True if the given pixel position lands on a ground tile (not a wall). */
export function isGroundAtPixel(
  grid: number[][],
  px: number,
  py: number,
  tileSize: number,
): boolean {
  const tx = Math.floor(px / tileSize);
  const ty = Math.floor(py / tileSize);
  return grid[ty]?.[tx] === TILE.ground;
}
