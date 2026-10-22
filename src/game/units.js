// Creating, hurting and killing units, plus the things units shoot and look for.
//
// A unit's `state` is a short string its brain switches on (see src/game/brains/). The ones shared by every troop are:
//   'march'   walking to the enemy keep     'cwait'  an officer waiting at his post     'cmarch'  an officer leading his band out

import { MAP_SIZE as N, PLAYER } from '../core/config.js';
import { random } from '../core/random.js';
import { removeItem } from '../core/util.js';
import { arrows, claims, effects, game, units } from '../core/world.js';
import { UNITS, capGroup, isFighter, isSiege, isTroop, isWorker } from '../data/units.js';
import { walkCost } from './pathing.js';
import { buildingAt, centerX, centerZ, inBounds } from './query.js';
import { notify } from './notify.js';

/** The free tile next to a building nearest the middle of its south face, for something to appear on. */
export function freeTileBeside(b, team) {
  let best = null, bestDist = 1e9;
  const fx = centerX(b), fz = centerZ(b) + b.size;
  for (let y = b.j - 1; y <= b.j + b.size; y++) {
    for (let x = b.i - 1; x <= b.i + b.size; x++) {
      if (!inBounds(x, y)) continue;
      if (x >= b.i && x < b.i + b.size && y >= b.j && y < b.j + b.size) continue;
      if (!walkCost(team, y * N + x, false) || buildingAt(y * N + x)) continue;   // open ground only: not inside another building's tile
      const d = Math.hypot(x + .5 - fx, y + .5 - fz) + random() * .5;
      if (d < bestDist) { bestDist = d; best = [x, y]; }
    }
  }
  return best;
}

/** The nearest officer of `team` waiting at his post (and accepted by `accepts`), within 60 tiles. */
export function findCommander(team, x, z, accepts) {
  let best = null, bestDist = 60;
  for (const c of units) {
    if (c.dead || c.team !== team || !UNITS[c.kind].command || c.state !== 'cwait') continue;
    if (accepts && !accepts(c)) continue;
    const d = Math.hypot(c.x - x, c.z - z);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

/** How many living units of `team` are in the same cap group as `kind` (see UNIT_CAPS). */
export function unitCount(team, kind) {
  const group = capGroup(kind);
  let n = 0;
  for (const u of units) if (!u.dead && u.team === team && capGroup(u.kind) === group) n++;
  return n;
}

/** Bring a new unit of `kind` out of building `b`. Returns null if there is no room beside it. */
export function spawnUnit(b, kind) {
  const at = freeTileBeside(b, b.team);
  if (!at) return null;
  const def = UNITS[kind];
  const u = {
    id: game.nextUnitId++, team: b.team, kind, x: at[0] + .5, z: at[1] + .5, hp: def.hp, maxHp: def.hp, home: b,
    state: 'idle', timer: .3, path: null, pathIndex: 0, goal: null, repathTimer: 0, fails: 0, cooldown: 0,
    face: 0, anim: random() * 9, carry: null, target: null, targetBuilding: null, scanTimer: 0, buildingScanTimer: 0, chaseTimer: 0,
    job: null, claimTile: -1, moving: false, working: false, hitTimer: 0, dead: false,
    leader: null, followers: [], patience: 0, rally: null, commandTimer: 0,
    lane: b.lane || null, laneStep: null,       // the lane it marches down, and the waypoint it is heading for (found when it first needs it)
  };
  if (isTroop(kind)) {
    if (def.command) {
      u.state = 'cwait';
      u.cap = (b.tier && b.tier.cap) || 5;
      u.take = (b.tier && b.tier.take) || null;
      b.officer = u;
      let rx = at[0], rz = at[1];
      if (b.yard) {
        const yx = Math.floor(b.yard.x), yz = Math.floor(b.yard.z);
        if (walkCost(b.team, yz * N + yx, false)) { rx = yx; rz = yz; }
      }
      u.rally = { i: rx, j: rz };
    } else {
      u.state = 'march';
      const c = findCommander(b.team, u.x, u.z, (c) => c.followers.length < c.cap && (!c.take || def.family === c.take));
      if (c) { u.leader = c; c.followers.push(u); }
    }
  } else if (isSiege(kind)) u.state = 'march';
  else b.workers.push(u);
  units.push(u);
  return u;
}

/** A worker stops heading for the tile it had claimed. */
export function releaseClaim(u) {
  if (u.claimTile >= 0) { claims[u.claimTile] = Math.max(0, claims[u.claimTile] - 1); u.claimTile = -1; }
}

export function killUnit(u, quiet) {
  if (u.dead) return;
  u.dead = true;
  releaseClaim(u);
  const job = u.job;
  if (job) {
    if (job.kind === 'haul' && job.reserved) job.site.incoming[job.resource] -= job.amount;
    if (job.kind === 'deliver' && !job.target.dead) {
      if (job.good === 'arrows') job.target.arrowsIncoming -= job.amount;
      else job.target.goodsIncoming[job.good] -= job.amount;
    }
    u.job = null;
  }
  if (u.home && !isTroop(u.kind) && !isSiege(u.kind)) removeItem(u.home.workers, u);   // workers and patrols are housed in their building
  if (u.leader) removeItem(u.leader.followers, u);
  if (!quiet) {
    effects.push({ x: u.x, y: .25, z: u.z, t: 0, d: .5, size: .25, color: [.85, .83, .8] });
    if (u.team === PLAYER && isWorker(u.kind)) notify('Enemies killed one of your ' + UNITS[u.kind].name.toLowerCase() + 's', 'wk', 14, 'warn');
  }
}

export function hurtUnit(target, damage, source) {
  if (target.dead) return;
  target.hp -= damage;
  target.hitTimer = .15;
  if (source && !source.dead && isFighter(target.kind) && (!target.target || target.target.dead)) target.target = source;
  if (target.hp <= 0) killUnit(target);
}

/** Loose an arrow from (x, y, z) at a unit. It flies for a time proportional to the distance and hurts the target if it is still alive on landing. */
export function shootArrow(x, y, z, target, damage, team, source, scale) {
  const dist = Math.hypot(target.x - x, target.z - z);
  arrows.push({
    x0: x, y0: y, z0: z, ex: target.x, ez: target.z, target, damage, team, source, scale: scale || 1,
    progress: 0, duration: Math.max(.18, dist / 13), arc: Math.min(1.2, dist * .12),
  });
}

/** The nearest living enemy unit within r tiles of a point, optionally only ones passing `accepts`. */
export function nearestEnemyUnit(team, x, z, r, accepts) {
  let best = null, bestDist = r;
  for (const u of units) {
    if (u.dead || u.team === team) continue;
    if (accepts && !accepts(u)) continue;
    const d = Math.hypot(u.x - x, u.z - z);
    if (d <= bestDist) { bestDist = d; best = u; }
  }
  return best;
}
