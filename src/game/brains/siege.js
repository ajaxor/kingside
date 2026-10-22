// Siege machines. Rams walk to the enemy keep and break whatever is in the way. Artillery (catapults, trebuchets) stands off and lobs
// rocks at the best building in range, favouring ones that shoot back.

import { UNITS } from '../../data/units.js';
import { isLinkable, usesArrows } from '../../data/buildings.js';
import { buildings, arrows, teams } from '../../core/world.js';
import { centerX, centerZ, distToBuilding, isGone, isPlanOnly, opponent } from '../query.js';
import { marchOnKeep } from '../lanes.js';
import { attackBuilding, nearestEnemyBuilding } from './fighting.js';

const RAM_SIGHT = 1.8, RAM_REACH = 1.1, SCAN_EVERY = { ram: .6, artillery: .5 };

/** The best building for artillery to hit within r tiles: nearest, with a bonus for ones that shoot back. */
function bestArtilleryTarget(u, r) {
  let best = null, bestScore = 1e9;
  for (const b of buildings) {
    if (b.team === u.team || isLinkable(b.type) || b.type === 'trap' || isPlanOnly(b)) continue;
    const d = distToBuilding(u.x, u.z, b);
    if (d > r) continue;
    const score = d - (usesArrows(b.type) ? 2 : 0);
    if (score < bestScore) { bestScore = score; best = b; }
  }
  return best;
}

/** Throw a rock at a building. It arcs high and splashes on landing. */
function lobRock(u, b) {
  const def = UNITS[u.kind], dist = Math.hypot(centerX(b) - u.x, centerZ(b) - u.z);
  arrows.push({
    x0: u.x, y0: .9, z0: u.z, ex: centerX(b), ez: centerZ(b), target: { x: centerX(b), z: centerZ(b), dead: false, building: b },
    damage: def.buildingDamage, team: u.team, source: u, scale: 1, rock: true, progress: 0, duration: Math.max(.7, dist / 7), arc: Math.min(4, dist * .35),
  });
}

export function thinkSiege(u, dt) {
  const def = UNITS[u.kind];
  if (u.targetBuilding && u.targetBuilding.dead) { u.targetBuilding = null; u.path = null; u.goal = null; }
  if (def.artillery) {
    if (u.targetBuilding && distToBuilding(u.x, u.z, u.targetBuilding) > def.range + .4) u.targetBuilding = null;
    if (!u.targetBuilding) {
      u.buildingScanTimer -= dt;
      if (u.buildingScanTimer <= 0) {
        u.buildingScanTimer = SCAN_EVERY.artillery;
        const b = bestArtilleryTarget(u, def.range - .3);
        if (b) { u.targetBuilding = b; u.path = null; u.goal = null; }
      }
    }
    if (u.targetBuilding) {
      u.face = Math.atan2(centerX(u.targetBuilding) - u.x, centerZ(u.targetBuilding) - u.z);
      u.working = true;
      if (u.cooldown <= 0) { u.cooldown = def.cooldown; lobRock(u, u.targetBuilding); }
      return;
    }
  } else {
    if (u.targetBuilding) { attackBuilding(u, dt, RAM_REACH, def.buildingDamage); return; }
    u.buildingScanTimer -= dt;
    if (u.buildingScanTimer <= 0) {
      u.buildingScanTimer = SCAN_EVERY.ram;
      const b = nearestEnemyBuilding(u, RAM_SIGHT);
      if (b) { u.targetBuilding = b; u.path = null; u.goal = null; return; }
    }
  }
  const enemyKeep = teams[opponent(u.team)].keep;
  if (isGone(enemyKeep)) return;
  if (marchOnKeep(u, dt) === 1) u.targetBuilding = enemyKeep;
}
