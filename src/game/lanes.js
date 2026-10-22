// The three lanes: which one a building's troops use, the waypoints of each for either side, and the walk along them.
// A lane is a list of waypoints from the player's keep to the enemy's (see LANES in data/map.js); the enemy walks it backwards.

import { LANES } from '../data/map.js';
import { teams } from '../core/world.js';
import { goToBuilding, setGoal, walk } from './movement.js';
import { isGone, opponent } from './query.js';

export const laneById = (id) => LANES.find((l) => l.id === id);

/** The waypoints of a lane in the order `team` walks them. */
export function laneRoute(team, id) {
  const lane = laneById(id);
  if (!lane) return null;
  return team === 0 ? lane.points : lane.points.slice().reverse();
}

/** Distance from point (x, z) to a lane's line, and the index of the waypoint after the nearest bit of line, in `route` order. */
function nearestOnRoute(route, x, z) {
  let best = 1e9, next = 1;
  for (let s = 0; s + 1 < route.length; s++) {
    const [ax, az] = route[s], [bx, bz] = route[s + 1], dx = bx - ax, dz = bz - az;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz || 1)));
    const d = Math.hypot(x - (ax + dx * t), z - (az + dz * t));
    if (d < best) { best = d; next = s + 1; }
  }
  return { dist: best, next };
}

/** The lane whose line passes nearest a point (ties go to the middle lane). A building's troops use the lane it stands closest to. */
export function laneFor(team, x, z) {
  let best = null, bestDist = 1e9;
  for (const lane of LANES) {
    const d = nearestOnRoute(laneRoute(team, lane.id), x, z).dist - (lane.id === 'mid' ? .01 : 0);
    if (d < bestDist) { bestDist = d; best = lane; }
  }
  return best;
}

/**
 * Take one step of a march on the enemy keep: along the unit's lane waypoint by waypoint, then straight at the keep. Returns 1 when it
 * has arrived at the keep, 0 otherwise. A waypoint that cannot be reached is skipped after a few failed tries.
 */
export function marchOnKeep(u, dt) {
  const route = u.lane ? laneRoute(u.team, u.lane) : null;
  if (route) {
    if (u.laneStep == null) u.laneStep = nearestOnRoute(route, u.x, u.z).next;
    if (u.laneStep < route.length) {
      const [wx, wz] = route[u.laneStep], i = Math.floor(wx), j = Math.floor(wz);
      if (!u.goal && !u.path) setGoal(u, i, j, i, j, true);
      const r = walk(u, dt);
      if (r === 1 || u.fails > 2) { u.laneStep++; u.fails = 0; u.goal = null; u.path = null; }
      return 0;
    }
  }
  const keep = teams[opponent(u.team)].keep;
  if (isGone(keep)) return 0;
  if (!u.goal && !u.path) goToBuilding(u, keep, true);
  return walk(u, dt) === 1 ? 1 : 0;
}
