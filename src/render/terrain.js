// Builds the meshes of the ground, as pure geometry (no WebGL), so they can be built and tested anywhere.
//
//   buildTerrain()  the ground: a flat tile each of grass, path, sand, water and ford, with banks and the map's edge. Built once a game.
//   buildNodes()    the resource tiles: each tree, rock or ore tile is one plain prism with a small gap round it, as tall as what is
//                   left in it, so a tile visibly shrinks as it is worked and vanishes when it is cleared. Rebuilt when one changes
//                   (game.nodesDirty); it is small enough to be cheap.

import { MAP_SIZE as N } from '../core/config.js';
import { TERRAIN, TERRAIN_INFO, NODE, NODE_INFO } from '../data/terrain.js';
import { ground, nodeKind, nodeLeft, road, nearWater, grassNoise } from '../core/world.js';
import { inBounds } from '../game/query.js';
import { MeshBuilder } from './mesh-builder.js';
import { C } from './palette.js';

function hash(i, j, seed) {
  const v = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

/** The ground tile's top colour. Flat: each tile is one of a few plain colours (two greens, shore sand, path), never a blend or a jitter. */
function groundColor(k, kind) {
  if (kind === TERRAIN.WATER) return C.water;
  if (kind === TERRAIN.FORD) return C.ford;
  if (road[k]) return C.path;
  if (nearWater[k]) return C.sand;
  return grassNoise[k] > .52 ? C.grass2 : C.grass;
}

const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** The ground of the whole map as one MeshBuilder. */
export function buildTerrain() {
  const m = new MeshBuilder();
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, kind = ground[k], h = TERRAIN_INFO[kind].height, col = groundColor(k, kind);
    m.quad([i, h, j], [i + 1, h, j], [i + 1, h, j + 1], [i, h, j + 1], col, [i + .5, h - 1, j + .5]);
    for (const [dx, dz] of SIDES) {                       // walls down to lower neighbours (banks) and to the map's edge
      const ni = i + dx, nj = j + dz, edge = !inBounds(ni, nj);
      const h2 = edge ? -1.4 : TERRAIN_INFO[ground[nj * N + ni]].height;
      if (h2 >= h) continue;
      let a, b;
      if (dx === 1) { a = [i + 1, j]; b = [i + 1, j + 1]; } else if (dx === -1) { a = [i, j]; b = [i, j + 1]; }
      else if (dz === 1) { a = [i, j + 1]; b = [i + 1, j + 1]; } else { a = [i, j]; b = [i + 1, j]; }
      const ctr = [i + .5, (h + h2) / 2, j + .5];
      if (edge) {
        const hm = -.95;
        m.quad([a[0], h, a[1]], [b[0], h, b[1]], [b[0], hm, b[1]], [a[0], hm, a[1]], kind ? C.bank : C.soil, ctr);
        m.quad([a[0], hm, a[1]], [b[0], hm, b[1]], [b[0], h2, b[1]], [a[0], h2, a[1]], C.soilD, ctr);
      } else m.quad([a[0], h, a[1]], [b[0], h, b[1]], [b[0], h2, b[1]], [a[0], h2, a[1]], kind === TERRAIN.LAND ? C.bank : C.sand, ctr);
    }
  }
  return m;
}

// How a resource tile looks: its height when nearly empty and when full, its side colour, and its top colours (one chosen per tile).
const NODE_LOOK = {
  [NODE.TREE]: { low: .14, high: .4, side: C.pine, tops: [C.leaf, C.leaf2] },
  [NODE.STONE]: { low: .1, high: .5, side: C.rockD, tops: [C.rock, C.stone] },
  [NODE.ORE]: { low: .1, high: .42, side: C.iron, tops: [[.86, .56, .4], [.92, .62, .44]] },
};
const GAP = .05;

/** Every standing tree, rock and ore tile as a prism, shrunk to what is left in it. */
export function buildNodes() {
  const m = new MeshBuilder();
  for (let k = 0; k < N * N; k++) {
    const kind = nodeKind[k];
    if (!kind) continue;
    const i = k % N, j = (k / N) | 0, look = NODE_LOOK[kind], left = Math.min(1, nodeLeft[k] / NODE_INFO[kind].amount);
    const h = look.low + (look.high - look.low) * left, top = look.tops[hash(i, j, kind) < .5 ? 0 : 1];
    m.box(i + GAP, 0, j + GAP, i + 1 - GAP, h, j + 1 - GAP, look.side, top);
  }
  return m;
}
