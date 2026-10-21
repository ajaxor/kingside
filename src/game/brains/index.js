// Runs one unit's behaviour for one simulation step. Each unit kind names its `brain` in src/data/units.js (troops and siege machines
// use their role); this table says which function that is.

import { UNITS } from '../../data/units.js';
import { unstick } from '../movement.js';
import { thinkBuilder } from './builder.js';
import { thinkFarmer } from './farmer.js';
import { thinkGatherer } from './gatherer.js';
import { thinkRaider, thinkRanger } from './patrol.js';
import { thinkEngineer, thinkRunner } from './runner.js';
import { thinkSiege } from './siege.js';
import { thinkTroop } from './troop.js';

const BRAINS = {
  builder: thinkBuilder, engineer: thinkEngineer, gatherer: thinkGatherer, runner: thinkRunner, farmer: thinkFarmer,
  ranger: thinkRanger, raider: thinkRaider, troop: thinkTroop, siege: thinkSiege,
};

export function updateUnit(u, dt) {
  u.moving = false; u.working = false;
  u.anim += dt; u.scanTimer -= dt; u.cooldown -= dt;
  if (u.hitTimer > 0) u.hitTimer -= dt;
  const def = UNITS[u.kind];
  BRAINS[def.brain ?? def.role](u, dt);
  unstick(u, dt);
}
