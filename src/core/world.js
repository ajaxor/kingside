// The state of one game, shared by the rules (src/game/), the renderer and the UI. Nothing here knows how to do anything: the arrays and
// lists are created once and cleared in place by resetWorld(), so any module can import them and always see the current game.

import { TILES, TEAM_COUNT } from './config.js';
import { START_STOCK } from '../data/balance.js';
import { FIELD } from '../data/terrain.js';

// ---- the map, one entry per tile (index = y * MAP_SIZE + x) ----
export const ground = new Uint8Array(TILES);          // TERRAIN: land, water or ford
export const nodeKind = new Uint8Array(TILES);        // NODE: tree, stone or ore on the tile (0 = none)
export const nodeLeft = new Uint8Array(TILES);        // harvests left in that node
export const marked = new Uint8Array(TILES);          // the player marked this node for workers to take first
export const claims = new Uint8Array(TILES);          // workers currently heading for this tile
export const field = new Uint8Array(TILES);           // FIELD state of a tilled plot
export const fieldTeam = new Int8Array(TILES);        // who tilled it (-1 = nobody)
export const fieldAge = new Float32Array(TILES);      // seconds a planted plot has been growing
export const yardOwner = new Int32Array(TILES);       // id of the officer hall whose courtyard this tile is part of
export const occupant = new Int32Array(TILES);        // id of the building standing on the tile (0 = none)
export const road = new Uint8Array(TILES);            // a trail carved between the keeps and the fords
export const nearWater = new Uint8Array(TILES);       // land next to water (drawn sandy)
export const tileRandom = new Float32Array(TILES);    // per-tile random number (path-cost tiebreak)
export const grassNoise = new Float32Array(TILES);    // smooth noise for drawing the grass
export const unreachable = Array.from({ length: TEAM_COUNT }, () => new Float32Array(TILES));  // per team: game time until which a tile is not tried again

// ---- the things in play ----
export const buildings = [];                          // every building, including plans
export const buildingsById = new Map();
export const units = [];
export const arrows = [];                             // arrows and rocks in flight
export const effects = [];                            // puffs of dust

/** Per side: { ai, stock, keep, ...computer-player timers }. */
export const teams = [];

/** Scalars of the running game. */
export const game = {
  time: 0, over: false, running: false, paused: false, speed: 1, seed: 0,
  nextBuildingId: 1, nextUnitId: 1,
  nearTimer: 0,                                       // how long until the next "troops closing on your keep" check
  terrainDirty: true,                                 // the terrain mesh needs rebuilding (a node was harvested)
};

export function makeTeam(ai) {
  return { ai, stock: { ...START_STOCK }, keep: null, aiTimer: 6, planStep: 0, trickleTimer: 0 };
}

/** Clear everything for a new game. `ai` says which sides the computer plays. */
export function resetWorld(seed, ai = [false, true]) {
  for (const a of [ground, nodeKind, nodeLeft, marked, claims, field, fieldAge, yardOwner, occupant, road, nearWater, tileRandom, grassNoise]) a.fill(0);
  fieldTeam.fill(-1);
  field.fill(FIELD.NONE);
  for (const u of unreachable) u.fill(0);
  buildings.length = 0; buildingsById.clear(); units.length = 0; arrows.length = 0; effects.length = 0;
  teams.length = 0;
  for (let t = 0; t < TEAM_COUNT; t++) teams.push(makeTeam(!!ai[t]));
  Object.assign(game, { time: 0, over: false, running: false, paused: false, speed: 1, seed, nextBuildingId: 1, nextUnitId: 1, nearTimer: 0, terrainDirty: true });
}

