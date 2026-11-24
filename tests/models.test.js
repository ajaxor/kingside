import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_MODELS, buildBuildingModel } from '../src/render/models/buildings.js';
import { buildUnitModel, UNIT_WIDTH } from '../src/render/models/units.js';
import { modelRise, modelScale } from '../src/render/scene.js';
import { BUILDINGS } from '../src/data/buildings.js';
import { PROPS, buildProp } from '../src/render/models/props.js';
import { UNIT_KINDS } from '../src/data/units.js';
import { buildTerrain, buildNodes } from '../src/render/terrain.js';
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
  sound(buildNodes(), 'nodes');
});

const extent = (m, axis) => { let lo = Infinity, hi = -Infinity; for (let i = axis; i < m.p.length; i += 3) { lo = Math.min(lo, m.p[i]); hi = Math.max(hi, m.p[i]); } return hi - lo; };

test('a person is drawn about a tile wide: the body is a .2 cylinder in the model, stretched by UNIT_WIDTH', () => {
  assert.ok(UNIT_WIDTH * .2 >= .7 && UNIT_WIDTH * .2 <= 1, `a body is ${(UNIT_WIDTH * .2).toFixed(2)} tiles wide`);
});

test('every building is drawn to fill most of its footprint, and not spill out of it', () => {
  for (const [type, def] of Object.entries(BUILDINGS)) {
    if (def.linkable || def.paint) continue;                     // walls are drawn from posts and links, fields are tiles
    const m = buildBuildingModel(type, 0), s = modelScale(type);
    for (const axis of [0, 2]) {
      const drawn = extent(m, axis) * s;
      assert.ok(drawn >= def.size * .7 && drawn <= def.size, `${type}: ${drawn.toFixed(2)} tiles across a ${def.size}-tile footprint`);
    }
    assert.ok(extent(m, 1) * s * modelRise(type) > 0, type);
  }
  assert.ok(Object.values(BUILDINGS).some((d) => d.size === 3) && Object.values(BUILDINGS).filter((d) => d.size === 2).length > 8, 'the keep and most workplaces are multi-tile');
});
