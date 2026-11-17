import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse } from 'yaml';
import { parseManifest } from '../../dist/manifest.js';
import { validateMarkdown } from '../../dist/markdown.js';

const root = new URL('../../', import.meta.url);
const read = (relative) => readFileSync(new URL(relative, root), 'utf8');

test('referência pública contém manifestos e template completos aceitos pelo motor', () => {
  const guide = read('docs/guides/contratos-de-composicao.md');
  const manifests = [...guide.matchAll(/```yaml\r?\n([\s\S]*?)```/g)].map(
    (match) => parseManifest(match[1]).data,
  );
  assert.deepEqual(
    manifests.map((item) => item.schemaVersion),
    [1, 1],
  );
  assert.equal(manifests[0].agents, undefined);
  assert.equal(manifests[1].agents.ref, 'v1.0.0');
  assert.equal(
    manifests[1].outputs['AGENTS.md'].include.conventions.entries[0].origin,
    'remote',
  );
  const template = guide.match(/```markdown\r?\n([\s\S]*?)```/)[1];
  const result = validateMarkdown(template, 'commits.tpl.md');
  assert.match(result.body, /Use Conventional Commits/);
  assert.doesNotMatch(result.body, /AGENT-CARD/);
});

test('help oferece somente as quatro raízes e todas as opções públicas', () => {
  const cli = fileURLToPath(new URL('dist/cli.js', root));
  const result = spawnSync(process.execPath, [cli, '--help'], {
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
  assert.equal(result.stderr, '');
  const commands = [...result.stdout.matchAll(/^agents ([a-z-]+)/gm)].map(
    (match) => match[1],
  );
  assert.deepEqual([...new Set(commands)].sort(), [
    'init',
    'release',
    'sync',
    'validate',
  ]);
  const flags = [...new Set(result.stdout.match(/--[a-z-]+/g))].sort();
  assert.deepEqual(flags, [
    '--base',
    '--bump',
    '--check',
    '--debug',
    '--dry-run',
    '--frozen',
    '--help',
    '--json',
    '--offline',
    '--repo-root',
    '--starter',
    '--version',
  ]);
});

test('as três skills são distribuídas pelo pacote com nomes e fontes corretos', () => {
  for (const name of [
    'agents-update-docs',
    'agents-update-version',
    'agents-write-conventions',
  ]) {
    const skill = read(`.agents/skills/${name}/SKILL.md`);
    const frontmatter = skill.match(/^---\r?\n([\s\S]*?)\r?\n---/)[1];
    assert.equal(parse(frontmatter).name, name);
    const commands = [...skill.matchAll(/\bagents\s+([a-z][\w-]*)/g)].map(
      (match) => match[1],
    );
    assert.ok(commands.length > 0);
    assert.ok(
      commands.every((command) =>
        ['init', 'validate', 'sync', 'release'].includes(command),
      ),
    );
    assert.doesNotMatch(
      skill,
      /release\s+(next-version|set-compose-ref|validate-state|validate-release-paths)/,
    );
    assert.equal(read(`assets/integration/${name}/SKILL.md`), skill);
  }
  const writing = read('.agents/skills/agents-write-conventions/SKILL.md');
  const template = writing.match(/```markdown\r?\n([\s\S]*?)```/)[1];
  assert.doesNotThrow(() => validateMarkdown(template, 'commits.tpl.md'));
  assert.equal(
    read('assets/integration/agents-update-docs/SKILL.md'),
    read('.agents/skills/agents-update-docs/SKILL.md'),
  );
  for (const relative of [
    '.agents/skills/update-docs',
    '.agents/skills/update-version',
    'assets/integration/update-docs',
  ]) {
    assert.equal(existsSync(new URL(relative, root)), false, relative);
  }
});
