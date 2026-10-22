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

// How a resource tile looks: its height when nearly empty and when full, its side colour, its top colours (patches of two), and how round
// the outside corners of a patch are (a fraction of a tile, at most .5) and how many facets each rounded corner has. Trees are the roundest.
const NODE_LOOK = {
  [NODE.TREE]: { low: .14, high: .4, side: C.pine, tops: [C.leaf, C.leaf2], round: .46, facets: 5 },
  [NODE.STONE]: { low: .1, high: .5, side: C.rockD, tops: [C.rock, C.stone], round: .12, facets: 2 },
  [NODE.ORE]: { low: .1, high: .42, side: C.iron, tops: [[.86, .56, .4], [.92, .62, .44]], round: .18, facets: 3 },
};

// A tile's four corners in walking order round it, with the side that follows each and the neighbour across that side; `from`..`to` is
// the arc's angle, which runs the other way at alternate corners.
const CORNERS = [
  { sx: -1, sz: -1, a0: 0, a1: Math.PI / 2 }, { sx: 1, sz: -1, a0: Math.PI / 2, a1: 0 },
  { sx: 1, sz: 1, a0: 0, a1: Math.PI / 2 }, { sx: -1, sz: 1, a0: Math.PI / 2, a1: 0 },
];
const SIDE_NEIGHBOUR = [[0, -1], [1, 0], [0, 1], [-1, 0]];     // across the side after corner 0, 1, 2, 3

/**
 * Every standing tree, rock and ore tile, merged: neighbouring tiles of one kind join into a single shape (no seam, no wall between
 * them), the outside corners of the shape are rounded, and each tile is as tall as what is left in it, so a patch visibly wears down as it
 * is worked and a tile vanishes when cleared.
 */
export function buildNodes() {
  const m = new MeshBuilder();
  const same = (i, j, kind) => inBounds(i, j) && nodeKind[j * N + i] === kind;
  const heightAt = (i, j, look, kind) => look.low + (look.high - look.low) * Math.min(1, nodeLeft[j * N + i] / NODE_INFO[kind].amount);
  for (let k = 0; k < N * N; k++) {
    const kind = nodeKind[k];
    if (!kind) continue;
    const i = k % N, j = (k / N) | 0, look = NODE_LOOK[kind], h = heightAt(i, j, look, kind);
    const top = look.tops[hash(i >> 1, j >> 1, kind) < .5 ? 0 : 1], mid = [i + .5, h / 2, j + .5], r = look.round;
    // The outline: for each corner, an arc if both sides at it face open ground (or another kind), else the corner itself.
    const corners = CORNERS.map(({ sx, sz, a0, a1 }, c) => {
      const px = i + (sx > 0 ? 1 : 0), pz = j + (sz > 0 ? 1 : 0);
      if (same(i + sx, j, kind) || same(i, j + sz, kind)) return [[px, pz]];
      const cx = px - sx * r, cz = pz - sz * r, pts = [];
      for (let f = 0; f <= look.facets; f++) {
        const a = a0 + (a1 - a0) * f / look.facets;
        pts.push([cx + sx * Math.cos(a) * r, cz + sz * Math.sin(a) * r]);
      }
      return pts;
    });
    const ring = corners.flat();
    for (let n = 0; n < ring.length; n++) {                 // the top, as a fan from the middle
      const a = ring[n], b = ring[(n + 1) % ring.length];
      m.tri([i + .5, h, j + .5], [a[0], h, a[1]], [b[0], h, b[1]], top, [i + .5, h - 1, j + .5]);
    }
    const wall = (a, b, y0) => m.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], look.side, mid);
    for (let c = 0; c < 4; c++) {
      const arc = corners[c];
      for (let n = 0; n + 1 < arc.length; n++) wall(arc[n], arc[n + 1], 0);      // round the corner
      const [di, dj] = SIDE_NEIGHBOUR[c], from = arc[arc.length - 1], to = corners[(c + 1) % 4][0];
      if (!same(i + di, j + dj, kind)) wall(from, to, 0);                         // an open side: a wall to the ground
      else {
        const lower = heightAt(i + di, j + dj, look, kind);                       // a joined side: only a step down to a lower neighbour
        if (lower < h) wall(from, to, lower);
      }
    }
  }
  return m;
}
