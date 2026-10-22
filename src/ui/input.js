// Pointer input on the map: one finger taps (select, place, raze) or drags (pan, or paint while marking and drawing walls and fields);
// two fingers pan and pinch to zoom; the wheel zooms. Everything it does goes through the player's commands (src/game/commands.js).

import { MAP_SIZE as N, PLAYER } from '../core/config.js';
import { game } from '../core/world.js';
import { BUILDINGS } from '../data/buildings.js';
import { buildingAt, inBounds } from '../game/query.js';
import { paintTile, razeField } from '../game/commands.js';
import { camera, clampCamera, panBy, pick } from '../render/camera.js';
import { canPlace } from '../game/buildings.js';
import { ghostTile, onGhost, confirmGhost } from './placement.js';
import { openMenu, select, setGhost, setRazeTarget, ui } from './state.js';

const pointers = new Map();
let gesture = null;
const DRAG_THRESHOLD = 7;

function tileFromScreen(x, y) {
  const p = pick(x, y);
  if (!p) return null;
  const i = Math.floor(p[0]), j = Math.floor(p[1]);
  return inBounds(i, j) ? { i, j, x: p[0], z: p[1] } : null;
}

const isPainting = () => ui.mode === 'mark' || (ui.mode === 'build' && !!BUILDINGS[ui.buildType].paint);
const isPlacing = () => ui.mode === 'build' && !BUILDINGS[ui.buildType].paint;

const ghostFor = (t) => ghostTile(ui.buildType, t.x, t.z);

/** Paint every tile along the line from the last painted tile to this one (Bresenham), so a fast drag leaves no gaps. */
function paintAt(x, y) {
  const t = tileFromScreen(x, y);
  if (!t) return;
  const tiles = [];
  if (gesture.last) {
    let [x0, y0] = gesture.last;
    const dx = Math.abs(t.i - x0), dy = Math.abs(t.j - y0), sx = x0 < t.i ? 1 : -1, sy = y0 < t.j ? 1 : -1;
    let err = dx - dy;
    for (let n = 0; n < 200; n++) {
      tiles.push([x0, y0]);
      if (x0 === t.i && y0 === t.j) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  } else tiles.push([t.i, t.j]);
  gesture.last = [t.i, t.j];
  const kind = ui.mode === 'mark' ? 'mark' : ui.buildType;
  for (const [i, j] of tiles) paintTile(kind, i, j, gesture.stroke);
}

function tap(x, y) {
  const t = tileFromScreen(x, y);
  if (isPlacing()) {                                     // the first touch sets the outline down, a second one on it builds
    if (!t) return;
    if (onGhost(t.i, t.j)) { if (!confirmGhost()) setGhost(ghostFor(t)); } else setGhost(ghostFor(t));
    return;
  }
  if (isPainting()) return;
  const b = t ? buildingAt(t.j * N + t.i) : null;
  if (ui.mode === 'remove') {
    if (t && !b && razeField(t.i, t.j)) return;
    setRazeTarget(b && b.team === PLAYER && b.type !== 'keep' ? b : null);
    return;
  }
  if (b || !t) { select(b || null); return; }
  select(null);
  // Open ground on your own side: a menu of what could be built right here.
  if (canPlace('hut', t.i, t.j)) openMenu({ i: t.i, j: t.j, sx: x, sy: y }); else openMenu(null);
}

function onDown(e, canvas) {
  if (!game.running) return;
  canvas.setPointerCapture(e.pointerId);
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 1) {
    gesture = { type: 'one', sx: e.clientX, sy: e.clientY, moved: false, button: e.button, last: null, stroke: { set: null }, ghostDrag: false };
    if (isPlacing() && ui.ghost) {                       // grabbing near the ghost drags it instead of panning
      const t = tileFromScreen(e.clientX, e.clientY), size = BUILDINGS[ui.buildType].size;
      if (t && t.i >= ui.ghost[0] - 1 && t.i < ui.ghost[0] + size + 1 && t.j >= ui.ghost[1] - 1 && t.j < ui.ghost[1] + size + 1) gesture.ghostDrag = true;
    }
    if (isPainting() && e.button === 0) paintAt(e.clientX, e.clientY);
  } else {
    const [a, b] = [...pointers.values()];
    gesture = { type: 'two', mid: [(a.x + b.x) / 2, (a.y + b.y) / 2], dist: Math.hypot(a.x - b.x, a.y - b.y) };
  }
}

function onMove(e) {
  const p = pointers.get(e.pointerId);
  if (!p || !gesture) return;
  const px = p.x, py = p.y;
  p.x = e.clientX; p.y = e.clientY;
  if (gesture.type === 'two') {
    if (pointers.size < 2) return;
    const [a, b] = [...pointers.values()], mid = [(a.x + b.x) / 2, (a.y + b.y) / 2], dist = Math.hypot(a.x - b.x, a.y - b.y);
    panBy(gesture.mid[0], gesture.mid[1], mid[0], mid[1]);
    if (gesture.dist > 10 && dist > 10) { camera.D *= gesture.dist / dist; clampCamera(); }
    gesture.mid = mid; gesture.dist = dist;
    return;
  }
  if (!gesture.moved && Math.hypot(e.clientX - gesture.sx, e.clientY - gesture.sy) > DRAG_THRESHOLD) gesture.moved = true;
  if (!gesture.moved) return;
  if (gesture.ghostDrag) {
    const t = tileFromScreen(e.clientX, e.clientY);
    if (t) {
      const g = ghostFor(t);
      if (g[0] !== ui.ghost[0] || g[1] !== ui.ghost[1]) setGhost(g);
    }
    return;
  }
  if (isPainting() && gesture.button === 0) paintAt(e.clientX, e.clientY);
  else panBy(px, py, e.clientX, e.clientY);
}

function onUp(e) {
  if (!pointers.has(e.pointerId)) return;
  pointers.delete(e.pointerId);
  if (gesture && gesture.type === 'one' && !gesture.moved && pointers.size === 0) tap(e.clientX, e.clientY);
  if (pointers.size === 0) gesture = null;
}

export function initInput(canvas) {
  canvas.addEventListener('pointerdown', (e) => onDown(e, canvas));
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', (e) => { pointers.delete(e.pointerId); if (!pointers.size) gesture = null; });
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); camera.D *= Math.exp(e.deltaY * .0012); clampCamera(); }, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  document.addEventListener('gesturestart', (e) => e.preventDefault());
}
