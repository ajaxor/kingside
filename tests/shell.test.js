import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const walk = (dir) => readdirSync(dir).flatMap((n) => (statSync(join(dir, n)).isDirectory() ? walk(join(dir, n)) : [join(dir, n)]));

test('every relative import in src/ points at a file that exists', () => {
  const missing = [];
  for (const file of walk(join(ROOT, 'src')).filter((f) => f.endsWith('.js'))) {
    for (const m of readFileSync(file, 'utf8').matchAll(/(?:from|import)\s*\(?\s*['"](\.[^'"]+)['"]/g)) {
      if (!existsSync(resolve(dirname(file), m[1]))) missing.push(file.slice(ROOT.length) + ' -> ' + m[1]);
    }
  }
  assert.deepEqual(missing, []);
});

test('the shell holds no game code, only the loader', () => {
  const shell = readFileSync(join(ROOT, 'index.html'), 'utf8');
  assert.ok(shell.includes('src/launcher.js?v='));
  assert.ok(!shell.includes('version.json') && !shell.includes('__BUILD__'));
  assert.ok(!shell.includes('<canvas'));
  assert.ok(shell.length < 4000);
});
