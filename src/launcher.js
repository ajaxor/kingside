// The launcher runs once the shell (index.html) has picked the build folder. It loads the stylesheet, shows the title screen (a full-screen
// page with a menu, and the build's git hash and update time) and loads the game behind it (src/main.js). Play hides the title screen and
// starts the game; "Menu" in the game brings the title screen back.
// The shell stays tiny and stable so a stale cached copy of it cannot hide changes to any of this.

import { TitleScreen } from './ui/title-screen.js';
import { describeBuild } from './core/version.js';
import { BUILD } from './build-info.js';

const defaultLoadCss = (doc, href) => new Promise((ok, no) => {
  const el = doc.createElement('link');
  el.rel = 'stylesheet'; el.href = href; el.onload = ok; el.onerror = () => no(new Error('Could not load ' + href));
  doc.head.appendChild(el);
});
const defaultLoadGame = async (href, opts) => (await import(new URL(href, location.href).href)).boot(opts);

/**
 * @param {object} o
 * @param {string} o.tag        cache-busting tag added to the stylesheet and game URLs
 * @param {{hash:string, updated:string}} [o.build]  the commit shown on the title screen (src/build-info.js, written by tools/stamp.mjs)
 * @param {() => void} [o.reload]
 * @param {Document} [o.doc]
 * @param {() => number} [o.random] @param {Function} [o.raf] @param {Function} [o.caf]  for the title screen's picture (tests pass stubs)
 * @param {Function} [o.loadCss] @param {Function} [o.loadGame]  replaceable for tests; loadGame resolves to the game's handle (src/main.js)
 * @returns {Promise<TitleScreen>} resolves once the game has loaded (or failed) behind the title screen
 */
export async function launch({
  tag, build = BUILD, reload = () => location.reload(),
  doc = document, random = Math.random, raf, caf, loadCss = defaultLoadCss, loadGame = defaultLoadGame,
}) {
  await loadCss(doc, 'style.css?v=' + tag);          // the title screen is styled by style.css, so it comes first
  doc.getElementById('boot')?.remove();
  doc.body.classList.remove('loading');

  let title = null, game = null, ready = false, failed = null;

  // The title screen can come back (Menu), so it is built by a function. The game's own page is hidden while it is up.
  const show = () => {
    doc.body.classList.add('in-menu');
    const t = title = new TitleScreen(doc, { random });
    t.setVersion(describeBuild(build));
    t.onRetry = () => reload();
    t.onPlay = () => { t.remove(); doc.body.classList.remove('in-menu'); game.begin(); };
    t.onInstall = () => game.install();
    t.showBackdrop({ random, raf, caf });
    if (ready) fill(t); else if (failed) t.setFailed(failed); else t.setProgress('Loading game...');
    return t;
  };
  const fill = (t) => {
    t.setBest(game.best());
    t.setInstallable(game.canInstall);
    t.setReady();
  };
  show();

  try {
    game = await loadGame('src/main.js?v=' + tag, { onQuit: show });
    ready = true;
    fill(title);
  } catch (e) {
    console.error(e);
    failed = String(e.message || e).split('\n')[0].slice(0, 120);
    title.setFailed(failed);
  }
  return title;
}
