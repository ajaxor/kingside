import test from 'node:test';
import assert from 'node:assert/strict';
import { MAP_SIZE as N } from '../src/core/config.js';
import { ground, nodeKind, road, territory, teams, buildings, units } from '../src/core/world.js';
import { TERRAIN } from '../src/data/terrain.js';
import { LANES } from '../src/data/map.js';
import { newGame } from '../src/game/flow.js';
import { canPlace, canTill, placeBuilding } from '../src/game/buildings.js';
import { laneFor, laneRoute } from '../src/game/lanes.js';
import { spawnUnit } from '../src/game/units.js';
import { productionOf } from '../src/game/production.js';
import { slotRows, slotsHtml } from '../src/ui/slots.js';

test('the map has three lanes, each a cleared road that fords the river once', () => {
  newGame({ seed: 9 });
  assert.equal(LANES.length, 3);
  for (const lane of LANES) {
    let fords = 0, blocked = 0;
    for (let s = 0; s + 1 < lane.points.length; s++) {
      const [ax, az] = lane.points[s], [bx, bz] = lane.points[s + 1];
      for (let t = 0; t <= 1; t += .02) {
        const k = Math.floor(az + (bz - az) * t) * N + Math.floor(ax + (bx - ax) * t);
        if (ground[k] === TERRAIN.FORD) fords++;
        if (ground[k] === TERRAIN.WATER || nodeKind[k]) blocked++;
      }
    }
    assert.ok(fords > 0, `${lane.id} crosses the river on a ford`);
    assert.equal(blocked, 0, `${lane.id} has no water or trees on it`);
  }
  assert.ok(road.some((v) => v), 'roads are cut');
});

test('both sides of the river are builders\' own; nothing can be built across the centre line', () => {
  newGame({ seed: 9 });
  const own = [0, 1].map((team) => { const keep = teams[team].keep; return territory[keep.j * N + keep.i]; });
  assert.deepEqual(own, [0, 1], 'each keep stands on its own half');
  let tried = 0;
  for (let k = 0; k < N * N; k++) {
    if (ground[k] !== TERRAIN.LAND || nodeKind[k]) continue;
    const i = k % N, j = (k / N) | 0, mine = territory[k];
    assert.equal(canPlace('hut', i, j, false, 1 - mine) && !buildings.some((b) => b.i === i && b.j === j), false, 'a hut cannot go on the other side');
    assert.equal(canTill(i, j, 1 - mine), false, 'a field cannot be tilled on the other side');
    tried++;
  }
  assert.ok(tried > 1000);
});

test('a trainer sends its troops down the lane it stands nearest, the enemy walking it the other way', () => {
  newGame({ seed: 9 });
  const keep = teams[0].keep;
  const left = placeBuilding(0, 'barracks', 9, 52, true), right = placeBuilding(0, 'barracks', 22, 62, true);
  assert.equal(left.lane, 'left');
  assert.equal(right.lane, 'right');
  assert.equal(laneFor(0, keep.i + 8, keep.j - 8).id, 'mid');
  const u = spawnUnit(left, 'soldier');
  assert.equal(u.lane, 'left');
  const forward = laneRoute(0, 'left'), back = laneRoute(1, 'left');
  assert.deepEqual(forward[0], back[back.length - 1]);
  assert.ok(units.includes(u));
});

test('buildings say what they are making', () => {
  newGame({ seed: 9 });
  const b = placeBuilding(0, 'barracks', 9, 52, true);
  b.timer = 2;
  const work = productionOf(b);
  assert.ok(work.fraction > 0 && work.fraction < 1);
  assert.equal(productionOf(placeBuilding(0, 'wall', 14, 56, true)), null);
  assert.equal(productionOf(placeBuilding(0, 'hut', 15, 52, false)), null, 'a plan makes nothing');
});

test('slots show what a building holds, with empty ones left for what it lacks', () => {
  newGame({ seed: 9 });
  const tower = placeBuilding(0, 'tower', 14, 56, true);
  tower.arrows = 3;
  const [row] = slotRows(tower);
  assert.equal(row.icon, 'arrows');
  assert.equal(row.have, 3);
  const html = slotsHtml(tower);
  assert.match(html, /class="slot"/);
  assert.match(html, /class="slot empty"/);
  const plan = placeBuilding(0, 'barracks', 15, 52, false);
  plan.have.wood = 10;
  assert.ok(slotRows(plan).some((r) => r.icon === 'wood' && r.have === 10 && r.max === 40), 'a site shows the supplies it needs');
});
