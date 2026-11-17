import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveContent } from '../../dist/resolve.js';

function git(root, ...args) {
  const result = spawnSync('git', ['-C', root, ...args], {
    encoding: 'utf8',
    windowsHide: true,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_ALLOW_PROTOCOL: 'file',
    },
  });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'agents refs á '));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 3 }));
  const author = join(root, 'author'),
    remote = join(root, 'remote.git'),
    consumer = join(root, 'consumer');
  mkdirSync(author);
  mkdirSync(consumer);
  git(author, 'init', '-b', 'main');
  git(author, 'config', 'user.name', 'Fixture');
  git(author, 'config', 'user.email', 'fixture@example.invalid');
  git(author, 'config', 'core.autocrlf', 'false');
  function commit(text) {
    writeFileSync(join(author, 'conteudo.txt'), text);
    git(author, 'add', '.');
    git(author, '-c', 'core.hooksPath=', 'commit', '-m', text);
    return git(author, 'rev-parse', 'HEAD');
  }
  const initial = commit('primeira versão');
  git(author, 'tag', 'v1.0.0');
  git(root, 'init', '--bare', remote);
  git(remote, 'symbolic-ref', 'HEAD', 'refs/heads/main');
  git(author, 'remote', 'add', 'origin', remote);
  git(author, 'push', 'origin', 'main', 'v1.0.0');
  return { root, author, remote, consumer, initial, commit };
}
function content(result) {
  return readFileSync(join(result.checkout, 'conteudo.txt'), 'utf8');
}

test('Git resolve branch não padrão e refs/heads pelo remote atualizado', (t) => {
  const f = fixture(t);
  git(f.author, 'checkout', '-b', 'feature/proxima');
  f.commit('feature inicial');
  git(f.author, 'push', 'origin', 'feature/proxima');
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'feature/proxima')),
    'feature inicial',
  );
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'refs/heads/feature/proxima')),
    'feature inicial',
  );
  f.commit('feature posterior');
  git(f.author, 'push', 'origin', 'feature/proxima');
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'feature/proxima')),
    'feature posterior',
  );
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'refs/heads/feature/proxima')),
    'feature posterior',
  );
});

test('Git atualiza branch padrão sem reutilizar branch local antiga; tag e SHA continuam selecionados', (t) => {
  const f = fixture(t);
  const main = resolveContent(f.consumer, f.remote, 'main');
  assert.equal(content(main), 'primeira versão');
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'v1.0.0')),
    'primeira versão',
  );
  assert.equal(
    content(resolveContent(f.consumer, f.remote, f.initial)),
    'primeira versão',
  );
  f.commit('main posterior');
  git(f.author, 'push', 'origin', 'main');
  const updated = resolveContent(f.consumer, f.remote, 'main');
  assert.notEqual(updated.checkout, main.checkout);
  assert.equal(content(updated), 'main posterior');
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'v1.0.0')),
    'primeira versão',
  );
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'refs/tags/v1.0.0')),
    'primeira versão',
  );
  assert.equal(
    content(resolveContent(f.consumer, f.remote, f.initial)),
    'primeira versão',
  );
});

test('Git prioriza tag explícita e rejeita branch removida mesmo havendo branch local no cache', (t) => {
  const f = fixture(t);
  resolveContent(f.consumer, f.remote, 'main');
  git(f.author, 'tag', 'escolha', f.initial);
  git(f.author, 'checkout', '-b', 'escolha');
  f.commit('branch com mesmo nome');
  git(f.author, 'push', 'origin', 'refs/heads/escolha', 'refs/tags/escolha');
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'escolha')),
    'primeira versão',
  );
  assert.equal(
    content(resolveContent(f.consumer, f.remote, 'refs/heads/escolha')),
    'branch com mesmo nome',
  );
  git(f.remote, 'config', 'receive.denyDeleteCurrent', 'ignore');
  git(f.author, 'push', 'origin', ':refs/heads/main');
  assert.throws(() => resolveContent(f.consumer, f.remote, 'main'), {
    code: 'SOURCE_REF',
  });
});
