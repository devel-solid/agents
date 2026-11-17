import assert from 'node:assert/strict';
import test from 'node:test';
import { dirname, resolve, sep } from 'node:path';
import {
  collectResources,
  packageAssets,
  skillDirectories,
} from '../../scripts/package-assets.mjs';

function resourceIO(overrides = {}) {
  const root = resolve('unit-resources');
  const files = new Map();
  function add(path, content) {
    files.set(resolve(root, path), Buffer.from(content));
  }
  add(
    'agentscli.yml',
    'skills:\n  - .agents/skills/agentscli-write-conventions\n  - .agents/skills/agentscli-update-agents\n  - assets/templates/skills/agentscli-build-agents\n',
  );
  for (const [path, name] of [
    [
      '.agents/skills/agentscli-write-conventions',
      'agentscli-write-conventions',
    ],
    ['.agents/skills/agentscli-update-agents', 'agentscli-update-agents'],
    [
      'assets/templates/skills/agentscli-build-agents',
      'agentscli-build-agents',
    ],
  ]) {
    add(
      `${path}/SKILL.md`,
      `---\nname: ${name}\ndescription: Write useful project instructions.\n---\nBody\n`,
    );
    add(`${path}/references/example.md`, 'Support content\n');
  }
  for (const language of ['en', 'pt-br']) {
    add(`assets/templates/${language}/AGENTS.tpl.md`, '# Project\n');
    add(
      `assets/templates/${language}/conventions/project.tpl.md`,
      language === 'pt-br'
        ? '# Contexto\n\n<!-- AGENT-CARD START -->\nLeia antes de trabalhar.\n<!-- AGENT-CARD END -->\n\n<!-- Substitua este comentário pelo contexto do projeto. -->\n'
        : '# Context\n\n<!-- AGENT-CARD START -->\nRead before working.\n<!-- AGENT-CARD END -->\n\n<!-- Replace this comment with project context. -->\n',
    );
  }
  const writes = [];
  const io = {
    realpathSync: (path) => path,
    lstatSync(path) {
      const file = files.has(path);
      if (
        !file &&
        ![...files.keys()].some((key) => key.startsWith(`${path}${sep}`))
      )
        throw new Error(`Missing mocked resource: ${path}`);
      return {
        isFile: () => file,
        isDirectory: () => !file,
        isSymbolicLink: () => false,
        nlink: 1,
      };
    },
    readFileSync(path, encoding) {
      const content = files.get(path);
      if (!content) throw new Error(`Missing mocked resource: ${path}`);
      return encoding ? content.toString(encoding) : content;
    },
    readdirSync(path) {
      return [
        ...new Set(
          [...files.keys()]
            .filter((key) => key.startsWith(`${path}${sep}`))
            .map((key) => key.slice(path.length + 1).split(sep)[0]),
        ),
      ];
    },
    mkdirSync: () => {},
    writeFileSync: (path, content) => writes.push({ path, content }),
    ...overrides,
  };
  return { root, io, add, writes };
}

test('distribution manifest accepts mixed roots and rejects unsupported/duplicate/unsafe entries', () => {
  assert.deepEqual(
    skillDirectories('skills: [a/agentscli-one, b/agentscli-two]'),
    [
      { path: 'a/agentscli-one', name: 'agentscli-one' },
      { path: 'b/agentscli-two', name: 'agentscli-two' },
    ],
  );
  for (const source of [
    'skills: []',
    'skills: [a/agentscli-one]\nlanguage: en',
    'skills: [a/agentscli-one, b/agentscli-one]',
    'skills: [../agentscli-one]',
    'skills: [/agentscli-one]',
    'skills: ["C:/agentscli-one"]',
    'skills: [a/CON/agentscli-one]',
    'skills: [a/other]',
    'skills: [a/agentscli-one,',
    'skills: [null]',
  ])
    assert.throws(() => skillDirectories(source), undefined, source);
});

test('whole skill trees and both document locales map without duplicated sources', () => {
  const { root, io } = resourceIO();
  const resources = collectResources(root, io);
  assert.equal(resources.length, 10);
  assert.equal(
    resources
      .find(
        (item) =>
          item.destination ===
          'skills/agentscli-write-conventions/references/example.md',
      )
      .content.toString(),
    'Support content\n',
  );
  assert.ok(
    resources.some(
      (item) => item.destination === 'templates/pt-br/AGENTS.tpl.md',
    ),
  );
  assert.ok(resources.every((item) => !item.destination.includes('release')));
  assert.deepEqual(
    [
      ...new Set(
        resources
          .filter((item) => item.destination.startsWith('skills/'))
          .map((item) => item.destination.split('/')[1]),
      ),
    ].sort(),
    [
      'agentscli-build-agents',
      'agentscli-update-agents',
      'agentscli-write-conventions',
    ],
  );
  for (const [language, title, hint] of [
    ['en', '# Context', 'Replace this comment'],
    ['pt-br', '# Contexto', 'Substitua este comentário'],
  ]) {
    const resource = resources.find(
      (item) =>
        item.destination === `templates/${language}/conventions/project.tpl.md`,
    );
    assert.ok(resource);
    assert.ok(resource.content.toString().startsWith(title));
    assert.ok(resource.content.toString().includes(hint));
    assert.equal(
      resource.content.toString(),
      io.readFileSync(
        resolve(
          root,
          `assets/templates/${language}/conventions/project.tpl.md`,
        ),
        'utf8',
      ),
    );
    assert.ok(
      !resources.some(
        (item) => item.destination === `templates/${language}/project.tpl.md`,
      ),
    );
  }
});

test('entrypoint metadata must match the directory and include a description', () => {
  const { root, io, add } = resourceIO();
  for (const content of [
    '# Skill',
    '---\nname: wrong\ndescription: useful\n---\n',
    '---\nname: agentscli-write-conventions\ndescription: ""\n---\n',
  ]) {
    add('.agents/skills/agentscli-write-conventions/SKILL.md', content);
    assert.throws(() => collectResources(root, io), /name and description/);
  }
});

test('packaging rejects linked sources and writes nothing before all resources pass', () => {
  const { root, io, add, writes } = resourceIO();
  const original = io.lstatSync;
  for (const field of ['isSymbolicLink', 'nlink']) {
    io.lstatSync = (path) => ({
      ...original(path),
      ...(path.endsWith('example.md')
        ? field === 'nlink'
          ? { nlink: 2 }
          : { isSymbolicLink: () => true }
        : {}),
    });
    assert.throws(() => packageAssets(root, io), /Aliased/);
    assert.deepEqual(writes, []);
  }
  io.lstatSync = original;
  add('assets/templates/pt-br/agents.tpl.md', '# Collision\n');
  assert.throws(() => packageAssets(root, io), /Duplicate resource/);
  assert.deepEqual(writes, []);
});

test('packaging preserves all bytes and targets only dist/assets', () => {
  const { root, io, writes } = resourceIO();
  assert.equal(packageAssets(root, io), 10);
  assert.equal(writes.length, 10);
  assert.ok(
    writes.every(({ path }) =>
      path.startsWith(resolve(root, 'dist/assets') + sep),
    ),
  );
  assert.equal(
    writes
      .find(({ path }) => dirname(path).endsWith('references'))
      .content.toString(),
    'Support content\n',
  );
});

test('support filenames must be portable on every supported platform', () => {
  const { root, io, add, writes } = resourceIO();
  add(
    '.agents/skills/agentscli-write-conventions/references/nul.md',
    'Invalid portable filename',
  );
  assert.throws(() => packageAssets(root, io), /Unsafe resource path/);
  assert.deepEqual(writes, []);
});
