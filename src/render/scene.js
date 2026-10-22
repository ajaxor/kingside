// Draws one frame of the world: terrain, buildings (with walls joined up and plans shown as foundations), fields, units, markers,
// arrows, health bars, and a blended pass of shadows, rings, dust and the placement ghost. Reads the world; changes nothing in it.

import { MAP_SIZE as N } from '../core/config.js';
import { BUILDINGS, isLinkable, usesArrows } from '../data/buildings.js';
import { UNITS } from '../data/units.js';
import { RESOURCES, RESOURCE_IDS } from '../data/resources.js';
import { GOODS } from '../data/goods.js';
import { FIELD, NODE } from '../data/terrain.js';
import { CROP_GROW_SECONDS } from '../data/balance.js';
import { buildings, buildingsById, units, arrows, effects, field, fieldAge, nodeKind, marked, occupant, game } from '../core/world.js';
import { centerX, centerZ, inBounds, isPlanOnly } from '../game/query.js';
import { canPlace } from '../game/buildings.js';
import { C, TEAM_COLORS, HEALTH_COLORS } from './palette.js';
import { camera, cameraEye, FOV } from './camera.js';
import { lookAt, multiply, perspective } from './gl/matrix.js';
import { beginScene, drawMesh, endScene, freeMesh, makeMesh, setBlending, setDepthWrite, setFog, setViewProjection, viewportSize } from './gl/context.js';
import { meshes } from './models/index.js';
import { buildTerrain, buildNodes } from './terrain.js';

const UNIT_SCALE = 1;                         // people are about .45 tall; they grow a little as the camera pulls back (zoomBoost)
const BAR_ROTATION = -Math.PI / 4, BAR_AXIS = [Math.SQRT1_2, 0, Math.SQRT1_2];
const PLAN_TINT = [.86, .78, .6], HIT_TINT = [1, 1, 1], SHADOW = [.18, .2, .35];   // shadows are the cool violet of the shade band, not black
const GHOST_OK = [.45, .9, .5], GHOST_BAD = [.95, .35, .3];

let terrainMesh = null, nodesMesh = null, nodesBuiltAt = 0;
const NODES_REBUILD_SECONDS = .15;        // harvesting marks the resource tiles dirty often; they are cheap to rebuild but not free

/** What the scene needs to know about the UI: `selected` and `razeTarget` buildings, `ghost` ({ type, i, j }) while placing, `blur` for tilt-shift. */
export function render(view) {
  const cube = meshes.prop.cube;
  const now = performance.now() / 1000;
  if (game.terrainDirty) {
    freeMesh(terrainMesh);
    terrainMesh = makeMesh(buildTerrain());
    game.terrainDirty = false;
  }
  if (game.nodesDirty && (!nodesMesh || now - nodesBuiltAt >= NODES_REBUILD_SECONDS)) {
    freeMesh(nodesMesh);
    nodesMesh = makeMesh(buildNodes());
    nodesBuiltAt = now;
    game.nodesDirty = false;
  }
  beginScene(view.blur, [0, 0, 0]);
  const eye = cameraEye(), { width, height } = viewportSize(), aspect = width / height;
  setViewProjection(multiply(perspective(FOV, aspect, .5, 400), lookAt(eye, [camera.tx, 0, camera.tz])));
  setFog(camera.D * 2.4, camera.D * 5.5);     // barely any haze: a far unit must read as clearly as a near one
  drawMesh(terrainMesh, 0, 0, 0);
  drawMesh(nodesMesh, 0, 0, 0);

  for (const b of buildings) drawBuilding(b);
  drawFields();
  for (const u of units) drawUnit(u);
  drawMarkers(now);
  drawArrows();
  drawBars();

  setBlending(true); setDepthWrite(false);
  for (const u of units) drawMesh(meshes.prop.disc, u.x + .03, .02, u.z - .02, 0, .15, 1, .15, SHADOW, 1, .22);
  for (const b of buildings) {
    if (isPlanOnly(b)) {
      const s = isLinkable(b.type) ? .7 : b.size * .96;
      drawMesh(cube, centerX(b), .03, centerZ(b), 0, s, .05, s, TEAM_COLORS[b.team].roof, 1, .38);
    }
  }
  for (const b of buildings) {
    if (isLinkable(b.type) || b.type === 'trap') continue;
    drawMesh(meshes.prop.disc, centerX(b) + .06, .018, centerZ(b) - .04, 0, b.size * .4, 1, b.size * .4, SHADOW, 1, .16);
  }
  for (const f of effects) {
    const p = f.t / f.d, s = f.size * (.5 + p);
    drawMesh(meshes.prop.puff, f.x, f.y + p * .5, f.z, 0, s, s, s, f.color, 1, .6 * (1 - p));
  }
  if (view.selected && !view.selected.dead) drawRing(view.selected, [.95, .8, .35], .9);
  if (view.razeTarget && !view.razeTarget.dead) drawRing(view.razeTarget, [.95, .35, .3], .9);
  if (view.ghost) drawGhost(view.ghost);
  setDepthWrite(true); setBlending(false);
  if (view.blur) endScene(camera.D);
}

function drawBar(x, y, z, width, fraction, color) {
  const cube = meshes.prop.cube;
  drawMesh(cube, x, y, z, BAR_ROTATION, width, .07, .07, [.12, .13, .15], 1);
  const w = Math.max(.001, width * fraction);
  drawMesh(cube, x - BAR_AXIS[0] * (width - w) / 2, y + .005, z - BAR_AXIS[2] * (width - w) / 2, BAR_ROTATION, w, .085, .085, color, 1);
}

function drawRing(b, color, alpha) {
  const cube = meshes.prop.cube, x = centerX(b), z = centerZ(b), s = b.size / 2 + .02, t = .05;
  drawMesh(cube, x, .05, z - s, 0, s * 2 + t, .06, t, color, 1, alpha); drawMesh(cube, x, .05, z + s, 0, s * 2 + t, .06, t, color, 1, alpha);
  drawMesh(cube, x - s, .05, z, 0, t, .06, s * 2 + t, color, 1, alpha); drawMesh(cube, x + s, .05, z, 0, t, .06, s * 2 + t, color, 1, alpha);
}

const sameTeamWall = (i, j, team) => {
  if (!inBounds(i, j)) return null;
  const id = occupant[j * N + i], o = id && buildingsById.get(id);
  return o && isLinkable(o.type) && o.team === team ? o : null;
};
const raised = (b) => (b.built ? 1 : Math.max(.12, b.progress));

/** A wall, palisade or gate: its post, plus a link toward the neighbour to the east and the one to the south. */
function drawLinkable(b, hit) {
  const models = meshes.building[b.team], def = BUILDINGS[b.type].models, x = centerX(b), z = centerZ(b);
  const sy = raised(b), tint = b.built ? hit : PLAN_TINT, tintAmount = hit ? .45 : (b.built ? 0 : .35);
  let rot = 0;
  if (b.type === 'gate') {                                // a gate faces along the wall it is set in
    const alongX = sameTeamWall(b.i - 1, b.j, b.team) || sameTeamWall(b.i + 1, b.j, b.team);
    const alongZ = sameTeamWall(b.i, b.j - 1, b.team) || sameTeamWall(b.i, b.j + 1, b.team);
    rot = alongZ && !alongX ? Math.PI / 2 : 0;
  }
  drawMesh(models[def.post], x, 0, z, rot, 1, sy, 1, tint, tintAmount);
  const east = sameTeamWall(b.i + 1, b.j, b.team), south = sameTeamWall(b.i, b.j + 1, b.team);
  if (east) drawMesh(models[def.link], x, 0, z, 0, 1, Math.min(sy, raised(east)), 1, tint, b.built ? 0 : .35);
  if (south) drawMesh(models[def.link], x, 0, z, -Math.PI / 2, 1, Math.min(sy, raised(south)), 1, tint, b.built ? 0 : .35);
}

function drawBuilding(b) {
  const models = meshes.building[b.team], x = centerX(b), z = centerZ(b), hit = b.hitTimer > 0 ? HIT_TINT : null;
  if (b.yard) {                                           // an officer hall's paved courtyard
    const { x: yx, z: yz } = b.yard, colors = TEAM_COLORS[b.team], cube = meshes.prop.cube;
    drawMesh(cube, yx, .018, yz, 0, 2.9, .036, 2.9, [.80, .76, .68], 1);
    drawMesh(cube, yx, .026, yz, 0, 1.1, .03, 1.1, colors.roof, .55);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) drawMesh(cube, yx + sx * 1.42, .12, yz + sz * 1.42, 0, .08, .24, .08, colors.dark, 1);
  }
  if (isLinkable(b.type)) { drawLinkable(b, hit); return; }
  if (b.built) { drawMesh(models[b.type], x, 0, z, 0, 1, 1, 1, hit, hit ? .45 : 0); return; }
  drawMesh(meshes.prop.foundation, x, 0, z, 0, b.size * .98, 1, b.size * .98);
  if (isPlanOnly(b)) return;
  drawMesh(models[b.type], x, 0, z, 0, 1, Math.max(.06, b.progress), 1, hit || PLAN_TINT, hit ? .45 : .35);
  const half = b.size * .5;
  drawMesh(meshes.prop.scaffold, x, 0, z, 0, half, b.size === 1 ? .8 : 1.5, half);
}

function drawFields() {
  const cube = meshes.prop.cube, crop = meshes.prop.crop;
  for (let k = 0; k < N * N; k++) {
    const f = field[k];
    if (!f) continue;
    const x = k % N + .5, z = ((k / N) | 0) + .5;
    drawMesh(cube, x, .02, z, 0, .94, .04, .94, C.soil, 1);
    if (f === FIELD.GROWING) drawMesh(crop, x, .03, z, 0, .55, 1.4 * (.2 + .8 * (fieldAge[k] / CROP_GROW_SECONDS)), .55, [.5, .76, .3], .5);
    else if (f === FIELD.RIPE) drawMesh(crop, x, .03, z, 0, .55, 1.4, .55);
  }
}

/** The colour of a bundle: a resource or good by name. */
function carryColor(item) {
  const key = RESOURCES[item]?.carry ?? GOODS[item]?.carry ?? 'straw';
  return C[key];
}

/** Units grow a little as the camera zooms out, so a crowd stays readable at any distance. */
const zoomBoost = () => Math.min(1.45, Math.max(1, Math.sqrt(camera.D / 24)));

function drawUnit(u) {
  const look = UNITS[u.kind].look, bob = u.moving ? Math.abs(Math.sin(u.anim * 11)) * .05 : 0;
  const swing = u.working ? Math.sin(u.anim * 12) * .18 : 0, hit = u.hitTimer > 0 ? HIT_TINT : null, s = (look.scale || UNIT_SCALE) * zoomBoost();
  drawMesh(meshes.unit[u.team][u.kind], u.x, bob, u.z, u.face + swing, s, s, s, hit, hit ? .55 : 0);
  if (u.carry) {
    const sx = -Math.sin(u.face) * .1, sz = -Math.cos(u.face) * .1;
    drawMesh(meshes.prop.cube, u.x + sx, .24 + bob, u.z + sz, u.face, .12, .1, .1, carryColor(u.carry.item), 1);
  }
}

function drawMarkers(now) {
  for (let k = 0; k < N * N; k++) {
    if (!marked[k] || !nodeKind[k]) continue;
    const x = k % N + .5, z = ((k / N) | 0) + .5, h = .75;
    drawMesh(meshes.prop.gem, x, h + Math.sin(now * 3 + k) * .04, z, now * 1.5 + k, .07, .11, .07, [.98, .82, .32], 1);
  }
  for (const b of buildings) {            // a red gem over your towers that have run out of arrows
    const defence = BUILDINGS[b.type].defence;
    if (defence && usesArrows(b.type) && b.team === 0 && b.built && b.arrows < defence.arrowsPerShot) {
      drawMesh(meshes.prop.gem, centerX(b), defence.height + .5 + Math.sin(now * 4) * .05, centerZ(b), now * 2, .09, .14, .09, [.95, .35, .3], 1);
    }
  }
}

function drawArrows() {
  for (const a of arrows) {
    const t = a.progress, x = a.x0 + (a.ex - a.x0) * t, z = a.z0 + (a.ez - a.z0) * t, y = a.y0 + (.4 - a.y0) * t + Math.sin(Math.PI * t) * a.arc;
    if (a.rock) drawMesh(meshes.prop.puff, x, y, z, 0, .15, .15, .15, [.46, .44, .42], 1);
    else drawMesh(meshes.prop.arrow, x, y, z, Math.atan2(-(a.ez - a.z0), a.ex - a.x0), 1.3 * a.scale);
  }
}

function drawBars() {
  for (const u of units) if (u.hp < u.maxHp) drawBar(u.x, UNITS[u.kind].look.barHeight || .7, u.z, .36, u.hp / u.maxHp, HEALTH_COLORS[u.team]);
  for (const b of buildings) {
    const def = BUILDINGS[b.type], top = def.barHeight ?? 1;
    if (!b.built && !isLinkable(b.type)) {            // construction progress, or how much of the material has arrived
      let have = 0, need = 0;
      for (const r of RESOURCE_IDS) { have += b.have[r]; need += b.need[r]; }
      drawBar(centerX(b), top * .7, centerZ(b), b.size * .5, b.progress > 0 ? b.progress : have / (need || 1), b.progress > 0 ? [.95, .78, .3] : [.75, .68, .55]);
    } else if (b.built && b.hp < b.maxHp) drawBar(centerX(b), top, centerZ(b), Math.min(1, b.size * .5), b.hp / b.maxHp, HEALTH_COLORS[b.team]);
  }
}

function drawGhost(ghost) {
  const def = BUILDINGS[ghost.type], ok = canPlace(ghost.type, ghost.i, ghost.j), color = ok ? GHOST_OK : GHOST_BAD;
  const gx = ghost.i + def.size / 2, gz = ghost.j + def.size / 2;
  drawMesh(meshes.prop.cube, gx, .03, gz, 0, def.size, .05, def.size, color, 1, .45);
  setDepthWrite(true);
  drawMesh(meshes.building[0][def.models ? def.models.post : ghost.type], gx, 0, gz, 0, 1, 1, 1, color, .35, .7);
  setDepthWrite(false);
}
