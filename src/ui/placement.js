// Placing a building takes two touches: the first puts an outline on the map (and shows what it costs and whether it fits), the second,
// on the outline itself, builds it, and the build interface closes. There are two ways to the outline: tap open ground and pick from the
// menu that opens there (place, then building), or pick from the dock's sheet and tap the map (building, then place).
// Everything the touch handlers and the panel's Build button share is here.

import { BUILDINGS } from '../data/buildings.js';
import { canPlace } from '../game/buildings.js';
import { paintTile, planBuilding } from '../game/commands.js';
import { MAP_SIZE as N } from '../core/config.js';
import { clamp } from '../core/math.js';
import { setGhost, setMode, ui } from './state.js';

/** The top-left tile that centres a building of `type` on the ground point (x, z). */
export function ghostTile(type, x, z) {
  const size = BUILDINGS[type].size;
  return [clamp(Math.floor(x - size / 2 + .5), 0, N - size), clamp(Math.floor(z - size / 2 + .5), 0, N - size)];
}

/** Is tile (i, j) under the outline now on the map? (A touch there confirms.) */
export function onGhost(i, j) {
  if (ui.mode !== 'build' || !ui.ghost) return false;
  const size = BUILDINGS[ui.buildType].size;
  return i >= ui.ghost[0] && i < ui.ghost[0] + size && j >= ui.ghost[1] && j < ui.ghost[1] + size;
}

/** Build what the outline shows, if it fits, and close the build interface (tool, outline, menu and sheet). Returns whether it was built. */
export function confirmGhost() {
  if (ui.mode !== 'build' || !ui.ghost) return false;
  const [i, j] = ui.ghost;
  if (!canPlace(ui.buildType, i, j) || !planBuilding(ui.buildType, i, j)) return false;
  setMode('look');
  return true;
}

/**
 * The player picked `type` for the tapped tile (i, j) (from the menu on the map), or with no spot yet (from the sheet). A building gets its
 * outline there, centred on the tapped tile as far as it can be, to confirm. Walls and fields are drawn by dragging, so from the menu the
 * one piece goes straight down and the interface closes; from the sheet the tool stays on for the drag.
 */
export function chooseBuilding(type, i, j) {
  const fromMap = i != null, paints = !!BUILDINGS[type].paint;
  if (paints && fromMap) { paintTile(type, i, j, { set: null }); setMode('look'); return; }
  const old = ui.mode === 'build' ? ui.ghost : null;
  setMode('build', type);
  if (paints) return;
  if (fromMap) setGhost(ghostTile(type, i + .5, j + .5));
  else if (old) setGhost(old);
}
