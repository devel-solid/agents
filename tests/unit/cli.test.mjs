import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { helpText, parseArguments, runCli } from '../../dist/cli.js';

function engineResult(command, exitCode = 0, changes = []) {
  return {
    exitCode,
    result: {
      schemaVersion: 1,
      command,
      ok: exitCode === 0,
      changes,
      diagnostics: [],
    },
  };
}

test('dispatch forwards root, normalized language, and read-only init preview', async () => {
  const calls = [];
  const response = await runCli(
    ['--repo-root', 'client', 'init', '--lang=PT-BR', '--dry-run', '--json'],
    {
      cwd: resolve('workspace'),
      execute: async (...args) => {
        calls.push(args);
        return engineResult('init', 0, [
          {
            action: 'update',
            path: '.agentscli/config.yml',
            status: 'pending',
          },
        ]);
      },
    },
  );
  assert.deepEqual(calls, [
    [
      'init',
      {
        repoRoot: resolve('workspace/client'),
        language: 'pt-br',
        dryRun: true,
      },
    ],
  ]);
  assert.equal(response.exitCode, 0);
  assert.equal(response.stderr, '');
  const document = JSON.parse(response.stdout);
  assert.equal(document.changes[0].status, 'pending');
  assert.deepEqual(Object.keys(document), [
    'schemaVersion',
    'command',
    'ok',
    'changes',
    'diagnostics',
  ]);
});

test('removed, misplaced, duplicate, and incompatible options never dispatch', async () => {
  const invalid = [
    [],
    ['release'],
    ['init', '--base'],
    ['init', '--starter', 'minimal'],
    ['validate', '--offline'],
    ['sync', '--frozen'],
    ['sync', '--debug'],
    ['sync', '--lang', 'en'],
    ['validate', '--dry-run'],
    ['init', '--check'],
    ['init', '--migrate', '--check'],
    ['sync', '--migrate'],
    ['validate', '--migrate'],
    ['init', '--migrate', '--migrate'],
    ['init', '--templates-dir', 'custom'],
    ['init', '--conventions-dir', 'custom'],
    ['sync', '--dry-run', '--check'],
    ['init', '--lang'],
    ['init', '--repo-root='],
    ['init', '--lang='],
    ['init', '--lang', 'en', '--lang', 'pt-br'],
    ['sync', '--json', '--json'],
    ['sync', '--dry-run=true'],
    ['init', 'extra'],
    ['sync', '--version'],
    ['--help', '--check'],
    ['--version', '--help'],
    ['--version', '--json'],
  ];
  for (const args of invalid) {
    let dispatched = false;
    const response = await runCli(args, {
      execute: async () => {
        dispatched = true;
        throw new Error('Unexpected dispatch');
      },
    });
    assert.equal(response.exitCode, 2, args.join(' '));
    assert.equal(dispatched, false, args.join(' '));
    assert.match(response.stderr || response.stdout, /USAGE/);
  }
});

test('help and standalone version use no runtime or project writes', async () => {
  const dependencies = {
    version: '0.1.0',
    execute: async () => {
      throw new Error('Help must not dispatch');
    },
  };
  assert.deepEqual(await runCli(['--version'], dependencies), {
    exitCode: 0,
    stdout: '0.1.0\n',
    stderr: '',
  });
  for (const args of [['--help'], ['sync', '--help']]) {
    const response = await runCli(args, dependencies);
    assert.equal(response.exitCode, 0);
    assert.match(response.stdout, /agentscli 0\.1\.0/);
    assert.match(response.stdout, /agentscli (init|validate|sync)/);
    assert.match(response.stdout, /three managed\nskill directories/);
    assert.match(response.stdout, /repeat sync/);
    assert.equal(response.stderr, '');
  }
  const help = await runCli(['--help', '--json'], dependencies);
  assert.equal(JSON.parse(help.stdout).command, 'help');
  assert.match(JSON.parse(help.stdout).text, /\.agentscli\/config\.yml/);
  assert.match(JSON.parse(help.stdout).text, /init --migrate/);
  assert.match(JSON.parse(help.stdout).text, /existing language and content/);
  assert.doesNotMatch(
    helpText('0.1.0'),
    /agentscli release|--base|--frozen|--offline/,
  );
});

test('migration remains init and forwards language, preview, and common options', async () => {
  const root = resolve('migration-client');
  for (const args of [
    ['init', '--migrate', '--lang', 'PT-BR', '--dry-run', '--json'],
    ['--migrate', '--dry-run', '--lang=PT-BR', '--json', 'init'],
  ]) {
    const calls = [];
    const response = await runCli(args, {
      cwd: root,
      execute: async (...values) => {
        calls.push(values);
        return engineResult('init', 0, [
          {
            action: 'delete',
            path: 'agentscli-compose.yml',
            status: 'pending',
          },
        ]);
      },
    });
    assert.deepEqual(calls, [
      [
        'init',
        { repoRoot: root, language: 'pt-br', dryRun: true, migrate: true },
      ],
    ]);
    assert.equal(response.exitCode, 0);
    assert.equal(response.stderr, '');
    assert.equal(JSON.parse(response.stdout).command, 'init');
    assert.equal(JSON.parse(response.stdout).changes[0].status, 'pending');
  }
  assert.deepEqual(parseArguments(['init', '--migrate'], root).options, {
    repoRoot: root,
    migrate: true,
  });
});

test('JSON preserves drift, validation, and operational exit codes in one document', async () => {
  for (const exitCode of [0, 1, 2, 3]) {
    const expected = engineResult('sync', exitCode, [
      {
        action: 'update',
        path: '.agents/skills/agentscli-build-agents/SKILL.md',
        status: 'pending',
      },
    ]);
    if (exitCode > 1)
      expected.result.diagnostics.push({
        code: 'FAILURE',
        message: 'Blocked.',
      });
    const response = await runCli(['sync', '--check', '--json'], {
      execute: async () => expected,
    });
    assert.equal(response.exitCode, exitCode);
    assert.equal(response.stderr, '');
    assert.deepEqual(JSON.parse(response.stdout), expected.result);
    assert.equal(response.stdout.trimEnd().split('\n').length, 1);
  }
});

test('partial failures retain completed and pending effects without claiming success', async () => {
  const failed = engineResult('sync', 3, [
    { action: 'update', path: 'AGENTS.md', status: 'completed' },
    {
      action: 'update',
      path: '.agents/skills/agentscli-build-agents/SKILL.md',
      status: 'pending',
    },
  ]);
  failed.result.diagnostics.push({
    code: 'OPERATION_FAILED',
    message: 'Repeat sync to finish.',
  });
  const response = await runCli(['sync'], { execute: async () => failed });
  assert.equal(response.exitCode, 3);
  assert.match(response.stdout, /completed update: AGENTS\.md/);
  assert.match(response.stdout, /pending update: \.agents\/skills/);
  assert.match(response.stderr, /Repeat sync/);
  assert.doesNotMatch(response.stdout, /Everything is up to date/);
});

test('unexpected boundary exceptions become operational results and usage remains JSON', async () => {
  const response = await runCli(['validate', '--json'], {
    execute: async () => {
      throw new Error('Read failed.');
    },
  });
  assert.equal(response.exitCode, 3);
  assert.equal(response.stderr, '');
  assert.deepEqual(JSON.parse(response.stdout).diagnostics, [
    { code: 'OPERATION_FAILED', message: 'Read failed.' },
  ]);
  const usage = await runCli(['sync', '--offline', '--json']);
  assert.equal(usage.exitCode, 2);
  assert.equal(JSON.parse(usage.stdout).diagnostics[0].code, 'USAGE');
  assert.equal(usage.stderr, '');
});

test('validate uses the current root and accepts only common flags', () => {
  const root = resolve('client');
  assert.deepEqual(parseArguments(['validate', '--json'], root), {
    action: 'execute',
    command: 'validate',
    json: true,
    options: { repoRoot: root },
  });
});
