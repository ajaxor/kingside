// Every kind of unit, as data.
//
//   role      worker  does a job for a building (gather, build, haul, farm); flees nothing, fights nothing
//             patrol  fights on its own near its camp: rangers defend, raiders hunt enemy workers
//             troop   trained at a barracks or hall; marches on the enemy keep, alone or behind an officer
//             siege   trained at a workshop; marches on the enemy keep and breaks buildings
//   brain     which behaviour drives it (src/game/brains/)
//   hp, speed (tiles/s), damage + range (tiles) + cooldown (s) for fighters; buildingDamage for siege
//   family    infantry | ranged: what an officer's `take` filter matches
//   command   1 officer, 2 general: gathers troops into a band
//   gather    { node, yields, amount, time, claimLimit } for gatherers: what they harvest, how much per trip, how long it takes,
//             and how many workers may share one tile
//   needs     { good, count } equipment consumed to train the unit
//   train     { cost, time } what it costs and how long it takes to train
//   artillery shoots buildings from range instead of ramming them
//   look      colour, scale, barHeight (health bar height), mounted: how it is drawn (src/render/models/). Everyone is drawn about
//             .45 tiles tall at scale 1, so a tile has room for a building and people walking round it.

import { NODE } from './terrain.js';

export const UNITS = {
  carpenter: { name: 'Carpenter', role: 'worker', brain: 'builder', hp: 25, speed: 1.7, look: { color: [.88, .70, .34] } },
  mason: { name: 'Mason', role: 'worker', brain: 'builder', hp: 25, speed: 1.6, look: { color: [.74, .72, .68] } },
  engineer: { name: 'Engineer', role: 'worker', brain: 'engineer', hp: 30, speed: 1.8, look: { color: [.58, .52, .66] } },
  cutter: {
    name: 'Woodcutter', role: 'worker', brain: 'gatherer', hp: 25, speed: 1.6, look: { color: [.45, .60, .33] },
    gather: { node: NODE.TREE, yields: 'wood', amount: 5, time: 2.6, claimLimit: 1 },
  },
  quarryman: {
    name: 'Quarryman', role: 'worker', brain: 'gatherer', hp: 25, speed: 1.5, look: { color: [.64, .62, .58] },
    gather: { node: NODE.STONE, yields: 'stone', amount: 5, time: 3.4, claimLimit: 2 },
  },
  miner: {
    name: 'Miner', role: 'worker', brain: 'gatherer', hp: 25, speed: 1.5, look: { color: [.40, .38, .42] },
    gather: { node: NODE.ORE, yields: 'iron', amount: 4, time: 3.6, claimLimit: 2 },
  },
  runner: { name: 'Runner', role: 'worker', brain: 'runner', hp: 25, speed: 2.1, look: { color: [.80, .64, .44] } },
  farmer: { name: 'Farmer', role: 'worker', brain: 'farmer', hp: 25, speed: 1.6, look: { color: [.82, .70, .42] } },

  ranger: {
    name: 'Ranger', role: 'patrol', brain: 'ranger', hp: 55, speed: 2.0, damage: 7, range: 4.5, cooldown: 1.1,
    look: { color: [.32, .46, .30], tunic: [.30, .46, .28] },
  },
  raider: {
    name: 'Raider', role: 'patrol', brain: 'raider', hp: 45, speed: 2.3, damage: 6, range: .9, cooldown: .9,
    look: { color: [.46, .32, .26], tunic: [.40, .29, .23] },
  },

  soldier: {
    name: 'Footman', role: 'troop', family: 'infantry', hp: 80, speed: 1.7, damage: 9, range: .95, cooldown: 1, look: { color: [.58, .6, .64] },
    needs: { good: 'weapons', count: 1 }, train: { cost: { food: 10, wood: 6 }, time: 12 },
  },
  manatarms: {
    name: 'Man-at-Arms', role: 'troop', family: 'infantry', hp: 150, speed: 1.45, damage: 12, range: .95, cooldown: 1, look: { color: [.46, .48, .54] },
    needs: { good: 'weapons', count: 1 }, train: { cost: { food: 14, iron: 12 }, time: 15 },
  },
  knight: {
    name: 'Knight', role: 'troop', family: 'infantry', hp: 170, speed: 2.5, damage: 15, range: 1, cooldown: 1,
    look: { color: [.62, .64, .7], mounted: true, scale: .8, barHeight: .8 },
    needs: { good: 'weapons', count: 1 }, train: { cost: { food: 20, iron: 22 }, time: 20 },
  },
  halberd: {
    name: 'Halberdier', role: 'troop', family: 'infantry', hp: 130, speed: 1.5, damage: 18, range: 1.2, cooldown: 1.3,
    look: { color: [.5, .52, .58], barHeight: .95 },
    needs: { good: 'weapons', count: 1 }, train: { cost: { food: 12, iron: 14 }, time: 16 },
  },
  archer: {
    name: 'Archer', role: 'troop', family: 'ranged', hp: 50, speed: 1.7, damage: 8, range: 5, cooldown: 1.2, look: { color: [.42, .5, .34] },
    needs: { good: 'bows', count: 1 }, train: { cost: { food: 10, wood: 6 }, time: 12 },
  },
  crossbow: {
    name: 'Crossbowman', role: 'troop', family: 'ranged', hp: 60, speed: 1.55, damage: 20, range: 6, cooldown: 2, look: { color: [.5, .45, .4] },
    needs: { good: 'parts', count: 1 }, train: { cost: { food: 14, iron: 10, wood: 8 }, time: 16 },
  },
  longbow: {
    name: 'Longbowman', role: 'troop', family: 'ranged', hp: 50, speed: 1.7, damage: 9, range: 8, cooldown: 1, look: { color: [.36, .48, .3] },
    needs: { good: 'bows', count: 1 }, train: { cost: { food: 10, wood: 12 }, time: 13 },
  },
  officer: {
    name: 'Officer', role: 'troop', command: 1, hp: 140, speed: 1.6, damage: 10, range: 1, cooldown: 1,
    look: { color: [.6, .62, .68], barHeight: .8 }, train: { cost: { food: 20, iron: 10 }, time: 28 },
  },
  general: {
    name: 'General', role: 'troop', command: 2, hp: 260, speed: 1.8, damage: 16, range: 1, cooldown: 1,
    look: { color: [.7, .66, .5], mounted: true, scale: .8, barHeight: .9 }, train: { cost: { food: 40, iron: 30 }, time: 50 },
  },

  ram: {
    name: 'Battering Ram', role: 'siege', hp: 220, speed: 1.0, buildingDamage: 28, range: 1, cooldown: 1.6,
    look: { color: [.5, .4, .3], scale: .75, barHeight: .6 },
    needs: { good: 'parts', count: 2 }, train: { cost: { wood: 30, iron: 5 }, time: 30 },
  },
  ironram: {
    name: 'Ironclad Ram', role: 'siege', hp: 450, speed: .95, buildingDamage: 50, range: 1, cooldown: 1.7,
    look: { color: [.5, .4, .3], scale: .75, barHeight: .6 },
    needs: { good: 'parts', count: 3 }, train: { cost: { wood: 40, iron: 25 }, time: 40 },
  },
  catapult: {
    name: 'Catapult', role: 'siege', artillery: true, hp: 90, speed: .9, buildingDamage: 30, range: 7.5, cooldown: 3.5,
    look: { color: [.5, .4, .3], scale: .75, barHeight: .6 },
    needs: { good: 'parts', count: 3 }, train: { cost: { wood: 35, stone: 15, iron: 8 }, time: 35 },
  },
  trebuchet: {
    name: 'Trebuchet', role: 'siege', artillery: true, hp: 110, speed: .8, buildingDamage: 60, range: 10.5, cooldown: 4.5,
    look: { color: [.5, .4, .3], scale: .75, barHeight: .75 },
    needs: { good: 'parts', count: 4 }, train: { cost: { wood: 50, stone: 25, iron: 20 }, time: 50 },
  },
};

export const UNIT_KINDS = Object.keys(UNITS);

// What a unit does, asked of its kind.
export const isWorker = (kind) => UNITS[kind].role === 'worker';
export const isTroop = (kind) => UNITS[kind].role === 'troop';
export const isSiege = (kind) => UNITS[kind].role === 'siege';
/** Fights other units by itself (patrols and troops). Siege machines only break buildings. */
export const isFighter = (kind) => UNITS[kind].role === 'troop' || UNITS[kind].role === 'patrol';
export const isCommander = (kind) => !!UNITS[kind].command;

/** Units limited together as one group: officers, generals and siege machines count toward their own cap (src/data/balance.js). */
export function capGroup(kind) {
  const def = UNITS[kind];
  return def.command === 1 ? 'officer' : def.command === 2 ? 'general' : def.role === 'siege' ? 'siege' : 'line';
}
