// A tiny event bus. The simulation announces what happens (a toast to show, a building lost, the game over) and the UI listens, so the
// rules never touch the page and can run headless in tests.
//
//   'toast'            { message, key, cooldown, kind }   something to tell the player ("good" | "warn" | undefined)
//   'building-removed' { building }                       a building was destroyed or razed
//   'game-over'        { result: 'win' | 'lose', time }   a keep fell

const handlers = new Map();

/** Listen for an event. Returns a function that stops listening. */
export function on(type, handler) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type).add(handler);
  return () => handlers.get(type).delete(handler);
}

export function emit(type, payload) {
  for (const handler of handlers.get(type) || []) handler(payload);
}
