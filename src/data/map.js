// How the map is laid out. The map is symmetric: the enemy's side is the player's rotated half a turn.

import { NODE } from './terrain.js';

export const MAP_GEN = {
  riverWidth: 1.15,             // base half-width of the river in tiles (varied by noise)
  fords: 3,                     // crossings
  noise: { ore: .83, stone: .8, forest: .57 },   // noise level above which each kind of node grows
  chance: { ore: .8, stone: .85, forest: .88, strayTree: .025 },
  clearRadius: 6.2,             // nothing grows this close to a keep
  // The player's starting spots, as [x, y] tile positions of the top-left corner. The enemy gets the mirror image.
  keep: [7, 40],
  // Clusters of nodes around each keep: centre, radius, kind, amount per tile.
  clusters: [
    { at: [13.5, 33.5], radius: 2.7, node: NODE.TREE, amount: 3 },
    { at: [17.5, 45], radius: 1.6, node: NODE.STONE, amount: 6 },
    { at: [3.5, 34.5], radius: 1.4, node: NODE.ORE, amount: 5 },
  ],
};

/** What each side starts with: the keep exactly there, the others at the nearest free spot to it. */
export const START_BUILDINGS = [
  { type: 'keep', at: [7, 40], exact: true },
  { type: 'hut', at: [11, 41] },
  { type: 'lodge', at: [11, 38] },
];
