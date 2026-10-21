// Runners carry goods from the building that makes them (fletcher, smithy, engineer's yard) to whoever needs them: arrows to towers,
// weapons, bows and parts to training buildings. Engineers do the same when they have no building plans to work on.
//
// States: idle -> go -> idle. A delivery reserves its amount at the target (`arrowsIncoming` / `goodsIncoming`) while in transit.

import { buildings } from '../../core/world.js';
import { BUILDINGS } from '../../data/buildings.js';
import { GOODS_STOCK_MAX } from '../../data/balance.js';
import { UNITS } from '../../data/units.js';
import { centerX, centerZ, isGone } from '../query.js';
import { goHome, goToBuilding, walk } from '../movement.js';
import { pickBuildJob, thinkBuilder } from './builder.js';

const MIN_ARROWS = 5;   // it will not fetch fewer arrows than this at a time

/** How many of `good` this building could still take. */
function demandOf(b, good) {
  if (!b.built) return 0;
  if (good === 'arrows') {
    const defence = BUILDINGS[b.type].defence;
    return defence && defence.maxArrows ? defence.maxArrows - b.arrows - b.arrowsIncoming : 0;
  }
  if (!b.tier || !BUILDINGS[b.type].training || UNITS[b.tier.produces].needs?.good !== good) return 0;
  return GOODS_STOCK_MAX - b.held[good] - b.goodsIncoming[good];
}

/** Put the reserved delivery back (the target is gone or unreachable). */
function cancelDelivery(u, home) {
  const { target, good, amount } = u.job;
  if (!isGone(target)) {
    if (good === 'arrows') target.arrowsIncoming -= amount;
    else target.goodsIncoming[good] -= amount;
  }
  if (!home.dead) home.stock[good] += amount;
  u.carry = null; u.job = null; u.state = 'idle'; u.goal = null;
}

export function thinkRunner(u, dt) {
  const home = u.home;
  switch (u.state) {
    case 'idle': {
      u.timer -= dt;
      if (u.timer > 0) return;
      u.timer = 1;
      let best = null, bestScore = 1e9, bestGood = null, bestAmount = 0;
      for (const supply of BUILDINGS[home.type].supply || []) {
        const have = home.stock[supply.good], minimum = supply.good === 'arrows' ? MIN_ARROWS : 1;
        if (have < minimum) continue;
        for (const b of buildings) {
          if (b.team !== u.team) continue;
          const amount = Math.min(have, demandOf(b, supply.good), supply.batch);
          if (amount < minimum) continue;
          const score = Math.hypot(centerX(b) - u.x, centerZ(b) - u.z) + (supply.good === 'arrows' ? (b.arrows + b.arrowsIncoming) * .6 : 0) - amount;
          if (score < bestScore) { bestScore = score; best = b; bestGood = supply.good; bestAmount = amount; }
        }
      }
      if (best) {
        home.stock[bestGood] -= bestAmount;
        if (bestGood === 'arrows') best.arrowsIncoming += bestAmount; else best.goodsIncoming[bestGood] += bestAmount;
        u.job = { kind: 'deliver', target: best, good: bestGood, amount: bestAmount };
        u.carry = { item: bestGood, amount: bestAmount };
        goToBuilding(u, best);
        u.state = 'go';
        return;
      }
      goHome(u);
      return;
    }
    case 'home':
      if (walk(u, dt) !== 0) { u.state = 'idle'; u.goal = null; }
      return;
    case 'go': {
      const { target, good, amount } = u.job;
      if (isGone(target)) {
        if (!home.dead) home.stock[good] += amount;
        u.carry = null; u.job = null; u.state = 'idle'; u.goal = null;
        return;
      }
      const r = walk(u, dt);
      if (r === -1 && u.fails > 3) { cancelDelivery(u, home); return; }
      if (r === 1) {
        if (good === 'arrows') { target.arrows += amount; target.arrowsIncoming -= amount; }
        else { target.held[good] += amount; target.goodsIncoming[good] -= amount; }
        u.carry = null; u.job = null; u.state = 'idle'; u.timer = .2;
      }
      return;
    }
  }
}

/** Engineers raise traps and ballistae when there are plans for them, and otherwise carry parts like a runner. */
export function thinkEngineer(u, dt) {
  if (u.state === 'go') { thinkRunner(u, dt); return; }
  if (u.state === 'idle') {
    u.timer -= dt;
    if (u.timer > 0) return;
    u.timer = .6;
    if (pickBuildJob(u)) { u.timer = 0; thinkBuilder(u, 0); return; }
    u.timer = 0;
    thinkRunner(u, 0);
    return;
  }
  thinkBuilder(u, dt);
}
