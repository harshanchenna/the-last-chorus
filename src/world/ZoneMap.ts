/**
 * ZoneMap — builds a Phaser tilemap (with wall collision) from a pure tile grid.
 *
 * The grid comes from `world/mapgen` (data-driven, testable); this is the thin
 * Phaser bridge. Swapping in a real Tiled JSON map later means feeding a grid
 * from the loaded map instead of the generated one — collision wiring is unchanged.
 */

import Phaser from 'phaser';
import { TILE } from './mapgen';

export class ZoneMap {
  readonly layer: Phaser.Tilemaps.TilemapLayer;
  readonly widthPx: number;
  readonly heightPx: number;

  constructor(scene: Phaser.Scene, grid: number[][], tilesetKey: string, tileSize = 16) {
    const map = scene.make.tilemap({ data: grid, tileWidth: tileSize, tileHeight: tileSize });
    const tileset = map.addTilesetImage(tilesetKey, tilesetKey, tileSize, tileSize, 0, 0);
    if (!tileset) throw new Error('tileset image missing — generateTileset() not run?');
    const layer = map.createLayer(0, tileset, 0, 0);
    if (!layer) throw new Error('failed to create tilemap layer');
    layer.setCollision(TILE.wall);
    layer.setDepth(-10);
    this.layer = layer;
    this.widthPx = (grid[0]?.length ?? 0) * tileSize;
    this.heightPx = grid.length * tileSize;
  }
}
