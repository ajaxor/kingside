// Colours of the world, as [r, g, b] (0..1), and each side's colours.
//
// The look is flat and minimal: the ground is quiet and low in contrast so everything standing on it reads at a glance. These are the
// mid-tone of each surface; the shader (gl/context.js) shifts them cool and dark on shaded faces and warm and light on top faces.
// Keep the ground muted and the objects (roofs, tunics, team colours) saturated.

export const C = {
  grass: [.58, .74, .52], grass2: [.52, .69, .49], grassD: [.46, .62, .44], path: [.84, .78, .64], sand: [.88, .82, .66], bank: [.66, .56, .44],
  water: [.40, .66, .80], ford: [.62, .80, .82], soil: [.58, .46, .35], soilD: [.46, .37, .29],
  rock: [.74, .74, .74], rockD: [.60, .61, .63], iron: [.78, .50, .36],
  leaf: [.30, .60, .38], leaf2: [.38, .68, .40], pine: [.19, .46, .38], pine2: [.25, .54, .42], trunk: [.52, .38, .28],
  wood: [.80, .60, .38], woodD: [.58, .42, .29], stone: [.88, .87, .84], stoneD: [.72, .72, .72],
  straw: [.94, .80, .44], crop: [.90, .78, .32], cropG: [.52, .76, .36], skin: [.90, .68, .52], steel: [.78, .82, .88],
  canvas: [.95, .92, .84], steelD: [.52, .56, .64], horse: [.62, .44, .30], horseD: [.44, .31, .22], dark: [.24, .25, .30], fire: [1, .58, .22], gold: [.98, .78, .26],
};

/** Per team: roof colour, darker trim, and the CSS colour the UI uses for it. Saturated, so a team's things stand out from the ground. */
export const TEAM_COLORS = [
  { roof: [.24, .50, .85], dark: [.16, .34, .64], css: 'var(--blue)' },
  { roof: [.88, .30, .24], dark: [.62, .19, .16], css: 'var(--red)' },
];

/** Health bar fill colour per team. */
export const HEALTH_COLORS = [[.45, .68, .95], [.95, .45, .36]];
