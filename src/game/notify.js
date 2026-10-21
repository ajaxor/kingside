// Telling the player things. Messages only go out while a game is running (so tests and the title screen stay quiet).

import { emit } from '../core/events.js';
import { game } from '../core/world.js';

/**
 * @param {string} message
 * @param {string} [key]       messages sharing a key are not repeated within `cooldown` seconds
 * @param {number} [cooldown]
 * @param {'good'|'warn'} [kind]
 */
export function notify(message, key, cooldown = 0, kind) {
  if (!game.running) return;
  emit('toast', { message, key, cooldown, kind });
}
