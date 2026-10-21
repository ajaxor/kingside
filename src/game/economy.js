// Paying for things out of a side's stock.

import { teams } from '../core/world.js';

/** Can this side pay `cost` (a { resource: amount } table)? */
export function canAfford(team, cost) {
  const stock = teams[team].stock;
  for (const r in cost) if (stock[r] < cost[r]) return false;
  return true;
}

export function pay(team, cost) {
  const stock = teams[team].stock;
  for (const r in cost) stock[r] -= cost[r];
}

/** Give back half of `cost`, rounded down (razing a building, replacing a wall). */
export function refundHalf(team, cost) {
  const stock = teams[team].stock;
  for (const r in cost) stock[r] += Math.floor(cost[r] / 2);
}
