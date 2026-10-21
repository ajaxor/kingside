// Fixed constants of the game world. Tunable gameplay numbers (costs, speeds, timers) live in src/data/.

export const MAP_SIZE = 48;                 // the map is MAP_SIZE x MAP_SIZE tiles
export const TILES = MAP_SIZE * MAP_SIZE;
export const PLAYER = 0;                    // team indices
export const ENEMY = 1;
export const TEAM_COUNT = 2;
export const SIM_STEP = 1 / 30;             // seconds of game time per simulation step
export const MAX_STEPS_PER_FRAME = 12;      // a slow frame never runs more steps than this
