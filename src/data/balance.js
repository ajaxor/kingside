// Game-wide tuning numbers. (Per-building and per-unit numbers are in buildings.js and units.js.)

/** What each side starts with. */
export const START_STOCK = { wood: 80, stone: 40, food: 50, iron: 12 };

/** Seconds for a planted field to ripen. */
export const CROP_GROW_SECONDS = 22;
/** Food a farmer brings home from one harvest. */
export const HARVEST_FOOD = 5;
/** Arrows a tower, ballista or bastion starts with. */
export const START_ARROWS = 6;
/** Seconds between a fletcher's, smith's or engineer's batches. */
export const SUPPLY_INTERVAL = 6.5;
/** Most of one good a training building keeps in stock. */
export const GOODS_STOCK_MAX = 10;

/** How many of each group of units a side may field at once (see capGroup in units.js). */
export const UNIT_CAPS = { line: Infinity, officer: 8, general: 6, siege: 6 };

/** The speed button cycles through these. */
export const GAME_SPEEDS = [1, 2, 3];

/** Seconds an officer waits for troops before marching with what he has: (officer, general). */
export const COMMANDER_PATIENCE = { 1: 100, 2: 150 };

/** A rock from a catapult also hurts units near where it lands: within `radius` tiles, for `fraction` of its damage. */
export const ROCK_SPLASH = { radius: 1.4, fraction: .5 };
