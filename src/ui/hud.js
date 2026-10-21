// The always-visible parts: the stockpile, the two keep health bars, game speed, pause and the tilt-shift toggle.

import { PLAYER, ENEMY } from '../core/config.js';
import { game, teams } from '../core/world.js';
import { RESOURCES, RESOURCE_IDS } from '../data/resources.js';
import { GAME_SPEEDS } from '../data/balance.js';
import { focusOn } from '../render/camera.js';
import { $ } from './dom.js';

export const hudOptions = { blur: true };

/** Build the stockpile pills and wire the buttons. */
export function initHud() {
  $('#stock').innerHTML = RESOURCE_IDS.map((r) => `<div class="res" title="${RESOURCES[r].name}"><i class="ic ${r}"></i><b id="res-${r}">0</b></div>`).join('')
    + '<button class="tbtn" id="bSpd" aria-label="Game speed">1×</button><button class="tbtn" id="bPause" aria-label="Pause">❚❚</button>';
  $('#kbP').onclick = () => { if (teams[PLAYER]?.keep) focusOn(teams[PLAYER].keep); };
  $('#kbE').onclick = () => { if (teams[ENEMY]?.keep) focusOn(teams[ENEMY].keep); };
  $('#bSpd').onclick = () => {
    game.speed = GAME_SPEEDS[(GAME_SPEEDS.indexOf(game.speed) + 1) % GAME_SPEEDS.length];
    $('#bSpd').textContent = game.speed + '×';
  };
  $('#bFx').onclick = () => { hudOptions.blur = !hudOptions.blur; $('#bFx').setAttribute('aria-pressed', String(hudOptions.blur)); };
  $('#bPause').onclick = () => setPaused(!game.paused);
}

export function setPaused(paused) {
  game.paused = paused;
  $('#bPause').textContent = paused ? '▶' : '❚❚';
  $('#bPause').setAttribute('aria-label', paused ? 'Resume' : 'Pause');
}

/** Put the speed and pause buttons back to their starting state (new game). */
export function resetHud() {
  game.speed = GAME_SPEEDS[0];
  $('#bSpd').textContent = game.speed + '×';
  setPaused(false);
}

const keepPercent = (keep) => (keep && !keep.dead ? keep.hp / keep.maxHp * 100 : 0);

export function updateHud() {
  const stock = teams[PLAYER].stock;
  for (const r of RESOURCE_IDS) $('#res-' + r).textContent = Math.floor(stock[r]);
  $('#kbP u').style.width = keepPercent(teams[PLAYER].keep) + '%';
  $('#kbE u').style.width = keepPercent(teams[ENEMY].keep) + '%';
}
