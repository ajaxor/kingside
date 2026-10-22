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
  crop(m) { for (const x of [-.55, 0, .55]) m.box(x - .2, .05, -.85, x + .2, .4, .85, C.cropG, C.crop); },   // three rows
  arrow(m) { m.box(0, 0, -.02, .5, .035, .02, C.woodD); m.box(.42, -.02, -.04, .52, .055, .04, C.steel); },
  scaffold(m) {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) m.box(x * .92 - .05, 0, z * .92 - .05, x * .92 + .05, 1, z * .92 + .05, C.woodD);
    m.box(-.96, .5, .86, .96, .58, .98, C.wood);
  },
  foundation(m) { m.box(-.5, 0, -.5, .5, .06, .5, [.78, .70, .54]); },
};

export function buildProp(id) {
  const m = new MeshBuilder();
  PROPS[id](m);
  return m;
}
