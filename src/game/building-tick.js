// What a building does each simulation step once it is built: earn income, shoot, make goods, train troops, house workers.

import { PLAYER } from '../core/config.js';
import { effects, teams } from '../core/world.js';
import { BUILDINGS } from '../data/buildings.js';
import { GOODS } from '../data/goods.js';
import { SUPPLY_INTERVAL, UNIT_CAPS } from '../data/balance.js';
import { UNITS, capGroup } from '../data/units.js';
import { RESOURCES } from '../data/resources.js';
import { plural } from '../core/text.js';
import { canAfford, pay } from './economy.js';
import { centerX, centerZ } from './query.js';
import { destroyBuilding } from './buildings.js';
import { notify } from './notify.js';
import { hurtUnit, nearestEnemyUnit, shootArrow, spawnUnit, unitCount } from './units.js';

function tickIncome(b, dt) {
  const income = BUILDINGS[b.type].income;
  b.timer += dt;
  if (b.timer >= income.interval) { b.timer = 0; teams[b.team].stock[income.resource] += income.amount; }
}

/** Shoot at the nearest enemy in range. Ones with arrows use them up and warn the player when empty; the keep never runs out. */
function tickDefence(b, dt) {
  const defence = BUILDINGS[b.type].defence;
  b.cooldown -= dt;
  if (b.cooldown > 0) return;
  const limited = !!defence.maxArrows;
  if (limited && b.arrows < defence.arrowsPerShot) return;
  const enemy = nearestEnemyUnit(b.team, centerX(b), centerZ(b), defence.range);
  if (!enemy) return;
  shootArrow(centerX(b), defence.height, centerZ(b), enemy, defence.damage, b.team, null, defence.boltScale || 1);
  b.cooldown = defence.cooldown;
  if (limited) {
    b.arrows -= defence.arrowsPerShot;
    if (b.arrows < defence.arrowsPerShot && b.team === PLAYER) notify('A ' + BUILDINGS[b.type].name.toLowerCase() + ' is out of arrows. A Fletcher keeps them stocked.', 'noarr', 25, 'warn');
  }
}

function tickTrap(b, dt) {
  const trap = BUILDINGS[b.type].trap;
  b.cooldown -= dt;
  if (b.cooldown > 0) return;
  const victim = nearestEnemyUnit(b.team, centerX(b), centerZ(b), trap.radius, (u) => UNITS[u.kind].role !== 'siege');
  if (!victim) return;
  hurtUnit(victim, trap.damage, null);
  b.charges--;
  b.cooldown = trap.cooldown;
  effects.push({ x: centerX(b), y: .2, z: centerZ(b), t: 0, d: .4, size: .3, color: [.6, .45, .3] });
  if (b.charges <= 0) destroyBuilding(b, true);
}

/** Make one batch of whichever good this building is lowest on (that it can afford and has room for). */
function tickSupply(b, dt) {
  b.timer += dt;
  if (b.timer < SUPPLY_INTERVAL) return;
  b.timer = 0;
  let pick = null, lowest = 2;
  for (const supply of BUILDINGS[b.type].supply) {
    if (b.stock[supply.good] + supply.batch > supply.max || !canAfford(b.team, supply.cost)) continue;
    const fill = b.stock[supply.good] / supply.max;
    if (fill < lowest) { lowest = fill; pick = supply; }
  }
  if (pick) { pay(b.team, pick.cost); b.stock[pick.good] += pick.batch; }
}

/** Train the next unit of the building's current tier when its timer is up, it has the equipment and the money, and the cap allows. */
function tickTraining(b, dt) {
  const kind = b.tier.produces, def = UNITS[kind], team = b.team;
  // The next officer is only trained once the last one has marched out with an army.
  if (BUILDINGS[b.type].courtyard && b.officer && !b.officer.dead && b.officer.state !== 'cmarch') return;
  b.timer += dt;
  if (b.timer < def.train.time) return;
  b.timer = def.train.time;
  const needs = def.needs, haveCost = canAfford(team, def.train.cost), haveGoods = !needs || b.held[needs.good] >= needs.count;
  if (haveCost && haveGoods && unitCount(team, kind) < UNIT_CAPS[capGroup(kind)] && spawnUnit(b, kind)) {
    pay(team, def.train.cost);
    if (needs) b.held[needs.good] -= needs.count;
    b.timer = 0;
  } else if (team === PLAYER) {
    const name = BUILDINGS[b.type].name;
    if (!haveGoods) notify(name + ' is waiting for ' + GOODS[needs.good].name + ' from ' + GOODS[needs.good].source, 'stallg' + b.id, 40, 'warn');
    else if (!haveCost) {
      const short = Object.keys(def.train.cost).filter((r) => teams[team].stock[r] < def.train.cost[r]).map((r) => RESOURCES[r].name).join(' and ');
      notify(name + ' needs more ' + short + ' to train ' + plural(def.name).toLowerCase(), 'stall' + b.id, 40, 'warn');
    }
  }
}

/** Raise the next worker if the building has room in its crew and the team can pay. */
function tickCrew(b, dt) {
  const crew = BUILDINGS[b.type].crew;
  if (b.workers.length >= crew.count) return;
  b.spawnTimer -= dt;
  if (b.spawnTimer > 0) return;
  if (canAfford(b.team, crew.cost)) { pay(b.team, crew.cost); spawnUnit(b, crew.unit); b.spawnTimer = crew.interval; }
  else b.spawnTimer = 1;
}

export function updateBuilding(b, dt) {
  if (b.hitTimer > 0) b.hitTimer -= dt;
  if (!b.built) return;
  const def = BUILDINGS[b.type];
  if (def.income) tickIncome(b, dt);
  if (def.defence) tickDefence(b, dt);
  if (def.trap) tickTrap(b, dt);
  if (def.supply) tickSupply(b, dt);
  if (b.tier && def.training) tickTraining(b, dt);
  if (def.crew) tickCrew(b, dt);
}
