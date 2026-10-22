// The game's entry point, loaded by the launcher (src/launcher.js) once the shell has picked the build folder.
// boot() builds the page (hidden: the launcher's title screen is what the player sees first) and resolves to a handle the launcher uses:
//
//   begin()        show the game and start a new map (the title screen's Play button)
//   best()         the fastest victory saved on this device, in seconds (null if none)
//   canInstall     true when "Save to your phone" makes sense (not already running as an installed app)
//   install()      show the install prompt or the instructions for adding the game to the home screen
//
// onQuit() is called when the player leaves the game for the title screen (the Menu button, or the end card's "Main menu").

import { MAX_STEPS_PER_FRAME, PLAYER, SIM_STEP } from './core/config.js';
import { on } from './core/events.js';
import { store } from './core/util.js';
import { game, teams } from './core/world.js';
import { newGame } from './game/flow.js';
import { tick } from './game/sim.js';
import { camera, clampCamera, focusOn, setViewport } from './render/camera.js';
import { initGL, resize } from './render/gl/context.js';
import { renderIcons } from './render/icons.js';
import { initMeshes } from './render/models/index.js';
import { render } from './render/scene.js';
import { BUILDINGS } from './data/buildings.js';
import { hideCard, showEndCard } from './ui/cards.js';
import { initContextPanel, refreshPanel } from './ui/context-panel.js';
import { $, mountDom } from './ui/dom.js';
import { hudOptions, initHud, resetHud, updateHud } from './ui/hud.js';
import { initBuildMenu, updateAffordability } from './ui/build-menu.js';
import { initInput } from './ui/input.js';
import { standalone, installTap, watchInstallPrompt } from './ui/install.js';
import { resetUi, select, setRazeTarget, ui } from './ui/state.js';
import { initToasts } from './ui/toasts.js';

const BEST_KEY = 'kingside.best';
const HUD_INTERVAL = .25;        // seconds between refreshes of the numbers on screen

export async function boot({ onQuit } = {}) {
  mountDom(document);
  const canvas = $('#gl');
  initGL(canvas);                                       // throws if this device has no WebGL: the title screen says so
  initMeshes();
  renderIcons();
  initHud();
  initBuildMenu();
  initContextPanel();
  initToasts();
  initInput(canvas);
  watchInstallPrompt();

  const fit = () => { setViewport(innerWidth, innerHeight); resize(innerWidth, innerHeight, devicePixelRatio); };
  fit();
  addEventListener('resize', fit);

  let playing = false, frameId = 0, last = 0, accumulator = 0, hudTimer = 0;

  const frame = (ts) => {
    const dt = Math.min(.1, (ts - last) / 1000);
    last = ts;
    if (game.running && !game.paused) {
      accumulator += dt * game.speed;
      let steps = 0;
      while (accumulator >= SIM_STEP && steps < MAX_STEPS_PER_FRAME) { tick(SIM_STEP); accumulator -= SIM_STEP; steps++; }
      if (steps >= MAX_STEPS_PER_FRAME) accumulator = 0;
    }
    hudTimer -= dt;
    if (hudTimer <= 0) { hudTimer = HUD_INTERVAL; updateHud(); updateAffordability(); refreshPanel(); }
    render({
      selected: ui.mode === 'look' ? ui.selected : null,
      razeTarget: ui.mode === 'remove' ? ui.razeTarget : null,
      ghost: ui.mode === 'build' && ui.ghost && !BUILDINGS[ui.buildType].paint ? { type: ui.buildType, i: ui.ghost[0], j: ui.ghost[1] } : null,
      menuTile: ui.menu ? { i: ui.menu.i, j: ui.menu.j } : null,
      blur: hudOptions.blur,
    });
    frameId = requestAnimationFrame(frame);
  };
  const run = (on) => {
    playing = on;
    cancelAnimationFrame(frameId);
    if (on) { last = performance.now(); frameId = requestAnimationFrame(frame); }
  };

  const startGame = () => {
    newGame();
    game.running = true;
    focusOn(teams[PLAYER].keep);
    camera.tx += 2.5; camera.tz -= 2.5;
    camera.D = innerWidth < innerHeight ? 36 : 30;      // start zoomed out: most of the player's side fits on screen
    clampCamera();
    accumulator = 0;
    hideCard();
    resetHud();
    resetUi();
    updateHud();
    updateAffordability();
  };

  const bestTime = () => { const v = parseFloat(store.get(BEST_KEY)); return Number.isFinite(v) ? v : null; };

  on('game-over', (result) => {
    if (result.result === 'win') {
      const best = bestTime();
      if (best == null || result.time < best) store.set(BEST_KEY, Math.round(result.time));
    }
    showEndCard(result, { onAgain: startGame, onMenu: quit });
    refreshPanel(true);
  });
  on('building-removed', ({ building }) => {
    if (ui.selected === building) select(null);
    if (ui.razeTarget === building) setRazeTarget(null);
  });

  const quit = () => { game.running = false; run(false); hideCard(); onQuit?.(); };
  $('#bMenu').onclick = quit;

  if (window.__KINGSIDE_TEST) window.__KINGSIDE_TEST.api = { game, teams, startGame, tick, render };

  return {
    begin() { startGame(); run(true); },
    best: bestTime,
    canInstall: !standalone(),
    install: installTap,
    get playing() { return playing; },
  };
}
