/**
 * Entry point. Boots the Phaser game into #game.
 *
 * Kept tiny on purpose — all real config lives in `core/game.ts` so it can be
 * tested without instantiating WebGL.
 */

import { startGame } from './core/game';
import { GAME_TITLE } from './core/config';

document.title = GAME_TITLE;
startGame('game');
