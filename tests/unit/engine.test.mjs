import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import {
  defaultManifest,
  language,
  parseManifest,
  serializeManifest,
} from '../../dist/manifest.js';
import { relativePath, uniquePaths } from '../../dist/paths.js';
import {
  decode,
  GENERATED,
  INSERTION,
  validateConvention,
  validateTemplate,
} from '../../dist/markdown.js';
import { render } from '../../dist/render.js';
import { checkRoot, inspect, replaceFile } from '../../dist/io.js';
import { isGenerated, plan } from '../../dist/plan.js';
import { execute } from '../../dist/runtime.js';

const bytes = (text) => new TextEncoder().encode(text);
const main =
  '# My project\n\nBefore.\n\n' + INSERTION + '\n\n## Custom section\nAfter.\n';
const convention = (title) =>
  `# ${title}\n\n<!-- AGENT-CARD START -->\nRead before editing ${title}.\n<!-- AGENT-CARD END -->\n\nKeep useful rules.\n`;
const MANAGED_SKILLS = [
  'agentscli-build-agents',
  'agentscli-update-agents',
  'agentscli-write-conventions',
];
const resources = {
  templates: {
    en: {
      'AGENTS.tpl.md': bytes(main),
      'project.tpl.md': bytes(convention('Project')),
    },
    'pt-br': {
      'AGENTS.tpl.md': bytes(main.replace('My project', 'Meu projeto')),
      'project.tpl.md': bytes(convention('Projeto')),
    },
  },
  skills: Object.fromEntries(
    MANAGED_SKILLS.map((name) => [
      name,
      {
        'SKILL.md': bytes(`# ${name}\n`),
        'references/rule.md': bytes('Supporting rule.\n'),
      },
    ]),
  ),
};

/** A mocked filesystem boundary: no temporary directories, commands, or real IO. */
function memory(files = {}) {
  const root = resolve('unit-project');
  const nodes = new Map();
  const writes = [];
  function directory(path) {
    const parent = dirname(path);
    if (parent !== path) directory(parent);
    if (!nodes.has(path)) nodes.set(path, { kind: 'directory', nlink: 1 });
  }
  directory(root);
  function put(path, content, overrides = {}) {
    const absolute = join(root, path);
    directory(dirname(absolute));
    nodes.set(absolute, {
      kind: 'file',
      nlink: 1,
      data: typeof content === 'string' ? bytes(content) : content,
      ...overrides,
    });
  }
  for (const [path, content] of Object.entries(files)) put(path, content);
  const io = {
    info: (path) => {
      const node = nodes.get(path);
      return node && { kind: node.kind, nlink: node.nlink };
    },
    names: (path) =>
      [...nodes.keys()]
        .filter((key) => key !== path && dirname(key) === path)
        .map((key) => key.slice(path.length + 1)),
    read: (path) => {
      const node = nodes.get(path);
      assert.equal(node?.kind, 'file', path);
      return node.data.slice();
    },
    mkdir: (path) => {
      assert.equal(nodes.get(dirname(path))?.kind, 'directory');
      assert.equal(nodes.has(path), false);
      writes.push(['mkdir', path]);
      nodes.set(path, { kind: 'directory', nlink: 1 });
    },
    writeExclusive: (path, content) => {
      assert.equal(nodes.has(path), false);
      writes.push(['write', path]);
      nodes.set(path, { kind: 'file', nlink: 1, data: content.slice() });
    },
    rename: (from, to) => {
      writes.push(['rename', to]);
      nodes.set(to, nodes.get(from));
      nodes.delete(from);
    },
    unlink: (path) => {
      writes.push(['unlink', path]);
      nodes.delete(path);
    },
    rmdir: (path) => {
      assert.equal(io.names(path).length, 0);
      writes.push(['rmdir', path]);
      nodes.delete(path);
    },
  };
  const text = (path) =>
    Buffer.from(io.read(join(root, path))).toString('utf8');
  return { root, io, nodes, writes, put, text };
}
function client(files = {}) {
  return memory({
    'agentscli-compose.yml': serializeManifest(defaultManifest()),
    'templates/AGENTS.tpl.md': main,
    ...files,
  });
}
const invoke = (fs, command, options = {}) =>
  execute(command, { repoRoot: fs.root, ...options }, { io: fs.io, resources });

test('manifest accepts only the reduced explicit contract and normalized language selection', () => {
  assert.deepEqual(
    parseManifest(
      'language: pt-br\ntemplates_dir: rules/templates\nconventions_dir: rules/final\n',
    ),
    {
      language: 'pt-br',
      templates_dir: 'rules/templates',
      conventions_dir: 'rules/final',
    },
  );
  assert.equal(language('PT-BR'), 'pt-br');
  assert.equal(defaultManifest().language, 'en');
  for (const text of [
    '[]',
    'language: [',
    'language: en\nlanguage: en',
    'language: EN\ntemplates_dir: templates\nconventions_dir: docs/conventions',
    'language: es\ntemplates_dir: templates\nconventions_dir: docs/conventions',
    'language: en\ntemplates_dir: templates',
    'language: en\ntemplates_dir: templates\nconventions_dir: docs/conventions\nentries: []',
    'language: en\ntemplates_dir: rules\nconventions_dir: rules/final',
    'language: en\ntemplates_dir: rules\nconventions_dir: RULES',
    'language: en\ntemplates_dir: .agents/x\nconventions_dir: docs/conventions',
    'language: en\ntemplates_dir: AGENTS.md/x\nconventions_dir: docs/conventions',
    'language: en\ntemplates_dir: ../templates\nconventions_dir: docs/conventions',
  ])
    assert.throws(() => parseManifest(text), undefined, text);
});

test('portable paths reject escapes, Windows aliases, file/directory overlaps, and Unicode collisions', () => {
  assert.equal(relativePath('nested\\file.tpl.md'), 'nested/file.tpl.md');
  for (const value of [
    '',
    '.',
    '../x',
    'a/../x',
    'a//x',
    '/tmp/x',
    'C:\\x',
    'a:N',
    'con',
    'rules./x',
    ' rules',
    'a/aux.md',
  ])
    assert.throws(() => relativePath(value));
  assert.throws(() => uniquePaths(['One.md', 'one.md']), {
    code: 'PATH_COLLISION',
  });
  assert.throws(() => uniquePaths(['café.md', 'cafe\u0301.md']), {
    code: 'PATH_COLLISION',
  });
  assert.throws(() => uniquePaths(['one.md', 'one.md/two.md']), {
    code: 'PATH_COLLISION',
  });
});

test('Markdown validation keeps examples literal and permits arbitrary main sections', () => {
  const examples =
    '\n```md\n# Example\n' +
    INSERTION +
    '\n<!-- AGENT-CARD START -->\nFake\n<!-- AGENT-CARD END -->\n```\n';
  assert.equal(
    validateTemplate(main + examples, 'main.tpl.md').text,
    main + examples,
  );
  const parsed = validateConvention(
    convention('**Rules** and [links](x)') + examples,
    'rules.tpl.md',
  );
  assert.equal(parsed.title, 'Rules and links');
  assert.match(parsed.body, /# Example/u);
  assert.match(parsed.body, /Fake/u);
  assert.doesNotMatch(parsed.body, /Read before editing/u);
  assert.throws(
    () =>
      validateTemplate(
        '# Title\n\n```md\n' + INSERTION + '\n```',
        'main.tpl.md',
      ),
    { code: 'TEMPLATE_MARKER' },
  );
  assert.throws(
    () => validateTemplate(main + '\n' + INSERTION, 'main.tpl.md'),
    { code: 'TEMPLATE_MARKER' },
  );
  assert.throws(
    () =>
      validateTemplate(
        '# Title\n\n<!-- Outer\n' + INSERTION + '\n-->',
        'main.tpl.md',
      ),
    { code: 'TEMPLATE_MARKER' },
  );
  assert.throws(
    () =>
      validateConvention(
        '# Rules\n<!-- AGENT-CARD START -->\n<!-- AGENT-CARD END -->',
        'rules.tpl.md',
      ),
    { code: 'SOURCE_CARD' },
  );
  assert.throws(() => validateConvention('# One\n# Two\n', 'rules.tpl.md'), {
    code: 'SOURCE_H1',
  });
  assert.throws(
    () =>
      validateConvention(
        '# Rules\n<!-- AGENT-CARD END -->\nText\n<!-- AGENT-CARD START -->',
        'rules.tpl.md',
      ),
    { code: 'SOURCE_CARD' },
  );
  assert.throws(() => decode(Uint8Array.from([0xc3, 0x28]), 'bad.tpl.md'), {
    code: 'SOURCE_UTF8',
  });
});

test('rendering preserves full authored body and produces localized LF notices, index, and escaped paths', () => {
  const output = render(
    { source: 'templates/AGENTS.tpl.md', text: main.replaceAll('\n', '\r\n') },
    [
      {
        source: 'templates/nested/a b(.tpl.md',
        output: 'docs/conventions/nested/a b(.md',
        text: convention('Rules'),
      },
    ],
    'pt-br',
  );
  assert.match(
    output.get('AGENTS.md'),
    /^<!-- agentscli:generated -->\n<!-- Arquivo gerado/u,
  );
  assert.match(
    output.get('AGENTS.md'),
    /Before\.[\s\S]*\[Rules\]\(docs\/conventions\/nested\/a%20b%28.md\)[\s\S]*After\./u,
  );
  assert.match(
    output.get('docs/conventions/nested/a b(.md'),
    /Keep useful rules/u,
  );
  assert.doesNotMatch(
    output.get('docs/conventions/nested/a b(.md'),
    /AGENT-CARD/u,
  );
  assert.doesNotMatch(output.get('AGENTS.md'), /\r/u);
  assert.equal(isGenerated(bytes('Manual\n' + GENERATED)), false);
  assert.equal(isGenerated(bytes('\ufeff' + GENERATED + '\n')), false);
  assert.equal(isGenerated(bytes(GENERATED + '\r\n')), true);
});

test('discovery automatically maps independent nested and dotted names and supports no conventions', () => {
  const fs = client({
    'templates/testing/unit.tpl.md': convention('Unit'),
    'templates/policy.details.tpl.md': convention('Policy'),
    'templates/readme.md': 'ignored',
  });
  const effects = plan(fs.io, fs.root, 'sync', resources);
  assert.ok(
    effects.find((item) => item.path === 'docs/conventions/testing/unit.md'),
  );
  assert.ok(
    effects.find((item) => item.path === 'docs/conventions/policy.details.md'),
  );
  assert.ok(!effects.find((item) => item.path.endsWith('AGENTS.md.md')));
  assert.equal(
    plan(client().io, fs.root, 'sync', resources).filter((item) =>
      item.path.startsWith('docs/conventions'),
    ).length,
    0,
  );
  fs.put('templates/POLICY.details.tpl.md', convention('Conflict'));
  assert.throws(() => plan(fs.io, fs.root, 'sync', resources));
  assert.equal(fs.writes.length, 0);
});

test('init plans missing setup and replaces even invalid manifests without writes in preview', async () => {
  const fs = memory({
    'agentscli-compose.yml': 'not: [valid',
    'old-output/keep.md': 'Manual old file',
  });
  const preview = await invoke(fs, 'init', { language: 'PT-BR', dryRun: true });
  assert.equal(preview.exitCode, 0);
  assert.equal(preview.result.diagnostics[0].code, 'INIT_PRESERVED');
  assert.equal(fs.writes.length, 0);
  assert.equal(
    preview.result.changes.find(
      (change) => change.path === 'agentscli-compose.yml',
    ).action,
    'update',
  );
  assert.ok(
    preview.result.changes.some(
      (change) => change.path === 'templates/project.tpl.md',
    ),
  );
  const applied = await invoke(fs, 'init', { language: 'PT-BR' });
  assert.equal(applied.exitCode, 0);
  assert.match(fs.text('agentscli-compose.yml'), /language: pt-br/u);
  assert.match(fs.text('AGENTS.md'), /Meu projeto/u);
  assert.equal(fs.text('old-output/keep.md'), 'Manual old file');
  assert.ok(
    applied.result.changes.every((change) => change.status === 'completed'),
  );
});

test('first init seeds context in an existing unrelated template directory and tolerates invalid old manifest bytes', async () => {
  const fs = memory({
    'templates/unrelated.txt': 'Keep',
    'agentscli-compose.yml': Uint8Array.from([0xc3, 0x28]),
  });
  assert.equal((await invoke(fs, 'init')).exitCode, 0);
  assert.ok(fs.nodes.has(join(fs.root, 'templates/project.tpl.md')));
  assert.equal(fs.text('templates/unrelated.txt'), 'Keep');
  assert.match(fs.text('agentscli-compose.yml'), /language: en/u);
});

test('repeated init preserves valid sources, regular skill edits, generated bodies and removed convention sources', async () => {
  const fs = client({
    'AGENTS.md': GENERATED + '\nEdited output\n',
    '.agents/skills/agentscli-update-agents/SKILL.md': 'Customized skill',
    'old-root/keep.md': GENERATED + '\nOld',
  });
  fs.put(
    'agentscli-compose.yml',
    'language: pt-br\ntemplates_dir: other/templates\nconventions_dir: old-root\n',
  );
  const result = await invoke(fs, 'init');
  assert.equal(result.exitCode, 0);
  assert.equal(fs.text('templates/AGENTS.tpl.md'), main);
  assert.equal(fs.text('AGENTS.md'), GENERATED + '\nEdited output\n');
  assert.equal(
    fs.text('.agents/skills/agentscli-update-agents/SKILL.md'),
    'Customized skill',
  );
  assert.equal(fs.nodes.has(join(fs.root, 'templates/project.tpl.md')), false);
  assert.match(
    fs.text('agentscli-compose.yml'),
    /language: en\ntemplates_dir: templates\nconventions_dir: docs\/conventions/u,
  );
  assert.equal(fs.text('old-root/keep.md'), GENERATED + '\nOld');
});

test('manual destination conflicts and malformed sources prevent every setup write', async () => {
  for (const files of [
    { 'AGENTS.md': '# Manual' },
    { 'templates/AGENTS.tpl.md': '# Missing marker' },
  ]) {
    const fs = memory(files);
    const result = await invoke(fs, 'init');
    assert.equal(result.exitCode, 2);
    assert.equal(fs.writes.length, 0);
    assert.deepEqual(result.result.changes, []);
  }
});

test('sync replaces whole generated bodies and cleans only stale current-root marked Markdown', async () => {
  const fs = client({
    'templates/rule.tpl.md': convention('Rule'),
    'AGENTS.md': GENERATED + '\nDirect edit',
    'docs/conventions/stale.md': GENERATED + '\nOld',
    'docs/conventions/manual.md': '# Manual\n' + GENERATED,
    'docs/conventions/not-markdown.txt': GENERATED,
    'previous/stale.md': GENERATED + '\nOld',
  });
  const result = await invoke(fs, 'sync');
  assert.equal(result.exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /My project/u);
  assert.equal(fs.nodes.has(join(fs.root, 'docs/conventions/stale.md')), false);
  assert.match(fs.text('docs/conventions/manual.md'), /Manual/u);
  assert.equal(fs.text('docs/conventions/not-markdown.txt'), GENERATED);
  assert.match(fs.text('previous/stale.md'), /Old/u);
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 0);
});

test('managed skills restore supporting files, discard extras and preserve neighboring skills', async () => {
  const fs = client({ '.agents/skills/custom/SKILL.md': 'Other skill' });
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  fs.put(
    '.agents/skills/agentscli-build-agents/references/rule.md',
    'Edited support',
  );
  fs.put('.agents/skills/agentscli-build-agents/extra/note.txt', 'Extra');
  const before = fs.writes.length;
  const check = await invoke(fs, 'sync', { check: true });
  const preview = await invoke(fs, 'sync', { dryRun: true });
  assert.equal(check.exitCode, 1);
  assert.equal(preview.exitCode, 0);
  assert.deepEqual(check.result.changes, preview.result.changes);
  assert.equal(fs.writes.length, before);
  assert.ok(
    check.result.changes.every((change) =>
      change.path.startsWith('.agents/skills/agentscli-build-agents/'),
    ),
  );
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.equal(
    fs.text('.agents/skills/agentscli-build-agents/references/rule.md'),
    'Supporting rule.\n',
  );
  assert.equal(
    fs.nodes.has(join(fs.root, '.agents/skills/agentscli-build-agents/extra')),
    false,
  );
  assert.equal(fs.text('.agents/skills/custom/SKILL.md'), 'Other skill');
});

test('validate supports missing skills and rejects internal or invalid configuration without writes', async () => {
  const fs = client();
  assert.equal((await invoke(fs, 'validate')).exitCode, 0);
  assert.equal(fs.writes.length, 0);
  fs.put('agentscli.yml', 'skills: []');
  for (const command of ['init', 'validate', 'sync']) {
    const result = await invoke(fs, command);
    assert.equal(result.exitCode, 2);
    assert.equal(result.result.diagnostics[0].code, 'INTERNAL_CONTEXT');
  }
  assert.equal(fs.writes.length, 0);
  const broken = client({
    'agentscli-compose.yml': 'schemaVersion: 1\nentries: []',
  });
  assert.equal((await invoke(broken, 'sync')).exitCode, 2);
});

test('client operations also reject subdirectories of the source repository', async () => {
  const fs = client();
  fs.nodes.set(join(dirname(fs.root), 'agentscli.yml'), {
    kind: 'file',
    nlink: 1,
    data: bytes('skills: []'),
  });
  const result = await invoke(fs, 'init');
  assert.equal(result.exitCode, 2);
  assert.equal(result.result.diagnostics[0].code, 'INTERNAL_CONTEXT');
  assert.equal(fs.writes.length, 0);
});

test('safe destinations reject symlinks, hardlinks, directory aliases and root ancestor links', async () => {
  for (const [path, content, info] of [
    ['AGENTS.md', GENERATED, { kind: 'link' }],
    ['AGENTS.md', GENERATED, { nlink: 2 }],
    [
      '.agents/skills/agentscli-build-agents/SKILL.md',
      'Skill',
      { kind: 'link' },
    ],
    ['docs/conventions', '', { kind: 'link' }],
  ]) {
    const fs = client();
    fs.put(path, content, info);
    assert.equal((await invoke(fs, 'sync')).exitCode, 2, path);
    assert.equal(fs.writes.length, 0);
  }
  const aliases = client({ 'agents.md': GENERATED });
  assert.throws(() => inspect(aliases.io, aliases.root, 'AGENTS.md', 'file'), {
    code: 'PATH_ALIAS',
  });
  const parent = memory();
  parent.nodes.get(dirname(parent.root)).kind = 'link';
  assert.throws(() => checkRoot(parent.io, parent.root), { code: 'ROOT' });
});

test('individual replacement preserves old bytes and cleans the temporary file on rename failure', () => {
  const fs = memory({ 'file.md': 'Old' });
  fs.io.rename = () => {
    throw new Error('Rename denied');
  };
  assert.throws(
    () => replaceFile(fs.io, fs.root, 'file.md', bytes('New'), bytes('Old')),
    /Rename denied/u,
  );
  assert.equal(fs.text('file.md'), 'Old');
  assert.ok(![...fs.nodes.keys()].some((path) => path.endsWith('.tmp')));
  fs.put('file.md', 'Changed after preflight');
  assert.throws(
    () => replaceFile(fs.io, fs.root, 'file.md', bytes('New'), bytes('Old')),
    { code: 'DESTINATION_CHANGED' },
  );
});

test('partial failures expose completed/pending effects and retry converges without persistent state', async () => {
  const fs = client({ 'templates/rule.tpl.md': convention('Rule') });
  const rename = fs.io.rename;
  let replacements = 0;
  fs.io.rename = (from, to) => {
    if (++replacements === 4) throw new Error('Injected disk failure');
    rename(from, to);
  };
  const failure = await invoke(fs, 'sync');
  assert.equal(failure.exitCode, 3);
  assert.equal(failure.result.ok, false);
  assert.equal(
    failure.result.changes.filter((change) => change.status === 'completed')
      .length,
    3,
  );
  assert.ok(
    failure.result.changes.some((change) => change.status === 'pending'),
  );
  assert.equal(failure.result.diagnostics.at(-1).code, 'RETRY_SYNC');
  assert.ok(![...fs.nodes.keys()].some((path) => path.endsWith('.tmp')));
  fs.io.rename = rename;
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.equal((await invoke(fs, 'sync', { check: true })).exitCode, 0);
  assert.ok(
    ![...fs.nodes.keys()].some((path) =>
      /journal|rollback|ownership|cache/u.test(path),
    ),
  );
});

test('custom roots use manifest language for notices and preserve literal authored text and previous roots', async () => {
  const fs = memory({
    'agentscli-compose.yml':
      'language: pt-br\ntemplates_dir: rules/sources\nconventions_dir: rules/final\n',
    'rules/sources/AGENTS.tpl.md': main,
    'rules/sources/nested/rule.tpl.md': convention('English authored title'),
    'docs/conventions/previous.md': GENERATED + '\nPrevious output',
  });
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /Arquivo gerado/u);
  assert.match(fs.text('AGENTS.md'), /My project/u);
  assert.match(fs.text('AGENTS.md'), /rules\/final\/nested\/rule.md/u);
  assert.match(
    fs.text('rules/final/nested/rule.md'),
    /English authored title/u,
  );
  assert.match(fs.text('docs/conventions/previous.md'), /Previous output/u);
});

test('replacement never removes an unowned exclusive-write collision or overwrites a newly manual destination', () => {
  const collision = memory({ 'file.md': 'Old' });
  let occupied;
  collision.io.writeExclusive = (path) => {
    occupied = path;
    collision.nodes.set(path, {
      kind: 'file',
      nlink: 1,
      data: bytes('Foreign temporary file'),
    });
    throw Object.assign(new Error('Occupied'), { code: 'EEXIST' });
  };
  assert.throws(
    () =>
      replaceFile(
        collision.io,
        collision.root,
        'file.md',
        bytes('New'),
        bytes('Old'),
      ),
    /Occupied/u,
  );
  assert.equal(
    Buffer.from(collision.nodes.get(occupied).data).toString(),
    'Foreign temporary file',
  );
  const changed = memory({ 'file.md': GENERATED + '\nOld' });
  const write = changed.io.writeExclusive;
  changed.io.writeExclusive = (path, content) => {
    write(path, content);
    changed.put('file.md', '# Now manual');
  };
  assert.throws(
    () =>
      replaceFile(
        changed.io,
        changed.root,
        'file.md',
        bytes('New'),
        bytes(GENERATED + '\nOld'),
      ),
    { code: 'DESTINATION_CHANGED' },
  );
  assert.equal(changed.text('file.md'), '# Now manual');
  assert.ok(![...changed.nodes.keys()].some((path) => path.endsWith('.tmp')));
});

test('init retry at every file boundary converges to clean setup without resurrecting removed conventions', async () => {
  function inventory(fs) {
    return [...fs.nodes.entries()]
      .filter(([, node]) => node.kind === 'file')
      .map(([path, node]) => [path, Buffer.from(node.data).toString('hex')])
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0));
  }
  for (const original of [{}, { 'agentscli-compose.yml': 'invalid: [' }]) {
    const clean = memory(original);
    const baseline = await invoke(clean, 'init', { language: 'pt-br' });
    assert.equal(baseline.exitCode, 0);
    const plannedPaths = baseline.result.changes.map((change) => change.path);
    assert.ok(
      plannedPaths.indexOf('templates/project.tpl.md') <
        plannedPaths.indexOf('templates/AGENTS.tpl.md'),
    );
    assert.equal(plannedPaths.at(-1), 'agentscli-compose.yml');
    for (let boundary = 1; boundary <= plannedPaths.length; boundary++) {
      const interrupted = memory(original);
      const rename = interrupted.io.rename;
      let count = 0;
      interrupted.io.rename = (from, to) => {
        if (++count === boundary) throw new Error('Interrupted setup');
        rename(from, to);
      };
      assert.equal(
        (await invoke(interrupted, 'init', { language: 'pt-br' })).exitCode,
        3,
        `boundary ${boundary}`,
      );
      interrupted.io.rename = rename;
      assert.equal(
        (await invoke(interrupted, 'init', { language: 'pt-br' })).exitCode,
        0,
        `retry ${boundary}`,
      );
      assert.deepEqual(
        inventory(interrupted),
        inventory(clean),
        `converged inventory at boundary ${boundary}`,
      );
      assert.equal(
        (await invoke(interrupted, 'sync', { check: true })).exitCode,
        0,
      );
      interrupted.nodes.delete(
        join(interrupted.root, 'templates/project.tpl.md'),
      );
      assert.equal(
        (await invoke(interrupted, 'init', { language: 'pt-br' })).exitCode,
        0,
      );
      assert.equal(
        interrupted.nodes.has(
          join(interrupted.root, 'templates/project.tpl.md'),
        ),
        false,
      );
    }
  }
});
