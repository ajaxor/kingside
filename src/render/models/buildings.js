// Models of the buildings, in a deliberately abstract, iconographic style. From the steep camera a roof is a blob, so every building is
// the same three layers instead:
//
//   a team ring     a thin disc in the owner's colour, so whose it is reads at a glance
//   a plinth        an octagon in the colour of its menu category (homes sand, gather green, craft amber, defend slate, army violet)
//   a glyph         one bold pictogram standing on it that says what the building is: a saw blade, a target, an anvil, a gear, a shield
//
// The glyph is built to read looking down: flat symbols made of discs and beams (`beam` is a box at any angle), with a little height.
// The keep, towers and the hall's banner stand tall so defence and command read from afar. Walls, gates and traps are separate pieces.
// A model id is a building type, or one of the pieces a wall is drawn from ('post', 'link', 'ppost', 'plink' and the gate), or 'field'.
// Coordinates are in tiles around the footprint's centre; y is up. `T` is the owning team's colour, `TD` its darker shade.

import { mulberry } from '../../core/random.js';
import { categoryOf } from '../../data/buildings.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C, TEAM_COLORS } from '../palette.js';

const TAU = 6.283, H = .11;                    // H: the top of the plinth, where every glyph starts
const lighten = (c, k = .1) => c.map((v) => Math.min(1, v + k));
const RED = [.86, .32, .26], DARK = C.dark;

/** The team ring and category plinth every building stands on. `r` is the plinth's radius. */
function base(m, T, type, r = .3) {
  const cat = categoryOf(type)?.color || [.93, .8, .46];
  m.cyl(0, 0, 0, r + .035, .04, r + .035, 8, T, Math.PI / 8);
  m.cyl(0, .04, 0, r, H, r, 8, cat, Math.PI / 8, lighten(cat));
}
const disc = (m, x, y0, z, r, h, col, n = 12) => m.cyl(x, y0, z, r, y0 + h, r, n, col, 0, lighten(col, .06));
/** `n` bars sticking out of a ring, like the teeth of a gear or saw. */
const teeth = (m, x, z, r0, r1, n, w, y0, y1, col, rot = 0) => {
  for (let i = 0; i < n; i++) { const a = rot + i / n * TAU; m.beam(x + Math.cos(a) * r0, z + Math.sin(a) * r0, x + Math.cos(a) * r1, z + Math.sin(a) * r1, w, y0, y1, col); }
};
const flag = (m, x, z, y0, y1, T, len = .28) => { m.box(x - .015, y0, z - .015, x + .015, y1, z + .015, C.woodD); m.box(x, y1 - len * .75, z - .012, x + len, y1, z + .012, T); };

export const BUILDING_MODELS = {
  keep(m, T) {                                                         // the castle: a tall centre and four turrets on a gold plinth
    m.cyl(0, 0, 0, 1.16, .05, 1.16, 8, T, Math.PI / 8);
    m.cyl(0, .05, 0, 1.08, .14, 1.08, 8, [.92, .8, .48], Math.PI / 8, [.97, .87, .6]);
    m.box(-.62, .14, -.62, .62, .62, .62, C.stone);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      m.cyl(sx * .64, .14, sz * .64, .24, 1.0, .22, 8, C.stone); m.cyl(sx * .64, 1.0, sz * .64, .3, 1.42, 0, 8, T);
    }
    m.cyl(0, .62, 0, .36, 1.5, .32, 8, C.stone);
    m.cyl(0, 1.5, 0, .44, 1.62, .44, 8, C.stoneD);
    m.cyl(0, 1.62, 0, .3, 2.05, 0, 8, T);
    m.box(-.2, .14, .6, .2, .5, .66, DARK);
    flag(m, 0, 0, 2.0, 2.55, T, .4);
  },

  // ---- homes: sand ----
  hut(m, T) {                                                          // a little house
    base(m, T, 'hut');
    m.box(-.15, H, -.11, .15, H + .15, .11, C.canvas);
    m.roof(-.2, -.15, .2, .15, H + .15, .15, T, C.canvas);
    m.box(-.04, H, .11, .04, H + .1, .13, DARK);
  },
  lodge(m, T) {                                                        // a stack of building blocks and a trowel
    base(m, T, 'lodge');
    m.box(-.22, H, -.14, -.02, H + .12, .06, C.stone); m.box(.02, H, -.14, .22, H + .12, .06, C.stoneD); m.box(-.12, H + .12, -.1, .08, H + .22, .02, C.stone);
    m.beam(.0, .24, .22, .04, .06, H, H + .04, C.steel); m.beam(-.2, .26, .02, .24, .045, H, H + .05, C.woodD);
  },

  // ---- gather: green ----
  mill(m, T) {                                                         // a saw blade biting a stack of logs
    base(m, T, 'mill');
    disc(m, 0, H, -.05, .2, .06, C.steel, 14); teeth(m, 0, -.05, .19, .26, 10, .06, H, H + .055, C.steel, .15);
    disc(m, 0, H + .06, -.05, .06, .03, C.gold, 8);
    for (const [x, y] of [[-.14, 0], [.0, 0], [.14, 0], [-.07, .1], [.07, .1]]) m.beam(x, .21, x, .27, .1, H + y, H + y + .1, C.trunk, C.wood);
  },
  mine(m, T) {                                                         // a rocky mound with ore showing and a dark entrance
    base(m, T, 'mine');
    m.blob(-.02, H, -.02, .26, .26, .24, C.rockD, .1, mulberry(7), 7, 3);
    for (const [x, z] of [[.1, -.08], [-.1, -.1], [0, .06]]) m.box(x - .05, H + .2, z - .04, x + .05, H + .3, z + .04, C.iron, [.92, .62, .44]);
    m.box(-.09, H, .17, .09, H + .13, .27, DARK);
  },
  farm(m, T) {                                                         // a haystack and a patch of crop
    base(m, T, 'farm');
    m.cyl(-.07, H, -.06, .2, H + .34, 0, 8, C.straw);
    m.box(.1, H, .1, .27, H + .06, .27, C.soil, C.cropG);
    for (const x of [.13, .19, .25]) m.box(x - .015, H + .06, .11, x + .015, H + .16, .26, C.crop);
  },
  field(m) {
    m.box(-.5, 0, -.5, .5, .04, .5, C.soil);
    for (const x of [-.3, 0, .3]) m.box(x - .07, .04, -.4, x + .07, .3, .4, C.cropG, C.crop);
  },

  // ---- craft: amber ----
  fletch(m, T) {                                                       // an archery target with an arrow in it
    base(m, T, 'fletch');
    disc(m, 0, H, 0, .27, .03, C.canvas, 16); disc(m, 0, H + .03, 0, .2, .02, RED, 16); disc(m, 0, H + .05, 0, .13, .02, C.canvas, 14); disc(m, 0, H + .07, 0, .06, .02, C.gold, 10);
    m.beam(-.26, .24, .04, -.04, .035, H + .1, H + .14, C.woodD); m.box(-.05, H + .1, -.09, .06, H + .15, .03, C.steel);
    m.beam(-.3, .28, -.2, .18, .09, H + .1, H + .12, C.canvas);
  },
  smith(m, T) {                                                        // an anvil, a hammer and a flame
    base(m, T, 'smith');
    m.box(-.14, H, -.08, .14, H + .08, .08, C.steelD); m.box(-.07, H + .08, -.05, .07, H + .15, .05, C.steelD); m.box(-.22, H + .15, -.085, .18, H + .23, .085, C.steel);
    m.cyl(-.22, H + .15, 0, .01, H + .15, .01, 3, C.steel);
    m.beam(.06, .26, .26, .08, .045, H, H + .05, C.woodD); m.box(.2, H, .06, .3, H + .1, .16, C.steel);
    m.cyl(-.2, H, .2, .09, H + .24, 0, 6, C.fire); m.cyl(-.2, H, .2, .045, H + .15, 0, 6, C.gold);
  },
  engineer(m, T) {                                                     // a big gear
    base(m, T, 'engineer');
    teeth(m, 0, 0, .15, .27, 8, .1, H, H + .1, C.steel, .2);
    disc(m, 0, H, 0, .2, .1, C.steelD, 14); disc(m, 0, H + .1, 0, .09, .03, DARK, 10); disc(m, 0, H + .1, 0, .04, .05, C.gold, 8);
  },

  // ---- defend: slate ----
  tower(m, T) {                                                        // tall and thin: a stone shaft, battlements, a team point
    base(m, T, 'tower', .26);
    m.cyl(0, H, 0, .17, H + .95, .14, 8, C.stone);
    m.cyl(0, H + .95, 0, .23, H + 1.07, .23, 8, C.stoneD);
    for (let i = 0; i < 4; i++) { const a = i * TAU / 4 + .78; m.box(Math.cos(a) * .2 - .04, H + 1.07, Math.sin(a) * .2 - .04, Math.cos(a) * .2 + .04, H + 1.17, Math.sin(a) * .2 + .04, C.stoneD); }
    m.cyl(0, H + 1.07, 0, .14, H + 1.45, 0, 8, T);
    m.box(-.04, H, .13, .04, H + .16, .18, DARK);
  },
  ballista(m, T) {                                                     // a crossbow seen from above: stock, two long arms, string and bolt
    base(m, T, 'ballista');
    m.beam(0, .26, 0, -.24, .07, H, H + .06, C.woodD);
    m.beam(0, .1, -.29, -.06, .06, H + .02, H + .09, C.woodD); m.beam(0, .1, .29, -.06, .06, H + .02, H + .09, C.woodD);
    m.beam(-.29, -.06, .29, -.06, .02, H + .05, H + .07, C.canvas);
    m.beam(0, .18, 0, -.3, .045, H + .08, H + .12, T); m.box(-.05, H + .08, -.34, .05, H + .12, -.26, C.steel);
  },
  bastion(m, T) {                                                      // short and wide: a squat hexagon with a big team shield on top
    base(m, T, 'bastion');
    m.cyl(0, H, 0, .28, H + .36, .26, 6, C.stone);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + .5; m.box(Math.cos(a) * .25 - .045, H + .36, Math.sin(a) * .25 - .045, Math.cos(a) * .25 + .045, H + .46, Math.sin(a) * .25 + .045, C.stoneD); }
    disc(m, 0, H + .36, 0, .17, .03, T, 6); disc(m, 0, H + .39, 0, .06, .03, C.steel, 8);
  },

  // ---- army: violet ----
  ranger(m, T) {                                                       // a green tent beside a bow
    base(m, T, 'ranger');
    m.cyl(.08, H, .06, .2, H + .32, 0, 4, [.3, .55, .32], Math.PI / 4);
    const pts = [-60, -30, 0, 30, 60].map((d) => [-.14 + Math.cos(d * Math.PI / 180) * .22 - .1, Math.sin(d * Math.PI / 180) * .24]);
    for (let i = 0; i + 1 < pts.length; i++) m.beam(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], .045, H, H + .06, C.woodD);
    m.beam(pts[0][0], pts[0][1], pts[4][0], pts[4][1], .015, H + .02, H + .04, C.canvas);
  },
  raider(m, T) {                                                       // crossed axes
    base(m, T, 'raider');
    m.beam(-.23, -.23, .23, .23, .05, H, H + .05, C.woodD); m.beam(.23, -.23, -.23, .23, .05, H + .05, H + .1, C.woodD);
    for (const [x, z] of [[-.22, -.22], [.22, -.22]]) m.box(x - .07, H, z - .07, x + .07, H + .12, z + .07, C.steelD);
    m.cyl(0, H + .1, 0, .06, H + .16, .06, 6, RED);
  },
  barracks(m, T) {                                                     // a shield with a sword down it
    base(m, T, 'barracks');
    m.cyl(0, H, 0, .25, H + .13, .25, 5, T, -Math.PI / 2, lighten(T, .08));
    disc(m, 0, H + .13, 0, .07, .04, C.steel, 8);
    m.beam(0, -.3, 0, .24, .05, H + .17, H + .21, C.steel); m.beam(-.1, -.12, .1, -.12, .04, H + .17, H + .21, C.gold); m.beam(0, .24, 0, .32, .06, H + .17, H + .21, C.woodD);
  },
  hall(m, T) {                                                         // a tall banner on a gold step: the commander
    base(m, T, 'hall');
    disc(m, 0, H, 0, .18, .05, C.gold, 10);
    m.box(-.016, H + .05, -.016, .016, H + .98, .016, C.woodD);
    m.box(.016, H + .5, -.012, .4, H + .94, .012, T); m.box(.016, H + .5, -.014, .4, H + .56, .014, C.gold);
    m.blob(0, H + 1.0, 0, .05, .05, .05, C.gold, 0, null, 6, 3);
  },
  workshop(m, T) {                                                     // a battering ram on wheels
    base(m, T, 'workshop');
    m.beam(0, .24, 0, -.2, .12, H + .07, H + .19, C.trunk, C.wood);
    m.box(-.09, H + .05, -.31, .09, H + .21, -.2, C.steelD);
    for (const [x, z] of [[-.16, -.1], [.16, -.1], [-.16, .12], [.16, .12]]) m.box(x - .03, H, z - .05, x + .03, H + .08, z + .05, DARK);
    m.beam(-.17, -.1, -.17, .12, .03, H + .08, H + .11, C.woodD); m.beam(.17, -.1, .17, .12, .03, H + .08, H + .11, C.woodD);
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
    m.box(-.2, 0, -.14, .2, .64, .14, DARK);
    flag(m, 0, 0, .95, 1.4, T, .26);
  },
  trap(m) {
    m.box(-.3, 0, -.3, .3, .03, .3, C.soilD);
    for (const x of [-.14, .14]) for (const z of [-.14, .14]) m.cyl(x, .03, z, .05, .22, 0, 4, C.steel);
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

// The quarry's glyph, written out here so it reads next to its siblings: a block of cut stone, a smaller one, and a pickaxe.
BUILDING_MODELS.quarry = (m, T) => {
  base(m, T, 'quarry');
  m.box(-.24, H, -.2, .04, H + .24, .08, C.stone); m.box(.0, H, .08, .18, H + .13, .24, C.stoneD);
  m.beam(-.2, .24, .24, -.16, .045, H + .24, H + .29, C.woodD);
  m.beam(.12, -.26, .3, -.08, .05, H + .24, H + .31, C.steel);
};

/** Build the model `id` in `team`'s colours. */
export function buildBuildingModel(id, team) {
  const m = new MeshBuilder(), colors = TEAM_COLORS[team];
  BUILDING_MODELS[id](m, colors.roof, colors.dark);
  return m;
}
