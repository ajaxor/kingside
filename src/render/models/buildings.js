// Models of the buildings, each a small function that adds boxes, roofs and cones to a MeshBuilder `m`. `T` is the owning team's
// roof colour and `TD` its darker trim. Models are built once per team and shared by every building of that type.
//
// A model id is a building type, or one of the pieces a wall is drawn from ('post', 'link', 'ppost', 'plink' and the gate), or 'field'.
// Coordinates are in tiles around the footprint's centre; y is up.

import { mulberry } from '../../core/random.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C, TEAM_COLORS } from '../palette.js';

const TAU = 6.283;

export const BUILDING_MODELS = {
  keep(m, T) {
    m.box(-1.4, 0, -1.4, 1.4, .16, 1.4, C.stoneD);
    m.box(-1.12, 0, -1.12, 1.12, 1.2, 1.12, C.stone);
    for (let t = -.95; t <= .96; t += .38) {                       // battlements on all four sides
      m.box(t - .1, 1.2, 1.0, t + .1, 1.42, 1.14, C.stone);
      m.box(t - .1, 1.2, -1.14, t + .1, 1.42, -1.0, C.stone);
      m.box(-1.14, 1.2, t - .1, -1.0, 1.42, t + .1, C.stone);
      m.box(1.0, 1.2, t - .1, 1.14, 1.42, t + .1, C.stone);
    }
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {           // corner turrets
      const x = sx * 1.1, z = sz * 1.1;
      m.cyl(x, 0, z, .44, 1.8, .44, 8, C.stone);
      m.cyl(x, 1.8, z, .54, 2.75, 0, 8, T);
    }
    m.box(-.62, 1.2, -.62, .62, 2.5, .62, C.stone);
    m.cyl(0, 2.5, 0, .92, 3.35, 0, 4, T, Math.PI / 4);
    m.box(-.26, 0, 1.1, .26, .62, 1.16, C.woodD);
    m.box(-1.16, .55, -.15, -1.1, .85, .15, C.dark);
    m.box(-.03, 3.2, -.03, .03, 4.1, .03, C.woodD);                // flagpole and flag
    m.box(.03, 3.68, -.015, .55, 4.02, .015, T);
  },
  hut(m, T) {
    m.box(-.62, 0, -.48, .62, .72, .48, C.wood);
    m.roof(-.74, -.62, .74, .62, .72, .52, T, C.wood);
    m.box(.28, .8, -.3, .44, 1.28, -.14, C.stoneD);
    m.box(-.12, 0, .48, .12, .45, .52, C.woodD);
    m.box(-.88, 0, .3, -.66, .12, .84, C.woodD); m.box(-.86, .12, .36, -.68, .22, .78, C.wood);
    m.box(.5, 0, .55, .9, .06, .9, C.stoneD); m.box(.56, .06, .6, .76, .22, .8, C.stone);
  },
  mill(m, T) {
    m.box(-.7, 0, -.55, .45, .78, .45, C.wood);
    m.roof(-.82, -.68, .57, .58, .78, .5, T, C.wood);
    m.box(-.14, 0, .45, .14, .48, .49, C.woodD);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3 - r; c++) {   // a stack of logs
      const y = .1 + r * .17;
      m.box(.55, y - .08, -.6 + c * .19 + r * .09, .95, y + .08, -.45 + c * .19 + r * .09, C.trunk, C.wood);
    }
    m.box(.5, 0, .35, .92, .18, .75, C.woodD, C.wood);
    m.cyl(.71, .18, .55, .13, .24, .13, 6, C.steel);
  },
  quarry(m) {
    m.box(-.9, 0, -.9, .9, .06, .9, C.rockD);
    m.box(-.85, 0, -.85, -.55, .5, .85, C.stoneD); m.box(-.55, 0, -.85, .85, .5, -.55, C.stoneD);
    m.box(-.2, .06, -.2, .2, .36, .2, C.stone); m.box(.25, .06, .2, .6, .3, .55, C.stone); m.box(-.4, .06, .35, -.1, .26, .65, C.stone);
    m.box(.5, 0, -.4, .6, 1.5, -.3, C.woodD); m.box(.55, 1.4, -.35, -.25, 1.48, -.27, C.wood); m.box(-.22, .5, -.32, -.2, 1.4, -.3, C.dark);
    m.box(.55, 0, .6, .9, .22, .9, C.wood);
  },
  mine(m) {
    const r = mulberry(7);
    m.blob(-.1, .12, -.2, .95, .75, .8, C.rockD, .25, r, 7, 4, (ring) => (ring === 0 ? C.grassD : C.rockD));
    m.box(-.38, 0, .35, .38, .66, .55, C.woodD); m.box(-.26, 0, .5, .26, .52, .58, C.dark); m.box(-.44, .62, .32, .44, .74, .6, C.wood);
    m.box(.35, 0, .65, .85, .25, .92, C.woodD); m.blob(.6, .3, .78, .2, .1, .12, C.iron, .4, r, 5, 3);
    m.blob(-.75, .08, .6, .18, .14, .16, C.iron, .4, r, 5, 3);
  },
  farm(m, T) {
    m.box(-.75, 0, -.6, .45, .62, .45, C.wood);
    m.roof(-.87, -.72, .57, .57, .62, .5, T, C.wood);
    m.box(-.15, 0, .45, .15, .46, .5, C.woodD); m.box(-.5, .28, .45, -.3, .5, .49, C.woodD);
    m.cyl(.72, 0, .55, .32, .5, .27, 8, C.straw); m.cyl(.72, .5, .55, .27, .78, 0, 8, C.straw);   // haystack
    m.box(-.88, 0, .62, -.5, .1, .78, C.woodD); m.box(.55, 0, -.85, .9, .14, -.5, C.woodD, C.straw);
  },
  field(m) {
    m.box(-.5, 0, -.5, .5, .04, .5, C.soil);
    for (const x of [-.3, 0, .3]) m.box(x - .06, .04, -.4, x + .06, .3, .4, C.cropG, C.crop);
  },
  fletch(m, T) {
    m.box(-.65, 0, -.5, .55, .7, .4, C.wood);
    m.roof(-.77, -.62, .67, .52, .7, .46, T, C.wood);
    m.box(-.12, 0, .4, .12, .45, .44, C.woodD);
    m.box(.7, 0, -.08, .76, .9, -.02, C.woodD); m.cyl(.73, .88, .25, .24, .92, .24, 10, C.straw, 0, [.85, .3, .25]);   // target
    for (let i = 0; i < 5; i++) m.box(-.85 + i * .08, 0, .55, -.82 + i * .08, .6, .58, C.woodD);                       // arrows in a rack
    m.box(-.9, .45, .53, -.45, .5, .6, C.wood);
  },
  tower(m, T) {
    m.cyl(0, 0, 0, .42, 2.1, .36, 8, C.stone);
    m.cyl(0, 2.1, 0, .48, 2.35, .48, 8, C.stoneD);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      m.box(Math.cos(a) * .42 - .07, 2.35, Math.sin(a) * .42 - .07, Math.cos(a) * .42 + .07, 2.52, Math.sin(a) * .42 + .07, C.stone);
    }
    m.cyl(0, 2.42, 0, .32, 3.1, 0, 8, T);
    m.box(-.12, 1.4, .34, .12, 1.6, .41, C.dark); m.box(-.13, 0, .33, .13, .45, .42, C.woodD);
  },
  ranger(m, T) {
    m.cyl(-.4, 0, -.3, .5, .9, 0, 4, [.40, .55, .36], Math.PI / 4);   // tents
    m.cyl(.45, 0, -.45, .4, .75, 0, 4, [.36, .5, .33], Math.PI / 4);
    m.cyl(-.5, 0, .5, .12, .08, .12, 6, C.rockD); m.cyl(-.5, .08, .5, .08, .24, 0, 5, C.fire);   // campfire
    m.box(.6, 0, .45, .65, 1.25, .5, C.woodD); m.box(.65, .82, .47, .98, 1.2, .49, T);
    m.box(-.05, 0, .4, .25, .35, .7, C.woodD);
  },
  raider(m, T) {
    m.cyl(-.35, 0, -.35, .52, .95, 0, 5, [.36, .30, .28], .3);
    m.cyl(.45, 0, -.3, .38, .72, 0, 5, [.32, .27, .25], .8);
    for (let i = 0; i < 9; i++) {                                     // a ring of stakes with a gap for a gate
      const a = i / 9 * TAU;
      if (a > 1.0 && a < 1.9) continue;
      m.cyl(Math.cos(a) * .92, 0, Math.sin(a) * .92, .06, .55, 0, 4, C.woodD);
    }
    m.cyl(.1, 0, .4, .12, .08, .12, 6, C.rockD); m.cyl(.1, .08, .4, .08, .26, 0, 5, C.fire);
    m.box(-.6, 0, .4, -.55, 1.3, .45, C.woodD); m.box(-.55, .85, .42, -.2, 1.25, .44, T);
  },
  barracks(m, T) {
    m.box(-.85, 0, -.6, .85, .32, .45, C.stoneD); m.box(-.82, .32, -.58, .82, .82, .42, C.wood);
    m.roof(-.95, -.72, .95, .56, .82, .48, T, C.wood); m.box(-.16, 0, .45, .16, .55, .5, C.woodD);
    m.box(.55, 0, .6, .6, .7, .65, C.woodD); m.box(.43, .45, .6, .72, .5, .65, C.woodD); m.blob(.575, .8, .625, .1, .1, .1, C.straw, 0, null, 6, 3);   // training dummy
    m.box(-.7, 0, .65, -.65, 1.4, .7, C.woodD); m.box(-.65, .95, .66, -.3, 1.35, .68, T);
  },
  hall(m, T) {
    m.box(-.88, 0, -.62, .88, .28, .5, C.stoneD); m.box(-.82, .28, -.56, .82, .92, .44, C.wood); m.roof(-.98, -.72, .98, .58, .92, .56, T, C.wood);
    m.box(-.16, 0, .44, .16, .6, .5, C.woodD); m.box(.7, 0, .65, .76, 1.7, .71, C.woodD); m.box(.42, 1.14, .66, .7, 1.58, .68, T); m.box(.42, 1.5, .655, .7, 1.58, .685, C.gold);
    m.box(-.76, 0, .7, -.7, .7, .76, C.woodD); m.box(-.9, .5, .7, -.56, .56, .76, C.woodD); m.blob(-.73, .8, .73, .1, .1, .1, C.straw, 0, null, 6, 3);
  },
  workshop(m, T) {
    m.box(-.92, 0, -.72, .92, .07, .72, C.soilD);
    for (const x of [-.88, .88]) for (const z of [-.68, .68]) m.box(x - .05, .07, z - .05, x + .05, .95, z + .05, C.woodD);
    m.roof(-.98, -.78, .98, .78, .95, .34, T, C.wood);
    m.box(-.62, .25, -.1, .6, .42, .1, C.trunk, C.wood); m.box(.55, .22, -.14, .72, .46, .14, C.steel); m.box(-.5, .07, -.2, -.4, .25, .2, C.woodD); m.box(.3, .07, -.2, .4, .25, .2, C.woodD);
    m.box(.5, .07, .4, .85, .32, .7, C.woodD, C.wood); m.box(-.85, .07, .38, -.45, .14, .7, C.wood); m.blob(-.65, .2, .54, .12, .1, .12, C.rockD, .2, mulberry(9), 5, 3);
  },
  lodge(m, T) {
    m.box(-.66, 0, -.5, .66, .74, .5, C.stone); m.roof(-.78, -.62, .78, .62, .74, .5, T, C.stoneD);
    m.box(-.12, 0, .5, .12, .46, .54, C.woodD); m.box(.28, .8, -.32, .46, 1.32, -.14, C.stoneD);
    m.box(.74, 0, 0, 1.0, .2, .4, C.stone); m.box(.78, .2, .04, .98, .38, .34, C.stoneD); m.box(.8, .38, .08, .94, .5, .3, C.stone);   // stacked stone
    m.box(-1.0, 0, .55, -.62, .16, .92, C.stone); m.box(-.96, .16, .6, -.7, .3, .88, C.stoneD);
    m.box(.5, 0, .62, .56, .9, .68, C.woodD); m.box(.5, .82, .62, .9, .88, .68, C.woodD);
  },
  smith(m, T, TD) {
    m.box(-.72, 0, -.52, .5, .7, .42, C.stoneD); m.roof(-.84, -.62, .62, .54, .7, .46, T, C.woodD);
    m.box(.12, .68, -.38, .38, 1.55, -.12, C.stone); m.box(.08, 1.55, -.42, .42, 1.64, -.08, C.stoneD);   // chimney
    m.box(-.14, 0, .42, .14, .46, .46, C.woodD); m.box(-.56, .28, .42, -.26, .5, .46, C.fire);
    m.box(.62, 0, .12, .9, .18, .52, C.steelD); m.box(.54, .18, .06, .98, .32, .58, C.steel); m.box(.94, .24, .2, 1.02, .3, .42, C.steel);   // anvil
    m.box(.6, 0, -.78, .92, .34, -.46, C.woodD); m.box(-.9, 0, .5, -.68, .12, .9, C.woodD); m.box(-.84, .12, .56, -.74, .36, .62, C.steel);
  },
  engineer(m, T) {
    m.box(-.95, 0, -.8, .95, .06, .8, C.soilD);
    m.box(-.82, .06, -.62, .12, .7, .3, C.wood); m.roof(-.92, -.72, .22, .4, .7, .4, T, C.woodD); m.box(-.12, .06, .3, .1, .46, .34, C.woodD);
    m.box(.58, .06, -.66, .68, 1.55, -.56, C.woodD); m.box(.2, 1.45, -.67, .82, 1.55, -.55, C.woodD); m.box(.22, .95, -.63, .26, 1.45, -.59, C.canvas); m.box(.16, .8, -.7, .34, .95, -.5, C.woodD);   // crane
    m.cyl(.5, .06, .5, .28, .2, .28, 10, C.steelD); m.cyl(.5, .2, .5, .1, .3, .1, 6, C.steel);
    m.box(.2, .06, 0, .8, .2, .3, C.trunk, C.wood); m.box(-.8, .06, .5, -.3, .14, .8, C.wood);
  },

  // ---- pieces walls and gates are made of ----
  ppost(m) {
    m.cyl(0, 0, 0, .14, .82, .1, 5, C.wood); m.cyl(0, .82, 0, .1, 1.05, 0, 5, C.wood);
    m.cyl(.14, 0, .1, .1, .7, .07, 5, C.woodD); m.cyl(-.14, 0, -.1, .1, .62, 0, 5, C.woodD); m.box(-.2, .35, -.03, .2, .4, .03, C.woodD);
  },
  plink(m) {
    for (const t of [.18, .36, .54, .72, .9]) { m.cyl(t, 0, 0, .1, .78, .07, 5, C.wood); m.cyl(t, .78, 0, .07, .95, 0, 5, C.wood); }
    m.box(0, .3, -.04, 1, .36, .04, C.woodD); m.box(0, .6, -.04, 1, .66, .04, C.woodD);
  },
  gate(m, T) {
    m.box(-.5, 0, -.32, -.2, 1.25, .32, C.stone); m.box(.2, 0, -.32, .5, 1.25, .32, C.stone); m.box(-.5, .82, -.32, .5, 1.25, .32, C.stone);
    for (const t of [-.42, -.14, .14, .42]) for (const z of [-.26, .26]) m.box(t - .07, 1.25, z - .06, t + .07, 1.42, z + .06, C.stone);
    m.box(-.2, 0, .3, -.14, .74, .52, C.woodD); m.box(.14, 0, .3, .2, .74, .52, C.woodD);
    m.box(-.02, 1.25, -.02, .02, 1.78, .02, C.woodD); m.box(.02, 1.5, -.01, .34, 1.74, .01, T);
  },
  trap(m) {
    m.box(-.42, 0, -.42, .42, .03, .42, C.soilD);
    for (const x of [-.26, 0, .26]) for (const z of [-.26, 0, .26]) m.cyl(x, .03, z, .055, .3, 0, 4, C.woodD);
  },
  ballista(m, T) {
    m.cyl(0, 0, 0, .36, .55, .3, 8, C.stone); m.box(-.34, .55, -.34, .34, .62, .34, C.stoneD);
    m.box(-.05, .62, -.2, .05, .76, .36, C.woodD); m.box(-.36, .7, .24, .36, .78, .3, C.woodD); m.box(-.015, .76, -.05, .015, .8, .5, C.steel);
    m.box(-.3, .55, -.3, -.26, 1.12, -.26, C.woodD); m.box(-.26, .86, -.3, -.04, 1.1, -.28, T);
  },
  bastion(m, T) {
    m.box(-.95, 0, -.95, .95, .22, .95, C.stoneD);
    m.cyl(0, .2, 0, .8, 2.2, .68, 10, C.stone); m.cyl(0, 2.2, 0, .86, 2.5, .86, 10, C.stoneD);
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * TAU;
      m.box(Math.cos(a) * .8 - .1, 2.5, Math.sin(a) * .8 - .1, Math.cos(a) * .8 + .1, 2.76, Math.sin(a) * .8 + .1, C.stone);
    }
    m.cyl(0, 2.5, 0, .5, 3.25, 0, 8, T); m.box(-.17, 0, .7, .17, .7, .76, C.woodD);
    for (let i = 0; i < 4; i++) {                                     // arrow slits
      const a = i * 1.5708 + .5;
      m.box(Math.cos(a) * .72 - .06, 1.3, Math.sin(a) * .72 - .06, Math.cos(a) * .72 + .06, 1.75, Math.sin(a) * .72 + .06, C.dark);
    }
    m.box(-.03, 3.2, -.03, .03, 3.9, .03, C.woodD); m.box(.03, 3.55, -.015, .55, 3.85, .015, T);
  },
  post(m, T) {
    m.box(-.3, 0, -.3, .3, 1.0, .3, C.stone);
    m.box(-.33, 1.0, -.33, .33, 1.12, .33, C.stoneD, T);
  },
  link(m) {
    m.box(0, 0, -.2, 1, .82, .2, C.stone);
    for (let t = .12; t < .95; t += .27) m.box(t, .82, -.2, t + .13, .98, .2, C.stone);
  },
};

/** Build the model `id` in `team`'s colours. */
export function buildBuildingModel(id, team) {
  const m = new MeshBuilder(), colors = TEAM_COLORS[team];
  BUILDING_MODELS[id](m, colors.roof, colors.dark);
  return m;
}
