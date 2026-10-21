// Troops and their officers.
//
// A troop walks to the enemy keep and attacks whatever blocks it. If an officer is waiting in a hall's courtyard (state 'cwait') with
// room in his band, the new troop joins him and follows him instead. An officer marches ('cmarch') when his band is full, or after
// waiting a while with at least one follower, or when the player says "March now". Troops in a marching band hit enemy buildings
// they pass; troops following a waiting officer only defend.

import { notify } from '../notify.js';
import { PLAYER } from '../../core/config.js';
import { COMMANDER_PATIENCE } from '../../data/balance.js';
import { UNITS } from '../../data/units.js';
import { isGone, opponent } from '../query.js';
import { teams } from '../../core/world.js';
import { chase, goToBuilding, setGoal, walk } from '../movement.js';
import { attackBuilding, fightTarget, nearestEnemyBuilding, scanForTarget } from './fighting.js';

const SIGHT = { alone: 3.5, escort: 4.5 };      // how far a troop notices enemies on its own, or with a leader / at his post
const LEASH = 7;
const BUILDING_SIGHT = { alone: 2.2, band: 2.6 };
const BUILDING_SCAN_EVERY = .6;
const FOLLOW_DISTANCE = { marching: 2.2, waiting: 2.8 };

/** Is this unit's chain of command on the march? */
function leaderMarching(leader) {
  return leader.state === 'cmarch' || (!!leader.leader && !leader.leader.dead && leaderMarching(leader.leader));
}

const bandSize = (commander) => commander.followers.reduce((n, f) => n + 1 + f.followers.length, 0);

/** Send an officer and his band to attack. */
export function sendCommander(c) {
  c.state = 'cmarch'; c.target = null; c.path = null; c.goal = null;
  const n = bandSize(c), name = UNITS[c.kind].name.toLowerCase();
  if (c.team === PLAYER) notify('Your ' + name + ' marches with ' + n + ' troops', 'pwave', 2, 'good');
  else notify('A red ' + name + ' marches on you with ' + n + ' troops', 'ewave', 8, 'warn');
}

function waitAtPost(u, dt) {
  const def = UNITS[u.kind];
  u.patience += dt; u.commandTimer -= dt;
  if (u.commandTimer > 0) return;
  u.commandTimer = 1;
  const full = u.followers.length >= u.cap, patience = COMMANDER_PATIENCE[def.command];
  if (full || (u.patience > patience && u.followers.length > 0)) sendCommander(u);
}

export function thinkTroop(u, dt) {
  const def = UNITS[u.kind];
  if (u.leader && u.leader.dead) u.leader = null;
  const leader = u.leader, atPost = !leader && u.state === 'cwait';
  scanForTarget(u, leader || atPost ? SIGHT.escort : SIGHT.alone);
  if (u.target && fightTarget(u, dt, LEASH)) return;
  // Archers and the like hit buildings from a short way back, and for half the damage.
  const buildingRange = def.range > 1.5 ? Math.min(def.range, 3) : 1.0;
  const buildingDamage = def.range > 1.5 ? def.damage * .5 : def.damage;

  if (leader) {
    const marching = leaderMarching(leader);
    if (marching) {
      if (u.targetBuilding && u.targetBuilding.dead) u.targetBuilding = null;
      if (!u.targetBuilding) {
        u.buildingScanTimer -= dt;
        if (u.buildingScanTimer <= 0) {
          u.buildingScanTimer = BUILDING_SCAN_EVERY;
          const b = nearestEnemyBuilding(u, BUILDING_SIGHT.band);
          if (b) { u.targetBuilding = b; u.path = null; u.goal = null; }
        }
      }
      if (u.targetBuilding) { attackBuilding(u, dt, buildingRange, buildingDamage); return; }
    } else u.targetBuilding = null;
    if (Math.hypot(leader.x - u.x, leader.z - u.z) > (marching ? FOLLOW_DISTANCE.marching : FOLLOW_DISTANCE.waiting)) chase(u, leader, dt);
    return;
  }

  if (atPost) {                                  // an officer at his post in the courtyard
    const px = u.rally.i + .5, pz = u.rally.j + .5;
    if (u.goal || u.path) { walk(u, dt); return; }
    if (Math.hypot(u.x - px, u.z - pz) > 2.2) { setGoal(u, u.rally.i, u.rally.j, u.rally.i, u.rally.j); return; }
    waitAtPost(u, dt);
    return;
  }

  if (u.targetBuilding) {
    if (u.targetBuilding.dead) { u.targetBuilding = null; u.path = null; u.goal = null; }
    else { attackBuilding(u, dt, buildingRange, buildingDamage); return; }
  }
  u.buildingScanTimer -= dt;
  if (u.buildingScanTimer <= 0) {
    u.buildingScanTimer = BUILDING_SCAN_EVERY;
    const b = nearestEnemyBuilding(u, BUILDING_SIGHT.alone);
    if (b) { u.targetBuilding = b; u.path = null; u.goal = null; return; }
  }
  const enemyKeep = teams[opponent(u.team)].keep;
  if (isGone(enemyKeep)) return;
  if (!u.goal && !u.path) goToBuilding(u, enemyKeep, true);
  const r = walk(u, dt);
  if (r === 1) u.targetBuilding = enemyKeep;
}
