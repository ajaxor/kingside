// How the computer opponent plays. It builds in a fixed order (PLAN) and then cycles through LOOP, tills fields around its
// farmsteads, upgrades training buildings on a timer, and receives a small free income (TRICKLE) so it keeps pace with a human.

import { NODE } from './terrain.js';

export const PLAN = [
  'mill', 'farm', 'quarry', 'farm', 'raider', 'mine', 'smith', 'barracks', 'fletch', 'tower', 'farm', 'ranger', 'tower', 'hall',
  'engineer', 'barracks', 'mill', 'farm', 'tower', 'workshop', 'raider', 'ballista', 'barracks', 'bastion', 'tower',
];
export const LOOP = ['farm', 'tower', 'barracks', 'ballista', 'quarry', 'mine', 'tower', 'smith'];

export const AI = {
  firstThinkAt: 6,              // seconds before its first decision
  thinkEvery: 4,                // seconds between decisions
  maxUnfinished: 2,             // it waits while this many of its buildings are still being raised
  trickle: { wood: .45, stone: .3, food: .35, iron: .16 },   // free income each second
  upgradeAfter: 130,            // first upgrade no earlier than this many seconds in, then once per further interval of it
  fieldsPerFarm: 7,
  fieldRadius: 5,
  placeAttempts: 500,           // random spots tried for each building
  placeRadius: [3, 14],         // distance from its keep it builds at (min, max)
};

/** Buildings it places near the thing they use: [node, weight per such tile within 5 tiles]. */
export const PLACEMENT_NEAR = { mill: [NODE.TREE, 1.2], quarry: [NODE.STONE, 2], mine: [NODE.ORE, 2.5] };
/** Buildings it places toward the enemy. */
export const FRONT_LINE = new Set(['tower', 'barracks', 'ranger', 'ballista', 'bastion', 'hall', 'workshop']);
