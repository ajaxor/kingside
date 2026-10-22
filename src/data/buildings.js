// Every building (and the field plot, which is drawn like one), as data.
//
//   name, shortName   full name, and the shorter label under its icon in the build tray
//   size              footprint in tiles (size x size). Everything is 1 except the keep (2): the model sits in the middle of its tile and
//                     leaves a walkway round the edge, which your own people use to pass through
//   hp, cost          hit points and what planning it costs; buildTime is the seconds of work to raise it
//   desc              the explanation shown to the player
//   builder           who raises it: a unit kind, or 'any' (carpenters and masons both)
//   crew              { unit, count, interval, cost }: workers it houses, and how often (s) and at what cost it makes the next one
//   supply            goods it makes: [{ good, batch, max, cost }] (one batch every SUPPLY_INTERVAL seconds)
//   defence           shoots at enemy units: { range, damage, cooldown, height } plus, for ones that use arrows,
//                     { arrowsPerShot, maxArrows } and optionally boltScale. No maxArrows means it never runs dry.
//   income            { resource, amount, interval }: produces a resource by itself
//   training          the upgrade tree it trains from (src/data/upgrades.js)
//   courtyard         reserves a paved plot beside it where an officer waits and gathers a band
//   trap              { damage, charges, radius, cooldown }: a hidden one-use spike
//   linkable          walls: neighbours join up, so it is drawn as `models.post` plus `models.link` pieces instead of one model
//   paint             drag to place many: 'line' (walls) or 'plots' (fields, which cost wood and need no builder)
//   fordOk            may be built on a ford
//   replaces          a building of this type may be replaced by it in place (a gate over a wall)
//   note              one line shown in the status of a finished one (walls and gates)
//   barHeight         how high above the ground its health bar floats (default 1)
//
// The build tray lists BUILD_MENU in order.

import { BARRACKS_TREE, HALL_TREE, WORKSHOP_TREE } from './upgrades.js';

export const BUILDINGS = {
  keep: {
    name: 'Keep', size: 2, hp: 700, barHeight: 2.4, cost: {},
    desc: 'Your stockpile and seat of power. Shoots at nearby enemies. If it falls, you lose.',
    defence: { range: 5.5, damage: 6, cooldown: 1.3, height: 1.6 },
    income: { resource: 'food', amount: 1, interval: 5 },
  },
  hut: {
    name: "Carpenter's Hut", shortName: 'Carpenter', size: 1, hp: 160, cost: { wood: 30, stone: 10 }, buildTime: 6, builder: 'any',
    desc: 'Houses 2 carpenters who haul timber from the keep and raise every wooden structure you plan.',
    crew: { unit: 'carpenter', count: 2, interval: 7, cost: { food: 5 } },
  },
  lodge: {
    name: "Mason's Lodge", shortName: 'Mason', size: 1, hp: 170, cost: { wood: 20, stone: 25 }, buildTime: 7, builder: 'any',
    desc: 'Houses 2 masons who haul supplies and raise every stone structure: towers, walls, gates, bastions, quarries, mines and forges.',
    crew: { unit: 'mason', count: 2, interval: 7, cost: { food: 5 } },
  },
  mill: {
    name: 'Lumber Mill', size: 1, hp: 160, cost: { wood: 25 }, buildTime: 6, builder: 'carpenter',
    desc: 'Woodcutters fell marked trees, or the nearest ones if none are marked.',
    crew: { unit: 'cutter', count: 2, interval: 8, cost: { food: 5 } },
  },
  quarry: {
    name: 'Quarry', size: 1, hp: 180, cost: { wood: 30 }, buildTime: 7, builder: 'mason',
    desc: 'Masons cut marked stone, or the nearest outcrop.',
    crew: { unit: 'quarryman', count: 2, interval: 8, cost: { food: 5 } },
  },
  mine: {
    name: 'Iron Mine', size: 1, hp: 180, cost: { wood: 30, stone: 20 }, buildTime: 8, builder: 'mason',
    desc: 'Miners dig marked iron ore (rust-coloured rock).',
    crew: { unit: 'miner', count: 2, interval: 8, cost: { food: 5 } },
  },
  farm: {
    name: 'Farmstead', size: 1, hp: 150, cost: { wood: 25, stone: 5 }, buildTime: 6, builder: 'carpenter',
    desc: 'Houses 2 farmers who plant, wait on and harvest the Fields you lay out nearby. Food feeds every worker and soldier.',
    crew: { unit: 'farmer', count: 2, interval: 8, cost: { food: 5 } },
  },
  field: {
    name: 'Field', size: 1, hp: 1, cost: { wood: 2 }, paint: 'plots',
    desc: 'Drag to till plots near a Farmstead. A farmer plants each one, it ripens, then the farmer harvests it and must replant. Tap Raze, then a plot, to remove it.',
  },
  fletch: {
    name: 'Fletcher', size: 1, hp: 150, cost: { wood: 30, stone: 10 }, buildTime: 7, builder: 'carpenter',
    desc: 'Turns wood into arrows for towers and bows for archers. Runners carry them to whoever is short.',
    crew: { unit: 'runner', count: 2, interval: 8, cost: { food: 5 } },
    supply: [
      { good: 'arrows', batch: 5, max: 20, cost: { wood: 3 } },
      { good: 'bows', batch: 4, max: 8, cost: { wood: 2 } },
    ],
  },
  smith: {
    name: 'Blacksmith', size: 1, hp: 200, cost: { wood: 30, stone: 30 }, buildTime: 8, builder: 'mason',
    desc: 'Forges weapons from iron and wood. A runner brings them to barracks; footmen, men-at-arms, knights and halberdiers each need one.',
    crew: { unit: 'runner', count: 1, interval: 8, cost: { food: 5 } },
    supply: [{ good: 'weapons', batch: 4, max: 12, cost: { iron: 1, wood: 1 } }],
  },
  engineer: {
    name: "Engineer's Yard", shortName: 'Engineer', size: 1, hp: 190, cost: { wood: 40, stone: 15, iron: 5 }, buildTime: 8, builder: 'carpenter',
    desc: 'Engineers build traps and ballistae, and craft the parts crossbows and siege engines need, carrying them to barracks and workshops.',
    crew: { unit: 'engineer', count: 2, interval: 9, cost: { food: 5 } },
    supply: [{ good: 'parts', batch: 3, max: 9, cost: { wood: 2, iron: 1 } }],
  },
  tower: {
    name: 'Tower', size: 1, hp: 260, barHeight: 1.7, cost: { wood: 15, stone: 25 }, buildTime: 8, builder: 'mason', fordOk: true,
    desc: 'Shoots enemies within 6 tiles while it has arrows. Starts with 6.',
    defence: { range: 6.5, damage: 10, cooldown: 1, height: 1.4, arrowsPerShot: 1, maxArrows: 20 },
  },
  wall: {
    name: 'Stone Wall', size: 1, hp: 140, barHeight: .8, cost: { stone: 4 }, buildTime: 2, builder: 'mason', fordOk: true,
    linkable: true, models: { post: 'post', link: 'link' }, paint: 'line',
    note: 'Blocks your own people too. Use a gate.',
    desc: 'Drag to lay a line. Blocks everyone, your own people too, so leave a gate. Enemies must hack through.',
  },
  palisade: {
    name: 'Palisade', size: 1, hp: 70, barHeight: .8, cost: { wood: 2 }, buildTime: 1, builder: 'carpenter', fordOk: true,
    linkable: true, models: { post: 'ppost', link: 'plink' }, paint: 'line',
    note: 'Blocks your own people too. Use a gate.',
    desc: 'Cheap wooden stakes. Drag to lay a line. Blocks everyone, so leave a gate.',
  },
  gate: {
    name: 'Gate', size: 1, hp: 220, barHeight: 1.0, cost: { wood: 10, stone: 10 }, buildTime: 4, builder: 'mason', fordOk: true,
    linkable: true, models: { post: 'gate', link: 'link' }, replaces: 'wall',
    note: 'Friendly units pass through. Enemies must break it down.',
    desc: 'Friendly units walk through; enemies must break it. Tap an existing wall tile to replace it with a gate.',
  },
  trap: {
    name: 'Spike Trap', size: 1, hp: 60, cost: { wood: 6, iron: 2 }, buildTime: 2, builder: 'engineer',
    desc: 'Built by engineers. Anyone from the other team who steps here takes 38 damage. Four charges, then it is spent.',
    trap: { damage: 38, charges: 4, radius: .6, cooldown: 1.2 },
  },
  ballista: {
    name: 'Ballista', size: 1, hp: 200, cost: { wood: 20, stone: 20, iron: 10 }, buildTime: 8, builder: 'engineer', fordOk: true,
    desc: 'Built by engineers. Heavy bolts out to 9 tiles, 2 arrows a shot. A Fletcher keeps it supplied.',
    defence: { range: 9.5, damage: 30, cooldown: 2.6, height: .6, arrowsPerShot: 2, maxArrows: 20, boltScale: 1.8 },
  },
  bastion: {
    name: 'Bastion', size: 1, hp: 520, barHeight: 1.6, cost: { wood: 30, stone: 60, iron: 15 }, buildTime: 14, builder: 'mason',
    desc: 'Fortified tower: thick walls, 30 arrows, rapid fire out to 7 tiles.',
    defence: { range: 7.5, damage: 14, cooldown: .8, height: 1.5, arrowsPerShot: 1, maxArrows: 30 },
  },
  ranger: {
    name: 'Ranger Camp', size: 1, hp: 170, cost: { wood: 30, food: 20 }, buildTime: 7, builder: 'carpenter',
    desc: 'Up to 3 rangers patrol your land and shoot raiders on sight.',
    crew: { unit: 'ranger', count: 3, interval: 14, cost: { food: 10 } },
  },
  raider: {
    name: 'Raider Camp', size: 1, hp: 170, cost: { wood: 30, food: 20 }, buildTime: 7, builder: 'carpenter',
    desc: 'Up to 3 raiders roam enemy land hunting their workers.',
    crew: { unit: 'raider', count: 3, interval: 18, cost: { food: 12 } },
  },
  barracks: {
    name: 'Barracks', size: 1, hp: 220, cost: { wood: 40, stone: 30 }, buildTime: 9, builder: 'carpenter', training: BARRACKS_TREE,
    desc: 'Trains troops who march straight at the red keep, or join an officer waiting in a courtyard. Each needs a weapon: blades from a Blacksmith, bows from a Fletcher, crossbow parts from an Engineer. Upgrade down two branches: heavy arms or archery.',
  },
  hall: {
    name: 'Officer Hall', size: 1, hp: 200, cost: { wood: 40, stone: 20 }, buildTime: 9, builder: 'carpenter', training: HALL_TREE, courtyard: true,
    desc: 'Trains one officer at a time. He holds the paved courtyard and gathers troops as they are trained, then marches. The next officer is trained once he has deployed. Upgrade for bigger bands, specialist captains, or generals.',
  },
  workshop: {
    name: 'Siege Workshop', size: 1, hp: 240, cost: { wood: 60, stone: 20, iron: 10 }, buildTime: 10, builder: 'carpenter', training: WORKSHOP_TREE,
    desc: 'Builds rams that break buildings, each needing parts from an Engineer. Upgrade to catapults and trebuchets that out-range towers.',
  },
};

/** Order of the build tray. */
export const BUILD_MENU = [
  'hut', 'lodge', 'mill', 'quarry', 'mine', 'farm', 'field', 'fletch', 'smith', 'engineer', 'tower', 'ballista', 'bastion',
  'palisade', 'wall', 'gate', 'trap', 'ranger', 'raider', 'barracks', 'hall', 'workshop',
];

// Questions asked of a building type.
export const isLinkable = (type) => !!BUILDINGS[type].linkable;
export const usesArrows = (type) => !!BUILDINGS[type].defence?.maxArrows;
/** The building that houses a kind of worker (carpenter -> the hut), for telling the player what to build. */
export const homeOf = (unitKind) => Object.keys(BUILDINGS).find((type) => BUILDINGS[type].crew?.unit === unitKind);
