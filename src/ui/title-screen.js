// The title screen: a full-screen page of its own (the game is hidden while it is up) with the logo, a menu, a short how-to-play page and
// the build line. Behind it a slow picture of the two keeps (src/render/title-backdrop.js).
// This is only the view. The launcher (src/launcher.js) decides when each state happens; the styles are the `.title*` rules in style.css.
//
// Menu:  Play, How to play, Save to your phone (only where it makes sense).
//
//   setProgress(text)       status line while the game loads (empty hides it)
//   setVersion(text)        build line at the bottom: the git hash and when that commit was made
//   setBest(seconds)        fastest victory so far (null hides the line)
//   setReady()              the game has loaded: Play is enabled
//   setInstallable(bool)    show the "Save to your phone" button
//   setFailed(message)      loading failed: Play is disabled and a Retry button appears
//   showBackdrop(opts)      start the picture behind the menu (opts go to TitleBackdrop)
//   remove()                take the page away
//   onPlay / onInstall / onRetry   called when those buttons are pressed; set by the launcher

import { TitleBackdrop } from '../render/title-backdrop.js';
import { HOW_TO_PLAY } from '../data/help.js';

const clock = (seconds) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

export class TitleScreen {
  /**
   * @param {Document} doc
   * @param {{random?: () => number}} [opts]
   */
  constructor(doc, { random = Math.random } = {}) {
    const h = (tag, cls, text) => {
      const e = doc.createElement(tag);
      if (cls) e.className = cls;
      if (text != null) e.textContent = text;
      return e;
    };
    const button = (cls, text, onClick) => {
      const b = h('button', cls, text);
      b.type = 'button';
      b.addEventListener('click', onClick);
      return b;
    };
    this.doc = doc;
    this.random = random;
    this.ready = false;
    this.backdrop = null;
    this.onPlay = () => {};
    this.onInstall = () => {};
    this.onRetry = () => {};

    // ---- main page ----
    this.status = h('p', 'title-status', 'Starting...');
    this.play = button('btn title-play', 'Play', () => { if (this.ready) this.onPlay(); }); this.play.disabled = true;
    this.howButton = button('btn ghost title-how-button', 'How to play', () => this.showHow(true));
    this.install = button('btn ghost title-install', 'Save to your phone', () => this.onInstall()); this.install.hidden = true;
    this.retry = button('btn title-retry', 'Retry', () => this.onRetry()); this.retry.hidden = true;
    const menu = h('nav', 'title-menu');
    menu.append(this.play, this.retry, this.howButton, this.install);
    this.bestEl = h('b', null, '');
    this.best = h('p', 'best', 'Fastest victory '); this.best.append(this.bestEl); this.best.hidden = true;
    this.ver = h('p', 'title-ver');
    const foot = h('footer', 'title-foot');
    foot.append(this.best, this.ver);
    this.main = h('section', 'title-page title-main');
    const logo = h('h1', 'logo', 'Kingside');
    this.main.append(logo, h('p', 'tagline', 'Plan the town. The town runs itself.'), this.status, menu, foot);

    // ---- how to play ----
    this.how = h('section', 'title-page title-howto'); this.how.hidden = true;
    const list = h('ul', 'how-list');
    for (const item of HOW_TO_PLAY.points) {
      const li = h('li');
      const swatch = h('i'); swatch.style.background = item.color;
      li.append(swatch, h('span', null, item.text));
      list.append(li);
    }
    this.how.append(h('h2', null, 'How to play'), list, h('p', 'how-controls', HOW_TO_PLAY.controls), button('btn title-back', 'Back', () => this.showHow(false)));

    const body = h('div', 'title-body');
    body.append(this.main, this.how);
    this.root = h('div', 'title');
    this.root.append(h('div', 'title-shade'), body);
    doc.body.append(this.root);
  }

  showHow(on) { this.how.hidden = !on; this.main.hidden = on; }

  showBackdrop(opts = {}) {
    this.backdrop?.stop();
    this.backdrop = new TitleBackdrop(this.doc, { random: this.random, ...opts });
    this.root.insertBefore ? this.root.insertBefore(this.backdrop.canvas, this.root.children[0]) : this.root.append(this.backdrop.canvas);
    this.backdrop.start();
  }

  setProgress(text) { this.status.textContent = text; this.status.hidden = !text; }
  setVersion(text) { this.ver.textContent = text; }
  setBest(seconds) { this.best.hidden = seconds == null; if (seconds != null) this.bestEl.textContent = clock(seconds); }
  setReady() { this.ready = true; this.retry.hidden = true; this.play.disabled = false; this.setProgress(''); }
  setInstallable(on) { this.install.hidden = !on; }
  setFailed(message) {
    this.ready = false;
    this.play.disabled = true;
    this.retry.hidden = false;
    this.setProgress('Could not load the game: ' + message);
    this.status.className = 'title-status error';
  }
  remove() { this.backdrop?.stop(); this.backdrop = null; this.root.remove(); }
}
