import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  rmSync,
  existsSync,
  readFileSync,
  unlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { stringify } from 'yaml';
import { spawnSync } from 'node:child_process';
import { initialize } from '../../dist/init.js';
import { parseManifest } from '../../dist/manifest.js';
import { buildSyncPlan } from '../../dist/plan.js';
import { applyPlan } from '../../dist/apply.js';
import { source, write, snapshot, projectRoot } from './helpers.mjs';

function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'agents local á '));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 5 }));
  return root;
}
function cli(root, args, expected = 0) {
  const result = spawnSync(
    process.execPath,
    [path.join(projectRoot, 'dist/cli.js'), ...args, '--json'],
    { cwd: root, env: { ...process.env, PATH: '' }, encoding: 'utf8' },
  );
  assert.equal(result.status, expected, result.stdout + result.stderr);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}
test('init, validate e sync completam o fluxo local sem Git nem rede', (t) => {
  const root = fixture(t);
  const empty = snapshot(root, { skip: [] });
  const preview = cli(root, ['init', '--dry-run']);
  assert.equal(preview.changes.length, 5);
  assert.equal(preview.result.applied, false);
  assert.deepEqual(snapshot(root, { skip: [] }), empty);
  const human = spawnSync(
    process.execPath,
    [path.join(projectRoot, 'dist/cli.js'), 'init', '--dry-run'],
    { cwd: root, env: { ...process.env, PATH: '' }, encoding: 'utf8' },
  );
  assert.equal(human.status, 0);
  assert.match(human.stdout, /Prévia: 5 arquivo/);
  assert.match(human.stdout, /Nenhum arquivo gravado/);
  assert.deepEqual(snapshot(root, { skip: [] }), empty);
  cli(root, ['init']);
  assert.equal(
    existsSync(
      path.join(root, '.agents/skills/agents-write-conventions/SKILL.md'),
    ),
    true,
  );
  assert.equal(existsSync(path.join(root, 'AGENTS.md')), false);
  assert.equal(existsSync(path.join(root, '.cache')), false);
  assert.equal(
    existsSync(path.join(root, '.agents/skills/agents-update-docs/SKILL.md')),
    true,
  );
  assert.equal(
    existsSync(path.join(root, '.agents/skills/agents-update-version')),
    false,
  );
  write(
    root,
    'templates/docs/conventions-local/commits.tpl.md',
    source('Commits', 'Use Conventional Commits.'),
  );
  cli(root, ['validate']);
  const authored = snapshot(root);
  const planned = cli(root, ['sync', '--dry-run']);
  assert.equal(planned.changes.length, 3);
  assert.deepEqual(snapshot(root), authored);
  cli(root, ['sync', '--check'], 1);
  assert.deepEqual(snapshot(root), authored);
  cli(root, ['sync']);
  const stable = snapshot(root);
  assert.match(
    readFileSync(path.join(root, 'docs/conventions/commits.md'), 'utf8'),
    /Use Conventional Commits/,
  );
  assert.equal(cli(root, ['sync']).changes.length, 0);
  assert.ok(
    cli(root, ['sync']).result.outputs.every(
      (output) => output.action === 'no-op',
    ),
  );
  cli(root, ['sync', '--check']);
  cli(root, ['init']);
  assert.deepEqual(snapshot(root), stable);
  unlinkSync(path.join(root, '.agents/skills/agents-update-docs/SKILL.md'));
  cli(root, ['validate']);
  cli(root, ['sync']);
});
test('schema v2 é explícito e o pin é opcional somente sem entradas remotas', (t) => {
  const root = fixture(t);
  initialize(root, {});
  const current = readFileSync(path.join(root, 'agents-compose.yml'), 'utf8');
  const data = parseManifest(current).data;
  assert.equal(data.schemaVersion, 2);
  assert.equal(data.agents, undefined);
  const c = data.outputs['AGENTS.md'].include.conventions;
  c.entries = [{ origin: 'local', from: 'x.tpl.md' }];
  assert.throws(() => parseManifest(stringify(data)), {
    code: 'MANIFEST_SCHEMA',
  });
  c.entries = [{ origin: 'remote', from: 'x.tpl.md' }];
  assert.throws(() => parseManifest(stringify(data)), {
    code: 'MANIFEST_SCHEMA',
  });
  data.agents = { repository: 'file:///base', ref: 'v1.0.0' };
  assert.doesNotThrow(() => parseManifest(stringify(data)));
  delete data.schemaVersion;
  delete data.agents;
  c.entries = [];
  assert.throws(() => parseManifest(stringify(data)), {
    code: 'MANIFEST_SCHEMA',
  });
});
test('pastas configuradas, famílias aninhadas e criação/cópia têm a mesma semântica', (t) => {
  const root = fixture(t);
  initialize(root, {});
  const manifest = parseManifest(
    readFileSync(path.join(root, 'agents-compose.yml'), 'utf8'),
  ).data;
  const c = manifest.outputs['AGENTS.md'].include.conventions;
  c.local.tpl_dir = 'fontes';
  c.out_dir = 'publicado';
  write(root, 'agents-compose.yml', stringify(manifest));
  write(root, 'fontes/Zebra.tpl.md', source('Zebra'));
  write(root, 'fontes/grupo/regra.tpl.md', source('Regra'));
  write(root, 'fontes/grupo/regra.detalhe.tpl.md', source('Detalhe'));
  write(root, 'fontes/alpha.tpl.md', source('Alpha'));
  write(root, 'fontes/README.md', '# Não é template.');
  const plan = buildSyncPlan(root);
  assert.equal(plan.families, 3);
  assert.deepEqual(
    plan.outputs.map((output) => output.path),
    [
      'publicado/alpha.md',
      'publicado/grupo/regra.md',
      'publicado/grupo/regra.detalhe.md',
      'publicado/Zebra.md',
      'AGENTS.md',
    ],
  );
  applyPlan(plan);
  assert.match(
    readFileSync(path.join(root, 'AGENTS.md'), 'utf8'),
    /publicado\/grupo\/regra.md/,
  );
});
test('fontes inválidas, órfãs e colisões abortam antes de escrever', (t) => {
  const root = fixture(t);
  initialize(root, {});
  const sourceRoot = 'templates/docs/conventions-local/';
  for (const [name, contents] of [
    ['sem-card.tpl.md', '# Sem card\n'],
    ['orfa.extra.tpl.md', source('Órfã')],
    ['contexto-do-projeto.extra.mais.tpl.md', source('Inválida')],
  ]) {
    write(root, sourceRoot + name, contents);
    const before = snapshot(root);
    cli(root, ['sync'], 2);
    assert.deepEqual(snapshot(root), before);
    unlinkSync(path.join(root, sourceRoot + name));
  }
  const data = parseManifest(
    readFileSync(path.join(root, 'agents-compose.yml'), 'utf8'),
  ).data;
  data.outputs['AGENTS.md'].include.conventions.out_dir = '.';
  write(root, 'agents-compose.yml', stringify(data));
  write(root, sourceRoot + 'AGENTS.tpl.md', source('Destino reservado'));
  const before = snapshot(root);
  cli(root, ['sync'], 2);
  assert.deepEqual(snapshot(root), before);
});
test('init preserva v1 offline e rejeita conflitos antes da primeira escrita', (t) => {
  const root = fixture(t);
  const manifest = {
    agents: { repository: 'https://example.invalid/base.git', ref: 'v1.0.0' },
    outputs: {
      'AGENTS.md': {
        include: {
          conventions: {
            out_dir: 'docs',
            local: { tpl_dir: 'local' },
            remote: { tpl_dir: 'remote' },
            entries: [],
          },
        },
      },
    },
  };
  const text = '# Pin preservado\n' + stringify(manifest);
  write(root, 'agents-compose.yml', text);
  write(root, 'AGENTS.md', 'Documento próprio\n');
  cli(root, ['init']);
  assert.equal(
    readFileSync(path.join(root, 'agents-compose.yml'), 'utf8'),
    text,
  );
  assert.equal(
    readFileSync(path.join(root, 'AGENTS.md'), 'utf8'),
    'Documento próprio\n',
  );
  const conflict = fixture(t);
  write(
    conflict,
    '.agents/skills/agents-update-docs/SKILL.md',
    'Personalizada\n',
  );
  const before = snapshot(conflict);
  cli(conflict, ['init', '--dry-run'], 2);
  assert.deepEqual(snapshot(conflict), before);
});
