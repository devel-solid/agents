import assert from 'node:assert/strict';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  projectRoot,
  copyTree,
  initGit,
  restrictedEnvironment,
  successful,
} from './helpers.mjs';

test(
  'instalação limpa compila e verifica tipos; setup instala hooks sem Python ou Make',
  { timeout: 180000 },
  () => {
    const root = mkdtempSync(path.join(tmpdir(), 'agents desenvolvimento á '));
    try {
      for (const relative of [
        'src',
        'schemas',
        'assets',
        'scripts',
        'templates/AGENTS.tpl.md',
        'templates/docs/conventions',
        '.agents/skills/agents-update-docs',
        '.agents/skills/agents-update-version',
        '.agents/skills/agents-write-conventions',
        'package.json',
        'package-lock.json',
        'tsconfig.json',
        'lefthook.yml',
      ]) {
        const source = path.join(projectRoot, relative),
          destination = path.join(root, relative);
        if (statSync(source).isDirectory()) copyTree(source, destination);
        else {
          mkdirSync(path.dirname(destination), { recursive: true });
          copyFileSync(source, destination);
        }
      }
      const npm =
        process.env.npm_execpath ??
        path.join(
          path.dirname(process.execPath),
          'node_modules/npm/bin/npm-cli.js',
        );
      assert.ok(existsSync(npm));
      successful(
        process.execPath,
        [npm, 'ci', '--offline', '--ignore-scripts', '--no-audit', '--no-fund'],
        { cwd: root },
      );
      const env = {
        ...restrictedEnvironment(root, true),
        ...(process.platform === 'win32'
          ? {}
          : { npm_config_script_shell: '/bin/sh' }),
      };
      successful(process.execPath, [npm, 'run', 'build'], { cwd: root, env });
      successful(process.execPath, [npm, 'run', 'typecheck'], {
        cwd: root,
        env,
      });
      assert.ok(existsSync(path.join(root, 'dist/cli.js')));
      initGit(root);
      successful(process.execPath, ['scripts/setup.mjs'], { cwd: root, env });
      const hook = path.join(root, '.git/hooks/pre-push');
      assert.ok(existsSync(hook));
      assert.match(readFileSync(hook, 'utf8'), /lefthook/);
      assert.equal(existsSync(path.join(root, 'agents-compose.yml')), false);
      assert.equal(existsSync(path.join(root, 'AGENTS.md')), false);
    } finally {
      rmSync(root, { recursive: true, force: true, maxRetries: 5 });
    }
  },
);
