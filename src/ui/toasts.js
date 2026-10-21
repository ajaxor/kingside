// Short messages at the top of the screen. The simulation announces them as 'toast' events (src/core/events.js).

import { on } from '../core/events.js';
import { $ } from './dom.js';

const lastShown = {};
const MAX_SHOWN = 3, SHOW_MS = 3600;

export function initToasts() {
  on('toast', ({ message, key, cooldown, kind }) => {
    const now = performance.now() / 1000;
    if (key && lastShown[key] != null && now - lastShown[key] < cooldown) return;
    if (key) lastShown[key] = now;
    const box = $('#toasts'), el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = message;
    box.prepend(el);
    while (box.children.length > MAX_SHOWN) box.lastChild.remove();
    setTimeout(() => el.remove(), SHOW_MS);
  });
}
