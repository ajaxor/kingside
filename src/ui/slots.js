// The slots shown for a building: one row per kind of thing it holds, a slot for each (or each few, for big stores), filled with the
// item's icon when it has one and left as a dark silhouette when it does not. Pure functions over the building, so they can be tested.

import { BUILDINGS } from '../data/buildings.js';
import { GOODS } from '../data/goods.js';
import { RESOURCES, RESOURCE_IDS } from '../data/resources.js';
import { UNITS } from '../data/units.js';
import { GOODS_STOCK_MAX } from '../data/balance.js';
import { plural } from '../core/text.js';
import { itemIcon } from './items.js';

const MAX_SLOTS = 12;      // a bigger store shows one slot per few items

/** The rows to show for building `b`: [{ label, icon, have, max }]. */
export function slotRows(b) {
  const def = BUILDINGS[b.type], rows = [];
  if (!b.built) {
    for (const r of RESOURCE_IDS) if (b.need[r] > 0) rows.push({ label: RESOURCES[r].name, icon: r, have: Math.floor(b.have[r]), max: b.need[r] });
    return rows;
  }
  if (def.defence?.maxArrows) rows.push({ label: 'arrows', icon: 'arrows', have: b.arrows, max: def.defence.maxArrows });
  if (def.supply) for (const s of def.supply) rows.push({ label: GOODS[s.good].name, icon: s.good, have: b.stock[s.good], max: s.max });
  const needs = b.tier && def.training ? UNITS[b.tier.produces].needs : null;
  if (needs) rows.push({ label: GOODS[needs.good].name, icon: needs.good, have: b.held[needs.good], max: GOODS_STOCK_MAX });
  if (def.crew) rows.push({ label: plural(UNITS[def.crew.unit].name).toLowerCase(), icon: 'worker', have: b.workers.length, max: def.crew.count });
  if (def.trap) rows.push({ label: 'charges', icon: 'spike', have: b.charges, max: def.trap.charges });
  return rows;
}

/** One row as markup. */
function rowHtml({ label, icon, have, max }) {
  const per = Math.ceil(max / MAX_SLOTS), count = Math.ceil(max / per), filled = Math.min(count, Math.floor(have / per));
  let slots = '';
  for (let n = 0; n < count; n++) slots += `<i class="slot${n < filled ? '' : ' empty'}">${itemIcon(icon)}</i>`;
  return `<div class="slotrow"><span class="lab">${label} <b>${have}/${max}</b></span><span class="sl">${slots}</span></div>`;
}

/** The whole block of slot rows for a building ('' when it holds nothing). */
export const slotsHtml = (b) => slotRows(b).map(rowHtml).join('');

