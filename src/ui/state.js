// What the player is doing right now: the tool picked (look, mark, raze or placing a building), the building being placed or looked at.
// Panels subscribe with onUiChange() and redraw when it fires.

export const ui = {
  mode: 'look',          // 'look' | 'mark' | 'remove' | 'build'
  buildType: null,       // the building being placed (mode 'build')
  ghost: null,           // [i, j] where it would go, once the player has tapped the map
  selected: null,        // the building whose panel is open (mode 'look')
  razeTarget: null,      // the building waiting for a raze confirmation (mode 'remove')
};

const listeners = new Set();
export const onUiChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
export function changed(force = false) { for (const fn of listeners) fn(force); }

export function setMode(mode, buildType = null) {
  ui.mode = mode; ui.buildType = buildType; ui.ghost = null; ui.razeTarget = null;
  if (mode !== 'look') ui.selected = null;
  changed(true);
}

export function select(building) { ui.selected = building; changed(true); }
export function setGhost(ghost) { ui.ghost = ghost; changed(true); }
export function setRazeTarget(building) { ui.razeTarget = building; changed(true); }
export function resetUi() { ui.selected = null; setMode('look'); }
