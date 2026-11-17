import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..',
);
export const fixtureRoot = path.join(projectRoot, 'tests/fixtures/node-cli');
export const windows = process.platform === 'win32';

export function write(root, relative, contents) {
  const target = path.join(root, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, contents);
  return target;
}

export function source(
  title,
  body = 'Regra própria da empresa.',
  card = 'Leia esta regra quando aplicável.',
) {
  return `# ${title}\n\n<!-- AGENT-CARD START -->\n${card}\n<!-- AGENT-CARD END -->\n\n${body}\n`;
}

export function command(executable, args, options = {}) {
  const result = spawnSync(executable, args, {
    encoding: 'utf8',
    timeout: 120000,
    ...options,
  });
  assert.ifError(result.error);
  return result;
}

export function successful(executable, args, options = {}) {
  const result = command(executable, args, options);
  assert.equal(
    result.status,
    0,
    `${executable} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`,
  );
  return result.stdout.trim();
}

export function git(root, ...args) {
  return successful('git', ['-C', root, ...args], { env: gitEnvironment() });
}

export function gitEnvironment(extra = {}) {
  return {
    ...process.env,
    GIT_ALLOW_PROTOCOL: 'file',
    GIT_TERMINAL_PROMPT: '0',
    GIT_CONFIG_NOSYSTEM: '1',
    ...extra,
  };
}

export function initGit(root) {
  mkdirSync(root, { recursive: true });
  git(root, 'init', '-b', 'main');
  git(root, 'config', 'user.email', 'fixture@example.invalid');
  git(root, 'config', 'user.name', 'Fixture Node');
  git(root, 'config', 'core.autocrlf', 'false');
}

export function commit(root, message = 'fixture') {
  git(root, 'add', '-A');
  git(root, '-c', 'core.hooksPath=', 'commit', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

export function walk(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .flatMap((entry) => {
      const relative = entry.name;
      return entry.isDirectory()
        ? walk(path.join(root, relative)).map((child) => `${relative}/${child}`)
        : [relative];
    })
    .sort();
}

export function snapshot(
  root,
  { skip = ['.cache', '.git', 'node_modules'] } = {},
) {
  const records = {};
  for (const relative of walk(root)) {
    if (
      skip.some(
        (prefix) => relative === prefix || relative.startsWith(`${prefix}/`),
      )
    )
      continue;
    const absolute = path.join(root, relative);
    records[relative] = {
      sha256: createHash('sha256').update(readFileSync(absolute)).digest('hex'),
      mtime: statSync(absolute).mtimeMs,
    };
  }
  return records;
}

export function copyTree(sourceRoot, destinationRoot) {
  for (const relative of walk(sourceRoot))
    write(
      destinationRoot,
      relative,
      readFileSync(path.join(sourceRoot, relative)),
    );
}

export function manifest(repository, ref, entries, options = {}) {
  return {
    schemaVersion: 1,
    agents: { repository, ref },
    outputs: {
      'AGENTS.md': {
        include: {
          conventions: {
            out_dir: options.outDir ?? 'docs/conventions',
            local: { tpl_dir: 'templates/docs/conventions-local' },
            remote: { tpl_dir: 'templates/docs/conventions' },
            entries,
          },
        },
      },
    },
  };
}

export function npmCli() {
  const candidates = [
    process.env.npm_execpath,
    path.join(
      path.dirname(process.execPath),
      'node_modules/npm/bin/npm-cli.js',
    ),
    path.resolve(
      path.dirname(process.execPath),
      '../lib/node_modules/npm/bin/npm-cli.js',
    ),
    '/usr/share/nodejs/npm/bin/npm-cli.js',
  ];
  const result = candidates.find(
    (candidate) => candidate && existsSync(candidate),
  );
  assert.ok(
    result,
    'npm-cli.js precisa estar disponível no ambiente de desenvolvimento',
  );
  return result;
}

export function restrictedEnvironment(root, withGit) {
  const bin = path.join(root, withGit ? 'bin-node-git' : 'bin-node');
  mkdirSync(bin, { recursive: true });
  const node = path.join(bin, windows ? 'node.exe' : 'node');
  if (!existsSync(node)) {
    if (windows) copyFileSync(process.execPath, node);
    else symlinkSync(process.execPath, node);
  }
  const paths = [bin];
  if (withGit) {
    const candidates = successful(windows ? 'where.exe' : 'which', [
      'git',
    ]).split(/\r?\n/);
    // O executável interno do Git Bash depende do PATH MSYS; use o wrapper autossuficiente.
    const executable =
      (windows
        ? candidates.find(
            (candidate) =>
              path.basename(path.dirname(candidate)).toLowerCase() === 'cmd',
          )
        : undefined) ?? candidates[0];
    if (windows) paths.push(path.dirname(executable));
    else if (!existsSync(path.join(bin, 'git')))
      symlinkSync(executable, path.join(bin, 'git'));
  }
  const env = gitEnvironment({
    PATH: paths.join(path.delimiter),
    Path: paths.join(path.delimiter),
  });
  for (const absent of ['python', 'python3', 'make', 'tsc']) {
    const result = spawnSync(absent, ['--version'], { env, encoding: 'utf8' });
    assert.equal(
      result.error?.code,
      'ENOENT',
      `${absent} deve estar ausente do PATH de runtime`,
    );
  }
  if (!withGit)
    assert.equal(
      spawnSync('git', ['--version'], { env }).error?.code,
      'ENOENT',
    );
  return env;
}

export function installArtifact() {
  const root = mkdtempSync(path.join(tmpdir(), 'agents pacote á '));
  const packDirectory = path.join(root, 'pack');
  const consumer = path.join(root, 'installation');
  mkdirSync(packDirectory);
  mkdirSync(consumer);
  const packed = successful(
    process.execPath,
    [
      npmCli(),
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      packDirectory,
    ],
    { cwd: projectRoot },
  );
  const [metadata] = JSON.parse(packed);
  const tarball = path.join(packDirectory, metadata.filename);
  successful(
    process.execPath,
    [
      npmCli(),
      'install',
      '--prefer-offline',
      '--ignore-scripts',
      '--omit=dev',
      '--no-audit',
      '--no-fund',
      '--package-lock=false',
      tarball,
    ],
    { cwd: consumer },
  );
  const installedRoot = path.join(consumer, 'node_modules/@devel-solid/agents');
  const cli = path.join(installedRoot, 'dist/cli.js');
  assert.ok(existsSync(cli), 'o bin do tarball deve existir fora do checkout');
  const runtimeEnv = restrictedEnvironment(root, true);
  const nodeOnlyEnv = restrictedEnvironment(root, false);
  return {
    root,
    metadata,
    installedRoot,
    cli,
    runtimeEnv,
    nodeOnlyEnv,
    run(repoRoot, args, { status = 0, env = runtimeEnv } = {}) {
      mkdirSync(repoRoot, { recursive: true });
      const result = command(
        process.execPath,
        [cli, ...args, '--repo-root', repoRoot, '--json'],
        { cwd: root, env },
      );
      assert.equal(
        result.status,
        status,
        `${args.join(' ')}\n${result.stdout}\n${result.stderr}`,
      );
      assert.equal(
        result.stderr,
        '',
        'modo JSON não deve vazar stdout/stderr de subprocessos',
      );
      let parsed;
      assert.doesNotThrow(() => {
        parsed = JSON.parse(result.stdout);
      }, result.stdout);
      assert.equal(parsed.schemaVersion, 1);
      assert.equal(typeof parsed.command, 'string');
      assert.equal(typeof parsed.ok, 'boolean');
      assert.ok(Array.isArray(parsed.changes));
      assert.ok(Array.isArray(parsed.diagnostics));
      return parsed;
    },
    cleanup() {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    },
  };
}
