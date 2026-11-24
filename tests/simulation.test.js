import test from 'node:test';
import assert from 'node:assert/strict';
import { seedRandom } from '../src/core/random.js';
import { on } from '../src/core/events.js';
import { SIM_STEP } from '../src/core/config.js';
import { buildings, game, teams, units } from '../src/core/world.js';
import { newGame } from '../src/game/flow.js';
import { tick } from '../src/game/sim.js';
import { UNITS } from '../src/data/units.js';
import { buildingAt, isPlanOnly, tileAt } from '../src/game/query.js';
import { spawnUnit } from '../src/game/units.js';
import { walkCost } from '../src/game/pathing.js';
import { placeBuilding } from '../src/game/buildings.js';

/** Play `seconds` of game time with the computer running both sides. */
function selfPlay(seed, seconds) {
  seedRandom(seed);
  const events = [];
  const off = [on('toast', (e) => events.push(['toast', e])), on('game-over', (e) => events.push(['game-over', e]))];
  newGame({ seed, ai: [true, true] });
  game.running = true;
  for (let t = 0; t < seconds && game.running; t += SIM_STEP) tick(SIM_STEP);
  off.forEach((f) => f());
  seedRandom();
  return events;
}

const finite = (list, keys) => list.every((o) => keys.every((k) => Number.isFinite(o[k])));

test('a new game gives each side a keep, a hut and a lodge', () => {
  newGame({ seed: 1 });
  for (const team of [0, 1]) {
    const types = buildings.filter((b) => b.team === team).map((b) => b.type).sort();
    assert.deepEqual(types, ['hut', 'keep', 'lodge']);
    assert.ok(teams[team].keep.built);
    assert.equal(teams[team].keep.size, 3);
  }
});

test('two computer players build, train and fight without breaking the world', () => {
  selfPlay(42, 400);
  assert.ok(finite(units, ['x', 'z', 'hp']), 'unit positions and health are numbers');
  assert.ok(finite(buildings, ['hp', 'progress']), 'building health is a number');
  assert.ok(buildings.filter((b) => b.built).length > 6, 'buildings get completed');
  assert.ok(buildings.some((b) => b.size > 1), 'buildings take more than one tile');
  assert.ok(units.length > 4, 'units appear');
  for (const t of teams) for (const v of Object.values(t.stock)) assert.ok(Number.isFinite(v) && v > -1e-6, 'stock stays a sane number');
  for (const u of units) assert.ok(u.x >= -1 && u.z >= -1 && u.x <= 73 && u.z <= 73, 'units stay on the map');
});

test('the same seed plays out the same way', () => {
  const snapshot = () => JSON.stringify([game.time.toFixed(2), buildings.length, units.length, teams.map((t) => Object.values(t.stock).map(Math.floor))]);
  selfPlay(7, 120); const a = snapshot();
  selfPlay(7, 120); const b = snapshot();
  assert.equal(a, b);
});

test('a long game ends with a keep falling, and says so', { timeout: 120000 }, () => {
  let ended = null;
  for (const seed of [3, 11, 21]) {
    const events = selfPlay(seed, 1800);
    ended = events.find(([name]) => name === 'game-over');
    if (ended) break;
  }
  assert.ok(ended, 'one of the games reaches a result');
  assert.match(ended[1].result, /^(win|lose)$/);
  assert.ok(ended[1].time > 0);
});

test('nobody ends up standing inside a building or a started building site', () => {
  // A person fills a whole tile, so buildings are solid. This used to fail: a worker whose path ended on a tile of its own building
  // circled the rim for ever. Count every worker step spent inside a solid building (a finished one, or a site with supplies or work in it).
  const solid = (b) => b && b.type !== 'gate' && b.type !== 'trap' && !isPlanOnly(b);
  let inside = 0, longest = 0;
  for (const seed of [1, 2]) {
    seedRandom(seed);
    newGame({ seed, ai: [true, true] });
    game.running = true;
    const streak = new Map();
    for (let t = 0; t < 600; t += SIM_STEP) {
      tick(SIM_STEP);
      for (const u of units) {
        if (UNITS[u.kind].role !== 'worker') continue;
        const there = solid(buildingAt(tileAt(u.x, u.z)));
        const run = there ? (streak.get(u.id) || 0) + SIM_STEP : 0;
        streak.set(u.id, run);
        if (there) inside++;
        longest = Math.max(longest, run);
      }
    }
    seedRandom();
  }
  assert.ok(longest < 3, `a worker spent ${longest.toFixed(1)}s in a row inside a building`);
  assert.ok(inside * SIM_STEP < 3, `${(inside * SIM_STEP).toFixed(1)}s of worker time spent inside buildings`);
});

test('a unit buried inside a new building walks out to open ground', () => {
  newGame({ seed: 1 });
  const keep = teams[0].keep;
  const u = spawnUnit(keep, 'cutter');
  assert.ok(u, 'a cutter appears beside the keep');
  u.x = keep.i + 1.5; u.z = keep.j + 1.5;                                  // the very middle of the 3x3 keep
  for (let t = 0; t < 2; t += SIM_STEP) tick(SIM_STEP);
  assert.ok(!buildingAt(tileAt(u.x, u.z)), 'it is out on open ground');
});

test('buildings are solid to everyone, your own included; gates, traps and untouched plans can be stepped on', () => {
  newGame({ seed: 1 });
  const keep = teams[0].keep, k = keep.j * 72 + keep.i;
  assert.equal(walkCost(0, k, false), 0, 'your own keep blocks you');
  assert.equal(walkCost(1, k, false), 0, 'and the enemy');
  assert.ok(walkCost(1, k, true) > 0, 'unless they mean to hack through');
  const open = (di, dj) => (keep.j + dj) * 72 + keep.i + di;
  const spot = [[-4, 8], [-5, 8], [-6, 8], [-4, 9]].find(([di, dj]) => walkCost(0, open(di, dj), false));
  const [di, dj] = spot;
  const gate = placeBuilding(0, 'gate', keep.i + di, keep.j + dj, true);
  assert.ok(gate.built && walkCost(0, open(di, dj), false) > 0, 'your own gate is a way through');
  assert.equal(walkCost(1, open(di, dj), false), 0, 'but not for the enemy');
  const plan = placeBuilding(0, 'trap', keep.i + di + 1, keep.j + dj, false);
  assert.ok(plan && walkCost(0, open(di + 1, dj), false) > 0, 'a trap can be stepped on');
});
