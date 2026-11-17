import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  linkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { initialize } from '../../dist/init.js';
import { loadManifest } from '../../dist/manifest.js';
import { buildSyncPlan } from '../../dist/plan.js';
import { applyPlan } from '../../dist/apply.js';
import { validateBase } from '../../dist/validate.js';
import { planRelease } from '../../dist/release.js';
import { baseMarkerContent } from '../../dist/roles.js';
import { projectRoot, snapshot, write } from './helpers.mjs';

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'agents papéis á '));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 5 }));
  return root;
}
function cli(cwd, args, expected = 2) {
  const result = spawnSync(
    process.execPath,
    [join(projectRoot, 'dist/cli.js'), ...args, '--json'],
    { cwd, encoding: 'utf8' },
  );
  assert.equal(result.status, expected, result.stdout + result.stderr);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}
test('base cria sete arquivos, com instruções próprias distintas do template consumidor', (t) => {
  const root = fixture(t);
  assert.equal(
    initialize(root, { base: true, dryRun: true }).changes.length,
    7,
  );
  assert.deepEqual(snapshot(root, { skip: [] }), {});
  initialize(root, { base: true });
  const own = readFileSync(join(root, 'AGENTS.md'), 'utf8');
  assert.equal(
    own,
    readFileSync(join(projectRoot, 'assets/base/AGENTS.md'), 'utf8'),
  );
  assert.notEqual(
    own,
    readFileSync(join(root, 'templates/AGENTS.tpl.md'), 'utf8'),
  );
  assert.doesNotMatch(
    own,
    /AGENT-CARD|Quando ler as conventions|Arquivo gerado/,
  );
  assert.equal(
    readFileSync(join(root, '.agents/base.json'), 'utf8'),
    baseMarkerContent,
  );
  assert.equal(existsSync(join(root, 'agents-compose.yml')), false);
  validateBase(root);
});
test('AGENTS próprio personalizado é preservado em repetição e reparo de skill', (t) => {
  const root = fixture(t);
  initialize(root, { base: true });
  write(root, 'AGENTS.md', '# Instruções da minha base\n\nConteúdo do dono.\n');
  const before = snapshot(root);
  const repeat = initialize(root, { base: true });
  assert.deepEqual(repeat.changes, []);
  assert.ok(repeat.preserved.includes('AGENTS.md'));
  assert.deepEqual(snapshot(root), before);
  rmSync(join(root, '.agents/skills/agents-write-conventions'), {
    recursive: true,
  });
  initialize(root, { base: true });
  assert.deepEqual(snapshot(root)['AGENTS.md'], before['AGENTS.md']);
  rmSync(join(root, 'AGENTS.md'));
  const missing = snapshot(root);
  assert.deepEqual(
    initialize(root, { base: true, dryRun: true }).changes.map((c) => c.path),
    ['AGENTS.md'],
  );
  assert.deepEqual(snapshot(root), missing);
  assert.throws(() => validateBase(root), {
    code: 'BASE_INSTRUCTIONS_MISSING',
  });
  initialize(root, { base: true });
  validateBase(root);
});
test('instruções próprias inválidas bloqueiam toda a inicialização', (t) => {
  for (const [name, content] of [
    ['vazio', ' \n'],
    ['utf8', Buffer.from([0xff])],
  ]) {
    const root = join(fixture(t), name);
    write(root, 'AGENTS.md', content);
    const before = snapshot(root, { skip: [] });
    for (const dryRun of [true, false])
      assert.throws(() => initialize(root, { base: true, dryRun }), {
        code: 'INIT_CONFLICT',
      });
    assert.deepEqual(snapshot(root, { skip: [] }), before);
  }
});
test('marcadores inválidos não são reparados nem usados para geração', (t) => {
  for (const content of [
    '',
    '{',
    '{"schemaVersion":2,"kind":"base"}',
    '{"schemaVersion":1,"kind":"consumer"}',
    '{"schemaVersion":1,"kind":"base","extra":true}',
    Buffer.from([0xff]),
  ]) {
    const root = fixture(t);
    write(root, '.agents/base.json', content);
    const before = snapshot(root, { skip: [] });
    for (const args of [
      ['init', '--base'],
      ['init', '--base', '--dry-run'],
      ['init'],
      ['validate', '--base'],
      ['sync', '--dry-run'],
      ['release', '--bump', 'patch', '--dry-run'],
    ]) {
      const result = cli(root, args);
      assert.ok(
        result.diagnostics.some((d) => d.code === 'PROJECT_ROLE_INVALID'),
      );
      assert.deepEqual(snapshot(root, { skip: [] }), before);
    }
  }
});
test('base rejeita composição, inclusive manifesto inserido manualmente e plano pronto', (t) => {
  const root = fixture(t);
  initialize(root, { base: true });
  for (const withManifest of [false, true]) {
    if (withManifest)
      write(
        root,
        'agents-compose.yml',
        'arquivo inválido inserido manualmente\n',
      );
    const before = snapshot(root, { skip: [] });
    for (const args of [
      ['init'],
      ['init', '--dry-run'],
      ['validate'],
      ['sync'],
      ['sync', '--dry-run'],
      ['sync', '--check'],
    ]) {
      assert.ok(
        cli(root, args).diagnostics.some(
          (d) => d.code === 'PROJECT_ROLE_CONFLICT',
        ),
      );
      assert.deepEqual(snapshot(root, { skip: [] }), before);
    }
    assert.throws(() => loadManifest(root), { code: 'PROJECT_ROLE_CONFLICT' });
    assert.throws(() => buildSyncPlan(root, {}), {
      code: 'PROJECT_ROLE_CONFLICT',
    });
    assert.throws(
      () =>
        applyPlan({
          repoRoot: root,
          changes: [{ path: 'AGENTS.md', content: 'Sobrescrever' }],
        }),
      { code: 'PROJECT_ROLE_CONFLICT' },
    );
    if (withManifest)
      for (const operation of [
        () => validateBase(root),
        () => planRelease(root, 'patch'),
        () => initialize(root, { base: true }),
      ])
        assert.throws(operation, { code: 'PROJECT_ROLE_CONFLICT' });
  }
});
test('consumidor rejeita init base, validação base e release sem qualquer escrita', (t) => {
  const root = fixture(t);
  initialize(root, {});
  const before = snapshot(root, { skip: [] });
  for (const args of [
    ['init', '--base'],
    ['init', '--base', '--dry-run'],
    ['validate', '--base'],
    ['release', '--bump', 'minor'],
    ['release', '--bump', 'minor', '--dry-run'],
  ]) {
    assert.ok(
      cli(root, args).diagnostics.some(
        (d) => d.code === 'PROJECT_ROLE_CONFLICT',
      ),
    );
    assert.deepEqual(snapshot(root, { skip: [] }), before);
  }
});
test('base não inicializada exige init antes de validação e release', (t) => {
  const root = fixture(t);
  for (const args of [
    ['validate', '--base'],
    ['release', '--bump', 'patch', '--dry-run'],
  ])
    assert.ok(
      cli(root, args).diagnostics.some(
        (d) => d.code === 'BASE_NOT_INITIALIZED',
      ),
    );
  assert.deepEqual(snapshot(root, { skip: [] }), {});
});
test('subpasta da base não redireciona operação ao manifesto do consumidor ancestral', (t) => {
  const parent = fixture(t);
  initialize(parent, {});
  const root = join(parent, 'base-separada');
  mkdirSync(root);
  initialize(root, { base: true });
  const child = join(root, 'subpasta');
  mkdirSync(child);
  const before = snapshot(parent, { skip: [] });
  for (const args of [
    ['validate'],
    ['sync'],
    ['sync', '--dry-run'],
    ['sync', '--check'],
    ['init'],
    ['init', '--base'],
    ['sync', '--repo-root', child],
  ])
    assert.ok(
      cli(child, args).diagnostics.some(
        (d) => d.code === 'PROJECT_ROLE_CONFLICT',
      ),
    );
  cli(root, ['validate', '--base'], 0);
  assert.deepEqual(snapshot(parent, { skip: [] }), before);
});
test('marcador não pode ser um alias nem instruções próprias podem ser hardlink', (t) => {
  const root = fixture(t);
  write(root, 'protegido.json', baseMarkerContent);
  mkdirSync(join(root, '.agents'));
  try {
    symlinkSync(
      join(root, 'protegido.json'),
      join(root, '.agents/base.json'),
      process.platform === 'win32' ? 'file' : undefined,
    );
  } catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) {
      t.skip('Host não permite links de arquivo.');
      return;
    }
    throw error;
  }
  assert.throws(() => initialize(root, { base: true }), {
    code: 'PATH_RESERVED',
  });
  assert.equal(
    readFileSync(join(root, 'protegido.json'), 'utf8'),
    baseMarkerContent,
  );
  assert.equal(existsSync(join(root, 'README.md')), false);
  rmSync(join(root, '.agents/base.json'));
  write(root, 'manual.md', 'Instruções próprias\n');
  linkSync(join(root, 'manual.md'), join(root, 'AGENTS.md'));
  assert.throws(() => initialize(root, { base: true }), {
    code: 'INIT_CONFLICT',
  });
  assert.equal(existsSync(join(root, '.agents/base.json')), false);
});

test('alias de diretório para uma subpasta não permite transformar a base em consumidor', (t) => {
  const root = fixture(t);
  initialize(root, { base: true });
  const child = join(root, 'subpasta');
  mkdirSync(child);
  const outside = fixture(t);
  const alias = join(outside, 'atalho');
  try {
    symlinkSync(
      child,
      alias,
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  } catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) {
      t.skip('Host não permite links de diretório.');
      return;
    }
    throw error;
  }
  const before = snapshot(root, { skip: [] });
  assert.throws(() => initialize(alias, { dryRun: true }), {
    code: 'PROJECT_ROLE_CONFLICT',
  });
  assert.throws(() => initialize(alias, {}), { code: 'PROJECT_ROLE_CONFLICT' });
  assert.throws(() => loadManifest(alias), { code: 'PROJECT_ROLE_CONFLICT' });
  assert.throws(() => buildSyncPlan(alias, {}), {
    code: 'PROJECT_ROLE_CONFLICT',
  });
  assert.throws(
    () =>
      applyPlan({
        repoRoot: alias,
        changes: [{ path: 'AGENTS.md', content: 'Não gravar' }],
      }),
    { code: 'PROJECT_ROLE_CONFLICT' },
  );
  for (const args of [
    ['init', '--dry-run'],
    ['validate'],
    ['sync'],
    ['sync', '--dry-run'],
    ['sync', '--check'],
    ['init', '--base'],
  ]) {
    assert.ok(
      cli(outside, [...args, '--repo-root', alias]).diagnostics.some(
        (d) => d.code === 'PROJECT_ROLE_CONFLICT',
      ),
    );
    assert.deepEqual(snapshot(root, { skip: [] }), before);
  }
  assert.equal(existsSync(join(child, 'agents-compose.yml')), false);
});
