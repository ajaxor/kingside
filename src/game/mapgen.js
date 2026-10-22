// Map generation: a winding river with fords, forests, stone and ore, and a mirror-image start for each side.
// Everything is drawn from one seed, so the same seed always gives the same map.

import { MAP_SIZE as N } from '../core/config.js';
import { makeNoise, mulberry } from '../core/random.js';
import { BUILDINGS } from '../data/buildings.js';
import { MAP_GEN } from '../data/map.js';
import { NODE, NODE_INFO, TERRAIN } from '../data/terrain.js';
import { ground, nearWater, nodeKind, nodeLeft, road, tileRandom, grassNoise } from '../core/world.js';
import { inBounds } from './query.js';

const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Where a point goes on the enemy's side of the map. */
export const mirror = (x, z) => [N - x, N - z];

/** The centre of the player's keep, in tiles. */
export const playerKeepCenter = () => [MAP_GEN.keep[0] + BUILDINGS.keep.size / 2, MAP_GEN.keep[1] + BUILDINGS.keep.size / 2];

/** Fill the map arrays (already cleared by resetWorld) from a seed. */
export function generateMap(seed) {
  const rng = mulberry(seed);
  const [n1, n2, n3, n4, n5] = [0, 1, 2, 3, 4].map(() => makeNoise(rng));
  const phase1 = rng() * 6.28, phase2 = rng() * 6.28;
  const K = N / 48;                                  // the river and fords were designed for a 48-tile map
  const fords = [N * .24 + rng() * 3 * K, N * .5 + (rng() - .5) * 4 * K, N * .76 - rng() * 3 * K];

  // The river runs corner to corner. u is the distance along the diagonal and v the distance across it.
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i, x = i + .5, z = j + .5;
      const u = (x + z) / 2, v = (x - z) / Math.SQRT2;
      const centre = v - 3.2 * K * Math.sin(u / K * .16 + phase1) - 1.4 * K * Math.sin(u / K * .37 + phase2);
      const halfWidth = MAP_GEN.riverWidth + .4 * n4(i * .2, j * .2);
      if (Math.abs(centre) < halfWidth) ground[k] = fords.some((f) => Math.abs(u - f) < 1.25) ? TERRAIN.FORD : TERRAIN.WATER;
      tileRandom[k] = rng();
      grassNoise[k] = n5(i * .11, j * .11);
    }
  }

  // Forests, stone and ore on dry land.
  const { noise, chance } = MAP_GEN;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i;
      if (ground[k]) continue;
      for (const [dx, dz] of NEIGHBOURS) if (inBounds(i + dx, j + dz) && ground[(j + dz) * N + i + dx]) nearWater[k] = 1;
      const forest = n1(i * .14, j * .14), stone = n2(i * .17, j * .17), ore = n3(i * .2, j * .2);
      let kind = NODE.NONE;
      if (ore > noise.ore && rng() < chance.ore) kind = NODE.ORE;
      else if (stone > noise.stone && rng() < chance.stone) kind = NODE.STONE;
      else if ((forest > noise.forest && rng() < chance.forest) || rng() < chance.strayTree) kind = NODE.TREE;
      if (kind) { nodeKind[k] = kind; nodeLeft[k] = NODE_INFO[kind].amount; }
    }
  }

  // A cluster of each kind near each keep, and clear ground around the keeps.
  const sprinkle = (x, z, radius, kind, amount) => {
    for (let j = Math.floor(z - radius); j <= z + radius; j++) {
      for (let i = Math.floor(x - radius); i <= x + radius; i++) {
        if (!inBounds(i, j)) continue;
        const k = j * N + i;
        if (ground[k]) continue;
        if (Math.hypot(i + .5 - x, j + .5 - z) <= radius && rng() < .92) { nodeKind[k] = kind; nodeLeft[k] = amount; }
      }
    }
  };
  const keepCenter = playerKeepCenter();
  for (const side of [0, 1]) {
    const place = (x, z) => (side ? mirror(x, z) : [x, z]);
    const [kx, kz] = place(keepCenter[0], keepCenter[1]);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (Math.hypot(i + .5 - kx, j + .5 - kz) < MAP_GEN.clearRadius) nodeKind[j * N + i] = NODE.NONE;
    for (const c of MAP_GEN.clusters) {
      const [x, z] = place(c.at[0], c.at[1]);
      sprinkle(x, z, c.radius, c.node, c.amount);
    }
  }

  // Carve a trail from each keep to every ford so the map can always be crossed.
  const enemyKeep = mirror(keepCenter[0], keepCenter[1]);
  for (const f of fords) {
    let best = -1, bestScore = 1e9;
    for (let k = 0; k < N * N; k++) {
      if (ground[k] !== TERRAIN.FORD) continue;
      const x = k % N + .5, z = ((k / N) | 0) + .5, u = (x + z) / 2, v = Math.abs((x - z) / Math.SQRT2);
      const score = Math.abs(u - f) * 3 + v;
      if (score < bestScore) { bestScore = score; best = k; }
    }
    if (best < 0) continue;
    const fx = best % N, fz = (best / N) | 0;
    carveTrail(keepCenter[0], keepCenter[1], fx, fz);
    carveTrail(enemyKeep[0], enemyKeep[1], fx, fz);
  }
}

/** Cheapest walk from (x0, z0) to tile (x1, z1) over dry land; any trees or stone on the way are cleared and the tiles become trail. */
function carveTrail(x0, z0, x1, z1) {
  const start = Math.floor(z0) * N + Math.floor(x0), goal = z1 * N + x1;
  const dist = new Float32Array(N * N).fill(1e9), parent = new Int32Array(N * N).fill(-1);
  dist[start] = 0;
  const open = [start];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (dist[open[i]] < dist[open[bi]]) bi = i;
    const k = open[bi];
    open[bi] = open[open.length - 1]; open.pop();
    if (k === goal) break;
    const i = k % N, j = (k / N) | 0;
    for (const [dx, dz] of NEIGHBOURS) {
      const ni = i + dx, nj = j + dz;
      if (!inBounds(ni, nj)) continue;
      const nk = nj * N + ni;
      if (ground[nk] === TERRAIN.WATER) continue;
      const cost = 1 + (nodeKind[nk] ? 6 : 0) + (road[nk] ? -.5 : 0) + tileRandom[nk] * .6;
      if (dist[k] + cost < dist[nk]) {
        if (dist[nk] >= 1e9) open.push(nk);
        dist[nk] = dist[k] + cost; parent[nk] = k;
      }
    }
  }
  for (let k = goal; k >= 0; k = parent[k]) {
    if (ground[k] === TERRAIN.LAND) { nodeKind[k] = NODE.NONE; road[k] = 1; }
    if (k === start) break;
  }
}
