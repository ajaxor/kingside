// The panel above the tray: instructions and costs for the tool in use, or details, upgrades and buttons for the building you tapped.
// Its text is built from the data (src/data/) and the building's state (status.js); buttons call the player's commands (src/game/commands.js).

import { MAP_SIZE as N, PLAYER } from '../core/config.js';
import { game, teams } from '../core/world.js';
import { BUILDINGS } from '../data/buildings.js';
import { TEAM_COLORS } from '../render/palette.js';
import { canAfford } from '../game/economy.js';
import { canPlace } from '../game/buildings.js';
import { clearMarks, marchNow, planBuilding, razeBuilding, upgradeForPlayer } from '../game/commands.js';
import { $ } from './dom.js';
import { costHtml } from './build-menu.js';
import { buildingStatus } from './status.js';
import { slotsHtml } from './slots.js';
import { laneFor, laneById } from '../game/lanes.js';
import { territory } from '../core/world.js';
import { changed, onUiChange, select, setGhost, setMode, setRazeTarget, ui } from './state.js';

const isPainting = () => ui.mode === 'mark' || (ui.mode === 'build' && !!BUILDINGS[ui.buildType].paint);

function upgradesHtml(b) {
  if (b.team !== PLAYER || !b.built || !b.tier) return '';
  const stock = teams[PLAYER].stock;
  if (!b.tier.upgrades.length) return b.tierDepth ? '<p>Fully upgraded.</p>' : '';
  return '<div class="ups">' + b.tier.upgrades.map((o, i) =>
    `<button class="up" data-a="up" data-i="${i}" ${canAfford(PLAYER, o.cost) ? '' : 'disabled'}><b>Upgrade: ${o.name}</b><span>${o.desc}</span><span class="costs">${costHtml(o.cost, stock)}</span></button>`).join('') + '</div>';
}

/** The panel's content and a key that changes whenever the content has to be rebuilt (not for numbers that merely tick). */
function describe() {
  const stock = teams[PLAYER].stock;
  if (isPainting() && ui.mode === 'build') {
    const def = BUILDINGS[ui.buildType];
    return {
      key: 'paint' + ui.buildType,
      html: `<h3>${def.name}</h3><p>${def.desc}</p><div class="costs">${costHtml(def.cost, stock)}</div><p>Drag across the map to paint, one tile at a time. Use two fingers to move the view.</p><div class="acts"><button class="btn" data-a="cancel">Done</button></div>`,
    };
  }
  if (ui.mode === 'build') {
    const def = BUILDINGS[ui.buildType], ghost = ui.ghost, ok = ghost && canPlace(ui.buildType, ghost[0], ghost[1]);
    const lane = ghost && def.training ? laneFor(PLAYER, ghost[0] + def.size / 2, ghost[1] + def.size / 2) : null;
    const across = ghost && !ok && territory[ghost[1] * N + ghost[0]] !== PLAYER;
    return {
      key: 'b' + ui.buildType + (ghost ? ghost.join() : '') + ok,
      html: `<h3>${def.name}</h3><p>${def.desc}</p><div class="costs">${costHtml(def.cost, stock)}</div>`
        + (ghost ? `<p>${ok ? 'Drag the outline to adjust, then place it. Builders haul whatever is missing.' : across ? 'You can only build on your own side of the river.' : 'Blocked here. Pick open, dry ground.'}</p>` : '<p>Tap the map where it should go.</p>')
        + (lane && ok ? `<p class="lanenote">Its troops will march down the <b>${lane.name}</b> (lit on the map). Place it nearer another lane to change that.</p>` : '')
        + `<div class="acts"><button class="btn" data-a="cancel">Cancel</button>${ghost ? `<button class="btn pri" data-a="place" ${ok ? '' : 'disabled'}>Place</button>` : ''}</div>`,
    };
  }
  if (ui.mode === 'mark') {
    return {
      key: 'mark',
      html: '<h3>Mark resources</h3><p>Drag over trees, stone or rust-coloured ore. Your workers go to marked spots first. Drag again to unmark. Two fingers move the view.</p><div class="acts"><button class="btn" data-a="clearmarks">Clear all marks</button><button class="btn" data-a="cancel">Done</button></div>',
    };
  }
  if (ui.mode === 'remove') {
    const b = ui.razeTarget;
    if (b) {
      return {
        key: 'rm' + b.id,
        html: `<h3>Raze ${BUILDINGS[b.type].name}?</h3><p>${b.built ? 'Returns half its cost.' : 'Returns the supplies already delivered.'}</p><div class="acts"><button class="btn" data-a="cancel">Keep it</button><button class="btn danger" data-a="raze">Raze</button></div>`,
      };
    }
    return { key: 'rm', html: '<h3>Raze</h3><p>Tap one of your buildings, walls or field plots to tear it down.</p><div class="acts"><button class="btn" data-a="cancel">Done</button></div>' };
  }
  const b = ui.selected;
  if (b && !b.dead) {
    const own = b.team === PLAYER, def = BUILDINGS[b.type], colors = TEAM_COLORS[b.team];
    const affordable = b.tier && b.built ? b.tier.upgrades.map((o) => (canAfford(PLAYER, o.cost) ? 1 : 0)).join('') : '';
    return {
      key: 'sel' + b.id + (b.tier ? b.tier.produces + b.built + affordable : ''),
      html: `<h3><i class="tm" style="background:${colors.css}"></i>${own ? '' : 'Red '}${def.name}</h3>
        <div class="hpbar"><u style="width:${Math.max(0, b.hp / b.maxHp * 100)}%;background:${colors.css}"></u></div>
        <p class="st">${buildingStatus(b)}</p><div class="slots">${slotsHtml(b)}</div>${b.lane && own ? `<p class="lanenote">Troops march down the <b>${laneById(b.lane).name}</b> (lit on the map).</p>` : ''}<p>${def.desc}</p>${upgradesHtml(b)}
        <div class="acts">${own && b.built && def.courtyard ? '<button class="btn pri" data-a="march">March now</button>' : ''}<button class="btn" data-a="close">Close</button></div>`,
    };
  }
  return null;
}

let shownKey = '';

/** Redraw the panel. Full rebuild only when its content changed (or `force`); otherwise just update the live numbers. */
export function refreshPanel(force = false) {
  const el = $('#ctx');
  const content = game.running ? describe() : null;
  if (!content) { el.hidden = true; shownKey = ''; return; }
  el.hidden = false;
  if (content.key !== shownKey || force) { shownKey = content.key; el.innerHTML = content.html; }
  if (ui.mode === 'build') {
    const costs = el.querySelector('.costs');
    if (costs) costs.innerHTML = costHtml(BUILDINGS[ui.buildType].cost, teams[PLAYER].stock);
  } else if (ui.mode === 'look' && ui.selected) {
    const st = el.querySelector('.st');
    if (st) st.textContent = buildingStatus(ui.selected);
    const slots = el.querySelector('.slots');
    if (slots) { const html = slotsHtml(ui.selected); if (html !== slots.dataset.html) { slots.innerHTML = html; slots.dataset.html = html; } }
    const bar = el.querySelector('.hpbar u');
    if (bar) bar.style.width = Math.max(0, ui.selected.hp / ui.selected.maxHp * 100) + '%';
  }
}

const ACTIONS = {
  cancel: () => setMode('look'),
  close: () => select(null),
  place() {
    const [i, j] = ui.ghost || [];
    if (!ui.ghost || !canPlace(ui.buildType, i, j)) return;
    planBuilding(ui.buildType, i, j);
    setGhost(null);
  },
  clearmarks: () => clearMarks(),
  raze() {
    if (!ui.razeTarget) return;
    razeBuilding(ui.razeTarget);
    setRazeTarget(null);
  },
  march: () => { if (ui.selected) marchNow(ui.selected); },
  up(button) {
    if (!ui.selected) return;
    if (upgradeForPlayer(ui.selected, +button.dataset.i)) changed(true);
  },
};

export function initContextPanel() {
  $('#ctx').addEventListener('click', (e) => {
    const button = e.target.closest('[data-a]');
    if (button) ACTIONS[button.dataset.a]?.(button);
  });
  onUiChange(refreshPanel);
}
