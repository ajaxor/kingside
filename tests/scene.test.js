import test from 'node:test';
import assert from 'node:assert/strict';
import { seedRandom } from '../src/core/random.js';
import { SIM_STEP } from '../src/core/config.js';
import { game, units } from '../src/core/world.js';
import { newGame } from '../src/game/flow.js';
import { tick } from '../src/game/sim.js';
import { camera, focusOn, pick, setViewport } from '../src/render/camera.js';
import { initGL, resize } from '../src/render/gl/context.js';
import { initMeshes } from '../src/render/models/index.js';
import { icons, renderIcons } from '../src/render/icons.js';
import { render } from '../src/render/scene.js';
import { BUILD_MENU } from '../src/data/buildings.js';

// There is no GPU under node, so WebGL is a stand-in that accepts every call and counts the draws. This checks the scene's own logic
// (the right meshes exist, nothing throws, bundles/bars/ghosts/walls all draw); what the picture looks like needs a real browser.
function fakeGL(stats) {
  const target = { COMPILE_STATUS: 1, LINK_STATUS: 2 };
  return new Proxy(target, {
    get(t, name) {
      if (name in t) return t[name];
      if (name === 'getShaderParameter' || name === 'getProgramParameter') return () => true;
      if (name === 'drawArrays') return (_mode, _first, count) => { stats.draws++; stats.vertices += count; };
      if (name === 'getAttribLocation') return () => 0;
      if (name === 'readPixels') return (_x, _y, _w, _h, _f, _t, out) => out.fill(200);
      if (/^[A-Z_0-9]+$/.test(String(name))) return 1;
      return () => ({});
    },
  });
}

test('a frame of a running game draws, with and without the blur, and the icons render', () => {
  const stats = { draws: 0, vertices: 0 };
  const gl = fakeGL(stats);
  const canvas = { getContext: () => gl, width: 0, height: 0 };
  initGL(canvas);
  setViewport(800, 600);
  resize(800, 600, 2);
  assert.equal(canvas.width, 1600);
  initMeshes();

  const made = [];
  renderIcons(() => ({ width: 0, height: 0, getContext: () => ({ createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {} }), toDataURL: () => { made.push(1); return 'data:image/png;base64,x'; } }));
  assert.equal(made.length, BUILD_MENU.length);
  for (const t of BUILD_MENU) assert.ok(icons[t], t);

  seedRandom(5);
  newGame({ seed: 5, ai: [true, true] });
  game.running = true;
  for (let t = 0; t < 300; t += SIM_STEP) tick(SIM_STEP);
  seedRandom();
  assert.ok(units.length > 0);
  focusOn(units[0].home);
  const view = { selected: units[0].home, razeTarget: null, ghost: { type: 'tower', i: 20, j: 20 }, blur: false };
  render(view);
  const plain = stats.draws;
  assert.ok(plain > 50, 'a lot is drawn: ' + plain);
  render({ ...view, blur: true });
  assert.ok(stats.draws > plain + plain / 2);
});

test('picking the screen centre finds the ground point the camera looks at', () => {
  setViewport(800, 600);
  Object.assign(camera, { tx: 20, tz: 30, D: 17, pitch: .94 });
  const p = pick(400, 300);
  assert.ok(Math.abs(p[0] - 20) < 1e-6 && Math.abs(p[1] - 30) < 1e-6);
  assert.equal(pick(400, -5000), null, 'a ray above the horizon hits nothing');
});
