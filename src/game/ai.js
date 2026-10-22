// The computer player. It plays the same rules as a human: it plans buildings (workers haul and raise them), tills fields, upgrades
// its training buildings, and its soldiers march on their own. On top of that it gets a small free income each second.
// Any side can be given to it (`team.ai`), which is what lets tests play a whole game with no one at the controls.

import { MAP_SIZE as N } from '../core/config.js';
import { random } from '../core/random.js';
import { buildings, game, nodeKind, field, fieldTeam, teams } from '../core/world.js';
import { AI, FRONT_LINE, LOOP, PLACEMENT_NEAR, PLAN } from '../data/ai.js';
import { BUILDINGS } from '../data/buildings.js';
import { canAfford, pay } from './economy.js';
import { canPlace, canTill, placeBuilding, tillField, upgradeBuilding } from './buildings.js';
import { centerX, centerZ, inBounds, opponent } from './query.js';
import { laneFor } from './lanes.js';

/** How many tiles of one node kind lie within r tiles (a square) of a point. */
function countNodes(x, z, r, kind) {
  let n = 0;
  for (let j = Math.floor(z - r); j <= z + r; j++) for (let i = Math.floor(x - r); i <= x + r; i++) if (inBounds(i, j) && nodeKind[j * N + i] === kind) n++;
  return n;
}

/** A good place for a building: random spots around the keep, scored by what the building wants to be near. */
function findSpot(team, type) {
  const keep = teams[team].keep, enemyKeep = teams[opponent(team)].keep;
  const kx = centerX(keep), kz = centerZ(keep), size = BUILDINGS[type].size;
  const [minR, maxR] = AI.placeRadius;
  let best = null, bestScore = -1e9;
  for (let t = 0; t < AI.placeAttempts; t++) {
    const angle = random() * 6.283, r = minR + random() * (maxR - minR);
    const i = Math.floor(kx + Math.cos(angle) * r - size / 2 + .5), j = Math.floor(kz + Math.sin(angle) * r - size / 2 + .5);
    if (!canPlace(type, i, j, true, team)) continue;
    const px = i + size / 2, pz = j + size / 2;
    let score = -Math.hypot(px - kx, pz - kz) * .5 + random();
    const near = PLACEMENT_NEAR[type];
    if (near) score += countNodes(px, pz, 5, near[0]) * near[1];
    if (FRONT_LINE.has(type)) {                    // toward the enemy keep
      const ex = centerX(enemyKeep), ez = centerZ(enemyKeep), toEnemy = Math.hypot(ex - kx, ez - kz);
      score += ((ex - kx) * (px - kx) + (ez - kz) * (pz - kz)) / toEnemy * 1.1;
    }
    if (BUILDINGS[type].training) {                // spread its trainers over the lanes: fewer already on a lane is better
      const lane = laneFor(team, px, pz).id;
      score -= buildings.filter((b) => b.team === team && b.lane === lane).length * 1.5;
    }
    if (score > bestScore) { bestScore = score; best = [i, j]; }
  }
  return best;
}

/** Till plots around each of its finished farmsteads until it has enough. */
function tillAroundFarms(team) {
  const fieldCost = BUILDINGS.field.cost;
  for (const b of buildings) {
    if (b.team !== team || b.type !== 'farm' || !b.built) continue;
    const bx = centerX(b), bz = centerZ(b);
    let plots = 0;
    const r = AI.fieldRadius;
    for (let j = Math.floor(bz - r); j <= bz + r; j++) for (let i = Math.floor(bx - r); i <= bx + r; i++) if (inBounds(i, j) && field[j * N + i] && fieldTeam[j * N + i] === team) plots++;
    for (let t = 0; t < 12 && plots < AI.fieldsPerFarm && canAfford(team, fieldCost); t++) {
      const i = Math.floor(bx + (random() - .5) * 8), j = Math.floor(bz + (random() - .5) * 8);
      if (Math.hypot(i + .5 - bx, j + .5 - bz) < b.size / 2 + 1.2) continue;
      if (canTill(i, j, team)) { pay(team, fieldCost); tillField(i, j, team); plots++; }
    }
  }
}

/** Move training buildings down a random branch of their upgrade tree, no sooner than `upgradeAfter` seconds per level. */
function upgradeBuildings(team) {
  for (const b of buildings) {
    if (b.team !== team || !b.built || !b.tier || !b.tier.upgrades.length || game.time < AI.upgradeAfter * (b.tierDepth + 1)) continue;
    const option = b.tier.upgrades[random() * b.tier.upgrades.length | 0];
    if (canAfford(team, option.cost)) { pay(team, option.cost); upgradeBuilding(b, option); }
  }
}

export function updateAI(team, dt) {
  const side = teams[team];
  side.trickleTimer += dt;
  if (side.trickleTimer >= 1) {
    side.trickleTimer -= 1;
    for (const r in AI.trickle) side.stock[r] += AI.trickle[r];
  }
  side.aiTimer -= dt;
  if (side.aiTimer > 0) return;
  side.aiTimer = AI.thinkEvery;
  tillAroundFarms(team);
  upgradeBuildings(team);
  if (buildings.filter((b) => b.team === team && !b.built).length >= AI.maxUnfinished) return;
  const type = side.planStep < PLAN.length ? PLAN[side.planStep] : LOOP[(side.planStep - PLAN.length) % LOOP.length];
  if (!canAfford(team, BUILDINGS[type].cost)) return;
  const spot = findSpot(team, type);
  side.planStep++;
  if (spot) placeBuilding(team, type, spot[0], spot[1], false);
}
