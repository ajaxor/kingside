// Models of the units, kept as simple as they can be so they read at a glance from a long way off. Every person is the same three
// shapes: a tapered body, a faceted head and a hat, plus one tool or weapon that says what the job is. Troops wear their team's colour as
// the whole tunic; workers wear the colour in their data (`look.color`, or `look.tunic` if set) with a team-coloured sash. Horsemen and
// siege machines are a handful of boxes.

import { mulberry } from '../../core/random.js';
import { UNITS } from '../../data/units.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C, TEAM_COLORS } from '../palette.js';

/** A bow seen from the side: a short curved strip plus a string. */
export function bowShape(m, x, y0, h, bulge, col) {
  const n = 4;
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = y0 + h * t, z = bulge * Math.sin(Math.PI * t) + .04;
    const a = [x - .035, y, z], b = [x + .035, y, z];
    if (prev) m.quad(prev[0], prev[1], b, a, col, [x, y0 + h / 2, -1]);
    prev = [a, b];
  }
  m.quad([x - .008, y0, .04], [x + .008, y0, .04], [x + .008, y0 + h, .04], [x - .008, y0 + h, .04], C.canvas);
}

// Small building blocks for people. Heights are for a body about .65 tall; the scene scales everyone up.
const dome = (m, col, r = .125) => m.cyl(0, .55, 0, r, .66, r * .72, 6, col);           // a cap or helmet
const hood = (m, col, h = .22) => m.cyl(0, .55, 0, .125, .55 + h, 0, 6, col);          // a pointed hood
const pole = (m, y1, col = C.woodD, x = .22) => m.box(x - .028, 0, -.028, x + .028, y1, .028, col);
const blade = (m, x0, y0, x1, y1, col = C.steel) => m.box(x0, y0, -.035, x1, y1, .035, col);
const HAT = [.98, .80, .16];

/** A horse and rider: the general's is white with a gold helm and a banner, the knight's brown with a lance. */
function mountedModel(m, kind, T, TD) {
  const general = kind === 'general';
  const hc = general ? [.95, .94, .9] : C.horse, hd = general ? [.74, .72, .68] : C.horseD, helm = general ? C.gold : C.steel;
  m.box(-.13, .22, -.3, .13, .46, .28, hc);                                               // barrel
  m.box(-.11, 0, -.3, .11, .22, -.2, hd); m.box(-.11, 0, .16, .11, .22, .26, hd);          // a slab of legs at each end
  m.box(-.07, .4, .2, .07, .66, .34, hc); m.box(-.06, .56, .3, .06, .68, .5, hc);          // neck and head
  m.box(-.14, .46, -.12, .14, .52, .14, TD);                                              // saddle cloth
  m.cyl(0, .52, -.02, .12, .84, .08, 6, T);                                               // rider
  m.blob(0, .92, -.02, .1, .1, .1, C.skin, 0, null, 6, 2);
  m.cyl(0, .92, -.02, .115, 1.02, .08, 6, helm);
  if (general) { pole(m, 1.3, C.woodD, -.3); m.box(-.7, .98, -.03, -.3, 1.3, .03, T); }
  else { m.box(.14, .52, -.4, .2, .6, .62, C.woodD); m.box(.14, .6, .42, .2, .72, .62, T); }
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
    return;
  }
  if (kind === 'catapult') {
    m.box(-.34, .12, -.5, .34, .2, .5, C.woodD, C.wood);
    for (const x of [-.37, .37]) for (const z of [-.3, .3]) wheel(x, z);
    for (const x of [-.3, .3]) m.box(x - .035, .2, -.12, x + .035, .66, -.06, C.woodD);
    m.box(-.32, .6, -.12, .32, .68, -.06, C.woodD);
    m.box(-.04, .38, -.45, .04, .46, .38, C.wood); m.box(-.12, .4, .34, .12, .52, .5, C.woodD);
    m.blob(0, .58, .42, .09, .08, .09, C.rockD, .2, mulberry(5), 5, 2);
    m.box(.02, .78, -.1, .3, .9, -.08, T);
    return;
  }
  // trebuchet
  m.box(-.45, .05, -.6, .45, .14, .6, C.woodD, C.wood);
  for (const x of [-.34, .34]) for (const z of [-.28, .16]) m.box(x - .035, .14, z, x + .035, 1.0, z + .08, C.woodD);
  m.box(-.36, .94, -.06, .36, 1.02, .02, C.woodD); m.box(-.04, .92, -.75, .04, 1.0, .6, C.wood);
  m.box(-.15, .5, -.8, .15, .92, -.58, C.stoneD);
  m.blob(0, .76, .58, .08, .08, .08, C.rockD, .2, mulberry(6), 5, 2);
  m.box(.34, 1.0, -.3, .38, 1.45, -.26, C.woodD); m.box(.38, 1.18, -.3, .7, 1.42, -.28, T);
}

// The hat and tool of each kind of foot unit. `tun` is its tunic colour, `T` its team colour.
const FOOT_MODELS = {
  carpenter(m) { dome(m, HAT); pole(m, .55); m.box(.12, .5, -.07, .32, .64, .07, C.steel); },
  cutter(m) { hood(m, [.30, .58, .30]); pole(m, .72); blade(m, .22, .46, .44, .7); },
  mason(m) { dome(m, C.canvas); pole(m, .5); m.box(.12, .44, -.08, .32, .58, .08, C.stoneD); },
  engineer(m) { dome(m, [.50, .40, .68]); pole(m, .5, C.steelD); m.cyl(.22, .5, 0, .1, .6, .1, 6, C.steelD); },
  quarryman(m) { dome(m, C.rockD); pole(m, .62); blade(m, .08, .56, .36, .66, C.steelD); },
  miner(m) { dome(m, C.dark); m.box(-.04, .6, .1, .04, .67, .15, C.gold); pole(m, .72); blade(m, .06, .64, .38, .74, C.steel); },
  runner(m) { dome(m, C.canvas); pole(m, .95); m.box(.22, .7, -.025, .52, .93, .025, C.canvas); },
  farmer(m) { m.cyl(0, .55, 0, .21, .6, .09, 6, C.straw); pole(m, .9); blade(m, .12, .84, .32, .9, C.steel); },
  ranger(m) { hood(m, [.24, .42, .26]); bowShape(m, .22, 0, .85, .13, C.woodD); },
  raider(m) {
    dome(m, C.steelD); for (const sx of [-1, 1]) m.box(sx * .14 - .02, .56, -.02, sx * .14 + .02, .74, .02, C.canvas);
    pole(m, .6); m.blob(.22, .68, 0, .09, .11, .09, C.fire, 0, null, 5, 2);
  },
  soldier(m, tun, T) {
    dome(m, C.steel); pole(m, 1.0); m.cyl(.22, 1.0, 0, .045, 1.18, 0, 4, C.steel);
    m.box(-.27, .16, -.14, -.2, .42, .14, T);
  },
  manatarms(m, tun, T) {
    m.cyl(0, .5, 0, .125, .7, .1, 6, C.steelD); m.box(-.32, .08, -.17, -.24, .52, .17, T);
    pole(m, .6); m.blob(.22, .66, 0, .09, .09, .09, C.steelD, 0, null, 5, 2);
  },
  halberd(m) { dome(m, C.steelD); pole(m, 1.3); blade(m, .22, .9, .5, 1.14); m.cyl(.22, 1.3, 0, .04, 1.46, 0, 4, C.steel); },
  archer(m) { hood(m, [.52, .38, .26]); bowShape(m, .22, 0, .7, .1, C.woodD); },
  longbow(m) { hood(m, [.40, .50, .30]); bowShape(m, .22, -.02, 1.12, .14, C.woodD); },
  crossbow(m) { dome(m, C.steelD); m.box(.14, .34, -.03, .22, .4, .46, C.woodD); m.box(.0, .35, .34, .36, .39, .4, C.woodD); },
  officer(m, tun, T) {
    m.cyl(0, .55, 0, .125, .7, .09, 6, C.gold); pole(m, 1.32, C.woodD, -.2);
    m.box(-.72, .9, -.03, -.2, 1.28, .03, T); m.box(-.72, .9, -.035, -.2, .96, .035, C.gold);
  },
};

/** Build the model for a unit kind in `team`'s colours. */
export function buildUnitModel(kind, team) {
  const m = new MeshBuilder(), def = UNITS[kind], look = def.look;
  const { roof: T, dark: TD } = TEAM_COLORS[team];
  if (def.role === 'siege') { siegeModel(m, kind, T); return m; }
  if (look.mounted) { mountedModel(m, kind, T, TD); return m; }
  const tun = def.role === 'troop' ? T : (look.tunic || look.color);
  m.cyl(0, 0, 0, .17, .44, .11, 6, tun);                                             // one tapered body, no legs or arms
  if (def.role !== 'troop') m.cyl(0, .18, 0, .15, .27, .14, 6, T);                   // a sash in the team colour
  m.blob(0, .54, 0, .11, .11, .11, C.skin, 0, null, 6, 2);                           // a faceted head
  FOOT_MODELS[kind](m, tun, T);
  return m;
}
