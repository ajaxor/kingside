// Models of the units: one simple body for everyone, with the role shown by a hat and a tool, plus mounts and siege machines.
// Troops wear their team's colour; everyone else wears the colour in their data (`look.color`, or `look.tunic` if set).

import { mulberry } from '../../core/random.js';
import { UNITS } from '../../data/units.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C, TEAM_COLORS } from '../palette.js';

const TAU = 6.283;

/** A bow seen from the side: a curved strip of quads plus a string. */
export function bowShape(m, x, y0, h, bulge, col) {
  const n = 5;
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = y0 + h * t, z = bulge * Math.sin(Math.PI * t) + .04;
    const a = [x - .03, y, z], b = [x + .03, y, z];
    if (prev) m.quad(prev[0], prev[1], b, a, col, [x, y0 + h / 2, -1]);
    prev = [a, b];
  }
  m.quad([x - .006, y0, .04], [x + .006, y0, .04], [x + .006, y0 + h, .04], [x - .006, y0 + h, .04], C.canvas);
}

/** A round shield facing sideways, with a different colour on its back. */
export function shieldDisc(m, x, y, z, r, col, rim) {
  const n = 8, c = [x, y, z];
  for (let i = 0; i < n; i++) {
    const a0 = i / n * TAU, a1 = (i + 1) / n * TAU;
    const p0 = [x, y + Math.sin(a0) * r, z + Math.cos(a0) * r], p1 = [x, y + Math.sin(a1) * r, z + Math.cos(a1) * r];
    m.tri(c, p0, p1, col, [x + 1, y, z]);
    m.tri(c, p1, p0, rim || col, [x - 1, y, z]);
  }
}

/** A horse and rider: the general's is white with gold armour and a banner, the knight's brown with a lance. */
function mountedModel(m, kind, T, TD) {
  const general = kind === 'general';
  const hc = general ? [.92, .9, .86] : C.horse, hd = general ? [.7, .68, .64] : C.horseD;
  m.box(-.12, .22, -.3, .12, .46, .28, hc);
  for (const x of [-.08, .08]) for (const z of [-.24, .2]) m.box(x - .03, 0, z - .03, x + .03, .22, z + .03, hd);
  m.box(-.07, .4, .2, .07, .66, .34, hc); m.box(-.06, .56, .3, .06, .68, .5, hc); m.box(-.015, .62, .18, .015, .72, .3, hd);
  m.box(-.1, .46, -.05, .1, .5, .18, T);
  m.cyl(0, .5, -.02, .1, .82, .07, 6, general ? C.gold : C.steel); m.blob(0, .9, -.02, .09, .09, .09, C.skin, 0, null, 6, 3);
  m.cyl(0, .9, -.02, .1, .98, 0, 6, general ? C.gold : C.steel); m.box(-.015, .98, -.06, .015, general ? 1.22 : 1.1, .05, T);
  if (general) {
    m.box(-.1, .5, -.2, .1, .82, -.14, TD); m.box(-.03, .5, -.3, .03, 1.25, -.26, C.woodD);
    m.box(-.42, .98, -.29, -.03, 1.24, -.27, T); m.box(-.42, .96, -.3, -.03, 1.0, -.26, C.gold);
  } else {
    m.box(.12, .5, -.4, .16, .55, .62, C.woodD); m.box(.13, .55, .4, .15, .67, .62, T);
  }
}

function siegeModel(m, kind, T) {
  const wheel = (x, z) => m.box(x - .04, 0, z - .1, x + .04, .2, z + .1, C.woodD);
  if (kind === 'ram' || kind === 'ironram') {
    const iron = kind === 'ironram';
    m.box(-.35, .12, -.55, .35, .2, .55, C.woodD, C.wood);
    for (const x of [-.38, .38]) for (const z of [-.35, .35]) wheel(x, z);
    for (const x of [-.34, .34]) for (const z of [-.5, .5]) m.box(x - .03, .2, z - .03, x + .03, .55, z + .03, C.woodD);
    m.roofZ(-.42, -.58, .42, .58, .55, .38, iron ? C.steelD : T, C.wood);
    m.box(-.07, .2, -.72, .07, .32, .78, C.trunk, C.wood); m.box(-.1, .17, .72, .1, .36, .88, C.steel);
    if (iron) { m.box(-.42, .55, -.58, .42, .6, .58, C.steel); m.box(-.06, .9, -.3, .06, .97, .3, T); }
    return;
  }
  if (kind === 'catapult') {
    m.box(-.34, .12, -.5, .34, .2, .5, C.woodD, C.wood);
    for (const x of [-.37, .37]) for (const z of [-.3, .3]) wheel(x, z);
    for (const x of [-.3, .3]) m.box(x - .035, .2, -.12, x + .035, .66, -.06, C.woodD);
    m.box(-.32, .6, -.12, .32, .68, -.06, C.woodD);
    m.box(-.04, .38, -.45, .04, .46, .38, C.wood); m.box(-.12, .4, .34, .12, .52, .5, C.woodD);
    m.blob(0, .58, .42, .09, .08, .09, C.rockD, .2, mulberry(5), 6, 3);
    m.box(-.13, .26, -.56, .13, .52, -.36, C.stoneD); m.box(-.02, .66, -.1, .02, .9, -.06, C.woodD); m.box(.02, .78, -.1, .3, .9, -.08, T);
    return;
  }
  // trebuchet
  m.box(-.45, .05, -.6, .45, .14, .6, C.woodD, C.wood);
  for (const x of [-.34, .34]) for (const z of [-.28, .16]) m.box(x - .035, .14, z, x + .035, 1.0, z + .08, C.woodD);
  m.box(-.36, .94, -.06, .36, 1.02, .02, C.woodD); m.box(-.04, .92, -.75, .04, 1.0, .6, C.wood);
  m.box(-.15, .5, -.8, .15, .92, -.58, C.stoneD); m.box(-.01, .78, .55, .01, .98, .57, C.canvas);
  m.blob(0, .76, .58, .08, .08, .08, C.rockD, .2, mulberry(6), 6, 3);
  m.box(.34, 1.0, -.3, .38, 1.45, -.26, C.woodD); m.box(.38, 1.18, -.3, .7, 1.42, -.28, T);
}

// The hat and tool of each kind of foot unit. `tun` is its tunic colour, `T` its team colour.
const stick = (m, x, y0, y1, z, w, col) => m.box(x - w, y0, z - w, x + w, y1, z + w, col || C.woodD);
const HAT = [.95, .78, .2];

const FOOT_MODELS = {
  carpenter(m) { m.cyl(0, .535, 0, .145, .565, .145, 8, HAT); m.blob(0, .575, 0, .105, .065, .105, HAT, 0, null, 6, 3); stick(m, .2, .05, .62, 0, .022); m.box(.11, .5, -.07, .29, .67, .07, C.wood); },
  cutter(m) { m.cyl(0, .54, 0, .11, .63, .07, 6, [.40, .58, .30]); stick(m, .2, .04, .66, 0, .022); m.box(.2, .44, -.02, .43, .68, .02, C.steel); },
  mason(m) {
    m.cyl(0, .535, 0, .12, .6, .1, 6, C.canvas); m.box(-.3, .38, -.1, -.1, .58, .1, C.stone, C.stone);
    stick(m, .2, .06, .4, 0, .022); m.box(.13, .34, -.06, .3, .42, .06, C.steel); m.cyl(0, .18, 0, .15, .4, .12, 6, [.74, .62, .46]);
  },
  engineer(m) {
    m.cyl(0, .535, 0, .13, .58, .12, 6, [.5, .42, .62]); m.blob(0, .575, 0, .1, .05, .1, C.dark, 0, null, 6, 3); m.box(-.09, .53, .07, .09, .58, .11, C.gold);
    stick(m, .2, .05, .52, 0, .022, C.steelD); m.cyl(.2, .52, 0, .1, .6, .1, 8, C.steelD); m.box(.14, .34, -.04, .26, .4, .04, C.steel);
  },
  quarryman(m) { m.cyl(0, .535, 0, .12, .58, .12, 6, C.rockD); m.box(-.3, .4, -.1, -.1, .6, .1, C.stone, C.stone); stick(m, .2, .06, .42, 0, .022); m.box(.13, .36, -.06, .28, .47, .06, C.stoneD); },
  miner(m) {
    m.blob(0, .545, 0, .115, .075, .115, C.dark, 0, null, 6, 3); m.box(-.03, .54, .09, .03, .6, .14, C.gold);
    stick(m, .2, 0, .75, 0, .022); m.box(.03, .66, -.02, .37, .73, .02, C.steel); m.box(-.01, .6, -.02, .07, .7, .02, C.steel); m.box(.33, .6, -.02, .41, .7, .02, C.steel);
  },
  runner(m) {
    m.cyl(0, .54, 0, .11, .62, .08, 6, C.canvas);
    for (let i = 0; i < 4; i++) {                                  // a bundle of rolled-up notes on a pole
      const o = (i % 2) * .025;
      m.box(.15 + i * .03, .1, -.012 + o, .168 + i * .03, .92, .012 + o, C.woodD);
      m.box(.15 + i * .03, .78, -.02 + o, .168 + i * .03, .9, .02 + o, C.canvas);
    }
    m.box(.13, .4, -.05, .3, .46, .05, C.straw);
  },
  farmer(m) {
    m.cyl(0, .54, 0, .2, .575, .12, 8, C.straw); m.cyl(0, .575, 0, .1, .66, .075, 8, C.straw);
    stick(m, .2, 0, .98, 0, .022);
    for (const dx of [-.08, 0, .08]) m.box(.2 + dx - .013, .92, -.013, .2 + dx + .013, 1.12, .013, C.steel);
    m.box(.11, .9, -.016, .29, .95, .016, C.steel);
  },
  ranger(m) {
    m.cyl(0, .5, 0, .135, .68, 0, 6, [.26, .42, .25]); bowShape(m, .2, 0, .85, .13, C.woodD);
    m.box(-.08, .2, -.18, 0, .5, -.1, C.woodD); m.box(-.07, .5, -.16, -.01, .6, -.12, C.canvas);
  },
  raider(m, tun, T) {
    m.blob(0, .545, 0, .11, .07, .11, C.steelD, 0, null, 6, 3);
    for (const sx of [-1, 1]) {
      m.box(sx * .12 - .02, .52, -.02, sx * .12 + .02, .64, .02, C.canvas);
      m.box(sx * .16 - .02, .62, -.02, sx * .16 + .02, .73, .02, C.canvas);
    }
    stick(m, .2, .04, .6, 0, .022);
    m.blob(.2, .7, 0, .08, .115, .08, C.fire, .25, mulberry(2), 5, 3); m.blob(.2, .68, 0, .04, .07, .04, [1, .92, .45], 0, null, 5, 3);
  },
  soldier(m, tun, T) {
    m.blob(0, .54, 0, .105, .07, .105, C.steel, 0, null, 6, 3); m.box(-.012, .49, .08, .012, .57, .1, C.steel);
    stick(m, .2, .2, .3, 0, .02); m.box(.14, .3, -.025, .26, .335, .025, C.gold); m.box(.19, .335, -.013, .21, .82, .013, C.steel);
    m.box(-.15, .3, -.03, -.09, .4, .03, tun); shieldDisc(m, -.17, .28, 0, .17, T, C.dark); m.blob(-.2, .28, 0, .04, .04, .04, C.gold, 0, null, 5, 3);
  },
  manatarms(m, tun, T) {
    m.cyl(0, .46, 0, .11, .66, .1, 6, C.steelD); m.box(-.07, .54, .085, .07, .575, .11, C.dark); m.box(-.2, .37, -.075, .2, .43, .075, C.steelD);
    m.box(-.27, .06, -.14, -.2, .54, .14, T); m.box(-.275, .06, -.025, -.2, .54, .025, C.steel); m.box(-.275, .25, -.14, -.2, .3, .14, C.steel);
    stick(m, .2, .04, .58, 0, .026); m.blob(.2, .64, 0, .09, .09, .09, C.steelD, .3, mulberry(4), 6, 3);
  },
  halberd(m) {
    m.blob(0, .54, 0, .105, .07, .105, C.steelD, 0, null, 6, 3); stick(m, .2, 0, 1.3, 0, .022);
    m.box(.2, .9, -.016, .46, 1.14, .016, C.steel); m.box(.2, 1.14, -.016, .24, 1.2, .016, C.steel); m.cyl(.2, 1.3, 0, .035, 1.46, 0, 4, C.steel);
  },
  archer(m) { m.cyl(0, .535, 0, .13, .6, .06, 6, [.5, .38, .26]); m.box(.05, .6, -.01, .06, .76, .01, C.canvas); bowShape(m, .2, 0, .68, .1, C.woodD); m.box(-.08, .2, -.18, 0, .48, -.1, C.woodD); },
  longbow(m) { m.cyl(0, .535, 0, .13, .6, .06, 6, [.5, .38, .26]); m.box(.05, .6, -.01, .06, .78, .01, C.gold); bowShape(m, .2, -.02, 1.2, .14, C.woodD); m.box(-.08, .2, -.18, 0, .5, -.1, C.woodD); },
  crossbow(m) {
    m.cyl(0, .525, 0, .17, .56, .1, 8, C.steelD); m.blob(0, .575, 0, .1, .06, .1, C.steelD, 0, null, 6, 3);
    m.box(.13, .3, -.02, .2, .35, .5, C.woodD); m.box(0, .31, .34, .34, .34, .38, C.woodD); m.box(.155, .35, .05, .175, .375, .52, C.steel);
  },
  officer(m, tun, T) {
    m.blob(0, .54, 0, .105, .07, .105, C.steel, 0, null, 6, 3); m.box(-.02, .57, -.11, .02, .78, .11, T); m.cyl(0, .29, 0, .145, .35, .125, 6, C.gold);
    stick(m, -.18, 0, 1.32, 0, .022);
    m.box(-.66, .88, -.02, -.18, 1.26, 0, T); m.box(-.66, .88, -.025, -.18, .94, .005, C.gold); m.blob(-.18, 1.35, 0, .045, .045, .045, C.gold, 0, null, 5, 3);
    m.box(.2, .12, -.012, .22, .52, .012, C.steel);
  },
};

/** Build the model for a unit kind in `team`'s colours. */
export function buildUnitModel(kind, team) {
  const m = new MeshBuilder(), def = UNITS[kind], look = def.look;
  const { roof: T, dark: TD } = TEAM_COLORS[team];
  if (def.role === 'siege') { siegeModel(m, kind, T); return m; }
  if (look.mounted) { mountedModel(m, kind, T, TD); return m; }
  const tun = def.role === 'troop' ? T : (look.tunic || look.color);
  // One simple body for everyone: legs, tunic, head, arm. The job shows in the hat and tool.
  m.box(-.07, 0, -.04, -.015, .17, .04, C.dark); m.box(.015, 0, -.04, .07, .17, .04, C.dark);
  m.cyl(0, .15, 0, .14, .43, .1, 6, tun);
  if (def.role !== 'troop') m.cyl(0, .35, 0, .135, .41, .115, 6, T);   // a sash in the team colour
  m.box(.1, .3, -.03, .19, .4, .03, tun);
  m.blob(0, .5, 0, .095, .095, .095, C.skin, 0, null, 6, 3);
  FOOT_MODELS[kind](m, tun, T);
  return m;
}
