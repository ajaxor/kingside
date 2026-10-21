// How a game ends: a keep falls.

import { emit } from '../core/events.js';
import { PLAYER } from '../core/config.js';
import { game } from '../core/world.js';

/** A keep was destroyed. `team` is the side that lost it. */
export function endGame(loser) {
  if (game.over) return;
  game.over = true;
  game.running = false;
  emit('game-over', { result: loser === PLAYER ? 'lose' : 'win', time: game.time });
}
