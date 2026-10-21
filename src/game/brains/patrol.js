// Rangers and raiders: fighters that live around their camp.
// Rangers wander around their own side and shoot enemies they see. Raiders roam the enemy's side hunting workers.

import { random } from '../../core/random.js';
import { buildings } from '../../core/world.js';
import { BUILDINGS } from '../../data/buildings.js';
import { isWorker } from '../../data/units.js';
import { centerX, centerZ } from '../query.js';
import { walk, wander } from '../movement.js';
import { nearestEnemyUnit } from '../units.js';
import { fightTarget, scanForTarget } from './fighting.js';

const RANGER_SIGHT = 7, RANGER_LEASH = 10;
const RAIDER_WORKER_SIGHT = 6.5, RAIDER_ANY_SIGHT = 2.5, RAIDER_LEASH = 9;

export function thinkRanger(u, dt) {
  scanForTarget(u, RANGER_SIGHT);
  if (u.target && fightTarget(u, dt, RANGER_LEASH)) return;
  if (u.state === 'wait') { u.timer -= dt; if (u.timer <= 0) u.state = 'idle'; return; }
  if (u.state === 'patrol') {
    if (walk(u, dt) !== 0) { u.state = 'wait'; u.timer = 1.5 + random() * 2.5; u.goal = null; }
    return;
  }
  const own = buildings.filter((b) => b.team === u.team && b.type !== 'wall');
  if (!own.length) return;
  const b = own[random() * own.length | 0];
  wander(u, centerX(b), centerZ(b), 3.5);
  u.state = 'patrol';
}

const isWorkerUnit = (unit) => isWorker(unit.kind);

export function thinkRaider(u, dt) {
  if (u.target && u.target.dead) u.target = null;
  if (u.scanTimer <= 0) {
    u.scanTimer = .35;
    if (!u.target || !isWorkerUnit(u.target)) {                      // prefer a worker to whatever it is fighting
      const worker = nearestEnemyUnit(u.team, u.x, u.z, RAIDER_WORKER_SIGHT, isWorkerUnit);
      if (worker) u.target = worker;
      else if (!u.target) u.target = nearestEnemyUnit(u.team, u.x, u.z, RAIDER_ANY_SIGHT);
    }
  }
  if (u.target && fightTarget(u, dt, RAIDER_LEASH)) return;
  if (u.state === 'wait') { u.timer -= dt; if (u.timer <= 0) u.state = 'idle'; return; }
  if (u.state === 'roam') {
    const r = walk(u, dt);
    if (r === 1) { u.state = 'wait'; u.timer = .8 + random() * 1.5; }
    else if (r === -1 && u.fails > 2) { u.state = 'idle'; u.goal = null; u.fails = 0; }
    return;
  }
  const enemy = buildings.filter((b) => b.team !== u.team && b.type !== 'wall');
  if (!enemy.length) return;
  const workplaces = enemy.filter((b) => { const crew = BUILDINGS[b.type].crew; return crew && isWorker(crew.unit); });   // not other raider or ranger camps
  const pool = workplaces.length && random() < .75 ? workplaces : enemy;
  const b = pool[random() * pool.length | 0];
  wander(u, centerX(b), centerZ(b), 4);
  u.state = 'roam';
}
