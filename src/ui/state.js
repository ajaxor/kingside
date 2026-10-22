// What the player is doing right now: the tool picked (look, mark, raze or placing a building), the building being placed or looked at.
// Panels subscribe with onUiChange() and redraw when it fires.

export const ui = {
  mode: 'look',          // 'look' | 'mark' | 'remove' | 'build'
  buildType: null,       // the building being placed (mode 'build')
  ghost: null,           // [i, j] where it would go, once the player has tapped the map
  selected: null,        // the building whose panel is open (mode 'look')
  razeTarget: null,      // the building waiting for a raze confirmation (mode 'remove')
  sheet: null,           // the category whose buildings the bottom sheet lists (null = closed)
  menu: null,            // { i, j, sx, sy, category }: the build menu opened by tapping open ground at tile (i, j), at screen point (sx, sy)
  category: 'gather',    // the category last looked at, shown first in the next menu
};

const listeners = new Set();
export const onUiChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export function changed(force = false) { for (const fn of listeners) fn(force); }

export function setMode(mode, buildType = null) {
  ui.mode = mode; ui.buildType = buildType; ui.ghost = null; ui.razeTarget = null; ui.sheet = null; ui.menu = null;
  if (mode !== 'look') ui.selected = null;
  changed(true);
}

export function select(building) { ui.selected = building; ui.menu = null; ui.sheet = null; changed(true); }

/** Open (or close, if already open) the bottom sheet listing a category's buildings. */
export function toggleSheet(category) {
  if (ui.sheet === category) ui.sheet = null;
  else { if (ui.mode === 'mark' || ui.mode === 'remove') { ui.mode = 'look'; ui.razeTarget = null; } ui.sheet = category; ui.selected = null; ui.category = category; }
  ui.menu = null;
  changed(true);
}

/** Open the build menu for tile (i, j), tapped at screen point (sx, sy); `null` closes it. */
export function openMenu(menu) {
  ui.menu = menu ? { ...menu, category: ui.category } : null;
  if (menu) { ui.selected = null; ui.sheet = null; }
  changed(true);
}
export function setMenuCategory(category) { if (ui.menu) { ui.menu.category = category; ui.category = category; changed(true); } }
export function setGhost(ghost) { ui.ghost = ghost; changed(true); }
export function setRazeTarget(building) { ui.razeTarget = building; changed(true); }
export function resetUi() { ui.selected = null; setMode('look'); }
