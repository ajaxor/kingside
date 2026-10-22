// Walking costs and A* path finding on the tile grid.

import { MAP_SIZE as N } from '../core/config.js';
import { clamp } from '../core/math.js';
import { ground, nodeKind } from '../core/world.js';
import { isLinkable } from '../data/buildings.js';
import { TERRAIN, TERRAIN_INFO } from '../data/terrain.js';
import { buildingAt, inBounds, isPlanOnly } from './query.js';

/**
 * What it costs `team` to step onto tile k; 0 means it cannot. Water and resource tiles block everyone. Walls, palisades and enemy
 * buildings block. A building of your own is not a wall: its model sits in the middle of the tile and leaves a walkway round the
 * edge, so your people may pass through the tile (a little slower to plan, see RIM_COST), keeping to the rim (see rimWaypoint in
 * movement.js). Your own gates, plans nobody has started and traps cost like ground. `breaking` lets a unit plan a path through enemy
 * buildings (at a high cost) because it will hack its way through.
 */
/** Stepping through a tile that has one of your own buildings on it costs this many times as much as open ground. */
const RIM_COST = 1.6;

export function walkCost(team, k, breaking) {
  const g = ground[k];
  if (g === TERRAIN.WATER || nodeKind[k]) return 0;
  const b = buildingAt(k);
  if (b) {
    if (b.type === 'trap') return 1.3;
    if (!b.built && isPlanOnly(b)) return TERRAIN_INFO[g].pathCost;
    if (b.team === team) return b.type === 'gate' ? 1.1 : isLinkable(b.type) ? 0 : TERRAIN_INFO[g].pathCost * RIM_COST;
    return breaking ? 12 : 0;
  }
  return TERRAIN_INFO[g].pathCost;
}

const NEIGHBOURS8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
const MAX_EXPANSIONS = 20000;

// Scratch space reused by every search. A tile's entries only count when its stamp equals the current search's number.
const gScore = new Float32Array(N * N), seenStamp = new Int32Array(N * N), closedStamp = new Int32Array(N * N), parent = new Int32Array(N * N);
let search = 0;

// Binary min-heap of tile indices ordered by score.
const heapTile = [], heapScore = [];
function heapPush(tile, score) {
  let i = heapTile.length;
  heapTile.push(tile); heapScore.push(score);
  while (i > 0) {
    const p = (i - 1) >> 1;
    if (heapScore[p] <= score) break;
    heapTile[i] = heapTile[p]; heapScore[i] = heapScore[p];
    i = p;
  }
  heapTile[i] = tile; heapScore[i] = score;
}
function heapPop() {
  const top = heapTile[0], lastTile = heapTile.pop(), lastScore = heapScore.pop(), n = heapTile.length;
  if (n) {
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= n) break;
      if (c + 1 < n && heapScore[c + 1] < heapScore[c]) c++;
      if (heapScore[c] >= lastScore) break;
      heapTile[i] = heapTile[c]; heapScore[i] = heapScore[c];
      i = c;
    }
    heapTile[i] = lastTile; heapScore[i] = lastScore;
  }
  return top;
}

/**
 * The tiles to walk (excluding the start) to get next to the target rectangle [x0..x1] x [z0..z1] of tiles, or [] if already next
 * to it, or null if there is no way. Diagonal steps may not cut corners.
 */
export function findPath(team, startX, startZ, x0, z0, x1, z1, breaking) {
  const si = clamp(Math.floor(startX), 0, N - 1), sj = clamp(Math.floor(startZ), 0, N - 1);
  const goalX0 = x0 - 1, goalZ0 = z0 - 1, goalX1 = x1 + 1, goalZ1 = z1 + 1;
  if (si >= goalX0 && si <= goalX1 && sj >= goalZ0 && sj <= goalZ1) return [];
  const estimate = (i, j) => {
    const dx = Math.max(goalX0 - i, 0, i - goalX1), dz = Math.max(goalZ0 - j, 0, j - goalZ1);
    return Math.max(dx, dz) + .414 * Math.min(dx, dz);
  };
  search++;
  heapTile.length = 0; heapScore.length = 0;
  const start = sj * N + si;
  gScore[start] = 0; seenStamp[start] = search; parent[start] = -1;
  heapPush(start, estimate(si, sj));
  let expansions = 0;
  while (heapTile.length && expansions++ < MAX_EXPANSIONS) {
    const k = heapPop();
    if (closedStamp[k] === search) continue;
    closedStamp[k] = search;
    const i = k % N, j = (k / N) | 0;
    if (k !== start && i >= goalX0 && i <= goalX1 && j >= goalZ0 && j <= goalZ1) {
      const path = [];
      for (let c = k; c !== start; c = parent[c]) path.push(c);
      return path.reverse();
    }
    for (let d = 0; d < 8; d++) {
      const ni = i + NEIGHBOURS8[d][0], nj = j + NEIGHBOURS8[d][1];
      if (!inBounds(ni, nj)) continue;
      const nk = nj * N + ni;
      if (closedStamp[nk] === search) continue;
      let cost = walkCost(team, nk, breaking);
      if (!cost) continue;
      if (d >= 4) {                                              // a diagonal needs both tiles beside it open
        if (!walkCost(team, j * N + ni, breaking) || !walkCost(team, nj * N + i, breaking)) continue;
        cost *= 1.414;
      }
      const g = gScore[k] + cost;
      if (seenStamp[nk] !== search || g < gScore[nk]) {
        seenStamp[nk] = search; gScore[nk] = g; parent[nk] = k;
        heapPush(nk, g + estimate(ni, nj));
      }
    }
  }
  return null;
}
