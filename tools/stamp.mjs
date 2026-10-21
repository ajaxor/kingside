// Writes src/build-info.js: the short git hash and commit time that the title screen shows.
//   npm run stamp
//
// The stamp names the latest commit that changed anything OTHER than src/build-info.js itself, so committing the stamp does not change
// what it says (a file cannot contain the hash of the commit that contains it). Run it after committing code and commit the result on
// its own, right before pushing; running it again changes nothing. This works the same wherever the files are served from, which
// matters because the webgames launcher serves the repo's files as they are, with no build step.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FILE = resolve(ROOT, 'src/build-info.js');

/** The text of src/build-info.js for a build. */
export function renderBuildInfo({ hash, updated }) {
  return `// Which commit this is, shown on the title screen. Written by tools/stamp.mjs (npm run stamp): do not edit by hand.
export const BUILD = { hash: '${hash}', updated: '${updated}' };
`;
}

/** { hash, updated } of the latest commit that touched anything but the stamp file (updated = ISO time in UTC). */
export function latestCodeCommit(cwd = ROOT) {
  const out = execFileSync('git', ['log', '-1', '--format=%H %cd', '--date=format-local:%Y-%m-%dT%H:%M:%SZ', '--', '.', ':(exclude)src/build-info.js'],
    { cwd, env: { ...process.env, TZ: 'UTC' }, encoding: 'utf8' }).trim();
  const [full, updated] = out.split(' ');
  if (!full || !updated) throw new Error('stamp: no commits found');
  return { hash: full.slice(0, 7), updated };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const text = renderBuildInfo(latestCodeCommit());
  let old = '';
  try { old = readFileSync(FILE, 'utf8'); } catch { /* first run */ }
  if (old === text) console.log('build-info.js is already current');
  else { writeFileSync(FILE, text); console.log('wrote src/build-info.js:\n' + text); }
}
