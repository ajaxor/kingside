# Tech debt

Architecture and design that could be better. Newest at the bottom.

- **Brain tunables are still inline.** Gatherer, farmer, runner, patrol and troop behaviour contain timers, scan radii and leash distances as literals. They belong in `src/data/` next to the unit tables (or in a `brains` section of `balance.js`).
- **Building models are code, not data.** `src/render/models/buildings.js` and `units.js` are hand-placed boxes. A small declarative part list (shape, size, offset, colour role) would let models be edited, tested and loaded as data.
- **The computer cheats.** `src/game/ai.js` tops up the enemy's stockpile on a timer (`trickleTimer`) instead of making it earn everything, and plans a fixed build order. A fair AI would gather and react.
- **UI builds HTML strings.** `src/ui/context-panel.js` and `build-menu.js` assemble `innerHTML`; there is no component model, so refreshes compare a key string to avoid rebuilding. Fine at this size, awkward as panels grow.
- **Global shared mutable world.** `src/core/world.js` exports mutable arrays that every module imports. It is simple and fast but makes tests reset the world by hand (`resetWorld`) and rules out two games at once.
- **No WebGL fallback or context-loss handling.** A lost context needs the meshes and framebuffers rebuilt; today the game just stops drawing.
- **Terrain is one big mesh rebuilt whenever a node is harvested** (throttled to 4 per second). Chunking it would make rebuilds cheap.
- **Rendering was only verified headlessly** (stubbed GL). There are no screenshot or golden-image tests.
- **Scattered unit-family strings.** `family` ('infantry' | 'ranged') and officer `take` filters are plain strings checked in several places.
