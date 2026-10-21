// Pieces of fighting shared by every kind of fighter: looking for targets, striking, chasing, and breaking buildings.

import { UNITS } from '../../data/units.js';
import { centerX, centerZ, distToBuilding, isPlanOnly } from '../query.js';
import { buildings } from '../../core/world.js';
import { damageBuilding } from '../buildings.js';
import { chase, goToBuilding, walk } from '../movement.js';
import { hurtUnit, nearestEnemyUnit, shootArrow } from '../units.js';

/** Drop a dead target; if there is none and the scan timer has run out, look for the nearest enemy within r tiles. */
export function scanForTarget(u, r, accepts) {
  if (u.target && u.target.dead) u.target = null;
  if (u.scanTimer > 0) return;
  u.scanTimer = .35;
  if (!u.target) u.target = nearestEnemyUnit(u.team, u.x, u.z, r, accepts);
}

/** Strike (or shoot at) a unit in range, when the weapon is ready. */
export function attackUnit(u, target) {
  const def = UNITS[u.kind];
  u.face = Math.atan2(target.x - u.x, target.z - u.z);
  u.working = true; u.path = null; u.goal = null;
  if (u.cooldown <= 0) {
    u.cooldown = def.cooldown;
    if (def.range > 1.5) shootArrow(u.x, .5, u.z, target, def.damage, u.team, u);
    else hurtUnit(target, def.damage, u);
  }
}

/** Fight the current target: attack when in range, chase when not, give up beyond `leash` tiles. Returns false when it let go. */
export function fightTarget(u, dt, leash) {
  const target = u.target;
  const dist = Math.hypot(target.x - u.x, target.z - u.z);
  if (dist > leash) { u.target = null; u.path = null; u.goal = null; return false; }
  if (dist <= UNITS[u.kind].range) attackUnit(u, target); else chase(u, target, dt);
  return true;
}

/** Attack the building in `u.targetBuilding`: strike it from `range` for `damage`, or walk up to it (hacking through whatever is in the way). */
export function attackBuilding(u, dt, range, damage) {
  const b = u.targetBuilding;
  if (distToBuilding(u.x, u.z, b) <= range) {
    u.face = Math.atan2(centerX(b) - u.x, centerZ(b) - u.z);
    u.working = true; u.path = null; u.goal = null;
    if (u.cooldown <= 0) { u.cooldown = UNITS[u.kind].cooldown; damageBuilding(b, damage); }
  } else {
    if (!u.goal && !u.path) goToBuilding(u, b, true);
    const r = walk(u, dt);
    if (r === -1 && u.fails > 4) { u.targetBuilding = null; u.fails = 0; }
  }
}

/** The nearest enemy building within r tiles that is worth hitting (walls and plans excluded). */
export function nearestEnemyBuilding(u, r) {
  let best = null, bestDist = r;
  for (const b of buildings) {
    if (b.team === u.team || b.type === 'wall' || isPlanOnly(b)) continue;
    const d = distToBuilding(u.x, u.z, b);
    if (d <= bestDist) { bestDist = d; best = b; }
  }
  return best;
}

