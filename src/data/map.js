// How the map is laid out. The map is symmetric: the enemy's side is the player's rotated half a turn.

import { NODE } from './terrain.js';

export const MAP_GEN = {
  riverWidth: 1.4,              // base half-width of the river in tiles (varied by noise)
  fords: 3,                     // crossings
  noise: { ore: .83, stone: .8, forest: .57 },   // noise level above which each kind of node grows
  chance: { ore: .6, stone: .6, forest: .7, strayTree: .02 },   // nodes are rich (see NODE_INFO), so they are thinner on the ground
  clearRadius: 8,               // nothing grows this close to a keep
  // The player's keep, as the [x, y] tile of its top-left corner. The enemy gets the mirror image.
  keep: [10, 60],
  // Clusters of nodes around each keep: centre, radius, kind, amount per tile.
  clusters: [
    { at: [19, 49], radius: 4, node: NODE.TREE, amount: 4 },
    { at: [24, 66], radius: 2.6, node: NODE.STONE, amount: 16 },
    { at: [4.5, 51], radius: 2.2, node: NODE.ORE, amount: 12 },
  ],
};

/** What each side starts with: the keep exactly there, the others at the nearest free spot to it. */
export const START_BUILDINGS = [
  { type: 'keep', at: [10, 60], exact: true },
  { type: 'hut', at: [14, 61] },
  { type: 'lodge', at: [14, 58] },
];
