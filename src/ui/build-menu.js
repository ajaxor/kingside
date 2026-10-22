// The build controls. A dock along the bottom has the three tools (Look, Mark, Raze) and one button per building category; a category opens a
// sheet of big cards. The other way in is to tap open ground on the map: a menu opens right there with the same categories and cards for
// what can be built on that tile. Choosing a building puts its outline down; touching the outline again builds it (see placement.js).

import { PLAYER } from '../core/config.js';
import { BUILDINGS, BUILD_CATEGORIES } from '../data/buildings.js';
import { canAfford } from '../game/economy.js';
import { canPlace } from '../game/buildings.js';
import { icons } from '../render/icons.js';
import { $ } from './dom.js';
import { itemIcon } from './items.js';
import { chooseBuilding } from './placement.js';
import { onUiChange, setMenuCategory, setMode, toggleSheet, ui, openMenu } from './state.js';

export const costHtml = (cost, stock) => Object.keys(cost).filter((r) => cost[r] > 0)
  .map((r) => `<span class="${stock && stock[r] < cost[r] ? 'short' : ''}">${itemIcon(r)}${cost[r]}</span>`).join('') || '<span>Free</span>';

const rgb = (c) => `rgb(${c.map((v) => Math.round(v * 255)).join(',')})`;
const category = (id) => BUILD_CATEGORIES.find((c) => c.id === id);

/** One building as a card: its picture, name and cost. `blocked` (it cannot stand on the tapped tile) greys it out. */
function cardHtml(type, blocked) {
  const def = BUILDINGS[type], cost = Object.keys(def.cost).filter((r) => def.cost[r] > 0).map((r) => `<span>${itemIcon(r)}${def.cost[r]}</span>`).join('') || '<span>Free</span>';
  return `<button class="card${canAfford(PLAYER, def.cost) ? '' : ' poor'}" data-b="${type}" ${blocked ? 'disabled' : ''}><img alt="" src="${icons[type] || ''}"><span class="nm">${def.shortName || def.name}</span><span class="cc">${cost}</span></button>`;
}

const dockHtml = () => BUILD_CATEGORIES.map((c) => `<button class="cat" data-cat="${c.id}" style="--c:${rgb(c.color)}"><img alt="" src="${icons[c.icon] || ''}"><span>${c.name}</span></button>`).join('');

function renderSheet() {
  const el = $('#sheet'), cat = ui.sheet && category(ui.sheet);
  el.hidden = !cat;
  if (!cat) return;
  el.style.setProperty('--c', rgb(cat.color));
  el.innerHTML = `<h4><b>${cat.name}</b><span>${cat.hint}. Pick one, then tap the map.</span></h4><div class="grid">${cat.types.map((t) => cardHtml(t, false)).join('')}</div>`;
}

function renderMenu() {
  const el = $('#locmenu'), menu = ui.menu;
  el.hidden = !menu;
  if (!menu) return;
  const cat = category(menu.category) || BUILD_CATEGORIES[0];
  el.style.setProperty('--c', rgb(cat.color));
  const tabs = BUILD_CATEGORIES.map((c) => `<button class="tab${c.id === cat.id ? ' on' : ''}" data-tab="${c.id}" style="--c:${rgb(c.color)}"><img alt="" src="${icons[c.icon] || ''}"><span>${c.name}</span></button>`).join('');
  el.innerHTML = `<div class="tabs">${tabs}</div><div class="grid">${cat.types.map((t) => cardHtml(t, !BUILDINGS[t].paint && !canPlace(t, menu.i, menu.j))).join('')}</div><button class="x" data-close aria-label="Close menu">Close</button>`;
  // Sit near the tapped spot, on the side with more room, and never off the screen.
  const w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
  const left = Math.max(8, Math.min(vw - w - 8, menu.sx - w / 2));
  const below = menu.sy < vh * .45, top = below ? menu.sy + 26 : menu.sy - h - 26;
  el.style.left = left + 'px';
  el.style.top = Math.max(70, Math.min(vh - h - 8, top)) + 'px';
}

function markActive() {
  document.querySelectorAll('.mode').forEach((el) => el.classList.toggle('on', el.dataset.mode === ui.mode));
  document.querySelectorAll('#cats .cat').forEach((el) => el.classList.toggle('on', el.dataset.cat === ui.sheet || (ui.mode === 'build' && BUILD_CATEGORIES.find((c) => c.id === el.dataset.cat)?.types.includes(ui.buildType))));
  renderSheet();
  renderMenu();
}

export function initBuildMenu() {
  $('#cats').innerHTML = dockHtml();
  $('#modes').addEventListener('click', (e) => {
    const button = e.target.closest('.mode');
    if (button) setMode(button.dataset.mode);
  });
  $('#cats').addEventListener('click', (e) => {
    const button = e.target.closest('.cat');
    if (button) toggleSheet(button.dataset.cat);
  });
  $('#sheet').addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (card) chooseBuilding(card.dataset.b);
  });
  $('#locmenu').addEventListener('click', (e) => {
    const tab = e.target.closest('[data-tab]'), card = e.target.closest('.card');
    if (tab) setMenuCategory(tab.dataset.tab);
    else if (card && ui.menu) chooseBuilding(card.dataset.b, ui.menu.i, ui.menu.j);
    else if (e.target.closest('[data-close]')) openMenu(null);
  });
  onUiChange(markActive);
}

/** Mark the cards the player cannot afford. */
export function updateAffordability() {
  for (const el of document.querySelectorAll('.card')) el.classList.toggle('poor', !canAfford(PLAYER, BUILDINGS[el.dataset.b].cost));
}
