// Ground and the things that stand on it, as the numbers stored in the map arrays (src/core/world.js).

/** What the ground itself is, per tile. */
export const TERRAIN = { LAND: 0, WATER: 1, FORD: 2 };

/** Per ground type: surface height (drawing), walking-speed factor and path cost. Water cannot be crossed. */
export const TERRAIN_INFO = {
  [TERRAIN.LAND]: { height: 0, speed: 1, pathCost: 1 },
  [TERRAIN.WATER]: { height: -.34, speed: 0, pathCost: 0 },
  [TERRAIN.FORD]: { height: -.14, speed: .6, pathCost: 1.5 },
};

/** A harvestable thing on a land tile (0 = nothing). Workers gather these; each harvest takes one from the tile's amount. */
export const NODE = { NONE: 0, TREE: 1, STONE: 2, ORE: 3 };

export const NODE_INFO = {
  [NODE.TREE]: { name: 'tree', amount: 3 },
  [NODE.STONE]: { name: 'stone', amount: 6 },
  [NODE.ORE]: { name: 'iron ore', amount: 5 },
};

/** State of a tilled plot (src/core/world.js `field`). A farmer tills, then plants, then harvests, which returns it to TILLED. */
export const FIELD = { NONE: 0, TILLED: 1, GROWING: 2, RIPE: 3 };
