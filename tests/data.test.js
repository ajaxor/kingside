import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, BUILD_MENU } from '../src/data/buildings.js';
import { UNITS } from '../src/data/units.js';
import { RESOURCES, RESOURCE_IDS } from '../src/data/resources.js';
import { GOODS } from '../src/data/goods.js';
import { NODE } from '../src/data/terrain.js';
import { PLAN, LOOP } from '../src/data/ai.js';
import { START_BUILDINGS } from '../src/data/map.js';
import { BUILDING_MODELS } from '../src/render/models/buildings.js';
import { C } from '../src/render/palette.js';

const costsAreValid = (cost, where) => { for (const [r, n] of Object.entries(cost)) { assert.ok(RESOURCES[r], `${where}: unknown resource ${r}`); assert.ok(n > 0, `${where}: ${r} cost`); } };
const walkTree = (node, visit) => { visit(node); node.upgrades.forEach((n) => walkTree(n, visit)); };

test('every building is complete and uses known resources, units and goods', () => {
  for (const [type, def] of Object.entries(BUILDINGS)) {
    assert.ok(def.name && def.size >= 1 && def.hp > 0, type);
    costsAreValid(def.cost, type);
    if (def.builder && def.builder !== 'any') assert.ok(UNITS[def.builder], `${type}: builder ${def.builder}`);
    if (def.crew) { assert.ok(UNITS[def.crew.unit], `${type}: crew`); costsAreValid(def.crew.cost, type + ' crew'); }
    for (const s of def.supply || []) { assert.ok(GOODS[s.good], `${type}: good ${s.good}`); costsAreValid(s.cost, type + ' supply'); }
    if (def.income) assert.ok(RESOURCES[def.income.resource], type);
    if (def.linkable) for (const id of Object.values(def.models)) assert.ok(BUILDING_MODELS[id], `${type}: model ${id}`);
    else if (type !== 'field') assert.ok(BUILDING_MODELS[type], `${type} has no model`);
  }
});

test('the build menu lists real buildings once each', () => {
  assert.equal(new Set(BUILD_MENU).size, BUILD_MENU.length);
  for (const t of BUILD_MENU) assert.ok(BUILDINGS[t], t);
});

test('every unit is complete, and soldiers name equipment that exists', () => {
  for (const [kind, def] of Object.entries(UNITS)) {
    assert.ok(def.name && def.hp > 0 && def.speed > 0 && def.look?.color, kind);
    if (def.needs) assert.ok(GOODS[def.needs.good], kind);
    if (def.train) costsAreValid(def.train.cost, kind);
    if (def.gather) { assert.ok(Object.values(NODE).includes(def.gather.node), kind); assert.ok(RESOURCES[def.gather.yields], kind); }
  }
});

test('upgrade trees only produce real units and charge real resources', () => {
  for (const [type, def] of Object.entries(BUILDINGS)) {
    if (!def.training) continue;
    walkTree(def.training, (node) => { assert.ok(UNITS[node.produces], `${type}: ${node.produces}`); assert.ok(UNITS[node.produces].train, `${type}: ${node.produces} is not trainable`); if (node.cost) costsAreValid(node.cost, node.name); });
  }
});

test('the computer player only plans buildings that exist, and carry colours are in the palette', () => {
  for (const t of [...PLAN, ...LOOP]) assert.ok(BUILDINGS[t], t);
  for (const s of START_BUILDINGS) assert.ok(BUILDINGS[s.type], s.type);
  for (const r of RESOURCE_IDS) assert.ok(C[RESOURCES[r].carry], r);
  for (const g of Object.values(GOODS)) assert.ok(C[g.carry]);
});
