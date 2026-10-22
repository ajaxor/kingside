// Placing a building takes two touches: the first puts an outline on the map (and shows what it costs and whether it fits), the second,
// on the outline itself, builds it. Everything the touch handlers and the panel's Build button share is here.

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

/** Build what the outline shows, if it fits. The tool stays on, ready for the next one. Returns whether it was built. */
export function confirmGhost() {
  if (ui.mode !== 'build' || !ui.ghost) return false;
  const [i, j] = ui.ghost;
  if (!canPlace(ui.buildType, i, j) || !planBuilding(ui.buildType, i, j)) return false;
  setGhost(null);
  return true;
}

/**
 * The player picked `type` for tile (i, j) (from the menu on the map, or the sheet with a spot already chosen). Walls and fields are
 * drawn by dragging, so the first piece goes straight down and the tool stays on; anything else gets its outline there to confirm.
 */
export function chooseBuilding(type, i, j) {
  const old = ui.mode === 'build' ? ui.ghost : null;
  setMode('build', type);
  if (BUILDINGS[type].paint) { if (i != null) paintTile(type, i, j, { set: null }); return; }
  if (i != null) setGhost([i, j]);
  else if (old) setGhost(old);
}
