import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { latestCodeCommit, renderBuildInfo } from '../tools/stamp.mjs';

test('renderBuildInfo writes a module the title screen can import', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'kingside-stamp-'));
  try {
    const file = join(dir, 'build-info.mjs');
    writeFileSync(file, renderBuildInfo({ hash: '8de09bd', updated: '2026-10-21T17:34:00Z' }));
    const { BUILD } = await import(file);
    assert.deepEqual(BUILD, { hash: '8de09bd', updated: '2026-10-21T17:34:00Z' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('the stamp names the latest commit that is not itself a stamp, so stamping is stable', () => {
  const dir = mkdtempSync(join(tmpdir(), 'kingside-git-'));
  const git = (...a) => execFileSync('git', a, { cwd: dir, encoding: 'utf8', env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t', GIT_COMMITTER_DATE: '2026-10-21T10:34:00-07:00', GIT_AUTHOR_DATE: '2026-10-21T10:34:00-07:00' } }).trim();
  try {
    git('init', '-q');
    mkdirSync(join(dir, 'src'));
    writeFileSync(join(dir, 'game.js'), 'one');
    git('add', '-A'); git('commit', '-q', '-m', 'code');
    const code = git('rev-parse', 'HEAD');
    const first = latestCodeCommit(dir);
    assert.equal(first.hash, code.slice(0, 7));
    assert.equal(first.updated, '2026-10-21T17:34:00Z');                       // 10:34 in Pacific time, as UTC
    writeFileSync(join(dir, 'src', 'build-info.js'), renderBuildInfo(first));
    git('add', '-A'); git('commit', '-q', '-m', 'Stamp build info');
    assert.deepEqual(latestCodeCommit(dir), first);                             // the stamp commit does not move the stamp
    writeFileSync(join(dir, 'game.js'), 'two');
    git('add', '-A'); git('commit', '-q', '-m', 'more code');
    assert.equal(latestCodeCommit(dir).hash, git('rev-parse', 'HEAD').slice(0, 7));
    assert.match(readFileSync(join(dir, 'src', 'build-info.js'), 'utf8'), new RegExp(code.slice(0, 7)));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
