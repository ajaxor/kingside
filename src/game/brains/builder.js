// Carpenters and masons: haul missing supplies from the keep to a building plan, then raise it.
//
// States: idle -> (toKeep -> toSite) for a haul job, or (toBuild -> building) for a build job; 'home' when walking back to their hut.
// A haul job reserves its amount in the site's `incoming` so two builders do not carry the same thing.

import { teams, buildings } from '../../core/world.js';
import { BUILDINGS } from '../../data/buildings.js';
import { RESOURCE_IDS } from '../../data/resources.js';
import { centerX, centerZ, distToBuilding, isGone } from '../query.js';
import { completeBuilding } from '../buildings.js';
import { goHome, goToBuilding, walk } from '../movement.js';

const HAUL_LOAD = 10;   // most a builder carries in one trip

/** What this worker should do next: haul to the plan that needs it, or build a plan that has everything. Null if there is nothing. */
export function pickBuildJob(u) {
  const stock = teams[u.team].stock;
  let best = null, bestScore = 1e9;
  for (const site of buildings) {
    if (site.team !== u.team || site.built) continue;
    const builder = BUILDINGS[site.type].builder;
    if (builder && builder !== 'any' && builder !== u.kind) continue;
    const dist = Math.hypot(centerX(site) - u.x, centerZ(site) - u.z);
    let full = true, haul = null;
    for (const r of RESOURCE_IDS) {
      if (site.need[r] > site.have[r]) full = false;
      const remaining = site.need[r] - site.have[r] - site.incoming[r];
      if (!haul && remaining > 0 && stock[r] >= 1) haul = { kind: 'haul', site, resource: r, amount: Math.min(HAUL_LOAD, remaining, Math.floor(stock[r])) };
    }
    if (full) {                                   // everything is there: building beats hauling
      const score = dist * .3 + site.id * .5 - 1000;
      if (score < bestScore) { bestScore = score; best = { kind: 'build', site }; }
    } else if (haul) {
      const score = dist * .3 + site.id * .5;
      if (score < bestScore) { bestScore = score; best = haul; }
    }
  }
  return best;
}

/** Give up the current job and go back to waiting for the next one. */
function abandon(u) {
  u.job = null; u.state = 'idle'; u.goal = null;
}

export function thinkBuilder(u, dt) {
  const stock = teams[u.team].stock, job = u.job;
  switch (u.state) {
    case 'idle': {
      u.timer -= dt;
      if (u.timer > 0) return;
      u.timer = .6;
      const next = pickBuildJob(u);
      if (!next) { goHome(u); return; }
      u.job = next;
      if (next.kind === 'haul') {
        next.site.incoming[next.resource] += next.amount;
        next.reserved = true;
        goToBuilding(u, teams[u.team].keep);
        u.state = 'toKeep';
      } else {
        goToBuilding(u, next.site);
        u.state = 'toBuild';
      }
      return;
    }
    case 'home':
      if (walk(u, dt) !== 0) { u.state = 'idle'; u.goal = null; }
      return;
    case 'toKeep': {
      if (isGone(job.site)) { job.site.incoming[job.resource] -= job.amount; u.job = null; u.state = 'idle'; return; }
      const r = walk(u, dt);
      if (r === -1 && u.fails > 3) { job.site.incoming[job.resource] -= job.amount; abandon(u); return; }
      if (r === 1) {                              // at the keep: take what is actually there
        const take = Math.min(job.amount, Math.floor(stock[job.resource]));
        job.site.incoming[job.resource] -= job.amount;
        job.reserved = false;
        if (take <= 0) { u.job = null; u.state = 'idle'; return; }
        stock[job.resource] -= take;
        job.amount = take;
        job.site.incoming[job.resource] += take;
        job.reserved = true;
        u.carry = { item: job.resource, amount: take };
        goToBuilding(u, job.site);
        u.state = 'toSite';
      }
      return;
    }
    case 'toSite': {
      if (isGone(job.site) || job.site.built) {   // the plan is gone: put the load back
        stock[job.resource] += job.amount;
        if (!isGone(job.site)) job.site.incoming[job.resource] -= job.amount;
        u.carry = null; abandon(u);
        return;
      }
      const r = walk(u, dt);
      if (r === -1 && u.fails > 3) {
        stock[job.resource] += job.amount;
        job.site.incoming[job.resource] -= job.amount;
        u.carry = null; abandon(u);
        return;
      }
      if (r === 1) {
        job.site.have[job.resource] += job.amount;
        job.site.incoming[job.resource] -= job.amount;
        job.reserved = false;
        u.carry = null; u.job = null; u.state = 'idle'; u.timer = .05;
      }
      return;
    }
    case 'toBuild': {
      if (isGone(job.site) || job.site.built) { abandon(u); return; }
      const r = walk(u, dt);
      if (r === -1 && u.fails > 3) { abandon(u); return; }
      if (r === 1) u.state = 'building';
      return;
    }
    case 'building': {
      const site = job.site;
      if (isGone(site) || site.built) { u.job = null; u.state = 'idle'; return; }
      if (distToBuilding(u.x, u.z, site) > 1.6) { goToBuilding(u, site); u.state = 'toBuild'; return; }
      u.face = Math.atan2(centerX(site) - u.x, centerZ(site) - u.z);
      u.working = true;
      site.progress += dt / BUILDINGS[site.type].buildTime;
      site.hp = Math.min(site.maxHp, site.maxHp * (.3 + .7 * site.progress));
      if (site.progress >= 1) completeBuilding(site);
      return;
    }
  }
}
