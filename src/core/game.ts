/**
 * Phaser game factory. Centralizes the engine config so the render contract
 * (pixel-art, integer scaling, 480×270 internal res) lives in one place.
 *
 * Exported as a function (not executed on import) so tests can introspect the
 * config without spinning up WebGL.
 */

import Phaser from 'phaser';
import { RENDER } from './config';
import { BootScene } from '../scenes/BootScene';
import { TitleScene } from '../scenes/TitleScene';
import { GameScene } from '../scenes/GameScene';
import { EndScene } from '../scenes/EndScene';

export function createGameConfig(parent: string): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: RENDER.width,
    height: RENDER.height,
    backgroundColor: '#05060a',
    pixelArt: true, // no texture smoothing (asset spec §1)
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    input: {
      gamepad: true, // keyboard + gamepad (seed §4)
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // top-down — no gravity (seed §3)
        debug: false,
      },
    },
    scene: [BootScene, TitleScene, GameScene, EndScene],
  };
}

export function startGame(parent: string): Phaser.Game {
  return new Phaser.Game(createGameConfig(parent));
}
