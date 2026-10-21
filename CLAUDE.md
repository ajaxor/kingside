# Kingside

A real-time strategy game for the browser. Run `npm start` to play it locally and `npm test` to test it. See README.md for how the code is laid out.

## Workflow

- Push straight to `main`. Do not open pull requests.
- `src/build-info.js` (the git hash and date on the title screen) is written automatically: after every push, `.github/workflows/stamp.yml` runs `tools/stamp.mjs` and commits the result to `main` as "Stamp build info [skip ci]". Do not edit it by hand and do not stamp before pushing. Pull before your next push so you pick up that commit. (`npm run stamp` does the same locally if you want to see it.)
- The game is served by the webgames launcher (a separate repo) straight from this repo's files, so anything the game needs at run time has to be committed, and `include` in webgames' `games.json` has to list it (`index.html`, `style.css`, `src/`).
- Note architecture and design that could be better in `tech-debt.md`, and new ideas in `backlog.md`.

## Where things go

- Game content (units, buildings, costs, upgrade trees, balance, AI plan, map generation) is data in `src/data/`. Adding a unit or building should mean adding an entry there, plus a model in `src/render/models/`; rules in `src/game/` read the data and do not hard-code kinds.
- The simulation (`src/game/`) never touches the page or WebGL. It tells the outside world about things through `src/core/events.js`. This is what lets `tests/simulation.test.js` play whole AI-vs-AI games under node.
