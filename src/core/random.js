// Randomness. The simulation draws from random() so a test can make a whole game repeatable with seedRandom(); the game itself uses
// Math.random. mulberry() is a small seeded generator and makeNoise() a smooth value-noise field built on one, used for the map.

let source = Math.random;

/** A random number in [0, 1). */
export const random = () => source();

/** Make random() repeatable (pass a number), or restore Math.random (pass nothing). */
export function seedRandom(seed) { source = seed == null ? Math.random : mulberry(seed); }

/** A seeded generator: call it for numbers in [0, 1). */
export function mulberry(seed) {
  let a = seed;
  return function next() {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/** Smooth 2D value noise (tiles every 64 cells) drawing its lattice from `rng`. Returns noise(x, y) in [0, 1]. */
export function makeNoise(rng) {
  const grid = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) grid[i] = rng();
  const at = (a, b) => grid[((b & 63) << 6) | (a & 63)];
  const smooth = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), u = smooth(x - xi), w = smooth(y - yi);
    return (at(xi, yi) * (1 - u) + at(xi + 1, yi) * u) * (1 - w) + (at(xi, yi + 1) * (1 - u) + at(xi + 1, yi + 1) * u) * w;
  };
}
