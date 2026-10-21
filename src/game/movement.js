// Moving a unit: set a goal, find a path to it, walk along it, chase a target, wander.
// A unit's goal is the target rectangle of tiles it wants to be next to: { x0, z0, x1, z1, breaking }.

import { MAP_SIZE as N } from '../core/config.js';
import { clamp } from '../core/math.js';
import { random } from '../core/random.js';
import { ground, nodeKind, occupant } from '../core/world.js';
import { TERRAIN, TERRAIN_INFO } from '../data/terrain.js';
import { UNITS, isFighter, isSiege } from '../data/units.js';
import { findPath, walkCost } from './pathing.js';
import { buildingAt, distToBuilding, isPlanOnly, tileAt } from './query.js';

export function setGoal(u, x0, z0, x1, z1, breaking) {
  u.goal = { x0, z0, x1, z1, breaking: !!breaking };
  u.path = null;
  u.repathTimer = 0;
}

/** Walk to be next to a building (`breaking`: willing to hack through enemy buildings on the way). */
export function goToBuilding(u, b, breaking) {
  setGoal(u, b.i, b.j, b.i + b.size - 1, b.j + b.size - 1, breaking);
}

/** Take one step of up to speed * dt toward a point. Returns true on arriving. */
function stepToward(u, tx, tz, dt) {
  const dx = tx - u.x, dz = tz - u.z, dist = Math.hypot(dx, dz);
  const step = UNITS[u.kind].speed * TERRAIN_INFO[ground[tileAt(u.x, u.z)]].speed * dt;
  u.moving = true;
  if (dist > 1e-4) u.face = Math.atan2(dx, dz);
  if (dist <= step) { u.x = tx; u.z = tz; return true; }
  u.x += dx / dist * step; u.z += dz / dist * step;
  return false;
}

/** Follow the current path. Returns true when it is finished (or there is none); drops the path if something now blocks it. */
function followPath(u, dt) {
  if (!u.path || u.pathIndex >= u.path.length) return true;
  const k = u.path[u.pathIndex];
  const b = buildingAt(k);
  if (b && b.type !== 'trap' && !isPlanOnly(b)) {
    if (b.team !== u.team) {
      if (isFighter(u.kind) || isSiege(u.kind)) { u.targetBuilding = b; u.goal = null; }   // an enemy wall in the way: attack it
      u.path = null;
      return false;
    }
    if (b.type !== 'gate') { u.path = null; return false; }
  }
  if (ground[k] === TERRAIN.WATER || nodeKind[k]) { u.path = null; return false; }
  if (stepToward(u, k % N + .5, ((k / N) | 0) + .5, dt)) { u.pathIndex++; return u.pathIndex >= u.path.length; }
  return false;
}

/**
 * Advance toward the goal. Returns 1 on arriving (or when there is no goal), 0 while on the way (or waiting to retry), and -1 when no
 * path could be found (it retries after a pause; `fails` counts the failures in a row).
 */
export function walk(u, dt) {
  if (!u.path) {
    if (!u.goal) return 1;
    if (u.repathTimer > 0) { u.repathTimer -= dt; return 0; }
    const g = u.goal, path = findPath(u.team, u.x, u.z, g.x0, g.z0, g.x1, g.z1, g.breaking);
    if (!path) { u.repathTimer = 1.2; u.fails++; return -1; }
    u.path = path; u.pathIndex = 0;
  }
  if (followPath(u, dt)) { u.path = null; u.goal = null; u.fails = 0; return 1; }
  return 0;
}

/** Close in on a moving target: walk straight at it when near, otherwise re-plan a path to where it is every 0.7 s. */
export function chase(u, target, dt) {
  const dist = Math.hypot(target.x - u.x, target.z - u.z);
  if (dist < 2.2 && dist > .01) {
    const nx = u.x + (target.x - u.x) / dist * .35, nz = u.z + (target.z - u.z) / dist * .35;
    if (walkCost(u.team, tileAt(nx, nz), false)) { u.path = null; u.goal = null; stepToward(u, target.x, target.z, dt); return; }
  }
  u.chaseTimer -= dt;
  if (u.chaseTimer <= 0 || (!u.path && !u.goal)) {
    u.chaseTimer = .7;
    const ti = Math.floor(target.x), tj = Math.floor(target.z);
    setGoal(u, ti, tj, ti, tj, false);
  }
  walk(u, dt);
}

/** Pick a random spot within r tiles of (x, z) and head there. */
export function wander(u, x, z, r) {
  const tx = clamp(Math.floor(x + (random() - .5) * 2 * r), 0, N - 1), tz = clamp(Math.floor(z + (random() - .5) * 2 * r), 0, N - 1);
  setGoal(u, tx, tz, tx, tz, false);
}

/** A worker who is away from home walks back to it. */
export function goHome(u) {
  if (u.home && !u.home.dead && distToBuilding(u.x, u.z, u.home) > 2.2 && !u.goal) { goToBuilding(u, u.home); u.state = 'home'; }
}

/** If a unit ended up standing somewhere it cannot be (a wall went up on it), nudge it to the nearest open tile. */
export function unstick(u, dt) {
  const k = tileAt(u.x, u.z);
  const enemyBuilding = occupant[k] && buildingAt(k) && buildingAt(k).team !== u.team;
  if (walkCost(u.team, k, false) || enemyBuilding) return;
  let best = null, bestDist = 9;
  const i = k % N, j = (k / N) | 0;
  for (let y = j - 2; y <= j + 2; y++) {
    for (let x = i - 2; x <= i + 2; x++) {
      if (x < 0 || y < 0 || x >= N || y >= N || !walkCost(u.team, y * N + x, false)) continue;
      const d = Math.hypot(x + .5 - u.x, y + .5 - u.z);
      if (d < bestDist) { bestDist = d; best = [x + .5, y + .5]; }
    }
  }
  if (best) { u.x += (best[0] - u.x) * Math.min(1, dt * 4); u.z += (best[1] - u.z) * Math.min(1, dt * 4); }
}
