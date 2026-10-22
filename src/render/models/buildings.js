// Models of the buildings, each a small function that adds a few boxes, roofs and cones to a MeshBuilder `m`. `T` is the owning team's
// colour and `TD` its darker trim. Models are built once per team and shared by every building of that type.
//
// A building takes one tile (the keep two) but its body only fills the middle ~.55 of it: the rest is the walkway people use to go round.
// Each type has its own body colour AND its own silhouette, so you can tell them apart in a glance: a thin tower, a squat round bastion,
// a barn with a silo, a smithy with a glowing forge, a mine in a grey mound. Team colour goes on roofs, flags and banners only.
//
// A model id is a building type, or one of the pieces a wall is drawn from ('post', 'link', 'ppost', 'plink' and the gate), or 'field'.
// Coordinates are in tiles around the footprint's centre; y is up.

import { mulberry } from '../../core/random.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C, TEAM_COLORS } from '../palette.js';

const TAU = 6.283;
const pole = (m, x, z, y0, y1, w = .015) => m.box(x - w, y0, z - w, x + w, y1, z + w, C.woodD);
const flag = (m, x, z, y0, y1, T, len = .3) => { pole(m, x, z, y0, y1); m.box(x, y1 - len * .8, z - .012, x + len, y1, z + .012, T); };
const door = (m, x, w, h, z) => m.box(x - w, 0, z - .01, x + w, h, z + .03, C.dark);
// A gear seen face-on: a plus and a cross of boxes, so it reads as a wheel.
const gear = (m, x, y, z, r, col) => {
  m.box(x - r, y - r * .3, z - .015, x + r, y + r * .3, z + .015, col); m.box(x - r * .3, y - r, z - .015, x + r * .3, y + r, z + .015, col);
  m.box(x - r * .75, y - r * .75, z - .01, x + r * .75, y + r * .75, z + .01, col);
};

const WALK = [.30, .52, .30];

export const BUILDING_MODELS = {
  keep(m, T) {                                                         // the one big building: a castle with four turrets and a tall centre
    m.box(-.92, 0, -.92, .92, .08, .92, C.stoneD);
    m.box(-.62, .08, -.62, .62, .85, .62, C.stone);
    m.box(-.68, .85, -.68, .68, .95, .68, C.stoneD);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      m.cyl(sx * .66, 0, sz * .66, .24, 1.35, .22, 8, C.stone); m.cyl(sx * .66, 1.35, sz * .66, .3, 1.9, 0, 8, T);
    }
    m.box(-.34, .95, -.34, .34, 1.7, .34, C.stone);
    m.cyl(0, 1.7, 0, .55, 2.35, 0, 4, T, Math.PI / 4);
    m.box(-.2, .08, .6, .2, .55, .66, C.dark);
    flag(m, 0, 0, 2.3, 2.9, T, .4); m.box(-.02, 2.28, -.02, .02, 2.34, .02, C.gold);
  },
  hut(m, T) {                                                          // a cottage: timber box, team pyramid roof, a log pile
    m.box(-.24, 0, -.2, .24, .3, .2, C.wood);
    m.roof(-.31, -.27, .31, .27, .3, .3, T, C.wood);
    door(m, 0, .06, .2, .2);
    m.box(.2, 0, .24, .36, .08, .36, C.trunk, C.wood);
  },
  mill(m, T) {                                                         // a sawmill: open shed, a big saw wheel and a stack of logs
    m.box(-.26, 0, -.2, .26, .26, .2, C.woodD);
    m.roofZ(-.3, -.24, .3, .24, .26, .16, T, C.wood);
    gear(m, 0, .46, .24, .2, C.steel);
    for (let i = 0; i < 3; i++) m.box(-.3 + i * .1, 0, .3, -.22 + i * .1, .09, .46, C.trunk, C.wood);
    m.box(-.26, .09, .32, -.1, .17, .44, C.trunk, C.wood);
  },
  quarry(m) {                                                          // a pit cut in grey rock with a crane lifting a block
    m.box(-.3, 0, -.3, .3, .06, .3, C.rockD);
    m.box(-.3, .06, -.3, -.16, .26, .3, C.stoneD); m.box(-.16, .06, -.3, .3, .26, -.16, C.stoneD);
    m.box(-.08, .06, -.04, .16, .2, .2, C.stone);
    pole(m, .24, .18, 0, .98, .025); m.box(-.2, .92, .15, .26, .98, .21, C.wood);
    m.box(-.22, .6, .16, -.12, .76, .2, C.stone); m.box(-.175, .76, .17, -.165, .92, .19, C.woodD);
  },
  mine(m) {                                                            // a grey mound with a timber arch and an ore cart
    const r = mulberry(7);
    m.blob(0, 0, -.06, .32, .42, .3, C.rockD, .1, r, 7, 3, (ring) => (ring === 0 ? C.grassD : C.rockD));
    m.box(-.15, 0, .16, .15, .3, .24, C.woodD); m.box(-.09, 0, .15, .09, .22, .27, C.dark);
    m.box(.14, 0, .3, .32, .1, .44, C.steelD); m.blob(.23, .1, .37, .08, .05, .06, C.iron, 0, null, 6, 2);
  },
  farm(m, T) {                                                         // a barn with a tall silo and a hay bale
    m.box(-.3, 0, -.18, .12, .26, .2, [.86, .72, .46]);
    m.roof(-.34, -.22, .16, .24, .26, .22, T, C.woodD);
    door(m, -.09, .07, .2, .2);
    m.cyl(.24, 0, -.04, .11, .62, .11, 8, C.canvas); m.dome(.24, .62, -.04, .11, .13, .11, C.steelD, 8, 2);
    m.cyl(.18, 0, .3, .1, .12, .1, 6, C.straw);
  },
  field(m) {
    m.box(-.5, 0, -.5, .5, .04, .5, C.soil);
    for (const x of [-.3, 0, .3]) m.box(x - .07, .04, -.4, x + .07, .3, .4, C.cropG, C.crop);
  },
  fletch(m, T) {                                                       // a green workshop with a big archery target on a post
    m.box(-.26, 0, -.2, .1, .24, .2, [.40, .60, .40]);
    m.roof(-.3, -.24, .14, .24, .24, .18, T, C.woodD);
    door(m, -.08, .06, .16, .2);
    pole(m, .26, 0, 0, .54, .02);
    m.box(.14, .38, -.2, .38, .74, .2, C.canvas);
    m.box(.14, .43, -.15, .38, .69, .15, C.fire); m.box(.14, .5, -.08, .38, .62, .08, C.canvas); m.box(.14, .54, -.03, .39, .58, .03, C.fire);
  },
  tower(m, T) {                                                        // tall and thin: a stone shaft, battlements and a team point
    m.cyl(0, 0, 0, .19, 1.05, .15, 8, C.stone);
    m.cyl(0, 1.05, 0, .25, 1.2, .25, 8, C.stoneD);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + .78; m.box(Math.cos(a) * .2 - .04, 1.2, Math.sin(a) * .2 - .04, Math.cos(a) * .2 + .04, 1.32, Math.sin(a) * .2 + .04, C.stoneD); }
    m.cyl(0, 1.2, 0, .13, 1.62, 0, 8, T);
    m.box(-.05, 0, .14, .05, .26, .2, C.dark); m.box(-.03, .72, .1, .03, .84, .16, C.dark);
  },
  ranger(m, T) {                                                       // two green tents round a fire
    m.cyl(-.15, 0, -.12, .24, .5, 0, 4, [.30, .52, .30], Math.PI / 4); m.cyl(.17, 0, -.06, .19, .4, 0, 4, [.26, .46, .28], Math.PI / 4);
    m.cyl(-.08, 0, .24, .07, .06, .07, 6, C.rockD); m.cyl(-.08, .06, .24, .05, .18, 0, 5, C.fire);
    flag(m, .26, .26, 0, .7, T, .2);
  },
  raider(m, T) {                                                       // dark hide tents inside a ring of spiked stakes
    m.cyl(-.1, 0, -.1, .22, .5, 0, 5, [.38, .30, .28], .3);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU;
      if (a > 1.0 && a < 1.9) continue;
      m.cyl(Math.cos(a) * .32, 0, Math.sin(a) * .32, .035, .3, 0, 4, C.woodD);
    }
    m.cyl(.1, 0, .12, .06, .06, .06, 6, C.rockD); m.cyl(.1, .06, .12, .04, .2, 0, 5, C.fire);
    flag(m, -.28, .24, 0, .7, T, .2);
  },
  barracks(m, T) {                                                     // long and low, banners at each end and a shield over the door
    m.box(-.3, 0, -.17, .3, .26, .17, C.stoneD); m.box(-.32, .26, -.19, .32, .31, .19, T);
    door(m, 0, .06, .16, .17);
    m.box(-.1, .18, .17, .1, .3, .2, T);
    flag(m, -.29, -.15, .3, .84, T, .22); flag(m, .29, -.15, .3, .84, T, .22);
  },
  hall(m, T) {                                                         // grand: pale stone, a gold dome, team banners
    m.box(-.3, 0, -.24, .3, .34, .24, C.stone); m.box(-.33, .34, -.27, .33, .4, .27, C.gold);
    m.box(-.14, .4, -.14, .14, .62, .14, C.stone); m.dome(0, .62, 0, .17, .2, .17, C.gold, 8, 3);
    door(m, 0, .07, .2, .24);
    flag(m, -.3, .22, 0, .94, T, .25); flag(m, .3, .22, 0, .94, T, .25);
  },
  workshop(m, T) {                                                     // an open timber frame sheltering a battering ram
    for (const x of [-.27, .27]) for (const z of [-.2, .2]) m.box(x - .03, 0, z - .03, x + .03, .4, z + .03, C.woodD);
    m.roofZ(-.32, -.25, .32, .25, .4, .16, T, C.woodD);
    m.box(-.07, .1, -.34, .07, .2, .36, C.trunk, C.wood); m.box(-.09, .08, .32, .09, .22, .42, C.steel);
    m.box(-.2, 0, -.1, -.14, .12, .1, C.woodD); m.box(.14, 0, -.1, .2, .12, .1, C.woodD);
  },
  lodge(m, T) {                                                        // a round stone hut, team cone roof, blocks stacked outside
    m.cyl(0, 0, 0, .24, .34, .24, 8, C.stone);
    m.cyl(0, .34, 0, .3, .72, 0, 8, T);
    door(m, 0, .05, .2, .24);
    m.box(.2, 0, .24, .36, .1, .38, C.stoneD); m.box(.22, .1, .26, .34, .19, .36, C.stone);
  },
  smith(m, T) {                                                        // dark stone, a tall chimney and a glowing forge mouth
    m.box(-.26, 0, -.2, .2, .32, .2, [.46, .44, .46]);
    m.roof(-.3, -.24, .24, .24, .32, .12, T, C.woodD);
    m.box(.06, .3, -.16, .2, .9, -.02, C.stoneD);
    m.box(-.2, .06, .2, -.02, .22, .24, C.fire);
    m.box(.2, 0, .16, .36, .1, .3, C.steelD); m.box(.17, .1, .13, .4, .17, .33, C.steel);
  },
  engineer(m, T) {                                                     // a purple workshop with a gear on the wall and a tall crane
    m.box(-.28, 0, -.2, .1, .3, .2, [.56, .46, .72]);
    m.roofZ(-.32, -.24, .14, .24, .3, .12, T, C.woodD);
    gear(m, -.09, .22, .22, .12, C.gold);
    pole(m, .24, -.06, 0, .98, .025); m.box(.02, .92, -.09, .34, .98, -.03, C.woodD); pole(m, .02, -.06, .62, .92, .008);
    m.box(-.03, .5, -.09, .07, .62, -.03, C.steelD);
  },

  // ---- pieces walls and gates are made of ----
  ppost(m) {
    m.cyl(0, 0, 0, .1, .6, .08, 5, C.wood); m.cyl(0, .6, 0, .08, .86, 0, 5, C.wood);
  },
  plink(m) {
    m.box(0, 0, -.04, 1, .58, .04, C.wood);
    for (const t of [.2, .5, .8]) m.cyl(t, .58, 0, .07, .78, 0, 4, C.wood);
    m.box(0, .22, -.06, 1, .3, .06, C.woodD);
  },
  gate(m, T) {
    m.box(-.5, 0, -.22, -.2, .95, .22, C.stone); m.box(.2, 0, -.22, .5, .95, .22, C.stone); m.box(-.5, .66, -.22, .5, .95, .22, C.stone);
    m.box(-.2, 0, -.14, .2, .64, .14, C.dark);
    flag(m, 0, 0, .95, 1.4, T, .26);
  },
  trap(m) {
    m.box(-.3, 0, -.3, .3, .03, .3, C.soilD);
    for (const x of [-.14, .14]) for (const z of [-.14, .14]) m.cyl(x, .03, z, .05, .22, 0, 4, C.steel);
  },
  ballista(m, T) {                                                     // a round stone plinth carrying a big crossbow with wide arms
    m.cyl(0, 0, 0, .22, .3, .19, 8, C.stone);
    m.box(-.04, .3, -.2, .04, .42, .3, C.woodD);
    m.box(-.34, .38, .1, .34, .46, .18, C.woodD);
    m.box(-.34, .46, -.02, -.26, .56, .18, C.woodD); m.box(.26, .46, -.02, .34, .56, .18, C.woodD);
    m.box(-.015, .42, -.1, .015, .46, .44, T);
  },
  bastion(m, T) {                                                      // short and wide: a squat drum with a team-coloured flat top
    m.cyl(0, 0, 0, .36, .66, .3, 10, C.stone);
    m.cyl(0, .66, 0, .4, .78, .4, 10, C.stoneD);
    m.cyl(0, .78, 0, .3, .86, .3, 10, T);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6; m.box(Math.cos(a) * .36 - .04, .78, Math.sin(a) * .36 - .04, Math.cos(a) * .36 + .04, .9, Math.sin(a) * .36 + .04, C.stoneD); }
    m.box(-.07, 0, .26, .07, .24, .32, C.dark);
  },
  post(m, T) {
    m.box(-.2, 0, -.2, .2, .7, .2, C.stone);
    m.box(-.24, .7, -.24, .24, .8, .24, C.stoneD, T);
  },
  link(m) {
    m.box(0, 0, -.14, 1, .6, .14, C.stone);
    m.box(0, .6, -.18, 1, .7, .18, C.stoneD);
  },
};

/** Build the model `id` in `team`'s colours. */
export function buildBuildingModel(id, team) {
  const m = new MeshBuilder(), colors = TEAM_COLORS[team];
  BUILDING_MODELS[id](m, colors.roof, colors.dark);
  return m;
}
