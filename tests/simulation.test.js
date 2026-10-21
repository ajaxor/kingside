import test from 'node:test';
import assert from 'node:assert/strict';
import { seedRandom } from '../src/core/random.js';
import { on } from '../src/core/events.js';
import { SIM_STEP } from '../src/core/config.js';
import { buildings, game, teams, units } from '../src/core/world.js';
import { newGame } from '../src/game/flow.js';
import { tick } from '../src/game/sim.js';

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
  }
});

test('two computer players build, train and fight without breaking the world', () => {
  selfPlay(42, 400);
  assert.ok(finite(units, ['x', 'z', 'hp']), 'unit positions and health are numbers');
  assert.ok(finite(buildings, ['hp', 'progress']), 'building health is a number');
  assert.ok(buildings.filter((b) => b.built).length > 6, 'buildings get completed');
  assert.ok(units.length > 4, 'units appear');
  for (const t of teams) for (const v of Object.values(t.stock)) assert.ok(Number.isFinite(v) && v > -1e-6, 'stock stays a sane number');
  for (const u of units) assert.ok(u.x >= -1 && u.z >= -1 && u.x <= 49 && u.z <= 49, 'units stay on the map');
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
