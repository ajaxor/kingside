import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, BUILD_CATEGORIES, BUILD_MENU, categoryOf } from '../src/data/buildings.js';
import { teams, buildings } from '../src/core/world.js';
import { newGame } from '../src/game/flow.js';
import { canPlace } from '../src/game/buildings.js';
import { BUILDING_MODELS } from '../src/render/models/buildings.js';
import { chooseBuilding, confirmGhost, ghostTile, onGhost } from '../src/ui/placement.js';
import { openMenu, resetUi, setGhost, setMode, setMenuCategory, toggleSheet, ui } from '../src/ui/state.js';

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

test('placing takes two touches: the first sets the outline, a touch on it builds and closes the build interface', () => {
  newGame({ seed: 4 });
  resetUi();
  const [i, j] = freeTile(), before = buildings.length;
  setMode('build', 'hut');
  assert.equal(confirmGhost(), false, 'nothing to build before an outline is down');
  chooseBuilding('hut', i, j);
  assert.deepEqual(ui.ghost, [i, j]);
  assert.ok(onGhost(i, j));
  assert.ok(onGhost(i + 1, j + 1), 'a hut is two tiles wide, so a touch on its far corner is on the outline too');
  assert.ok(!onGhost(i + 2, j + 2), 'a touch beyond it is not a confirmation');
  assert.equal(buildings.length, before, 'the outline alone builds nothing');
  assert.equal(confirmGhost(), true);
  assert.equal(buildings.length, before + 1);
  assert.equal(buildings.at(-1).size, 2, 'a hut takes a 2x2 patch of tiles');
  assertClosed();
});

/** The build interface is shut: no tool, no outline, no menu, no sheet. */
function assertClosed() {
  assert.equal(ui.mode, 'look');
  assert.equal(ui.buildType, null);
  assert.equal(ui.ghost, null);
  assert.equal(ui.menu, null);
  assert.equal(ui.sheet, null);
}

test('place then building: the menu pick sets the outline on the tapped tile, a second touch builds it and closes everything', () => {
  newGame({ seed: 4 });
  resetUi();
  const [i, j] = freeTile(), before = buildings.length;
  openMenu({ i, j, sx: 100, sy: 100 });
  chooseBuilding('hut', i, j);                      // the card in the map menu
  assert.equal(ui.menu, null, 'the menu closes as soon as a building is picked');
  assert.equal(ui.mode, 'build');
  assert.deepEqual(ui.ghost, [i, j]);
  assert.equal(buildings.length, before, 'picking only sets the outline');
  assert.equal(confirmGhost(), true);
  assert.equal(buildings.length, before + 1);
  assertClosed();
});

test('building then place: the sheet pick waits for the map, the first tap sets the outline, the second builds and closes everything', () => {
  newGame({ seed: 4 });
  resetUi();
  const [i, j] = freeTile(), before = buildings.length;
  toggleSheet('home');
  assert.equal(ui.sheet, 'home');
  chooseBuilding('hut');                            // the card in the dock's sheet
  assert.equal(ui.sheet, null, 'the sheet closes as soon as a building is picked');
  assert.equal(ui.mode, 'build');
  assert.equal(ui.ghost, null, 'no spot yet');
  assert.equal(confirmGhost(), false, 'nothing to confirm before the map is touched');
  setGhost(ghostTile('hut', i + 1, j + 1));          // the first tap on the map (input.js does exactly this)
  assert.deepEqual(ui.ghost, [i, j]);
  assert.equal(confirmGhost(), true);               // the second tap, on the outline
  assert.equal(buildings.length, before + 1);
  assertClosed();
});

test('a wall picked from the map menu goes down once and closes; from the sheet the tool stays on for the drag', () => {
  newGame({ seed: 4 });
  resetUi();
  const [i, j] = freeTile(), before = buildings.length;
  openMenu({ i, j, sx: 100, sy: 100 });
  chooseBuilding('wall', i, j);
  assert.equal(buildings.length, before + 1, 'one wall plan');
  assertClosed();
  toggleSheet('defend');
  chooseBuilding('wall');
  assert.equal(ui.mode, 'build');
  assert.equal(ui.buildType, 'wall', 'still on, ready to drag a line');
  chooseBuilding('field', i + 3, j);                // a field from the menu closes too
  assertClosed();
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
  assert.deepEqual(ghostTile('tower', 5.4, 7.6), [5, 7]);
  assert.deepEqual(ghostTile('hut', 5.4, 7.6), [4, 7]);
  assert.deepEqual(ghostTile('keep', 5.4, 7.6), [4, 6]);
});
