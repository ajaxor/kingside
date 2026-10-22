// What a finished building is busy making, as a fraction done: a unit it trains, a worker it raises, goods it stocks or a resource it earns.
// Pure reads of the building's state, for the bar drawn over it.

import { clamp } from '../core/math.js';
import { BUILDINGS } from '../data/buildings.js';
import { SUPPLY_INTERVAL } from '../data/balance.js';
import { UNITS } from '../data/units.js';
import { canAfford } from './economy.js';

/** `{ fraction, stalled }` for a building that is producing something (stalled: ready but waiting for money or equipment), or null. */
export function productionOf(b) {
  if (!b.built || b.dead) return null;
  const def = BUILDINGS[b.type];
  if (def.training && b.tier) {
    if (def.courtyard && b.officer && !b.officer.dead && b.officer.state !== 'cmarch') return null;      // the officer is out at his post
    const kind = b.tier.produces, time = UNITS[kind].train.time, needs = UNITS[kind].needs;
    const fraction = clamp(b.timer / time, 0, 1), ready = fraction >= .999;
    return { fraction, stalled: ready && (!canAfford(b.team, UNITS[kind].train.cost) || (needs && b.held[needs.good] < needs.count)) };
  }
  if (def.supply) return { fraction: clamp(b.timer / SUPPLY_INTERVAL, 0, 1), stalled: false };
  if (def.income) return { fraction: clamp(b.timer / def.income.interval, 0, 1), stalled: false };
  if (def.crew && b.workers.length < def.crew.count) {
    return { fraction: clamp(1 - b.spawnTimer / def.crew.interval, 0, 1), stalled: !canAfford(b.team, def.crew.cost) };
  }
  return null;
}
