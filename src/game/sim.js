// One step of the simulation: every building and unit acts, projectiles fly, crops grow, the computer players think.

import { MAP_SIZE as N, PLAYER } from '../core/config.js';
import { random } from '../core/random.js';
import { removeWhere } from '../core/util.js';
import { arrows, buildings, effects, field, fieldAge, game, teams, units } from '../core/world.js';
import { CROP_GROW_SECONDS, ROCK_SPLASH } from '../data/balance.js';
import { FIELD } from '../data/terrain.js';
import { UNITS, isSiege, isTroop } from '../data/units.js';
import { updateAI } from './ai.js';
import { updateBuilding } from './building-tick.js';
import { updateUnit } from './brains/index.js';
import { damageBuilding } from './buildings.js';
import { notify } from './notify.js';
import { tileAt, centerX, centerZ } from './query.js';
import { walkCost } from './pathing.js';
import { hurtUnit } from './units.js';

const WARN_RADIUS = 11;     // enemy troops this close to the player's keep trigger a warning

/** Keep units from standing on top of each other: soldiers hold formation spacing, workers only nudge apart when both are still. */
function separateUnits() {
  const isMilitary = (u) => UNITS[u.kind].role === 'troop' || UNITS[u.kind].role === 'patrol' || isSiege(u.kind);
  for (let a = 0; a < units.length; a++) {
    const p = units[a];
    if (p.dead) continue;
    const pm = isMilitary(p);
    for (let b = a + 1; b < units.length; b++) {
      const q = units[b];
      if (q.dead) continue;
      const mil = pm && isMilitary(q);
      if (!mil && p.moving && q.moving) continue;
      const R = mil ? (p.team === q.team ? (isSiege(p.kind) || isSiege(q.kind) ? .75 : .5) : .38) : .3;
      let dx = q.x - p.x, dz = q.z - p.z, d2 = dx * dx + dz * dz;
      if (d2 >= R * R) continue;
      if (d2 < 1e-6) { const angle = random() * 6.283; dx = Math.cos(angle) * .01; dz = Math.sin(angle) * .01; d2 = dx * dx + dz * dz; }
      const d = Math.sqrt(d2), push = (R - d) * .4;
      const ux = dx / d * push, uz = dz / d * push;
      if (walkCost(p.team, tileAt(p.x - ux, p.z - uz), false)) { p.x -= ux; p.z -= uz; }
      if (walkCost(q.team, tileAt(q.x + ux, q.z + uz), false)) { q.x += ux; q.z += uz; }
    }
  }
}

/** Move arrows along their arcs; one that lands hurts its target (a rock hurts a building and splashes nearby units). */
function flyArrows(dt) {
  for (const a of arrows) {
    if (!a.target.dead) { a.ex = a.target.x; a.ez = a.target.z; }
    a.progress += dt / a.duration;
    if (a.progress < 1) continue;
    a.done = true;
    if (a.target.building) {
      const b = a.target.building;
      if (b.dead) continue;
      damageBuilding(b, a.damage);
      for (const e of units) if (!e.dead && e.team !== a.team && Math.hypot(e.x - a.ex, e.z - a.ez) < ROCK_SPLASH.radius) hurtUnit(e, a.damage * ROCK_SPLASH.fraction, null);
      effects.push({ x: a.ex, y: .4, z: a.ez, t: 0, d: .5, size: .45, color: [.6, .55, .5] });
    } else if (!a.target.dead) hurtUnit(a.target, a.damage, a.source);
  }
  removeWhere(arrows, (a) => a.done);
}

export function tick(dt) {
  game.time += dt;
  for (const b of buildings.slice()) if (!b.dead) updateBuilding(b, dt);
  for (const u of units) if (!u.dead) updateUnit(u, dt);
  separateUnits();
  flyArrows(dt);
  removeWhere(units, (u) => u.dead);
  for (const e of effects) e.t += dt;
  removeWhere(effects, (e) => e.t >= e.d);
  for (let k = 0; k < N * N; k++) {
    if (field[k] !== FIELD.GROWING) continue;
    fieldAge[k] += dt;
    if (fieldAge[k] >= CROP_GROW_SECONDS) field[k] = FIELD.RIPE;
  }
  game.nearTimer -= dt;
  if (game.nearTimer <= 0) {
    game.nearTimer = 2;
    const keep = teams[PLAYER].keep;
    if (keep) {
      for (const u of units) {
        if (u.team !== PLAYER && (isTroop(u.kind) || isSiege(u.kind)) && Math.hypot(u.x - centerX(keep), u.z - centerZ(keep)) < WARN_RADIUS) {
          notify('Red troops are closing on your keep', 'near', 20, 'warn');
          break;
        }
      }
    }
  }
  for (let t = 0; t < teams.length; t++) if (teams[t].ai) updateAI(t, dt);
}
