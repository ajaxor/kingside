// Map generation: a winding river (the centre line), three lanes that cross it at fords, forests, stone and ore, and a mirror-image start
// for each side. Forest walls keep the lanes apart; the river splits the map into the two sides builders are confined to.
// Everything is drawn from one seed, so the same seed always gives the same map.

import { MAP_SIZE as N } from '../core/config.js';
import { makeNoise, mulberry } from '../core/random.js';
import { BUILDINGS } from '../data/buildings.js';
import { LANES, MAP_GEN } from '../data/map.js';
import { NODE, NODE_INFO, TERRAIN } from '../data/terrain.js';
import { ground, nearWater, nodeKind, nodeLeft, road, territory, tileRandom, grassNoise } from '../core/world.js';
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

  // The river runs corner to corner. u is the distance along the diagonal and v the distance across it. Which side of its middle a tile
  // is on decides whose half it is. (Fords are cut where the lanes cross it, below.)
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const k = j * N + i, x = i + .5, z = j + .5;
      const u = (x + z) / 2, v = (x - z) / Math.SQRT2;
      const centre = v - 3.2 * K * Math.sin(u / K * .16 + phase1) - 1.4 * K * Math.sin(u / K * .37 + phase2);
      const halfWidth = MAP_GEN.riverWidth + .4 * n4(i * .2, j * .2);
      if (Math.abs(centre) < halfWidth) ground[k] = TERRAIN.WATER;
      territory[k] = centre < 0 ? 0 : 1;
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

  // Where each lane runs, for every tile: how far it is from the nearest one.
  const laneDist = new Float32Array(N * N).fill(1e9);
  for (const lane of LANES) {
    for (let s = 0; s + 1 < lane.points.length; s++) {
      const [ax, az] = lane.points[s], [bx, bz] = lane.points[s + 1], dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz || 1;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
        const t = Math.max(0, Math.min(1, ((i + .5 - ax) * dx + (j + .5 - az) * dz) / len2));
        const d = Math.hypot(i + .5 - (ax + dx * t), j + .5 - (az + dz * t));
        if (d < laneDist[j * N + i]) laneDist[j * N + i] = d;
      }
    }
  }

  // Forest walls along the lanes, so they read as separate corridors. They thin out near the keeps, so a base opens onto all three.
  const keepCenter = playerKeepCenter();
  const keeps = [keepCenter, mirror(keepCenter[0], keepCenter[1])];
  const [wallNear, wallFar] = MAP_GEN.laneWall;
  for (let k = 0; k < N * N; k++) {
    if (ground[k] || laneDist[k] < wallNear || laneDist[k] > wallFar) continue;
    const x = k % N + .5, z = ((k / N) | 0) + .5;
    if (keeps.some(([kx, kz]) => Math.hypot(x - kx, z - kz) < MAP_GEN.laneWallFreeRadius) || rng() > MAP_GEN.laneWallChance) continue;
    nodeKind[k] = NODE.TREE; nodeLeft[k] = NODE_INFO[NODE.TREE].amount;
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
  for (const side of [0, 1]) {
    const place = (x, z) => (side ? mirror(x, z) : [x, z]);
    const [kx, kz] = place(keepCenter[0], keepCenter[1]);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (Math.hypot(i + .5 - kx, j + .5 - kz) < MAP_GEN.clearRadius) nodeKind[j * N + i] = NODE.NONE;
    for (const c of MAP_GEN.clusters) {
      const [x, z] = place(c.at[0], c.at[1]);
      sprinkle(x, z, c.radius, c.node, c.amount);
    }
  }

  // Cut the lanes: a cleared road, and a ford where the river crosses (the only places it can be crossed).
  for (let k = 0; k < N * N; k++) {
    if (laneDist[k] < MAP_GEN.laneFord && ground[k] === TERRAIN.WATER) ground[k] = TERRAIN.FORD;
    if (laneDist[k] < MAP_GEN.laneRoad && ground[k] !== TERRAIN.WATER) { nodeKind[k] = NODE.NONE; nodeLeft[k] = 0; if (ground[k] === TERRAIN.LAND) road[k] = 1; }
  }
}
