// The game's page: the canvas, resource bar, toasts, context panel and build tray. Built once by boot() and hidden behind the title screen
// (body.in-menu in style.css). Everything else finds its elements by id.

const MARKUP = `
<canvas id="gl"></canvas>
<div id="top">
  <div class="row" id="stock"></div>
  <div class="row" id="keeps">
    <button class="kb" id="kbP"><i></i>Your keep<em><u></u></em></button>
    <button class="kb" id="kbE"><i></i>Red keep<em><u></u></em></button>
    <button class="tbtn" id="bMenu" aria-label="Main menu">Menu</button>
    <button class="tbtn" id="bFx" aria-label="Toggle tilt-shift" aria-pressed="true">Tilt</button>
  </div>
</div>
<div id="toasts"></div>
<div id="bot">
  <div id="ctx" hidden></div>
  <div id="tray">
    <div id="modes">
      <button class="mode on" data-mode="look">Look</button>
      <button class="mode" data-mode="mark">Mark</button>
      <button class="mode rm" data-mode="remove">Raze</button>
    </div>
    <div id="pal"></div>
  </div>
</div>
<div id="ov" hidden><div id="card"></div></div>`;

/** Add the game page to `doc`. Returns it (a hidden-by-CSS-while-in-menu container). */
export function mountDom(doc) {
  const root = doc.createElement('div');
  root.id = 'game';
  root.innerHTML = MARKUP;
  doc.body.append(root);
  return root;
}

export const $ = (selector, doc = document) => doc.querySelector(selector);
