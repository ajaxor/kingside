// Small questions about the map, buildings and units that every rule asks.

import { MAP_SIZE as N, ENEMY, PLAYER } from '../core/config.js';
import { clamp } from '../core/math.js';
import { buildingsById, occupant } from '../core/world.js';
import { RESOURCE_IDS } from '../data/resources.js';

export const inBounds = (i, j) => i >= 0 && j >= 0 && i < N && j < N;
/** The tile index under a position on the ground (clamped to the map). */
export const tileAt = (x, z) => clamp(Math.floor(z), 0, N - 1) * N + clamp(Math.floor(x), 0, N - 1);
/** The other side. */
export const opponent = (team) => (team === PLAYER ? ENEMY : PLAYER);

export const centerX = (b) => b.i + b.size / 2;
export const centerZ = (b) => b.j + b.size / 2;
export const isGone = (b) => !b || b.dead;
/** The building standing on tile k, if any. */
export const buildingAt = (k) => (occupant[k] ? buildingsById.get(occupant[k]) : undefined);

/** A plan nothing has been delivered to is only a plan: it cannot be hurt or targeted, and nobody is blocked by it. */
export const isPlanOnly = (b) => !b.built && b.progress <= 0 && RESOURCE_IDS.every((r) => b.have[r] <= 0);

/** Distance from a point to the nearest edge of a building's footprint. */
export function distToBuilding(x, z, b) {
  const dx = Math.max(b.i - x, 0, x - (b.i + b.size));
  const dz = Math.max(b.j - z, 0, z - (b.j + b.size));
  return Math.hypot(dx, dz);
}
