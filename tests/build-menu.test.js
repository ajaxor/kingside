import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, BUILD_CATEGORIES, BUILD_MENU, categoryOf } from '../src/data/buildings.js';
import { teams, buildings } from '../src/core/world.js';
import { newGame } from '../src/game/flow.js';
import { canPlace } from '../src/game/buildings.js';
import { BUILDING_MODELS } from '../src/render/models/buildings.js';
import { chooseBuilding, confirmGhost, ghostTile, onGhost } from '../src/ui/placement.js';
import { openMenu, resetUi, setMode, setMenuCategory, toggleSheet, ui } from '../src/ui/state.js';

test('every buildable type is in exactly one category, and each category has a colour and a model for each of its types', () => {
  const seen = BUILD_CATEGORIES.flatMap((c) => c.types);
  assert.equal(new Set(seen).size, seen.length, 'no type is listed twice');
  assert.deepEqual([...seen].sort(), Object.keys(BUILDINGS).filter((t) => t !== 'keep').sort(), 'every building but the keep is listed');
  assert.deepEqual(BUILD_MENU, seen);
  for (const c of BUILD_CATEGORIES) {
    assert.equal(c.color.length, 3);
    assert.ok(BUILDINGS[c.icon] && c.types.includes(c.icon), `${c.id}'s picture is one of its buildings`);
    for (const t of c.types) { assert.equal(categoryOf(t), c); assert.ok(BUILDING_MODELS[BUILDINGS[t].models?.post || t], t); }
  }
});

/** A free tile on the player's side, a few tiles from the keep. */
function freeTile() {
  const keep = teams[0].keep;
  for (let r = 3; r < 12; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (canPlace('hut', keep.i + di, keep.j + dj)) return [keep.i + di, keep.j + dj];
  throw new Error('no free tile');
}

test('placing takes two touches: the first sets the outline, a touch on it builds', () => {
  newGame({ seed: 4 });
  resetUi();
  const [i, j] = freeTile(), before = buildings.length;
  setMode('build', 'hut');
  assert.equal(confirmGhost(), false, 'nothing to build before an outline is down');
  chooseBuilding('hut', i, j);
  assert.deepEqual(ui.ghost, [i, j]);
  assert.ok(onGhost(i, j));
  assert.ok(!onGhost(i + 1, j + 1), 'a touch elsewhere is not a confirmation');
  assert.equal(buildings.length, before, 'the outline alone builds nothing');
  assert.equal(confirmGhost(), true);
  assert.equal(buildings.length, before + 1);
  assert.equal(ui.ghost, null, 'the outline is gone, the tool is still on');
  assert.equal(ui.mode, 'build');
});

test('a blocked outline cannot be confirmed; the menu and sheet open and close', () => {
  newGame({ seed: 4 });
  resetUi();
  const keep = teams[0].keep;
  chooseBuilding('hut', keep.i, keep.j);          // on the keep itself
  assert.equal(confirmGhost(), false);
  resetUi();
  const [i, j] = freeTile();
  openMenu({ i, j, sx: 100, sy: 100 });
  assert.ok(ui.menu);
  setMenuCategory('army');
  assert.equal(ui.menu.category, 'army');
  toggleSheet('craft');
  assert.equal(ui.menu, null, 'opening the sheet closes the menu');
  assert.equal(ui.sheet, 'craft');
  toggleSheet('craft');
  assert.equal(ui.sheet, null);
  assert.deepEqual(ghostTile('hut', 5.4, 7.6), [5, 7]);
  assert.deepEqual(ghostTile('keep', 5.4, 7.6), [4, 7]);
});
