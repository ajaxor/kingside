// Woodcutters, quarrymen and miners: walk to a tree, rock or ore vein, work it, carry the load home to the keep stockpile.
//
// States: idle -> toRes -> work -> toHome -> idle. The unit's `gather` data (src/data/units.js) says what it harvests.
// A worker "claims" its tile so the right number of workers share a node. Marked nodes are taken first, if the player marked any.

import { MAP_SIZE as N } from '../../core/config.js';
import { claims, game, marked, nodeKind, nodeLeft, teams, unreachable } from '../../core/world.js';
import { UNITS } from '../../data/units.js';
import { centerX, centerZ } from '../query.js';
import { goHome, goToBuilding, setGoal, walk } from '../movement.js';
import { releaseClaim } from '../units.js';

const SEARCH_RADIUS = 11;         // tiles from home it will look when nothing is marked
const UNREACHABLE_FOR = 30;       // seconds it will not try a tile it could not find a way to

/** The best node of the right kind for this worker, or -1. */
function findNode(u, gather) {
  const team = teams[u.team], home = u.home, hx = centerX(home), hz = centerZ(home);
  let useMarks = false;
  if (!team.ai) for (let k = 0; k < N * N; k++) if (marked[k] && nodeKind[k] === gather.node) { useMarks = true; break; }
  let best = -1, bestScore = 1e9;
  const skip = unreachable[u.team];
  for (let k = 0; k < N * N; k++) {
    if (nodeKind[k] !== gather.node || claims[k] >= gather.claimLimit || skip[k] > game.time) continue;
    if (useMarks && !marked[k]) continue;
    const x = k % N + .5, z = ((k / N) | 0) + .5;
    const d = Math.hypot(x - hx, z - hz);
    if (!useMarks && d > SEARCH_RADIUS) continue;
    const score = d + Math.hypot(x - u.x, z - u.z) * .3;
    if (score < bestScore) { bestScore = score; best = k; }
  }
  return best;
}

export function thinkGatherer(u, dt) {
  const gather = UNITS[u.kind].gather, stock = teams[u.team].stock;
  switch (u.state) {
    case 'idle': {
      u.timer -= dt;
      if (u.timer > 0) return;
      u.timer = 1;
      const k = findNode(u, gather);
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
      if (nodeKind[u.claimTile] !== gather.node) { releaseClaim(u); u.state = 'idle'; u.goal = null; return; }
      const r = walk(u, dt);
      if (r === -1 && u.fails > 2) {
        unreachable[u.team][u.claimTile] = game.time + UNREACHABLE_FOR;
        releaseClaim(u); u.state = 'idle'; u.goal = null; u.fails = 0;
        return;
      }
      if (r === 1) { u.state = 'work'; u.timer = gather.time; }
      return;
    }
    case 'work': {
      if (nodeKind[u.claimTile] !== gather.node) { releaseClaim(u); u.state = 'idle'; return; }
      const k = u.claimTile;
      u.face = Math.atan2(k % N + .5 - u.x, ((k / N) | 0) + .5 - u.z);
      u.working = true;
      u.timer -= dt;
      if (u.timer <= 0) {
        nodeLeft[k]--;
        if (nodeLeft[k] <= 0) { nodeKind[k] = 0; marked[k] = 0; }
        game.nodesDirty = true;
        releaseClaim(u);
        u.carry = { item: gather.yields, amount: gather.amount };
        goToBuilding(u, u.home);
        u.state = 'toHome';
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
