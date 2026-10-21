// Placing, finishing, damaging and destroying buildings (and tilling fields).

import { MAP_SIZE as N, PLAYER } from '../core/config.js';
import { emit } from '../core/events.js';
import { random } from '../core/random.js';
import { removeItem } from '../core/util.js';
import { buildings, buildingsById, effects, field, fieldAge, fieldTeam, game, ground, nodeKind, occupant, teams, yardOwner } from '../core/world.js';
import { BUILDINGS, isLinkable, usesArrows } from '../data/buildings.js';
import { START_ARROWS } from '../data/balance.js';
import { GOODS } from '../data/goods.js';
import { FIELD, TERRAIN } from '../data/terrain.js';
import { RESOURCE_IDS, emptyAmounts } from '../data/resources.js';
import { buildingAt, centerX, centerZ, inBounds, isPlanOnly, opponent } from './query.js';
import { notify } from './notify.js';
import { endGame } from './outcome.js';
import { killUnit } from './units.js';

const zeroGoods = () => Object.fromEntries(Object.keys(GOODS).map((g) => [g, 0]));

/** Can a building of `type` stand with its top-left corner at tile (i, j)? `spacing` also demands an empty ring around it (the AI uses this). */
export function canPlace(type, i, j, spacing) {
  const def = BUILDINGS[type];
  for (let y = j; y < j + def.size; y++) {
    for (let x = i; x < i + def.size; x++) {
      if (!inBounds(x, y)) return false;
      const k = y * N + x;
      if (nodeKind[k] || field[k] || yardOwner[k]) return false;
      if (occupant[k]) {
        const there = buildingAt(k);
        const replaceable = def.replaces && there && there.team === PLAYER && there.type === def.replaces && there.built;
        if (!replaceable) return false;
      }
      const g = ground[k];
      if (g === TERRAIN.WATER) return false;
      if (g === TERRAIN.FORD && !def.fordOk) return false;
    }
  }
  if (spacing) {
    for (let y = j - 1; y <= j + def.size; y++) {
      for (let x = i - 1; x <= i + def.size; x++) {
        if (!inBounds(x, y)) return false;
        if (occupant[y * N + x]) return false;
      }
    }
  }
  return true;
}

/** Can a plot of field be tilled at tile (i, j)? */
export function canTill(i, j) {
  if (!inBounds(i, j)) return false;
  const k = j * N + i;
  return ground[k] === TERRAIN.LAND && !nodeKind[k] && !occupant[k] && !field[k] && !yardOwner[k];
}

export function tillField(i, j, team) {
  const k = j * N + i;
  field[k] = FIELD.TILLED; fieldTeam[k] = team; fieldAge[k] = 0;
}

export function clearField(i, j) {
  const k = j * N + i;
  field[k] = FIELD.NONE; fieldTeam[k] = -1; fieldAge[k] = 0;
}

/** Add a building (a plan, or finished if `built`). Does not charge for it: builders haul the cost in from the keep. */
export function placeBuilding(team, type, i, j, built) {
  const def = BUILDINGS[type];
  const b = {
    id: game.nextBuildingId++, team, type, i, j, size: def.size,
    maxHp: def.hp, hp: built ? def.hp : def.hp * .3, built, progress: built ? 1 : 0,
    need: { ...emptyAmounts(), ...def.cost }, have: emptyAmounts(), incoming: emptyAmounts(),
    workers: [], spawnTimer: 1.5, timer: random() * 3, cooldown: 0,
    arrows: usesArrows(type) ? START_ARROWS : 0, arrowsIncoming: 0,
    stock: zeroGoods(),           // goods this building has made and is holding for runners
    held: zeroGoods(),            // goods it has been delivered and is keeping for training
    goodsIncoming: zeroGoods(),   // goods runners are bringing it
    officer: null, yard: null, yardTiles: null,
    hitTimer: 0, dead: false,
    tier: def.training || null,   // where it is in its upgrade tree
    tierDepth: 0,
    charges: def.trap ? def.trap.charges : 0,
  };
  for (let y = j; y < j + b.size; y++) for (let x = i; x < i + b.size; x++) occupant[y * N + x] = b.id;
  buildings.push(b);
  buildingsById.set(b.id, b);
  if (type === 'keep') teams[team].keep = b;
  if (def.courtyard) reserveCourtyard(b);
  return b;
}

/** An officer hall reserves a paved 3x3 plot beside it (the one most open and best toward the enemy) so nothing else is built on it. */
function reserveCourtyard(b) {
  const enemyKeep = teams[opponent(b.team)] && teams[opponent(b.team)].keep;
  const ex = enemyKeep ? centerX(enemyKeep) : N / 2, ez = enemyKeep ? centerZ(enemyKeep) : N / 2;
  const ox = centerX(b), oz = centerZ(b);
  const free = (x, z) => ground[z * N + x] === TERRAIN.LAND && !nodeKind[z * N + x] && !occupant[z * N + x] && !field[z * N + x] && !yardOwner[z * N + x];
  let best = null, bestScore = -1e9;
  for (let a = 0; a < 16; a++) {
    const angle = a / 16 * 6.283, r = b.size / 2 + 1.9;
    const yx = Math.floor(ox + Math.cos(angle) * r) + .5, yz = Math.floor(oz + Math.sin(angle) * r) + .5;
    let openness = 0;
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = Math.floor(yx) + dx, z = Math.floor(yz) + dz;
        if (!inBounds(x, z)) { openness -= 3; continue; }
        openness += free(x, z) ? 1 : -2;
      }
    }
    const toEnemy = Math.hypot(ex - ox, ez - oz) || 1;
    const score = openness * 3 + ((ex - ox) * (yx - ox) + (ez - oz) * (yz - oz)) / toEnemy * .4;
    if (score > bestScore) { bestScore = score; best = { x: yx, z: yz }; }
  }
  b.yard = best;
  b.yardTiles = [];
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = Math.floor(best.x) + dx, z = Math.floor(best.z) + dz;
      if (inBounds(x, z) && free(x, z)) { yardOwner[z * N + x] = b.id; b.yardTiles.push(z * N + x); }
    }
  }
}

/** A building's last piece of work is done. */
export function completeBuilding(b) {
  b.built = true; b.progress = 1; b.hp = b.maxHp; b.spawnTimer = 1;
  if (b.team === PLAYER) notify(BUILDINGS[b.type].name + ' complete', 'done' + b.type, isLinkable(b.type) ? 20 : 0, 'good');
}

/**
 * Remove a building. Unless `quiet` (the player razed it or replaced it), it was wrecked: it leaves dust, and a plan for the same
 * building is put back on the spot with half of any supplies delivered to it lost. A destroyed keep ends the game.
 */
export function destroyBuilding(b, quiet) {
  if (b.dead) return;
  b.dead = true;
  for (let y = b.j; y < b.j + b.size; y++) for (let x = b.i; x < b.i + b.size; x++) if (occupant[y * N + x] === b.id) occupant[y * N + x] = 0;
  if (b.yardTiles) for (const k of b.yardTiles) if (yardOwner[k] === b.id) yardOwner[k] = 0;
  removeItem(buildings, b);
  buildingsById.delete(b.id);
  for (const w of b.workers.slice()) killUnit(w, true);
  if (!quiet) {
    for (let n = 0; n < 6; n++) {
      effects.push({ x: centerX(b) + (random() - .5) * b.size, y: .3 + random() * .6, z: centerZ(b) + (random() - .5) * b.size, t: 0, d: .7 + random() * .4, size: .35 * b.size, color: [.55, .52, .5] });
    }
  }
  emit('building-removed', { building: b });
  if (b.type === 'keep') endGame(b.team);
  else if (!quiet) {
    if (!b.built) for (const r of RESOURCE_IDS) teams[b.team].stock[r] += Math.floor(b.have[r] / 2);
    const plan = placeBuilding(b.team, b.type, b.i, b.j, false);
    plan.tier = b.tier; plan.tierDepth = b.tierDepth;
    if (b.team === PLAYER && !isLinkable(b.type)) notify('Your ' + BUILDINGS[b.type].name + ' was destroyed. A replacement is planned.', 'lost' + b.type, 6, 'warn');
  }
}

/** Damage a building. Plans nobody has started cannot be hurt. */
export function damageBuilding(b, amount) {
  if (b.dead || isPlanOnly(b)) return;
  b.hp -= amount;
  b.hitTimer = .12;
  if (b.team === PLAYER) {
    if (b.type === 'keep') notify('Your keep is under attack!', 'katk', 10, 'warn');
    else notify('Enemies are breaking your ' + BUILDINGS[b.type].name.toLowerCase(), 'batk', 12, 'warn');
  }
  if (b.hp <= 0) destroyBuilding(b);
}

/** Move a training building one step down its upgrade tree. */
export function upgradeBuilding(b, upgrade) {
  b.tier = upgrade;
  b.tierDepth++;
}

