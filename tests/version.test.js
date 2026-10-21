import test from 'node:test';
import assert from 'node:assert/strict';
import { describeBuild, formatUpdated } from '../src/core/version.js';

test('formatUpdated shows date and time with a zone', () => {
  assert.equal(formatUpdated('2026-10-21T17:34:00Z', { locale: 'en-US', timeZone: 'UTC' }), 'Oct 21, 2026, 5:34 PM UTC');
  assert.equal(formatUpdated('2026-10-21T17:34:00Z', { locale: 'en-US', timeZone: 'America/Los_Angeles' }), 'Oct 21, 2026, 10:34 AM PDT');
});

test('formatUpdated gives nothing for a missing or unreadable date', () => {
  assert.equal(formatUpdated(undefined), '');
  assert.equal(formatUpdated('not a date'), '');
});

test('describeBuild names the git hash and the update time', () => {
  const line = describeBuild({ hash: '8de09bd', updated: '2026-10-21T17:34:00Z' }, { locale: 'en-US', timeZone: 'UTC' });
  assert.equal(line, 'Build 8de09bd · Oct 21, 2026, 5:34 PM UTC');
});

test('describeBuild keeps the hash when the date is unknown, and says so for a copy that was never stamped', () => {
  assert.equal(describeBuild({ hash: '8de09bd' }), 'Build 8de09bd');
  assert.equal(describeBuild({ hash: 'dev' }), 'Unstamped development build');
  assert.equal(describeBuild({}), 'Unstamped development build');
});
