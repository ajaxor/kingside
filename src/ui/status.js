// One line saying what a building is doing, made from its data and its state. Pure text (no DOM), so it can be tested.

import { PLAYER } from '../core/config.js';
import { plural, capitalize } from '../core/text.js';
import { teams } from '../core/world.js';
import { BUILDINGS } from '../data/buildings.js';
import { GOODS } from '../data/goods.js';
import { RESOURCES, RESOURCE_IDS } from '../data/resources.js';
import { UNITS } from '../data/units.js';
import { TAKE_LABEL } from '../data/upgrades.js';
import { GOODS_STOCK_MAX } from '../data/balance.js';
import { isPlanOnly } from '../game/query.js';

const seconds = (n) => Math.max(0, Math.ceil(n));
const crewText = (b, crew) => `${plural(UNITS[crew.unit].name)} ${b.workers.length}/${crew.count}`;

function underConstruction(b, def) {
  const parts = RESOURCE_IDS.filter((r) => b.need[r] > 0).map((r) => `${Math.floor(b.have[r])}/${b.need[r]} ${RESOURCES[r].name}`).join(' · ');
  const by = def.builder && def.builder !== 'any' ? ` · raised by ${plural(UNITS[def.builder].name).toLowerCase()}` : '';
  if (b.progress > 0) return `Under construction · ${Math.round(b.progress * 100)}%${by}`;
  return `${isPlanOnly(b) ? 'Planned · waiting' : 'Waiting'} for supplies · ${parts}${by}`;
}

function hallStatus(b) {
  const o = b.officer;
  if (o && !o.dead && o.state !== 'cmarch') {
    const take = o.take ? ' · ' + TAKE_LABEL[o.take] : '';
    return `${UNITS[o.kind].name} holds the courtyard · ${o.followers.length}/${o.cap} troops${take} · next trained once he marches`;
  }
  return `Training ${UNITS[b.tier.produces].name} · ready in ${seconds(UNITS[b.tier.produces].train.time - b.timer)}s`;
}

function trainerStatus(b) {
  const kind = b.tier.produces, def = UNITS[kind], stock = teams[b.team].stock;
  const short = Object.keys(def.train.cost).filter((r) => stock[r] < def.train.cost[r]).map((r) => RESOURCES[r].name).join(', ');
  let text = `Trains ${plural(def.name)} · next in ${seconds(def.train.time - b.timer)}s${short ? ' · needs ' + short : ''}`;
  if (def.needs) {
    const { good, count } = def.needs, have = b.held[good];
    text += ` · ${GOODS[good].name} ${have}/${GOODS_STOCK_MAX}${have < count ? ` (waiting for ${GOODS[good].source})` : ''}`;
  }
  return text;
}

export function buildingStatus(b) {
  const def = BUILDINGS[b.type];
  if (!b.built) return underConstruction(b, def);
  if (def.income) return b.team === PLAYER ? `Stockpile for every hauler. Grows ${def.income.amount} ${def.income.resource} every ${def.income.interval}s.` : 'Burn this to win.';
  if (def.defence?.maxArrows) return `Arrows ${b.arrows}/${def.defence.maxArrows}${b.arrowsIncoming ? ` · ${b.arrowsIncoming} on the way` : ''}`;
  if (def.trap) return `${b.charges} charges left`;
  if (def.note) return def.note;
  if (def.supply) {
    const goods = def.supply.map((s) => `${GOODS[s.good].name} ${b.stock[s.good]}/${s.max}`).join(' · ');
    return `${capitalize(goods)} · ${crewText(b, def.crew)}`;
  }
  if (def.courtyard) return hallStatus(b);
  if (def.training) return trainerStatus(b);
  if (def.crew) {
    const crew = def.crew, text = crewText(b, crew);
    if (b.workers.length >= crew.count) return text;
    const cost = Object.keys(crew.cost).map((r) => crew.cost[r] + ' ' + RESOURCES[r].name).join(', ');
    return `${text} · next in ${seconds(b.spawnTimer)}s (${cost})`;
  }
  return '';
}
