// What the player can do, as plain functions: plan a building, paint walls and fields, mark resources, raze, upgrade, send troops out.
// The UI calls these; they change the world and tell the player what happened.

import { MAP_SIZE as N, PLAYER } from '../core/config.js';
import { costText, plural } from '../core/text.js';
import { field, fieldTeam, marked, nodeKind, occupant, teams, units } from '../core/world.js';
import { BUILDINGS, homeOf } from '../data/buildings.js';
import { RESOURCES, RESOURCE_IDS } from '../data/resources.js';
import { UNITS } from '../data/units.js';
import { canAfford, pay, refundHalf } from './economy.js';
import { canPlace, canTill, clearField, destroyBuilding, placeBuilding, tillField, upgradeBuilding } from './buildings.js';
import { buildingAt } from './query.js';
import { notify } from './notify.js';
import { sendCommander } from './brains/troop.js';

const resourceNames = Object.fromEntries(RESOURCE_IDS.map((r) => [r, RESOURCES[r].name]));

/** Plan a building for the player at (i, j). Builders haul the supplies; nothing is charged now. Returns the plan, or null if it cannot go there. */
export function planBuilding(type, i, j) {
  if (!canPlace(type, i, j)) return null;
  const def = BUILDINGS[type];
  if (def.replaces) {                                   // a gate goes where a wall stands: the wall is taken down and half its cost returned
    const there = buildingAt(j * N + i);
    if (there) { refundHalf(PLAYER, BUILDINGS[there.type].cost); destroyBuilding(there, true); }
  }
  const plan = placeBuilding(PLAYER, type, i, j, false);
  notify(def.name + ' planned', 'plan', 0);
  const builder = def.builder;
  if (builder && builder !== 'any' && !units.some((u) => !u.dead && u.team === PLAYER && u.kind === builder)) {
    notify('No ' + UNITS[builder].name.toLowerCase() + 's yet. Build a ' + BUILDINGS[homeOf(builder)].name + '.', 'nobld' + builder, 12, 'warn');
  }
  return plan;
}

/**
 * Paint one tile while the player drags: mark (or unmark) a resource, till a field plot, or plan a wall piece. `stroke` is shared by
 * the whole drag so that a drag that starts on a marked tile unmarks everything it crosses.
 */
export function paintTile(kind, i, j, stroke) {
  const k = j * N + i;
  if (kind === 'mark') {
    if (!nodeKind[k]) return;
    if (stroke.set == null) stroke.set = marked[k] ? 0 : 1;
    marked[k] = stroke.set;
    return;
  }
  const def = BUILDINGS[kind];
  if (def.paint === 'plots') {
    if (!canTill(i, j)) return;
    if (canAfford(PLAYER, def.cost)) { pay(PLAYER, def.cost); tillField(i, j, PLAYER); }
    else notify('Fields cost ' + costText(def.cost, resourceNames) + ' each', 'nofw', 4, 'warn');
  } else if (canPlace(kind, i, j)) placeBuilding(PLAYER, kind, i, j, false);
}

export function clearMarks() { marked.fill(0); }

/** Tear down a building of the player's. A finished one returns half its cost, a plan returns what had been delivered. */
export function razeBuilding(b) {
  if (b.built) refundHalf(PLAYER, BUILDINGS[b.type].cost);
  else for (const r of RESOURCE_IDS) teams[PLAYER].stock[r] += b.have[r];
  destroyBuilding(b, true);
}

/** Remove one of the player's field plots (returns half its cost). Returns true if there was one. */
export function razeField(i, j) {
  const k = j * N + i;
  if (!field[k] || fieldTeam[k] !== PLAYER || occupant[k]) return false;
  clearField(i, j);
  refundHalf(PLAYER, BUILDINGS.field.cost);
  return true;
}

/** Spend the player's resources to move a building to the upgrade at `index` of its current tier. */
export function upgradeForPlayer(b, index) {
  const option = b.tier && b.tier.upgrades[index];
  if (!option || !canAfford(PLAYER, option.cost)) return false;
  pay(PLAYER, option.cost);
  upgradeBuilding(b, option);
  notify(BUILDINGS[b.type].name + ' now trains ' + plural(UNITS[option.produces].name).toLowerCase(), 'up', 0, 'good');
  return true;
}

/** Tell the officer waiting at a hall to march now with whoever he has. */
export function marchNow(hall) {
  const o = hall.officer;
  if (o && !o.dead && o.state === 'cwait' && o.followers.length > 0) sendCommander(o);
}

