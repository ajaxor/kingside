# Tech debt

Architecture and design that could be better. Newest at the bottom.

- **Brain tunables are still inline.** Gatherer, farmer, runner, patrol and troop behaviour contain timers, scan radii and leash distances as literals. They belong in `src/data/` next to the unit tables (or in a `brains` section of `balance.js`).
- **Building models are code, not data.** `src/render/models/buildings.js` and `units.js` are hand-placed boxes. A small declarative part list (shape, size, offset, colour role) would let models be edited, tested and loaded as data.
- **The computer cheats.** `src/game/ai.js` tops up the enemy's stockpile on a timer (`trickleTimer`) instead of making it earn everything, and plans a fixed build order. A fair AI would gather and react.
- **UI builds HTML strings.** `src/ui/context-panel.js` and `build-menu.js` assemble `innerHTML`; there is no component model, so refreshes compare a key string to avoid rebuilding. Fine at this size, awkward as panels grow.
- **Global shared mutable world.** `src/core/world.js` exports mutable arrays that every module imports. It is simple and fast but makes tests reset the world by hand (`resetWorld`) and rules out two games at once.
- **No WebGL fallback or context-loss handling.** A lost context needs the meshes and framebuffers rebuilt; today the game just stops drawing.
- **The resource-tile mesh is rebuilt whole whenever a node is harvested** (throttled to ~7 per second). The ground is static now, but the nodes mesh could still be chunked or updated in place.
- **Rendering was only verified headlessly** (stubbed GL). There are no screenshot or golden-image tests.
- **Scattered unit-family strings.** `family` ('infantry' | 'ranged') and officer `take` filters are plain strings checked in several places.
- **The flat look is tuned by eye and coupled to the camera heading.** The three light bands in `src/render/gl/context.js` (thresholds, sun direction) were chosen so the two walls the fixed camera sees land in different bands. Turning the camera, or changing `FORWARD` in `camera.js`, would silently flatten that. Light and shade colours are literals in the shader, and the palette in `palette.js` assumes them (top faces come out about 7% warmer and lighter).
- **Team colours live in three places.** `TEAM_COLORS` in `palette.js`, `--blue`/`--red` in `style.css`, and the keep silhouettes in `title-backdrop.js` are kept in sync by hand.
- **Zoom-dependent sizing is ad hoc.** `zoomBoost` in `scene.js` grows units as the camera pulls back, but health bars, selection rings and markers stay a fixed world size, so they shrink relative to the units when zoomed out. One shared "readable at this zoom" scale would be cleaner.
- **`tileRandom` is no longer used by drawing.** It is only the path-cost tiebreak in `mapgen.js` now; its comment in `world.js` still says "for drawing variation".
- **Models are still hand-placed coordinates.** The simplified buildings and people are shorter, but the data-driven part list suggested above would still help. Worker and troop tools are one-off lines per kind in `FOOT_MODELS`.
- **Look changes are only checked by eye.** A headless Chromium with software WebGL does render the game (that is how this style was checked), so a screenshot or golden-image test is now possible; `tests/scene.test.js` still uses a stub GL.
- **Rim-walking is a heuristic.** `waypointFor` in `movement.js` picks a ±.4 offset waypoint to go round an own building's tile; there is no real clearance model, so two people can still overlap on a rim and a model wider than ~.55 would be walked through.
- **Own buildings are passable tiles, enemy ones are not.** `walkCost` in `pathing.js` charges own non-wall buildings x1.6, which also lets units path through a building that fully blocks a corridor.
- **Map generation scales by a magic constant.** `mapgen.js` multiplies river and ford shapes by `K = N / 48`; the shapes were tuned at 48 tiles and other sizes were not tried. Map content (cluster positions) in `data/map.js` is hand-placed for 72.
- **`nodeLeft` is a `Uint8Array`**, so a node cannot hold more than 255 harvests.
- **Sim constants are in tiles but models are in fractions of one.** Speeds, ranges and radii were not rescaled when people shrank to ~.2 wide, so e.g. melee reach and arrow height look off at close zoom.
