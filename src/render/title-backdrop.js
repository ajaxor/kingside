// The picture behind the title screen: a hazy morning over rolling hills, drifting clouds, and the two keeps facing each other across the
// valley. Painted with plain 2D canvas. It owns its canvas, runs only while the title screen is up, and draws one still frame for people
// who ask for reduced motion.

const TAU = Math.PI * 2;
const CLOUDS = 7;

function hill(c, W, H, base, amp, phase, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, H * base + Math.sin(x / W * TAU * 1.3 + phase) * H * amp + Math.sin(x / W * TAU * 3.1 + phase * 2) * H * amp * .35);
  c.lineTo(W, H);
  c.closePath();
  c.fill();
}

/** A keep silhouette: a block with battlements and two corner turrets, `s` pixels wide. */
function keep(c, x, y, s, color, flag) {
  c.fillStyle = color;
  c.fillRect(x - s / 2, y - s * .7, s, s * .7);
  for (let i = 0; i < 5; i++) c.fillRect(x - s / 2 + i * s / 4.5, y - s * .7 - s * .1, s / 9, s * .1);
  for (const side of [-1, 1]) {
    c.fillRect(x + side * s * .55 - s * .09, y - s * 1.05, s * .18, s * 1.05);
    c.beginPath(); c.moveTo(x + side * s * .55 - s * .13, y - s * 1.05); c.lineTo(x + side * s * .55, y - s * 1.4); c.lineTo(x + side * s * .55 + s * .13, y - s * 1.05); c.fill();
  }
  c.fillStyle = flag;
  c.fillRect(x, y - s * 1.45, s * .3, s * .14);
  c.fillRect(x - s * .01, y - s * 1.45, s * .02, s * .75);
}

export class TitleBackdrop {
  /**
   * @param {Document} doc
   * @param {object} o
   * @param {Function} [o.random]
   * @param {Function} [o.raf] @param {Function} [o.caf]  animation-frame functions (default: the window's)
   * @param {Window} [o.win]
   */
  constructor(doc, { random = Math.random, raf = globalThis.requestAnimationFrame?.bind(globalThis), caf = globalThis.cancelAnimationFrame?.bind(globalThis), win = globalThis.window } = {}) {
    this.raf = raf; this.caf = caf; this.win = win;
    this.canvas = doc.createElement('canvas');
    this.canvas.className = 'title-bg';
    this.w = 400; this.h = 800; this.dpr = 1; this.time = 0; this.id = 0; this.last = 0; this.running = false;
    this.onResize = () => { this.resize(); if (!this.running) this.draw(); };
    this.phase = random() * TAU;
    // positions are fractions of the screen so the picture fits any window
    this.clouds = Array.from({ length: CLOUDS }, () => ({ x: random(), y: .06 + random() * .3, size: .6 + random() * .9, speed: .004 + random() * .008, a: .4 + random() * .4 }));
  }

  resize() {
    const win = this.win;
    this.dpr = Math.min(win?.devicePixelRatio || 1, 2);
    this.w = win?.innerWidth || 400; this.h = win?.innerHeight || 800;
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
  }

  start() {
    this.ctx = this.canvas.getContext?.('2d');
    if (!this.ctx) return;
    this.resize();
    this.win?.addEventListener('resize', this.onResize);
    const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (still || !this.raf) { this.draw(); return; }
    this.running = true;
    this.last = 0;
    const tick = (ts) => {
      if (!this.running) return;
      const dt = this.last ? Math.min(.05, (ts - this.last) / 1000) : 0;
      this.last = ts;
      this.update(dt); this.draw();
      this.id = this.raf(tick);
    };
    this.id = this.raf(tick);
  }

  stop() {
    this.running = false;
    if (this.id && this.caf) this.caf(this.id);
    this.win?.removeEventListener('resize', this.onResize);
  }

  update(dt) {
    this.time += dt;
    for (const cloud of this.clouds) { cloud.x += cloud.speed * dt; if (cloud.x > 1.25) cloud.x = -.25; }
  }

  draw() {
    const c = this.ctx, W = this.w, H = this.h, p = this.phase;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const sky = c.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#9fc4d6'); sky.addColorStop(.55, '#d6e4e2'); sky.addColorStop(1, '#e4ebdc');
    c.fillStyle = sky; c.fillRect(0, 0, W, H);
    const glow = c.createRadialGradient(W * .72, H * .24, 6, W * .72, H * .24, Math.max(W, H) * .5);
    glow.addColorStop(0, 'rgba(255,244,214,.75)'); glow.addColorStop(1, 'rgba(255,244,214,0)');
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    for (const cloud of this.clouds) {
      const x = cloud.x * W, y = cloud.y * H, r = 26 * cloud.size * Math.max(.8, Math.min(1.6, W / 420));
      c.fillStyle = `rgba(255,255,255,${cloud.a})`;
      for (const [dx, dy, k] of [[0, 0, 1], [r * .9, -r * .2, .8], [-r * .9, r * .05, .7], [r * 1.7, r * .1, .6]]) { c.beginPath(); c.ellipse(x + dx, y + dy, r * k * 1.3, r * k * .55, 0, 0, TAU); c.fill(); }
    }
    hill(c, W, H, .62, .035, p, '#a9c79a');
    const s = Math.max(34, Math.min(70, W / 6));
    keep(c, W * .2, H * .64, s * .7, '#8da7b6', '#5f92cc');
    keep(c, W * .82, H * .63, s * .7, '#a99a96', '#d3624d');
    hill(c, W, H, .72, .04, p + 2, '#8fb682');
    hill(c, W, H, .84, .035, p + 4, '#78a06b');
  }
}
