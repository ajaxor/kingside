import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_MODELS, buildBuildingModel } from '../src/render/models/buildings.js';
import { buildUnitModel } from '../src/render/models/units.js';
import { PROPS, buildProp } from '../src/render/models/props.js';
import { UNIT_KINDS } from '../src/data/units.js';
import { buildTerrain } from '../src/render/terrain.js';
import { newGame } from '../src/game/flow.js';

const sound = (m, what) => {
  assert.ok(m.p.length > 0 && m.p.length === m.n.length && m.p.length === m.c.length, what);
  for (const a of [m.p, m.n, m.c]) for (const v of a) assert.ok(Number.isFinite(v), `${what}: non-finite value`);
};

test('every building model builds for both teams', () => {
  for (const id of Object.keys(BUILDING_MODELS)) for (const team of [0, 1]) sound(buildBuildingModel(id, team), id);
});

test('every unit model builds for both teams', () => {
  for (const kind of UNIT_KINDS) for (const team of [0, 1]) sound(buildUnitModel(kind, team), kind);
});

test('every prop builds', () => { for (const id of Object.keys(PROPS)) sound(buildProp(id), id); });

test('the terrain of a generated map builds', () => {
  newGame({ seed: 12345 });
  sound(buildTerrain(), 'terrain');
});
