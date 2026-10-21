import test from 'node:test';
import assert from 'node:assert/strict';
import { launch } from '../src/launcher.js';
import { fakeDoc } from './helpers/fake-dom.js';

const BUILD = { hash: 'abc1234', updated: '2026-10-21T17:34:00Z' };
const handle = (extra = {}) => ({ begin() {}, best: () => null, canInstall: false, install() {}, ...extra });
const opts = (doc, extra = {}) => ({
  doc, tag: 'abc1234', build: BUILD, raf: null,
  loadCss: async () => {}, ...extra,
});

test('the title screen is a page of its own: the game is hidden behind it, and it shows the git hash and update time', async () => {
  const doc = fakeDoc();
  const title = await launch(opts(doc, { loadGame: async () => handle() }));
  assert.equal(doc.body.classList.has('in-menu'), true);
  assert.equal(doc.body.classList.has('loading'), false);
  assert.equal(doc.getElementById('boot'), null);                           // the shell's loading message is gone
  assert.match(title.ver.textContent, /^Build abc1234 · Oct 21, 2026/);
});

test('the game is loaded with the cache-busting tag', async () => {
  const doc = fakeDoc();
  const loaded = [];
  await launch(opts(doc, { loadGame: async (href) => { loaded.push(href); return handle(); } }));
  assert.deepEqual(loaded, ['src/main.js?v=abc1234']);
});

test('Play hides the title screen, shows the game and starts it', async () => {
  const doc = fakeDoc();
  const calls = [];
  const title = await launch(opts(doc, { loadGame: async () => handle({ begin: () => calls.push('begin'), best: () => 754, canInstall: true, install: () => calls.push('install') }) }));
  assert.equal(title.bestEl.textContent, '12:34');
  assert.equal(title.best.hidden, false);
  assert.equal(title.play.disabled, false);
  assert.equal(title.install.hidden, false);
  title.install.click();
  title.play.click();
  assert.deepEqual(calls, ['install', 'begin']);
  assert.equal(title.root.isConnected, false);
  assert.equal(doc.body.classList.has('in-menu'), false);                   // the game's page is visible again
});

test('Play stays off until the game has loaded', async () => {
  const doc = fakeDoc();
  let release;
  const gate = new Promise((ok) => { release = ok; });
  const pending = launch(opts(doc, { loadGame: async () => { await gate; return handle(); } }));
  await new Promise((ok) => setTimeout(ok, 0));
  const t = doc.body.find('title');
  assert.ok(t, 'the title screen is up while loading');
  assert.equal(t.find('title-play').disabled, true);
  assert.equal(t.find('title-status').textContent, 'Loading game...');
  release();
  const title = await pending;
  assert.equal(title.play.disabled, false);
  assert.equal(title.status.hidden, true);
});

test('leaving the game brings the title screen back, ready to play again', async () => {
  const doc = fakeDoc();
  let quit;
  const first = await launch(opts(doc, { loadGame: async (_href, o) => { quit = o.onQuit; return handle({ best: () => 61 }); } }));
  first.play.click();
  assert.equal(doc.body.classList.has('in-menu'), false);
  quit();                                                                   // Menu in the game
  assert.equal(doc.body.classList.has('in-menu'), true);
  const again = doc.body.find('title');
  assert.ok(again && again !== first.root, 'a fresh title screen');
  assert.equal(again.find('title-play').disabled, false);
  assert.equal(again.find('best').children[0].textContent, '1:01');
});

test('a load failure disables Play and offers Retry', async () => {
  const doc = fakeDoc();
  const origError = console.error; console.error = () => {};
  let reloaded = false;
  const title = await launch(opts(doc, { reload: () => { reloaded = true; }, loadGame: async () => { throw new Error('boom'); } }));
  console.error = origError;
  assert.equal(title.play.disabled, true);
  assert.equal(title.retry.hidden, false);
  assert.match(title.status.textContent, /boom/);
  title.retry.click();
  assert.equal(reloaded, true);
});
