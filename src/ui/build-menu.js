// The tray along the bottom: the Look / Mark / Raze tools and one button per thing you can build, with its icon and cost.

import { PLAYER } from '../core/config.js';
import { BUILDINGS, BUILD_MENU } from '../data/buildings.js';
import { canAfford } from '../game/economy.js';
import { icons } from '../render/icons.js';
import { $ } from './dom.js';
import { itemIcon } from './items.js';
import { onUiChange, setMode, ui } from './state.js';

export const costHtml = (cost, stock) => Object.keys(cost).filter((r) => cost[r] > 0)
  .map((r) => `<span class="${stock && stock[r] < cost[r] ? 'short' : ''}">${itemIcon(r)}${cost[r]}</span>`).join('') || '<span>Free</span>';

export function buildPalette() {
  $('#pal').innerHTML = BUILD_MENU.map((type) => {
    const def = BUILDINGS[type];
    const cost = Object.keys(def.cost).map((r) => `${itemIcon(r)}${def.cost[r]}`).join(' ');
    return `<button class="bb" data-b="${type}"><img alt="" src="${icons[type] || ''}"><span class="nm">${def.shortName || def.name}</span><span class="cc">${cost}</span></button>`;
  }).join('');
}

export function initBuildMenu() {
  buildPalette();
  $('#modes').addEventListener('click', (e) => {
    const button = e.target.closest('.mode');
    if (button) setMode(button.dataset.mode);
  });
  $('#pal').addEventListener('click', (e) => {
    const button = e.target.closest('.bb');
    if (!button) return;
    const type = button.dataset.b;
    if (ui.mode === 'build' && ui.buildType === type) setMode('look'); else setMode('build', type);
  });
  onUiChange(markActive);
}

function markActive() {
  document.querySelectorAll('.mode').forEach((el) => el.classList.toggle('on', el.dataset.mode === ui.mode));
  document.querySelectorAll('.bb').forEach((el) => el.classList.toggle('on', ui.mode === 'build' && el.dataset.b === ui.buildType));
}

/** Grey out the buttons the player cannot afford. */
export function updateAffordability() {
  for (const el of document.querySelectorAll('.bb')) el.classList.toggle('poor', !canAfford(PLAYER, BUILDINGS[el.dataset.b].cost));
}

