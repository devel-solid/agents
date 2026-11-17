import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, unlinkSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { initialize } from '../../dist/init.js';
import { release, planRelease, nextVersion } from '../../dist/release.js';
import { initGit, git, commit, write, source, snapshot } from './helpers.mjs';

function fixture(t, committed = true) {
  const root = mkdtempSync(join(tmpdir(), 'agents release á '));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 5 }));
  initialize(root, { base: true });
  initGit(root);
  if (committed) commit(root);
  return root;
}
test('cálculo semver valida entradas e incrementa sem perder precisão', () => {
  assert.equal(nextVersion('v1.2.3', 'patch'), 'v1.2.4');
  assert.equal(nextVersion('v1.2.3', 'minor'), 'v1.3.0');
  assert.equal(nextVersion('v1.2.3', 'major'), 'v2.0.0');
  assert.equal(
    nextVersion('v9007199254740992.0.0', 'major'),
    'v9007199254740993.0.0',
  );
  for (const version of ['1.2.3', 'v01.2.3', 'v1.2.3-rc.1', 'v1.2.3\n'])
    assert.throws(() => nextVersion(version, 'patch'));
  assert.throws(() => nextVersion('v1.0.0', 'outro'));
});
test('primeira versão funciona sem manifesto, pacote ou remoto; preview preserva inclusive .git', (t) => {
  const root = fixture(t);
  const before = snapshot(root, { skip: [] });
  const preview = release(root, 'minor', true);
  assert.equal(preview.result.baselineTag, null);
  assert.equal(preview.result.nextVersion, 'v0.1.0');
  assert.equal(preview.result.applied, false);
  assert.deepEqual(snapshot(root, { skip: [] }), before);
  const head = git(root, 'rev-parse', 'HEAD');
  const applied = release(root, 'minor');
  assert.equal(applied.result.applied, true);
  assert.equal(git(root, 'rev-parse', 'v0.1.0'), head);
  assert.equal(git(root, 'rev-parse', 'HEAD'), head);
  assert.deepEqual(
    snapshot(root),
    Object.fromEntries(
      Object.entries(before).filter(([name]) => !name.startsWith('.git/')),
    ),
  );
});
test('seleção numérica respeita alcance e aceita tags anotadas e leves', (t) => {
  const root = fixture(t);
  git(root, 'tag', 'v1.9.0');
  git(root, 'tag', '-a', 'v1.10.0', '-m', 'versão');
  git(root, 'tag', 'v1.99.0-rc.1');
  git(root, 'checkout', '-b', 'outra');
  write(root, 'outra.txt', 'fora\n');
  commit(root);
  git(root, 'tag', 'v99.0.0');
  git(root, 'checkout', 'main');
  assert.equal(planRelease(root, 'patch').nextVersion, 'v1.10.1');
});
test('colisão de tag em outra branch é rejeitada sem substituição', (t) => {
  const root = fixture(t);
  git(root, 'tag', 'v1.2.3');
  git(root, 'checkout', '-b', 'outra');
  write(root, 'outra.txt', 'fora\n');
  const other = commit(root);
  git(root, 'tag', 'v1.3.0');
  git(root, 'checkout', 'main');
  const before = snapshot(root, { skip: [] });
  assert.throws(() => release(root, 'minor'), { code: 'RELEASE_TAG_EXISTS' });
  assert.equal(git(root, 'rev-parse', 'v1.3.0'), other);
  assert.deepEqual(snapshot(root, { skip: [] }), before);
});
test('fonte inválida, alterações e arquivo ignorado fora do commit impedem tag', (t) => {
  const root = fixture(t);
  write(root, 'solto.txt', 'sem commit');
  assert.throws(() => release(root, 'patch'), { code: 'RELEASE_DIRTY' });
  unlinkSync(join(root, 'solto.txt'));
  write(root, 'templates/docs/conventions/ruim.tpl.md', '# Sem card\n');
  commit(root);
  assert.throws(() => release(root, 'patch'), { code: 'SOURCE_CARD' });
  unlinkSync(join(root, 'templates/docs/conventions/ruim.tpl.md'));
  commit(root);
  write(root, '.gitignore', 'ignorada.tpl.md\n');
  commit(root);
  write(root, 'templates/docs/conventions/ignorada.tpl.md', source('Ignorada'));
  assert.throws(() => release(root, 'patch'), {
    code: 'RELEASE_SOURCE_UNTRACKED',
  });
  assert.equal(git(root, 'tag', '--list'), '');
});
test('repositório sem commit e bump ausente são pré-requisitos de validação', (t) => {
  const root = fixture(t, false);
  assert.throws(() => release(root, 'patch'), { code: 'RELEASE_HEAD' });
  assert.throws(() => release(root, ''), { code: 'USAGE' });
});
test('nova aplicação recalcula versão após uma prévia sem reservar o número', (t) => {
  const root = fixture(t);
  git(root, 'tag', 'v1.2.3');
  assert.equal(release(root, 'minor', true).result.nextVersion, 'v1.3.0');
  git(root, 'tag', 'v1.4.0');
  assert.equal(release(root, 'minor').result.nextVersion, 'v1.5.0');
});
test('mudança durante a verificação interrompe release antes de criar sua tag', (t) => {
  const root = fixture(t);
  git(root, 'tag', 'v1.0.0');
  const original = childProcess.spawnSync;
  let scans = 0;
  childProcess.spawnSync = (executable, args, options) => {
    if (executable === 'git' && args.includes('--merged') && ++scans === 2)
      original('git', ['-C', root, 'tag', 'v1.5.0'], options);
    return original(executable, args, options);
  };
  syncBuiltinESMExports();
  try {
    assert.throws(() => release(root, 'minor'), {
      code: 'RELEASE_STATE_CHANGED',
    });
  } finally {
    childProcess.spawnSync = original;
    syncBuiltinESMExports();
  }
  assert.equal(git(root, 'tag', '--list', 'v1.1.0'), '');
});
test('criação concorrente da mesma tag é preservada pelo Git sem force', (t) => {
  const root = fixture(t);
  const prior = git(root, 'rev-parse', 'HEAD');
  git(root, 'tag', 'v1.0.0');
  write(root, 'nova.txt', 'mudança');
  commit(root);
  const original = childProcess.spawnSync;
  childProcess.spawnSync = (executable, args, options) => {
    if (executable === 'git' && args.includes('--no-sign'))
      original('git', ['-C', root, 'tag', 'v1.1.0', prior], options);
    return original(executable, args, options);
  };
  syncBuiltinESMExports();
  try {
    assert.throws(() => release(root, 'minor'), { code: 'RELEASE_GIT' });
  } finally {
    childProcess.spawnSync = original;
    syncBuiltinESMExports();
  }
  assert.equal(git(root, 'rev-parse', 'v1.1.0'), prior);
});
