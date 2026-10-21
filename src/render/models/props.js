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
  crop(m) { for (let x = -.8; x <= .81; x += .32) for (let z = -.8; z <= .81; z += .32) m.box(x - .09, .05, z - .09, x + .09, .4, z + .09, C.cropG, C.crop); },
  arrow(m) { m.box(0, 0, -.012, .5, .025, .012, C.woodD); m.box(.42, -.02, -.03, .52, .045, .03, C.steel); },
  scaffold(m) {
    for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) m.box(x * .92 - .04, 0, z * .92 - .04, x * .92 + .04, 1, z * .92 + .04, C.woodD);
    m.box(-.96, .5, .88, .96, .55, .96, C.wood); m.box(-.96, .5, -.96, -.88, .55, .96, C.wood);
  },
  foundation(m) { m.box(-.5, 0, -.5, .5, .06, .5, [.72, .62, .46]); },
};

export function buildProp(id) {
  const m = new MeshBuilder();
  PROPS[id](m);
  return m;
}
