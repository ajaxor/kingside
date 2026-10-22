// Models of the units, as plain as they can be so they read at a glance. Every person is a cylinder with a rounded top, a round head, and
// whatever sets the job apart: a hat or helmet and one tool or weapon. Troops wear their team's colour as the whole tunic; workers wear
// the colour in their data (`look.color`, or `look.tunic` if set) with a team-coloured sash. Horsemen and siege machines are a handful
// of boxes. A person stands about .45 tiles tall and .2 wide, so a tile has room for a building and people walking round it.

import { mulberry } from '../../core/random.js';
import { UNITS } from '../../data/units.js';
import { MeshBuilder } from '../mesh-builder.js';
import { C, TEAM_COLORS } from '../palette.js';

/** A bow seen from the side: a short curved strip plus a string. */
export function bowShape(m, x, y0, h, bulge, col) {
  const n = 4;
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n, y = y0 + h * t, z = bulge * Math.sin(Math.PI * t) + .03;
    const a = [x - .02, y, z], b = [x + .02, y, z];
    if (prev) m.quad(prev[0], prev[1], b, a, col, [x, y0 + h / 2, -1]);
    prev = [a, b];
  }
  m.quad([x - .006, y0, .03], [x + .006, y0, .03], [x + .006, y0 + h, .03], [x - .006, y0 + h, .03], C.canvas);
}

// The shapes people are made of. y is up; the body is a cylinder .2 tall under a dome, the head a ball on top of it.
const HEAD_Y = .375;
const body = (m, tun, y0 = 0, r = .1) => { m.cyl(0, y0, 0, r, y0 + .2, r, 8, tun); m.dome(0, y0 + .2, 0, r, r, r, tun, 8, 2); };
const sash = (m, T, y0 = 0) => m.cyl(0, y0 + .08, 0, .106, y0 + .14, .106, 8, T);
const head = (m, y = HEAD_Y) => m.blob(0, y, 0, .072, .072, .072, C.skin, 0, null, 8, 4);
const cap = (m, col, y = HEAD_Y) => m.dome(0, y + .01, 0, .082, .07, .082, col, 8, 2);                   // a skull cap or helmet
const brim = (m, col, y = HEAD_Y) => m.cyl(0, y + .01, 0, .105, y + .03, .105, 8, col);                // a ring round the cap
const hood = (m, col, h = .17, y = HEAD_Y) => m.cyl(0, y - .01, 0, .082, y + h, 0, 8, col);           // a pointed hood or hat
const pole = (m, y1, col = C.woodD, x = .15, w = .02) => m.box(x - w, 0, -w, x + w, y1, w, col);       // a staff, held at the side
const bar = (m, x0, y0, x1, y1, col = C.steel, w = .025) => m.box(x0, y0, -w, x1, y1, w, col);        // a flat blade or head

/** A horse and rider: the general's is white with a gold helm and a banner, the knight's brown with a lance. */
function mountedModel(m, kind, T, TD) {
  const general = kind === 'general';
  const hc = general ? [.95, .94, .9] : C.horse, hd = general ? [.74, .72, .68] : C.horseD, helm = general ? C.gold : C.steel;
  m.box(-.09, .15, -.24, .09, .32, .2, hc);                                               // barrel
  m.box(-.08, 0, -.24, .08, .15, -.15, hd); m.box(-.08, 0, .11, .08, .15, .2, hd);         // a slab of legs at each end
  m.box(-.05, .27, .16, .05, .45, .27, hc); m.box(-.045, .38, .24, .045, .47, .38, hc);    // neck and head
  m.box(-.1, .32, -.1, .1, .35, .1, TD);                                                  // saddle cloth
  body(m, T, .32, .075); head(m, .32 + .36); cap(m, helm, .32 + .36);                     // the rider
  if (general) { pole(m, 1.0, C.woodD, -.17, .015); m.box(-.4, .72, -.02, -.17, 1.0, .02, T); }
  else { m.box(.1, .36, -.3, .14, .42, .42, C.woodD); m.box(.1, .42, .28, .14, .5, .42, T); }
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

const HAT = [.98, .80, .16];

// The hat and tool of each kind of foot unit. `tun` is its tunic colour, `T` its team colour.
const FOOT_MODELS = {
  carpenter(m) { cap(m, HAT); brim(m, HAT); pole(m, .3); m.box(.09, .26, -.05, .21, .35, .05, C.steel); },
  cutter(m) { hood(m, [.28, .58, .30]); pole(m, .42); bar(m, .15, .28, .27, .42); },
  mason(m) { cap(m, C.canvas); pole(m, .3); m.box(.08, .26, -.06, .22, .36, .06, C.stoneD); },
  engineer(m) { cap(m, [.50, .40, .68]); m.box(-.08, HEAD_Y, .06, .08, HEAD_Y + .03, .09, C.gold); pole(m, .3, C.steelD); m.cyl(.15, .3, 0, .07, .34, .07, 6, C.steelD); },
  quarryman(m) { cap(m, C.rockD); pole(m, .38); bar(m, .06, .34, .26, .4, C.steelD); },
  miner(m) { cap(m, C.dark); m.box(-.025, HEAD_Y + .03, .07, .025, HEAD_Y + .08, .1, C.gold); pole(m, .42); bar(m, .05, .36, .27, .42); },
  runner(m) { cap(m, C.canvas); pole(m, .62); m.box(.15, .46, -.015, .34, .6, .015, C.canvas); },
  farmer(m) { m.cyl(0, HEAD_Y + .01, 0, .15, HEAD_Y + .03, .1, 8, C.straw); cap(m, C.straw); pole(m, .55); bar(m, .09, .5, .21, .55); },
  ranger(m) { hood(m, [.22, .42, .26]); bowShape(m, .15, 0, .5, .08, C.woodD); },
  raider(m) {
    cap(m, C.steelD); for (const sx of [-1, 1]) m.box(sx * .09 - .015, HEAD_Y + .02, -.015, sx * .09 + .015, HEAD_Y + .13, .015, C.canvas);
    pole(m, .3); m.blob(.15, .36, 0, .05, .06, .05, C.fire, 0, null, 6, 3);
  },
  soldier(m, tun, T) {
    cap(m, C.steel); pole(m, .72); m.cyl(.15, .72, 0, .03, .84, 0, 4, C.steel);
    m.box(-.15, .1, -.08, -.1, .28, .08, T);
  },
  manatarms(m, tun, T) {
    m.cyl(0, HEAD_Y - .02, 0, .08, HEAD_Y + .1, .07, 8, C.steelD); m.box(-.18, .04, -.1, -.12, .32, .1, T);
    pole(m, .36); m.blob(.15, .4, 0, .06, .06, .06, C.steelD, 0, null, 6, 3);
  },
  halberd(m) { cap(m, C.steelD); pole(m, .9); bar(m, .15, .62, .3, .8); m.cyl(.15, .9, 0, .03, 1.0, 0, 4, C.steel); },
  archer(m) { hood(m, [.52, .38, .26]); bowShape(m, .15, 0, .44, .07, C.woodD); },
  longbow(m) { hood(m, [.40, .50, .30]); bowShape(m, .15, -.02, .78, .1, C.woodD); },
  crossbow(m) { cap(m, C.steelD); m.box(.1, .22, -.025, .16, .27, .28, C.woodD); m.box(0, .23, .2, .26, .26, .24, C.woodD); },
  officer(m, tun, T) {
    m.cyl(0, HEAD_Y + .05, 0, .08, HEAD_Y + .11, .06, 8, C.gold); m.box(-.015, HEAD_Y + .08, -.1, .015, HEAD_Y + .17, .1, T);
    pole(m, .9, C.woodD, -.14, .015); m.box(-.4, .62, -.02, -.14, .88, .02, T); m.box(-.4, .62, -.025, -.14, .68, .025, C.gold);
  },
};

/** Build the model for a unit kind in `team`'s colours. */
export function buildUnitModel(kind, team) {
  const m = new MeshBuilder(), def = UNITS[kind], look = def.look;
  const { roof: T, dark: TD } = TEAM_COLORS[team];
  if (def.role === 'siege') { siegeModel(m, kind, T); return m; }
  if (look.mounted) { mountedModel(m, kind, T, TD); return m; }
  const tun = def.role === 'troop' ? T : (look.tunic || look.color);
  body(m, tun);                                                       // a cylinder with a rounded top
  if (def.role !== 'troop') sash(m, T);                               // workers wear a sash in the team colour
  head(m);                                                            // a round head
  FOOT_MODELS[kind](m, tun, T);
  return m;
}
