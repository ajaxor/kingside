// Upgrade trees of the training buildings. A building starts at its tree's root and each upgrade moves it one node down a branch.
//
//   name, desc   shown on the upgrade button
//   cost         what the upgrade costs the player
//   produces     the unit kind the building trains at this node
//   cap, take    officers only: how many troops a band holds, and which `family` of troops they accept (null = any)
//   upgrades     the nodes you can move to from here

export const BARRACKS_TREE = {
  name: 'Footmen', produces: 'soldier', upgrades: [
    {
      name: 'Heavy Arms', desc: 'Armoured men-at-arms: slow, tough, hit hard.', cost: { wood: 30, stone: 30, iron: 15 }, produces: 'manatarms', upgrades: [
        { name: 'Knights', desc: 'Mounted shock troops. Very fast, high damage, costly.', cost: { stone: 40, iron: 40 }, produces: 'knight', upgrades: [] },
        { name: 'Halberdiers', desc: 'Long polearms. Heavy damage, slower swing.', cost: { stone: 30, iron: 30 }, produces: 'halberd', upgrades: [] },
      ],
    },
    {
      name: 'Archery Range', desc: 'Bowmen shoot from behind the front line.', cost: { wood: 50, stone: 10 }, produces: 'archer', upgrades: [
        { name: 'Crossbows', desc: 'Slow but punishing bolts, range 6.', cost: { wood: 40, iron: 25 }, produces: 'crossbow', upgrades: [] },
        { name: 'Longbows', desc: 'Cheap and quick. Range 8 outreaches towers.', cost: { wood: 50, stone: 10 }, produces: 'longbow', upgrades: [] },
      ],
    },
  ],
};

export const HALL_TREE = {
  name: 'Officers', produces: 'officer', cap: 5, take: null, upgrades: [
    {
      name: 'Muster Captains', desc: 'Officers lead bands of 8 troops of any kind.', cost: { wood: 30, stone: 30 }, produces: 'officer', cap: 8, take: null, upgrades: [
        { name: 'Generals', desc: 'Mounted generals replace officers and lead 14 troops of any kind.', cost: { wood: 50, stone: 40, iron: 25 }, produces: 'general', cap: 14, take: null, upgrades: [] },
      ],
    },
    {
      name: 'Infantry Captains', desc: 'Officers take only footmen, men-at-arms, knights and halberdiers: bands of 8.', cost: { wood: 30, stone: 30 }, produces: 'officer', cap: 8, take: 'infantry', upgrades: [
        { name: 'Vanguard Captains', desc: 'Infantry-only bands of 12.', cost: { wood: 40, stone: 40, iron: 15 }, produces: 'officer', cap: 12, take: 'infantry', upgrades: [] },
      ],
    },
    {
      name: 'Archer Captains', desc: 'Officers take only archers, crossbowmen and longbowmen: bands of 8.', cost: { wood: 40, stone: 20 }, produces: 'officer', cap: 8, take: 'ranged', upgrades: [
        { name: 'Marksman Captains', desc: 'Ranged-only bands of 12.', cost: { wood: 50, stone: 20, iron: 10 }, produces: 'officer', cap: 12, take: 'ranged', upgrades: [] },
      ],
    },
  ],
};

export const WORKSHOP_TREE = {
  name: 'Battering Rams', produces: 'ram', upgrades: [
    { name: 'Ironclad Rams', desc: 'Plated rams with double the hull and nearly double the punch.', cost: { wood: 40, stone: 20, iron: 30 }, produces: 'ironram', upgrades: [] },
    {
      name: 'Artillery', desc: 'Catapults lob stone from 7 tiles. Upgrade again for trebuchets.', cost: { wood: 50, stone: 30, iron: 10 }, produces: 'catapult', upgrades: [
        { name: 'Trebuchets', desc: 'Out-range every tower. Slow, ruinous to walls.', cost: { wood: 60, stone: 50, iron: 30 }, produces: 'trebuchet', upgrades: [] },
      ],
    },
  ],
};

/** Who may be told to take only some troops: the label shown for an officer's `take` filter. */
export const TAKE_LABEL = { infantry: 'infantry only', ranged: 'ranged only' };
