// Builds the ground mesh: tiles of grass, water and ford with their banks, then the forests, rock outcrops and ore on top. Forests and
// cliffs that touch share one continuous raised surface; a lone tree or rock stands on its own. Pure geometry (no WebGL), so it can be
// built and tested anywhere. Rebuilt when a node is harvested (game.terrainDirty).

import { MAP_SIZE as N } from '../core/config.js';
import { mixColor, shade } from '../core/math.js';
import { mulberry } from '../core/random.js';
import { TERRAIN, TERRAIN_INFO, NODE, NODE_INFO } from '../data/terrain.js';
import { ground, nodeKind, nodeLeft, road, nearWater, grassNoise, game } from '../core/world.js';
import { inBounds } from '../game/query.js';
import { MeshBuilder } from './mesh-builder.js';
import { C } from './palette.js';

const FULL_TILE = { [NODE.TREE]: NODE_INFO[NODE.TREE].amount, [NODE.STONE]: NODE_INFO[NODE.STONE].amount, [NODE.ORE]: NODE_INFO[NODE.ORE].amount };

/** A tree standing at (x, z) on height `yb`: a stack of two cones (a pine) or one faceted ball on a stub (a leafy tree). Few facets, no jitter. */
export function addTree(m, x, z, r, yb = 0, scale = 1) {
  const big = (.9 + r() * .3) * scale;
  if (r() < .55) {
    m.cyl(x, yb, z, .07, yb + .22, .07, 4, C.trunk);
    m.cyl(x, yb + .16 * scale, z, .4 * big, yb + .78 * big, 0, 5, C.pine, 0);
    m.cyl(x, yb + .5 * big, z, .3 * big, yb + 1.2 * big, 0, 5, C.pine2, 0);
  } else {
    m.cyl(x, yb, z, .07, yb + .36 * big, .07, 4, C.trunk);
    m.blob(x, yb + .66 * big, z, .36 * big, .34 * big, .36 * big, r() < .5 ? C.leaf : C.leaf2, 0, null, 5, 2);
  }
}

function hash(i, j, seed) {
  const v = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
  return v - Math.floor(v);
}

// "mass" nodes join into one surface: forests (trees) or cliffs (stone and ore).
const isForest = (i, j) => inBounds(i, j) && nodeKind[j * N + i] === NODE.TREE;
const isCliff = (i, j) => inBounds(i, j) && nodeKind[j * N + i] >= NODE.STONE;
const isMass = (i, j, forest) => (forest ? isForest(i, j) : isCliff(i, j));

function neighbourCount(i, j, forest) {
  return (isMass(i - 1, j, forest) ? 1 : 0) + (isMass(i + 1, j, forest) ? 1 : 0) + (isMass(i, j - 1, forest) ? 1 : 0) + (isMass(i, j + 1, forest) ? 1 : 0);
}

/** Heights at the tile corners of a forest or cliff mass: higher where more of the four tiles around a corner belong to it. */
function massHeights(forest, maxHeight, seed) {
  const W = N + 1, H = new Float32Array(W * W), profile = forest ? [0, 0, .55, .85, 1] : [0, 0, .55, .9, 1];
  for (let vj = 0; vj <= N; vj++) for (let vi = 0; vi <= N; vi++) {
    let c = 0;
    if (isMass(vi - 1, vj - 1, forest)) c++;
    if (isMass(vi, vj - 1, forest)) c++;
    if (isMass(vi - 1, vj, forest)) c++;
    if (isMass(vi, vj, forest)) c++;
    H[vj * W + vi] = profile[c] * maxHeight * (c >= 3 ? .7 + .6 * hash(vi, vj, seed) : 1);
  }
  return H;
}

function massHeightAt(H, i, j, u, v) {
  const W = N + 1;
  return (H[j * W + i] * (1 - u) + H[j * W + i + 1] * u) * (1 - v) + (H[(j + 1) * W + i] * (1 - u) + H[(j + 1) * W + i + 1] * u) * v;
}

function massTile(m, i, j, H, kind) {
  const W = N + 1, h00 = H[j * W + i], h10 = H[j * W + i + 1], h01 = H[(j + 1) * W + i], h11 = H[(j + 1) * W + i + 1], forest = kind === NODE.TREE;
  let top;
  if (forest) {
    top = hash(i, j, 2) < .5 ? C.leaf : C.leaf2;           // flat patches, not blends
  } else if (kind === NODE.ORE) top = mixColor(C.rock, C.iron, .5);
  else top = hash(i, j, 3) < .5 ? C.rock : C.stone;
  const side = forest ? C.pine : C.rockD;
  const A = [i, h00, j], B = [i + 1, h10, j], Cc = [i + 1, h11, j + 1], D = [i, h01, j + 1], ctr = [i + .5, -2, j + .5];
  if (hash(i, j, 5) < .5) { m.tri(A, B, Cc, top, ctr); m.tri(A, Cc, D, top, ctr); }
  else { m.tri(A, B, D, top, ctr); m.tri(B, Cc, D, top, ctr); }
  const joins = (di, dj) => isMass(i + di, j + dj, forest), sc = [i + .5, .5, j + .5];
  if (!joins(0, -1)) m.quad([i, 0, j], [i + 1, 0, j], B, A, side, sc);
  if (!joins(0, 1)) m.quad([i, 0, j + 1], [i + 1, 0, j + 1], Cc, D, side, sc);
  if (!joins(-1, 0)) m.quad([i, 0, j], [i, 0, j + 1], D, A, side, sc);
  if (!joins(1, 0)) m.quad([i + 1, 0, j], [i + 1, 0, j + 1], Cc, B, side, sc);
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

/** The whole map as one MeshBuilder. */
export function buildTerrain() {
  const m = new MeshBuilder();
  const forestH = massHeights(true, .5, 7), cliffH = massHeights(false, .95, 3);
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
    const node = nodeKind[k];
    if (!node) continue;
    const r = mulberry(k * 977 + game.seed), x = i + .5 + (r() - .5) * .25, z = j + .5 + (r() - .5) * .25;
    const forest = node === NODE.TREE, joined = neighbourCount(i, j, forest);
    if (forest) {
      if (!joined) { m.disc(x, .012, z, .42, 8, shade(col, .8)); addTree(m, x, z, r, 0, 1); }
      else {
        massTile(m, i, j, forestH, NODE.TREE);
        const hy = massHeightAt(forestH, i, j, .5, .5) - .05;
        addTree(m, i + .3 + r() * .4, j + .3 + r() * .4, r, hy, .9);
        if (joined === 4) addTree(m, i + .2 + r() * .6, j + .2 + r() * .6, r, hy, .78);
      }
    } else {
      const scale = .75 + .25 * (nodeLeft[k] / FULL_TILE[node]), base = node === NODE.STONE ? C.rock : C.rockD;
      const ore = node === NODE.ORE;
      if (!joined) {
        m.disc(i + .5, .012, j + .5, .5, 8, mixColor(col, C.rockD, .45));
        m.blob(x, .12, z, .4 * scale, .34 * scale, .36 * scale, base, .2, r, 5, 2, ore ? (a, b) => ((a + b) % 3 === 0 ? C.iron : base) : null);
        m.blob(x + .25, .06, z + .2, .18, .14, .16, ore ? C.iron : C.rockD, .2, r, 5, 2);
      } else {
        massTile(m, i, j, cliffH, node);
        const hy = massHeightAt(cliffH, i, j, .5, .5);
        m.blob(x, hy + .03, z, .34 * scale, .26 * scale, .32 * scale, ore ? C.iron : C.rock, .2, r, 5, 2);
      }
    }
  }
  return m;
}
