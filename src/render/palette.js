// Colours of the world, as [r, g, b] (0..1), and each side's colours.

export const C = {
  grass: [.60, .74, .44], grass2: [.53, .69, .40], grassD: [.47, .61, .36], path: [.80, .72, .55], sand: [.84, .78, .58], bank: [.62, .50, .36],
  water: [.35, .60, .73], ford: [.58, .76, .77], soil: [.50, .39, .29], soilD: [.40, .31, .24],
  rock: [.70, .69, .66], rockD: [.56, .56, .55], iron: [.66, .43, .31],
  leaf: [.36, .58, .33], leaf2: [.47, .66, .34], pine: [.24, .46, .35], pine2: [.29, .53, .38], trunk: [.47, .34, .24],
  wood: [.71, .55, .37], woodD: [.50, .37, .26], stone: [.83, .81, .76], stoneD: [.68, .66, .62],
  straw: [.88, .76, .45], crop: [.84, .75, .35], cropG: [.55, .72, .32], skin: [.94, .79, .64], steel: [.72, .74, .78],
  canvas: [.90, .86, .76], steelD: [.50, .52, .58], horse: [.56, .42, .30], horseD: [.40, .30, .22], dark: [.22, .22, .24], fire: [1, .62, .25], gold: [.95, .75, .30],
};

/** Per team: roof colour, darker trim, and the CSS colour the UI uses for it. */
export const TEAM_COLORS = [
  { roof: [.34, .52, .74], dark: [.24, .38, .56], css: 'var(--blue)' },
  { roof: [.76, .33, .27], dark: [.55, .23, .19], css: 'var(--red)' },
];

/** Health bar fill colour per team. */
export const HEALTH_COLORS = [[.45, .68, .95], [.95, .45, .36]];
