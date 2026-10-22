// Models of the buildings, each a small function that adds a few boxes, roofs and cones to a MeshBuilder `m`. `T` is the owning team's
// roof colour and `TD` its darker trim. Models are built once per team and shared by every building of that type.
//
// They are deliberately plain: a base, a body, a roof in the team colour, a dark door, and one thing that says what the building is for
// (a chimney, a crane, a haystack). No fine detail, so the silhouette and the roof colour read from a long way off.
//
// A model id is a building type, or one of the pieces a wall is drawn from ('post', 'link', 'ppost', 'plink' and the gate), or 'field'.
// Coordinates are in tiles around the footprint's centre; y is up.

import { mulberry } from '../../core/random.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C, TEAM_COLORS } from '../palette.js';

const TAU = 6.283;
const flag = (m, x, z, y0, y1, T) => { m.box(x - .03, y0, z - .03, x + .03, y1, z + .03, C.woodD); m.box(x + .03, y1 - .36, z - .02, x + .5, y1 - .02, z + .02, T); };

export const BUILDING_MODELS = {
  keep(m, T) {
    m.box(-1.4, 0, -1.4, 1.4, .16, 1.4, C.stoneD);
    m.box(-1.12, 0, -1.12, 1.12, 1.2, 1.12, C.stone);
    m.box(-1.2, 1.2, -1.2, 1.2, 1.4, 1.2, C.stoneD);                    // the parapet, one slab
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {               // corner turrets
      const x = sx * 1.1, z = sz * 1.1;
      m.cyl(x, 0, z, .44, 1.8, .44, 6, C.stone);
      m.cyl(x, 1.8, z, .54, 2.75, 0, 6, T);
    }
    m.box(-.62, 1.4, -.62, .62, 2.5, .62, C.stone);
    m.cyl(0, 2.5, 0, .92, 3.35, 0, 4, T, Math.PI / 4);
    m.box(-.28, 0, 1.1, .28, .66, 1.16, C.dark);                        // gate
    flag(m, 0, 0, 3.2, 4.1, T);
  },
  hut(m, T) {
    m.box(-.62, 0, -.48, .62, .72, .48, C.wood);
    m.roof(-.74, -.62, .74, .62, .72, .52, T, C.wood);
    m.box(-.12, 0, .48, .12, .45, .52, C.dark);
    m.box(.5, 0, .55, .9, .22, .9, C.stone);                            // a block of stone
    m.box(-.9, 0, .3, -.66, .2, .84, C.woodD);                          // a plank bench
  },
  mill(m, T) {
    m.box(-.7, 0, -.55, .45, .78, .45, C.wood);
    m.roof(-.82, -.68, .57, .58, .78, .5, T, C.wood);
    m.box(-.14, 0, .45, .14, .48, .49, C.dark);
    m.box(.55, 0, -.6, .95, .17, .4, C.trunk, C.wood); m.box(.6, .17, -.5, .9, .34, .3, C.trunk, C.wood);   // logs
  },
  quarry(m) {
    m.box(-.9, 0, -.9, .9, .06, .9, C.rockD);
    m.box(-.85, .06, -.85, -.5, .5, .85, C.stoneD); m.box(-.5, .06, -.85, .85, .5, -.5, C.stoneD);
    m.box(-.2, .06, -.2, .25, .36, .25, C.stone);
    m.box(.5, 0, -.4, .6, 1.5, -.3, C.woodD); m.box(.55, 1.4, -.35, -.2, 1.5, -.27, C.wood);   // crane
  },
  mine(m) {
    const r = mulberry(7);
    m.blob(-.1, .1, -.2, .95, .8, .8, C.rockD, .12, r, 6, 3, (ring) => (ring === 0 ? C.grassD : C.rockD));
    m.box(-.4, 0, .35, .4, .66, .58, C.woodD); m.box(-.28, 0, .5, .28, .52, .6, C.dark);       // the adit
    m.blob(.6, .26, .78, .22, .12, .14, C.iron, 0, null, 5, 2);
  },
  farm(m, T) {
    m.box(-.75, 0, -.6, .45, .62, .45, C.wood);
    m.roof(-.87, -.72, .57, .57, .62, .5, T, C.wood);
    m.box(-.15, 0, .45, .15, .46, .5, C.dark);
    m.cyl(.72, 0, .55, .34, .55, .26, 6, C.straw); m.cyl(.72, .55, .55, .26, .85, 0, 6, C.straw);   // haystack
  },
  field(m) {
    m.box(-.5, 0, -.5, .5, .04, .5, C.soil);
    for (const x of [-.3, 0, .3]) m.box(x - .07, .04, -.4, x + .07, .3, .4, C.cropG, C.crop);
  },
  fletch(m, T) {
    m.box(-.65, 0, -.5, .55, .7, .4, C.wood);
    m.roof(-.77, -.62, .67, .52, .7, .46, T, C.wood);
    m.box(-.12, 0, .4, .12, .45, .44, C.dark);
    m.box(.7, 0, -.08, .78, .9, -.02, C.woodD); m.cyl(.74, .88, .25, .24, .92, .24, 8, C.straw, 0, [.9, .3, .25]);   // an archery target
  },
  tower(m, T) {
    m.cyl(0, 0, 0, .42, 2.1, .36, 6, C.stone);
    m.cyl(0, 2.1, 0, .5, 2.4, .5, 6, C.stoneD);                         // the parapet, one ring
    m.cyl(0, 2.4, 0, .34, 3.1, 0, 6, T);
    m.box(-.13, 0, .33, .13, .5, .42, C.dark);
  },
  ranger(m, T) {
    m.cyl(-.4, 0, -.3, .5, .9, 0, 4, [.34, .56, .34], Math.PI / 4);   // tents
    m.cyl(.45, 0, -.45, .4, .75, 0, 4, [.30, .50, .30], Math.PI / 4);
    m.cyl(-.5, 0, .5, .14, .12, .14, 6, C.rockD); m.cyl(-.5, .12, .5, .08, .28, 0, 5, C.fire);   // campfire
    flag(m, .6, .45, 0, 1.25, T);
  },
  raider(m, T) {
    m.cyl(-.35, 0, -.35, .52, .95, 0, 5, [.40, .32, .30], .3);
    m.cyl(.45, 0, -.3, .38, .72, 0, 5, [.34, .28, .26], .8);
    for (let i = 0; i < 6; i++) {                                     // a ring of stakes with a gap for a gate
      const a = i / 6 * TAU;
      if (a > 1.0 && a < 2.1) continue;
      m.cyl(Math.cos(a) * .92, 0, Math.sin(a) * .92, .07, .55, 0, 4, C.woodD);
    }
    m.cyl(.1, 0, .4, .13, .1, .13, 6, C.rockD); m.cyl(.1, .1, .4, .08, .3, 0, 5, C.fire);
    flag(m, -.6, .4, 0, 1.3, T);
  },
  barracks(m, T) {
    m.box(-.85, 0, -.6, .85, .32, .45, C.stoneD); m.box(-.82, .32, -.58, .82, .82, .42, C.wood);
    m.roof(-.95, -.72, .95, .56, .82, .48, T, C.wood); m.box(-.16, 0, .45, .16, .55, .5, C.dark);
    flag(m, -.7, .65, 0, 1.4, T);
  },
  hall(m, T) {
    m.box(-.88, 0, -.62, .88, .28, .5, C.stoneD); m.box(-.82, .28, -.56, .82, .92, .44, C.wood); m.roof(-.98, -.72, .98, .58, .92, .56, T, C.wood);
    m.box(-.16, 0, .44, .16, .6, .5, C.dark);
    flag(m, .7, .65, 0, 1.7, T); m.box(.73, 1.45, .64, .85, 1.55, .66, C.gold);
  },
  workshop(m, T) {
    m.box(-.92, 0, -.72, .92, .07, .72, C.soilD);
    for (const x of [-.88, .88]) for (const z of [-.68, .68]) m.box(x - .06, .07, z - .06, x + .06, .95, z + .06, C.woodD);
    m.roof(-.98, -.78, .98, .78, .95, .34, T, C.wood);
    m.box(-.62, .25, -.12, .6, .42, .12, C.trunk, C.wood); m.box(.5, .07, .4, .85, .32, .7, C.woodD, C.wood);
  },
  lodge(m, T) {
    m.box(-.66, 0, -.5, .66, .74, .5, C.stone); m.roof(-.78, -.62, .78, .62, .74, .5, T, C.stoneD);
    m.box(-.12, 0, .5, .12, .46, .54, C.dark);
    m.box(.74, 0, 0, 1.0, .2, .4, C.stone); m.box(.78, .2, .04, .98, .38, .34, C.stoneD);   // stacked stone
  },
  smith(m, T) {
    m.box(-.72, 0, -.52, .5, .7, .42, C.stoneD); m.roof(-.84, -.62, .62, .54, .7, .46, T, C.woodD);
    m.box(.1, .68, -.4, .4, 1.55, -.1, C.stone);                        // chimney
    m.box(-.14, 0, .42, .14, .46, .46, C.dark); m.box(-.56, .28, .42, -.26, .5, .46, C.fire);
    m.box(.62, 0, .12, .96, .2, .52, C.steelD); m.box(.54, .2, .06, 1.0, .32, .58, C.steel);   // anvil
  },
  engineer(m, T) {
    m.box(-.95, 0, -.8, .95, .06, .8, C.soilD);
    m.box(-.82, .06, -.62, .12, .7, .3, C.wood); m.roof(-.92, -.72, .22, .4, .7, .4, T, C.woodD); m.box(-.12, .06, .3, .1, .46, .34, C.dark);
    m.box(.58, .06, -.66, .68, 1.55, -.56, C.woodD); m.box(.2, 1.45, -.67, .82, 1.55, -.55, C.woodD);   // crane
    m.cyl(.5, .06, .5, .28, .24, .28, 6, C.steelD);
  },

  // ---- pieces walls and gates are made of ----
  ppost(m) {
    m.cyl(0, 0, 0, .15, .82, .11, 5, C.wood); m.cyl(0, .82, 0, .11, 1.05, 0, 5, C.wood);
  },
  plink(m) {
    m.box(0, 0, -.06, 1, .82, .06, C.wood);
    for (const t of [.2, .5, .8]) m.cyl(t, .82, 0, .1, 1.0, 0, 4, C.wood);
    m.box(0, .3, -.08, 1, .38, .08, C.woodD);
  },
  gate(m, T) {
    m.box(-.5, 0, -.32, -.2, 1.25, .32, C.stone); m.box(.2, 0, -.32, .5, 1.25, .32, C.stone); m.box(-.5, .82, -.32, .5, 1.25, .32, C.stone);
    m.box(-.2, 0, -.2, .2, .8, .2, C.dark);
    flag(m, 0, 0, 1.25, 1.78, T);
  },
  trap(m) {
    m.box(-.42, 0, -.42, .42, .03, .42, C.soilD);
    for (const x of [-.22, .22]) for (const z of [-.22, .22]) m.cyl(x, .03, z, .08, .34, 0, 4, C.woodD);
  },
  ballista(m, T) {
    m.cyl(0, 0, 0, .36, .55, .3, 6, C.stone); m.box(-.34, .55, -.34, .34, .62, .34, C.stoneD);
    m.box(-.05, .62, -.2, .05, .76, .4, C.woodD); m.box(-.38, .7, .24, .38, .8, .32, C.woodD);
    m.box(-.3, .55, -.3, -.24, 1.12, -.24, C.woodD); m.box(-.24, .86, -.3, -.02, 1.1, -.26, T);
  },
  bastion(m, T) {
    m.box(-.95, 0, -.95, .95, .22, .95, C.stoneD);
    m.cyl(0, .2, 0, .8, 2.2, .68, 8, C.stone); m.cyl(0, 2.2, 0, .88, 2.5, .88, 8, C.stoneD);
    m.cyl(0, 2.5, 0, .55, 3.25, 0, 6, T); m.box(-.18, 0, .7, .18, .72, .76, C.dark);
    flag(m, 0, 0, 3.2, 3.9, T);
  },
  post(m, T) {
    m.box(-.3, 0, -.3, .3, 1.0, .3, C.stone);
    m.box(-.34, 1.0, -.34, .34, 1.12, .34, C.stoneD, T);
  },
  link(m) {
    m.box(0, 0, -.2, 1, .82, .2, C.stone);
    m.box(0, .82, -.25, 1, .96, .25, C.stoneD);                         // a single coping slab
  },
};

/** Build the model `id` in `team`'s colours. */
export function buildBuildingModel(id, team) {
  const m = new MeshBuilder(), colors = TEAM_COLORS[team];
  BUILDING_MODELS[id](m, colors.roof, colors.dark);
  return m;
}
