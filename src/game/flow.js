// Starting a game: build the map, give each side its keep, hut and lodge, and reset the clock.

import { MAP_SIZE as N, ENEMY, PLAYER } from '../core/config.js';
import { game, resetWorld } from '../core/world.js';
import { BUILDINGS } from '../data/buildings.js';
import { START_BUILDINGS } from '../data/map.js';
import { canPlace, placeBuilding } from './buildings.js';
import { generateMap } from './mapgen.js';

/** Place a starting building at (i, j), or at the nearest spot that fits (searching outward in rings). */
function placeNear(team, type, i, j) {
  for (let r = 0; r < 9; r++) {
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        if (canPlace(type, i + di, j + dj, true)) return placeBuilding(team, type, i + di, j + dj, true);
      }
    }
  }
  return placeBuilding(team, type, i, j, true);
}

/**
 * Set up a fresh game. `seed` fixes the map (random if omitted); `ai` says which sides the computer plays (default: just the enemy).
 * The game is left not running: the caller sets game.running when play begins.
 */
export function newGame({ seed = (Math.random() * 1e9) | 0, ai = [false, true] } = {}) {
  resetWorld(seed, ai);
  generateMap(seed);
  for (const start of START_BUILDINGS) {
    const size = BUILDINGS[start.type].size;
    const [i, j] = start.at;
    // The enemy's start is the player's turned half a turn around the map's centre.
    const spots = [[PLAYER, i, j], [ENEMY, N - i - size, N - j - size]];
    for (const [team, ti, tj] of spots) {
      if (start.exact) placeBuilding(team, start.type, ti, tj, true);
      else placeNear(team, start.type, ti, tj);
    }
  }
  return game;
}
