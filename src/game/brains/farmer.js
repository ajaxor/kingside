// Farmers: till a plot, plant it, wait for it to ripen (the sim ripens it), harvest it, carry the food home.
//
// States: idle -> toRes -> work -> (back to idle after tilling/planting, or toHome after harvesting). A tilled plot (TILLED) is planted
// and becomes GROWING; a ripe one (RIPE) is harvested and goes back to TILLED so it must be planted again.

import { MAP_SIZE as N } from '../../core/config.js';
import { claims, field, fieldTeam, fieldAge, game, teams, unreachable } from '../../core/world.js';
import { HARVEST_FOOD } from '../../data/balance.js';
import { FIELD } from '../../data/terrain.js';
import { centerX, centerZ } from '../query.js';
import { goHome, goToBuilding, setGoal, walk } from '../movement.js';
import { releaseClaim } from '../units.js';

const SEARCH_RADIUS = 14;
const RIPE_PREFERENCE = 5;   // a ripe plot counts as this many tiles nearer than it is
const PLANT_TIME = 2, HARVEST_TIME = 2.6;

const needsWork = (k) => field[k] === FIELD.TILLED || field[k] === FIELD.RIPE;

function findPlot(u) {
  const home = u.home, hx = centerX(home), hz = centerZ(home);
  let best = -1, bestScore = 1e9;
  const skip = unreachable[u.team];
  for (let k = 0; k < N * N; k++) {
    if (!needsWork(k) || fieldTeam[k] !== u.team || claims[k] >= 1 || skip[k] > game.time) continue;
    const x = k % N + .5, z = ((k / N) | 0) + .5, d = Math.hypot(x - hx, z - hz);
    if (d > SEARCH_RADIUS) continue;
    const score = d + Math.hypot(x - u.x, z - u.z) * .3 - (field[k] === FIELD.RIPE ? RIPE_PREFERENCE : 0);
    if (score < bestScore) { bestScore = score; best = k; }
  }
  return best;
}

export function thinkFarmer(u, dt) {
  const stock = teams[u.team].stock;
  switch (u.state) {
    case 'idle': {
      u.timer -= dt;
      if (u.timer > 0) return;
      u.timer = 1;
      const k = findPlot(u);
      if (k < 0) { goHome(u); return; }
      u.claimTile = k; claims[k]++;
      setGoal(u, k % N, (k / N) | 0, k % N, (k / N) | 0);
      u.state = 'toRes';
      return;
    }
    case 'home':
      if (walk(u, dt) !== 0) { u.state = 'idle'; u.goal = null; }
      return;
    case 'toRes': {
      if (!needsWork(u.claimTile)) { releaseClaim(u); u.state = 'idle'; u.goal = null; return; }
      const r = walk(u, dt);
      if (r === -1 && u.fails > 2) {
        unreachable[u.team][u.claimTile] = game.time + 30;
        releaseClaim(u); u.state = 'idle'; u.goal = null; u.fails = 0;
        return;
      }
      if (r === 1) { u.state = 'work'; u.timer = field[u.claimTile] === FIELD.TILLED ? PLANT_TIME : HARVEST_TIME; }
      return;
    }
    case 'work': {
      const k = u.claimTile;
      if (!needsWork(k)) { releaseClaim(u); u.state = 'idle'; return; }
      u.face = Math.atan2(k % N + .5 - u.x, ((k / N) | 0) + .5 - u.z);
      u.working = true;
      u.timer -= dt;
      if (u.timer <= 0) {
        if (field[k] === FIELD.TILLED) {                        // planted
          field[k] = FIELD.GROWING; fieldAge[k] = 0;
          releaseClaim(u); u.state = 'idle'; u.timer = .1;
        } else {                                                // harvested
          field[k] = FIELD.TILLED;
          releaseClaim(u);
          u.carry = { item: 'food', amount: HARVEST_FOOD };
          goToBuilding(u, u.home);
          u.state = 'toHome';
        }
      }
      return;
    }
    case 'toHome': {
      const r = walk(u, dt);
      if (r === -1 && u.fails > 3) { u.carry = null; u.state = 'idle'; u.goal = null; return; }
      if (r === 1) { stock[u.carry.item] += u.carry.amount; u.carry = null; u.state = 'idle'; u.timer = .2; }
      return;
    }
  }
}
