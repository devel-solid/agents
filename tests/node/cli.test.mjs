import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
  existsSync,
  symlinkSync,
  linkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import {
  initialize,
  inspectIntegration,
  expectedIntegration,
} from '../../dist/init.js';
import { snapshot, write } from './helpers.mjs';

const cli = fileURLToPath(new URL('../../dist/cli.js', import.meta.url));
function temporary(run) {
  const root = mkdtempSync(join(tmpdir(), 'agents cli '));
  try {
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true, maxRetries: 3 });
  }
}
function invoke(root, args) {
  const result = spawnSync(
    process.execPath,
    [cli, ...args, '--repo-root', root, '--json'],
    { encoding: 'utf8' },
  );
  assert.ifError(result.error);
  assert.equal(result.stderr, '');
  return { status: result.status, data: JSON.parse(result.stdout) };
}
test('CLI rejeita uso inválido com envelope estável e sem criar setup', () =>
  temporary((root) => {
    for (const args of [
      ['sync', '--check', '--dry-run'],
      ['validate', '--starter', 'minimal'],
      ['init', '--starter', 'minimal'],
      ['init', '--base', '--repository', 'x'],
      ['init', '--base', '--starter', 'outro'],
      ['init', '--base', '--convention', 'x'],
      ['doctor', '--ref', 'x'],
      ['doctor', '--help'],
      ['new', 'convention'],
      ['update'],
      ['explain'],
      ['recover'],
      ['release', 'next-version'],
      ['release', 'validate-state'],
      ['release', 'validate-release-paths'],
      ['release', 'set-compose-ref'],
      ['release', '--current-ref', 'v1.0.0', '--bump', 'minor'],
      ['release', '--next-ref', 'v1.1.0', '--bump', 'minor'],
      ['release', '--bump', 'minor', '--sha', 'abc'],
      ['qualquer'],
      ['release', 'inexistente'],
      ['sync', '--desconhecida'],
    ]) {
      const { status, data } = invoke(root, args);
      assert.equal(status, 2, args.join(' '));
      assert.equal(data.schemaVersion, 1);
      assert.equal(data.ok, false);
      assert.ok(data.diagnostics.length);
      if (args[0] === 'doctor' && args[1] === '--help')
        assert.match(data.diagnostics[0].message, /Use agents validate/);
      if (
        args[0] === 'release' &&
        [
          'next-version',
          'validate-state',
          'validate-release-paths',
          'set-compose-ref',
        ].includes(args[1])
      ) {
        const guidance =
          args[1] === 'set-compose-ref'
            ? /Edite agents.ref.*agents sync --dry-run/
            : /agents release --bump.*--dry-run/;
        assert.match(data.diagnostics[0].message, guidance);
      }
      assert.deepEqual(data.changes, []);
      assert.equal(existsSync(join(root, 'agents-compose.yml')), false);
    }
  }));
test('init --base verifica todos os conflitos antes da primeira escrita', () =>
  temporary((root) => {
    writeFileSync(join(root, 'README.md'), 'README próprio\n');
    assert.throws(() => initialize(root, { base: true }), /Arquivo existente/);
    assert.equal(existsSync(join(root, 'templates')), false);
    assert.equal(
      readFileSync(join(root, 'README.md'), 'utf8'),
      'README próprio\n',
    );
  }));
test('init --base rejeita pai ocupado por arquivo antes de escrever', () =>
  temporary((root) => {
    writeFileSync(join(root, 'templates'), 'arquivo próprio\n');
    assert.throws(() => initialize(root, { base: true }), /Diretório ocupado/);
    assert.equal(existsSync(join(root, 'README.md')), false);
  }));
test('validate em raiz sem manifesto permanece somente leitura e reporta o problema', () =>
  temporary((root) => {
    const { status, data } = invoke(root, ['validate']);
    assert.equal(status, 2);
    assert.ok(
      data.diagnostics.some((item) => item.code === 'MANIFEST_MISSING'),
    );
    assert.equal(existsSync(join(root, '.cache')), false);
    assert.equal(existsSync(join(root, '.agents')), false);
  }));
test('integração desconhecida permanece preservada', () =>
  temporary((root) => {
    const skill = join(root, '.agents/skills/agents-update-docs');
    mkdirSync(skill, { recursive: true });
    writeFileSync(join(skill, 'SKILL.md'), 'Minha integração\n');
    assert.equal(inspectIntegration(root), 'conflict');
    assert.throws(() => initialize(root, {}), /Integração desconhecida/);
    assert.equal(
      readFileSync(join(skill, 'SKILL.md'), 'utf8'),
      'Minha integração\n',
    );
    assert.equal(existsSync(join(root, 'agents-compose.yml')), false);
  }));
test('init rejeita aliases para metadados Git e cache antes de gravar', (context) =>
  temporary((root) => {
    for (const [alias, reserved, options] of [
      ['templates', '.git', { base: true }],
      ['.agents', '.git', {}],
      ['.agents', '.git', { base: true }],
      ['.agents', '.cache', { base: true }],
      ['templates', '.cache', { base: true }],
    ]) {
      const reservedRoot = join(root, reserved);
      mkdirSync(reservedRoot, { recursive: true });
      try {
        symlinkSync(
          reservedRoot,
          join(root, alias),
          process.platform === 'win32' ? 'junction' : 'dir',
        );
      } catch (error) {
        if (['EPERM', 'EACCES'].includes(error.code)) {
          context.skip('Host não permite criar links de diretório.');
          return;
        }
        throw error;
      }
      assert.throws(() => initialize(root, options), /caminho reservado/);
      assert.equal(existsSync(join(root, 'README.md')), false);
      assert.equal(existsSync(join(reservedRoot, 'AGENTS.tpl.md')), false);
      assert.equal(existsSync(join(reservedRoot, 'skills')), false);
      rmSync(join(root, alias));
    }
  }));

test('init --base preserva skill personalizada ou com arquivos extras antes de qualquer escrita', () =>
  temporary((root) => {
    const target = '.agents/skills/agents-update-version/SKILL.md';
    for (const customized of [true, false]) {
      write(
        root,
        target,
        customized
          ? 'Minha skill de versão\n'
          : expectedIntegration('agents-update-version').get('SKILL.md'),
      );
      if (!customized)
        write(
          root,
          '.agents/skills/agents-update-version/notas.md',
          'Arquivo próprio\n',
        );
      const before = snapshot(root, { skip: [] });
      for (const dryRun of [true, false]) {
        const { status, data } = invoke(root, [
          'init',
          '--base',
          ...(dryRun ? ['--dry-run'] : []),
        ]);
        assert.equal(status, 2);
        assert.ok(
          data.diagnostics.some((d) => d.code === 'INTEGRATION_CONFLICT'),
        );
        assert.deepEqual(snapshot(root, { skip: [] }), before);
      }
      assert.equal(existsSync(join(root, 'README.md')), false);
      assert.equal(existsSync(join(root, 'templates')), false);
    }
  }));

test('init --base rejeita alias para a skill do consumidor sem escrever em nenhuma delas', (context) =>
  temporary((root) => {
    const skills = join(root, '.agents/skills');
    const consumer = join(skills, 'agents-update-docs');
    mkdirSync(consumer, { recursive: true });
    writeFileSync(join(consumer, 'SKILL.md'), 'Conteúdo protegido\n');
    try {
      symlinkSync(
        consumer,
        join(skills, 'agents-update-version'),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
    } catch (error) {
      if (['EPERM', 'EACCES'].includes(error.code)) {
        context.skip('Host não permite criar links de diretório.');
        return;
      }
      throw error;
    }
    assert.throws(() => initialize(root, { base: true }), /caminho reservado/);
    assert.equal(
      readFileSync(join(consumer, 'SKILL.md'), 'utf8'),
      'Conteúdo protegido\n',
    );
    assert.equal(existsSync(join(root, 'README.md')), false);
    rmSync(join(skills, 'agents-update-version'));
  }));
test('ambos os modos rejeitam alias da curadoria para outra skill antes de escrever', (context) =>
  temporary((root) => {
    const skills = join(root, '.agents/skills');
    const target = join(skills, 'agents-update-docs');
    mkdirSync(target, { recursive: true });
    writeFileSync(join(target, 'SKILL.md'), 'Conteúdo protegido\n');
    try {
      symlinkSync(
        target,
        join(skills, 'agents-write-conventions'),
        process.platform === 'win32' ? 'junction' : 'dir',
      );
    } catch (error) {
      if (['EPERM', 'EACCES'].includes(error.code)) {
        context.skip('Host não permite criar links de diretório.');
        return;
      }
      throw error;
    }
    for (const base of [false, true])
      for (const dryRun of [false, true]) {
        assert.throws(
          () => initialize(root, { base, dryRun }),
          /caminho reservado/,
        );
        assert.equal(
          readFileSync(join(target, 'SKILL.md'), 'utf8'),
          'Conteúdo protegido\n',
        );
        for (const absent of [
          'README.md',
          'templates',
          'agents-compose.yml',
          '.agents/skills/agents-update-version',
        ])
          assert.equal(existsSync(join(root, absent)), false);
      }
    rmSync(join(skills, 'agents-write-conventions'));
  }));

test('manifesto UTF-8 inválido e operação removida são rejeitados sem alterar arquivos ligados', () =>
  temporary((root) => {
    writeFileSync(
      join(root, 'agents-compose.yml'),
      Buffer.from([0xff, 0xfe, 0x00]),
    );
    const invalid = invoke(root, ['validate']);
    assert.equal(invalid.status, 2);
    assert.ok(
      invalid.data.diagnostics.some((item) => item.code === 'MANIFEST_UTF8'),
    );
    const source =
      'agents:\n  repository: exemplo\n  ref: v1.0.0\noutputs:\n  AGENTS.md:\n    include:\n      conventions:\n        out_dir: docs\n        local:\n          tpl_dir: local\n        remote:\n          tpl_dir: remote\n        entries: []\n';
    writeFileSync(join(root, 'agents-compose.yml'), source);
    linkSync(
      join(root, 'agents-compose.yml'),
      join(root, 'arquivo-alheio.yml'),
    );
    const linked = invoke(root, [
      'release',
      'set-compose-ref',
      '--next-ref',
      'v1.0.1',
    ]);
    assert.equal(linked.status, 2);
    assert.equal(
      readFileSync(join(root, 'arquivo-alheio.yml'), 'utf8'),
      source,
    );
    assert.equal(
      readFileSync(join(root, 'agents-compose.yml'), 'utf8'),
      source,
    );
  }));
