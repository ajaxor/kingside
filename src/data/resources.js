// The four stockpiled resources. `carry` names the colour (src/render/palette.js) of the bundle a worker is seen carrying.

export const RESOURCES = {
  wood: { name: 'wood', carry: 'wood' },
  stone: { name: 'stone', carry: 'stone' },
  food: { name: 'food', carry: 'crop' },
  iron: { name: 'iron', carry: 'iron' },
};

export const RESOURCE_IDS = Object.keys(RESOURCES);

/** A fresh amounts table with every resource at `value` (default 0). */
export const emptyAmounts = (value = 0) => Object.fromEntries(RESOURCE_IDS.map((id) => [id, value]));
