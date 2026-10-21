// The card shown when a game ends: who won, how long it took, and buttons for another map or the title screen.

import { $ } from './dom.js';

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

/** Show the end-of-game card. `onAgain` starts a new map; `onMenu` goes back to the title screen. */
export function showEndCard({ result, time }, { onAgain, onMenu }) {
  const won = result === 'win';
  $('#card').innerHTML = `<h1>${won ? 'Victory' : 'Defeat'}</h1>
    <p class="sub">${won ? `The red keep burns after ${clock(time)}.` : `Your keep fell after ${clock(time)}.`}</p>
    <button class="btn pri" id="again">New map</button>
    <button class="btn ghost" id="menu">Main menu</button>`;
  $('#ov').hidden = false;
  $('#ctx').hidden = true;
  $('#again').onclick = () => { hideCard(); onAgain(); };
  $('#menu').onclick = () => { hideCard(); onMenu(); };
}

export function hideCard() { $('#ov').hidden = true; }
