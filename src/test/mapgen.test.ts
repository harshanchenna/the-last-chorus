import { describe, it, expect } from 'vitest';
import { buildTileGrid, isGroundAtPixel, TILE, type MapSpec } from '../world/mapgen';
import { MAPS } from '../data/maps';
import { ZONES } from '../data/zones';

const SPEC: MapSpec = {
  widthTiles: 10,
  heightTiles: 8,
  walls: [{ x: 4, y: 3, w: 2, h: 2 }],
};

describe('buildTileGrid', () => {
  const grid = buildTileGrid(SPEC);

  it('has the requested dimensions', () => {
    expect(grid.length).toBe(8);
    expect(grid[0]!.length).toBe(10);
  });

  it('walls the outer border', () => {
    expect(grid[0]!.every((t) => t === TILE.wall)).toBe(true);
    expect(grid[7]!.every((t) => t === TILE.wall)).toBe(true);
    expect(grid[3]![0]).toBe(TILE.wall);
    expect(grid[3]![9]).toBe(TILE.wall);
  });

  it('fills interior wall rectangles and leaves the rest ground', () => {
    expect(grid[3]![4]).toBe(TILE.wall);
    expect(grid[4]![5]).toBe(TILE.wall);
    expect(grid[2]![2]).toBe(TILE.ground);
  });

  it('maps pixel positions to ground/wall', () => {
    expect(isGroundAtPixel(grid, 2 * 16 + 4, 2 * 16 + 4, 16)).toBe(true);
    expect(isGroundAtPixel(grid, 4 * 16 + 4, 3 * 16 + 4, 16)).toBe(false);
  });
});

describe('zone maps are coherent', () => {
  it('every zone has a map whose default spawn lands on ground', () => {
    for (const zone of Object.values(ZONES)) {
      const spec = MAPS[zone.id];
      expect(spec, `map for ${zone.id}`).toBeDefined();
      const grid = buildTileGrid(spec!);
      expect(
        isGroundAtPixel(grid, zone.defaultSpawn.x, zone.defaultSpawn.y, 16),
        `${zone.id} spawn must be on ground`,
      ).toBe(true);
    }
  });

  it('every rest-point sits on ground (reachable)', () => {
    for (const zone of Object.values(ZONES)) {
      const grid = buildTileGrid(MAPS[zone.id]!);
      for (const rp of zone.restPoints) {
        expect(isGroundAtPixel(grid, rp.x, rp.y, 16), `${rp.id} on ground`).toBe(true);
      }
    }
  });
});
