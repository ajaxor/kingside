// "Save to your phone": the browser's install prompt where there is one, and instructions where there is not. When the game is run from the
// webgames launcher the launcher supplies the manifest and icon; this only decides whether the button makes sense and what it does.

let deferredPrompt = null;

export function standalone() {
  try { return !!(window.navigator.standalone || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches)); } catch { return false; }
}

export function watchInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
}

export function installTap() {
  if (deferredPrompt) { try { deferredPrompt.prompt(); } catch { /* ignore */ } deferredPrompt = null; return; }
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
  // the title screen covers the game's page, so this is a plain browser alert
  try { alert(ios ? 'Tap Share, then Add to Home Screen.' : 'Open the browser menu, then choose Add to Home screen or Install app.'); } catch { /* ignore */ }
}
