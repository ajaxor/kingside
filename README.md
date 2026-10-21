# Kingside

A browser real-time strategy game. Plan the town and it runs itself: carpenters and masons raise what you plan, workers gather, farmers farm, smiths and fletchers arm the barracks, and soldiers march on the red keep. Burn it before it burns yours.

## Run it locally

```
npm start        # http://localhost:8080/  (PORT=1234 npm start to change)
npm test
```

The game is made of ES modules, which browsers will not load from `file://`, so open it through `npm start`. A local run never caches. There is no build step. WebGL is required; if the device lacks it the title screen says so.

## How it is laid out

| Path | What it is |
|---|---|
| `index.html` | the tiny stable shell: hands over to the launcher |
| `style.css` | all styles |
| `src/launcher.js` | loads the stylesheet, shows the title screen, loads the game behind it, brings the title back on "Menu" |
| `src/main.js` | builds the page (hidden until Play), runs the frame loop, starts and ends games |
| `src/build-info.js` | the git hash and date on the title screen, stamped automatically |
| `src/core/` | constants, the shared world state (`world.js`), the event bus, seedable random, math and text helpers, build description |
| `src/data/` | **the game's content as data**: `units`, `buildings`, `upgrades` (trees), `resources`, `goods`, `terrain`, `balance`, `ai`, `map`, `help` |
| `src/game/` | the rules: map generation, pathing, movement, units, buildings and their per-step behaviour, the computer player, the player's commands, one simulation `tick` |
| `src/game/brains/` | one behaviour per kind of unit (builder, gatherer, runner, farmer, patrol, troop, siege); a unit's data names its brain |
| `src/render/` | WebGL: `gl/` (context, tilt-shift blur, matrices), `models/` (every building, unit and prop built from boxes, roofs, cones and blobs), `terrain.js`, `scene.js` (a frame), `camera.js`, `icons.js` (build tray pictures) |
| `src/ui/` | page markup, resource bar, build tray, context panel, input, toasts, end card, title screen |
| `tools/` | `stamp.mjs` writes `build-info.js` from git; `serve.mjs` is the dev server |
| `tests/` | `node --test` |

### Data driven

A unit says what it is (`role`, `brain`, stats, what it gathers or needs, what it costs to train, how it looks). A building says what it does (crew, supply, defence, income, training tree, courtyard, trap, wall-like). The rules ask the data: "does this building have `defence`?", not "is this a tower?". `tests/data.test.js` checks that every reference between tables points at something real.

### Simulation and picture are separate

`src/game/` changes the world (`src/core/world.js`) and emits events; `src/render/` and `src/ui/` read the world and draw it. Randomness goes through `random()` so a test can seed it, and the computer player can play either side, so `tests/simulation.test.js` plays whole seeded AI-vs-AI games headlessly.

## The title screen and its build line

The title screen is a page of its own (the game is hidden behind it) with Play, How to play and Save to your phone. The build line shows the short git hash and when that commit was made, read from `src/build-info.js`, which `.github/workflows/stamp.yml` commits after every push. Pull before your next push to pick up the bot's commit.

## Hosting

The webgames launcher serves this repo's files exactly as they are (and gives the game its home-screen icon and manifest), so everything needed at run time is committed.
