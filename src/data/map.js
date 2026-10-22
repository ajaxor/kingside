// How the map is laid out. The map is symmetric: the enemy's side is the player's rotated half a turn.

import { MAP_SIZE as N } from '../core/config.js';
import { NODE } from './terrain.js';

export const MAP_GEN = {
  riverWidth: 1.4,              // base half-width of the river in tiles (varied by noise)
  noise: { ore: .83, stone: .8, forest: .57 },   // noise level above which each kind of node grows
  chance: { ore: .6, stone: .6, forest: .7, strayTree: .02 },   // nodes are rich (see NODE_INFO), so they are thinner on the ground
  clearRadius: 8,               // nothing grows this close to a keep
  laneRoad: 1.4,                // tiles within this distance of a lane's line are a cleared road (and a ford where the river crosses)
  laneFord: 1.9,                // ... and water this close to it is shallow, so the lane can cross
  laneWall: [2.3, 3.7],         // a band of forest this far from a lane keeps the lanes apart (thin spots let you cut through)
  laneWallChance: .86,
  laneWallFreeRadius: 13,       // no lane wall this close to a keep, so the base opens onto all three lanes
  // The player's keep, as the [x, y] tile of its top-left corner. The enemy gets the mirror image.
  keep: [10, 60],
  // Clusters of nodes around each keep: centre, radius, kind, amount per tile.
  clusters: [
    { at: [19, 49], radius: 4, node: NODE.TREE, amount: 4 },
    { at: [24, 66], radius: 2.6, node: NODE.STONE, amount: 16 },
    { at: [4.5, 51], radius: 2.2, node: NODE.ORE, amount: 12 },
  ],
};

/**
 * The three lanes, as the waypoints troops walk from the player's keep to the enemy's. The enemy walks them the other way. On screen
 * the keeps sit at the bottom and top, so these are the left, middle and right lanes. The river (the centre line) is crossed once on each.
 * The right lane is the left one turned half a turn about the map's centre, so the map stays symmetric.
 */
const turned = (points) => points.map(([x, z]) => [N - x, N - z]).reverse();
const LEFT = [[11, 60], [9, 52], [9, 9], [20, 9], [52, 9], [61, 12]];
export const LANES = [
  { id: 'left', name: 'left lane', points: LEFT },
  { id: 'mid', name: 'middle lane', points: [[11, 60], [24, 48], [36, 36], [48, 24], [61, 12]] },
  { id: 'right', name: 'right lane', points: turned(LEFT) },
];

/** What each side starts with: the keep exactly there, the others at the nearest free spot to it. */
export const START_BUILDINGS = [
  { type: 'keep', at: [10, 60], exact: true },
  { type: 'hut', at: [14, 61] },
  { type: 'lodge', at: [14, 58] },
];
