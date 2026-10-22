// Small shared shapes the scene draws many times, tinted and scaled as needed: a unit cube (bars, rings, ghosts, bundles), a flat disc
// (shadows), a gem (markers), a puff of dust or smoke, a patch of crop, an arrow, a scaffold and a building foundation.

import { mulberry } from '../../core/random.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C } from '../palette.js';

export const PROPS = {
  cube(m) { m.box(-.5, -.5, -.5, .5, .5, .5, [1, 1, 1]); },
  disc(m) { m.disc(0, 0, 0, 1, 12, [0, 0, 0]); },
  gem(m) { m.blob(0, 0, 0, 1, 1, 1, [1, 1, 1], 0, null, 4, 2); },
  puff(m) { m.blob(0, 0, 0, 1, 1, 1, [1, 1, 1], .3, mulberry(3), 6, 3); },
  crop(m) { for (const x of [-.55, 0, .55]) m.box(x - .2, .05, -.85, x + .2, .3, .85, C.cropG, C.crop); },   // three rows
  arrow(m) { m.box(0, 0, -.015, .3, .02, .015, C.woodD); m.box(.26, -.015, -.03, .33, .035, .03, C.steel); },
  scaffold(m) {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) m.box(x * .62 - .04, 0, z * .62 - .04, x * .62 + .04, 1, z * .62 + .04, C.woodD);
    m.box(-.66, .5, .58, .66, .58, .66, C.wood);
  },
  foundation(m) { m.box(-.5, 0, -.5, .5, .06, .5, [.78, .70, .54]); },
};

export function buildProp(id) {
  const m = new MeshBuilder();
  PROPS[id](m);
  return m;
}
