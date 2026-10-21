import test from 'node:test';
import assert from 'node:assert/strict';

// Importing the entry points loads the whole module graph, which catches missing exports, typos and circular-import ordering mistakes.
test('the whole module graph loads', async () => {
  const main = await import('../src/main.js');
  assert.equal(typeof main.boot, 'function');
  const launcher = await import('../src/launcher.js');
  assert.equal(typeof launcher.launch, 'function');
});
