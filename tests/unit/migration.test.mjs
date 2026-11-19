import test from 'node:test';
import assert from 'node:assert/strict';
import { dirname, join, resolve } from 'node:path';
import { execute } from '../../dist/runtime.js';
import { render } from '../../dist/render.js';
import { planMigration } from '../../dist/migration.js';
import { GENERATED } from '../../dist/markdown.js';

const bytes = (text) => new TextEncoder().encode(text);
const main = '# Project\n\n<!-- agentscli:conventions -->\n';
const convention =
  '# Unit\n\n<!-- AGENT-CARD START -->\nRead for rules.\n<!-- AGENT-CARD END -->\n\nKeep this literal.\n';
const skills = Object.fromEntries(
  [
    'agentscli-build-agents',
    'agentscli-update-agents',
    'agentscli-write-conventions',
  ].map((name) => [
    name,
    {
      'SKILL.md': bytes(`# ${name}\n`),
      'references/rule.md': bytes('Rule.\n'),
    },
  ]),
);
const resources = {
  templates: {
    en: {
      'AGENTS.tpl.md': bytes(main),
      'conventions/project-context.tpl.md': bytes(
        convention.replace('# Unit', '# Project context'),
      ),
    },
    'pt-br': {
      'AGENTS.tpl.md': bytes(main),
      'conventions/contexto-do-projeto.tpl.md': bytes(
        convention.replace('# Unit', '# Contexto do projeto'),
      ),
    },
  },
  skills,
};

/** Only an injected in-memory filesystem; no projects, processes or real writes. */
function memory(files = {}) {
  const root = resolve('migration-unit'),
    nodes = new Map(),
    writes = [];
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
      assert.equal(nodes.has(path), false);
      nodes.set(path, { kind: 'directory', nlink: 1 });
      writes.push(['mkdir', path]);
    },
    writeExclusive: (path, content) => {
      assert.equal(nodes.has(path), false);
      nodes.set(path, { kind: 'file', nlink: 1, data: content.slice() });
      writes.push(['write', path]);
    },
    rename: (from, to) => {
      nodes.set(to, nodes.get(from));
      nodes.delete(from);
      writes.push(['rename', to]);
    },
    unlink: (path) => {
      nodes.delete(path);
      writes.push(['unlink', path]);
    },
    rmdir: (path) => {
      assert.equal(io.names(path).length, 0);
      nodes.delete(path);
      writes.push(['rmdir', path]);
    },
  };
  return {
    root,
    nodes,
    writes,
    io,
    put,
    text: (path) => Buffer.from(io.read(join(root, path))).toString('utf8'),
  };
}
function legacy({
  language = 'en',
  templates = 'templates',
  outputs = 'docs/conventions',
  sources = { 'testing/unit.tpl.md': convention },
  extras = {},
} = {}) {
  const documents = render(
    { source: `${templates}/AGENTS.tpl.md`, text: main },
    Object.entries(sources)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([relative, text]) => ({
        source: `${templates}/${relative}`,
        output: `${outputs}/${relative.slice(0, -7)}.md`,
        text,
      })),
    language,
    { legacyLayout: true },
  );
  return memory({
    'agentscli-compose.yml': `language: ${language}\ntemplates_dir: ${templates}\nconventions_dir: ${outputs}\n`,
    [`${templates}/AGENTS.tpl.md`]: main,
    ...Object.fromEntries(
      Object.entries(sources).map(([path, text]) => [
        `${templates}/${path}`,
        text,
      ]),
    ),
    ...Object.fromEntries(documents),
    ...extras,
  });
}
const invoke = (fs, options = {}) =>
  execute(
    'init',
    { repoRoot: fs.root, migrate: true, ...options },
    { io: fs.io, resources },
  );
const exists = (fs, path) => !!fs.io.info(join(fs.root, path));
const assertSuccess = (result) =>
  assert.equal(result.exitCode, 0, JSON.stringify(result.result.diagnostics));

test('affected HTML is rejected before migration writes even with quotes or entities', async () => {
  for (const html of [
    '<a title=">" href="docs/conventions/testing/unit.md">Unit</a>',
    '<a href="docs&#47;conventions&#47;testing&#47;unit.md">Unit</a>',
  ]) {
    const fs = legacy();
    fs.put('templates/AGENTS.tpl.md', main + '\n' + html + '\n');
    const result = await invoke(fs);
    assert.equal(result.exitCode, 2);
    assert.equal(result.result.diagnostics[0].code, 'MIGRATION_LINK');
    assert.equal(fs.writes.length, 0);
    assert.ok(exists(fs, 'agentscli-compose.yml'));
    assert.ok(exists(fs, 'docs/conventions/testing/unit.md'));
  }
});

test('migration retains real URL suffixes when authored paths use numeric entities', async () => {
  const fs = legacy();
  const authored =
    main +
    '\n[Unit](docs&#47;conventions&#47;testing&#47;unit.md?mode=1#part)\n';
  fs.put('templates/AGENTS.tpl.md', authored);
  fs.put(
    'AGENTS.md',
    render(
      { source: 'templates/AGENTS.tpl.md', text: authored },
      [
        {
          source: 'templates/testing/unit.tpl.md',
          output: 'docs/conventions/testing/unit.md',
          text: convention,
        },
      ],
      'en',
    ).get('AGENTS.md'),
  );
  assertSuccess(await invoke(fs));
  for (const path of ['AGENTS.md', '.agentscli/templates/AGENTS.tpl.md'])
    assert.ok(
      fs
        .text(path)
        .includes('[Unit](.agentscli/conventions/testing/unit.md?mode=1#part)'),
    );
});

test('migration previews the same ordered transfers, full skills and bounded cleanup without writes', async () => {
  const policy = convention.replace('# Unit', '# Policy details');
  for (const language of ['en', 'pt-br']) {
    const fs = legacy({
      language,
      templates: 'rules/sources',
      outputs: 'rules/final',
      sources: { 'conventions/policy-details.tpl.md': policy },
      extras: {
        'rules/sources/image.png': 'image',
        'rules/final/manual.md': 'Manual.',
        '.agents/skills/other/SKILL.md': 'Other.',
        '.agents/skills/agentscli-build-agents/extra.md': 'extra',
      },
    });
    const preview = await invoke(fs, { dryRun: true });
    assertSuccess(preview);
    assert.equal(fs.writes.length, 0);
    const paths = preview.result.changes.map((change) => change.path);
    assert.ok(
      paths.includes(
        '.agentscli/templates/conventions/conventions/policy-details.tpl.md',
      ),
    );
    assert.ok(paths.includes('.agents/skills/agentscli-build-agents/extra.md'));
    assert.equal(paths.at(-1), 'agentscli-compose.yml');
    const applied = await invoke(fs);
    assertSuccess(applied);
    assert.deepEqual(
      applied.result.changes.map(({ path, action }) => ({ path, action })),
      preview.result.changes.map(({ path, action }) => ({ path, action })),
    );
    assert.equal(fs.text('.agentscli/config.yml'), `language: ${language}\n`);
    assert.equal(
      fs.text(
        '.agentscli/templates/conventions/conventions/policy-details.tpl.md',
      ),
      policy,
    );
    assert.ok(
      fs
        .text('AGENTS.md')
        .includes('.agentscli/conventions/conventions/policy-details.md'),
    );
    for (const path of [
      'rules/sources/image.png',
      'rules/final/manual.md',
      '.agents/skills/other/SKILL.md',
    ])
      assert.ok(exists(fs, path));
    assert.ok(!exists(fs, 'agentscli-compose.yml'));
    const noop = await invoke(fs, {
      language: language === 'en' ? 'pt-br' : 'en',
    });
    assertSuccess(noop);
    assert.equal(noop.result.changes.length, 0);
  }
});

test('migration rejects a noncanonical legacy source before preview or apply writes', async () => {
  const relative = 'testing/policy.details.tpl.md';
  const authored = convention.replace('# Unit', '# Policy details');
  const fs = legacy({ sources: { [relative]: authored } });
  const source = `templates/${relative}`;
  const output = 'docs/conventions/testing/policy.details.md';
  const originalIndex = fs.text('AGENTS.md');
  const originalOutput = fs.text(output);
  for (const dryRun of [true, false]) {
    const { exitCode, result } = await invoke(fs, { dryRun });
    assert.equal(exitCode, 2);
    assert.deepEqual(result.changes, []);
    assert.equal(result.diagnostics[0].code, 'SOURCE_FILENAME');
    assert.equal(result.diagnostics[0].path, source);
    assert.match(result.diagnostics[0].message, /policy-details\.tpl\.md/u);
    assert.equal(fs.writes.length, 0);
    assert.equal(fs.text(source), authored);
    assert.equal(fs.text(output), originalOutput);
    assert.equal(fs.text('AGENTS.md'), originalIndex);
    assert.ok(exists(fs, 'agentscli-compose.yml'));
    assert.ok(!exists(fs, '.agentscli/config.yml'));
  }
});

test('migration accepts missing old outputs, empty conventions and preserves raw source newlines', async () => {
  const fs = legacy({ sources: {} });
  fs.nodes.delete(join(fs.root, 'AGENTS.md'));
  fs.put('templates/AGENTS.tpl.md', main.replaceAll('\n', '\r\n'));
  assertSuccess(await invoke(fs));
  assert.equal(
    fs.text('.agentscli/templates/AGENTS.tpl.md'),
    main.replaceAll('\n', '\r\n'),
  );
  assert.ok(!exists(fs, '.agentscli/templates/conventions'));
  const missing = legacy();
  missing.nodes.delete(join(missing.root, 'docs/conventions/testing/unit.md'));
  assertSuccess(await invoke(missing));
});

test('migration rejects all foreseeable content conflicts before any writes', async () => {
  for (const [path, content] of [
    ['AGENTS.md', `${GENERATED}\nDirect edit.\n`],
    ['docs/conventions/testing/unit.md', 'Manual output.'],
    ['docs/conventions/testing/unit.md', `${GENERATED}\nDirect edit.\n`],
    ['.agentscli/templates/AGENTS.tpl.md', main + 'Different.\n'],
    ['.agentscli/conventions/testing/unit.md', `${GENERATED}\nDifferent.\n`],
    ['.agentscli/templates/conventions/unrelated.tpl.md', convention],
    ['.agentscli/conventions/stale.md', `${GENERATED}\nStale.\n`],
  ]) {
    const fs = legacy();
    fs.put(path, content);
    const result = await invoke(fs);
    assert.equal(result.exitCode, 2, path);
    assert.equal(fs.writes.length, 0, path);
    assert.equal(fs.text(path), content);
  }
});

test('migration rejects unsupported, unsafe and conflicting contexts before writes', async () => {
  for (const config of [
    'entries: []\n',
    'language: en\ntemplates_dir: .agentscli/old\nconventions_dir: docs\n',
    'language: en\ntemplates_dir: templates\nconventions_dir: .AGENTSCLI\n',
    'language: en\nlanguage: pt-br\n',
  ]) {
    const fs = legacy();
    fs.put('agentscli-compose.yml', config);
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, 0);
  }
  for (const overrides of [{ kind: 'link' }, { nlink: 2 }]) {
    const fs = legacy();
    fs.put('templates/testing/unit.tpl.md', convention, overrides);
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, 0);
  }
  const alias = legacy();
  alias.put('.AGENTSCLI/config.yml', 'language: en\n');
  assert.equal((await invoke(alias)).exitCode, 2);
  assert.equal(alias.writes.length, 0);
  const internal = legacy();
  internal.put('agentscli.yml', 'skills: []\n');
  assert.equal((await invoke(internal)).exitCode, 2);
  assert.equal(internal.writes.length, 0);
  const ancestor = legacy();
  ancestor.nodes.set(join(dirname(ancestor.root), 'agentscli.yml'), {
    kind: 'file',
    nlink: 1,
    data: bytes('skills: []\n'),
  });
  assert.equal((await invoke(ancestor)).exitCode, 2);
  assert.equal(ancestor.writes.length, 0);
  const noClient = memory();
  assert.equal((await invoke(noClient)).exitCode, 2);
  assert.equal(noClient.writes.length, 0);
});

test('ordinary operations reject legacy state in every preview/check mode', async () => {
  const fs = legacy({ extras: { '.agentscli/config.yml': 'language: en\n' } });
  for (const [command, options] of [
    ['init', {}],
    ['init', { dryRun: true }],
    ['validate', {}],
    ['sync', {}],
    ['sync', { dryRun: true }],
    ['sync', { check: true }],
  ]) {
    const result = await execute(
      command,
      { repoRoot: fs.root, ...options },
      { io: fs.io, resources },
    );
    assert.equal(result.exitCode, 2);
    assert.equal(result.result.diagnostics[0].code, 'MIGRATION_REQUIRED');
    assert.equal(fs.writes.length, 0);
  }
});

test('expected legacy output directories block all migration writes', async () => {
  for (const path of ['AGENTS.md', 'docs/conventions/testing/unit.md']) {
    const fs = legacy();
    fs.nodes.delete(join(fs.root, path));
    fs.nodes.set(join(fs.root, path), { kind: 'directory', nlink: 1 });
    const result = await invoke(fs);
    assert.equal(result.exitCode, 2, path);
    assert.equal(fs.writes.length, 0, path);
    assert.ok(exists(fs, 'templates/testing/unit.tpl.md'));
  }
});

test('every meaningful migration write/deletion interruption converges with unchanged options', async () => {
  const baseline = legacy();
  const effects = planMigration(baseline.io, baseline.root, resources);
  for (const target of effects
    .filter((effect) => !effect.directory)
    .map((effect) => effect.path)) {
    const fs = legacy();
    let failed = false;
    const absolute = join(fs.root, target);
    for (const method of ['rename', 'unlink']) {
      const original = fs.io[method];
      fs.io[method] = (...args) => {
        const path = method === 'rename' ? args[1] : args[0];
        if (path === absolute && !failed) {
          failed = true;
          throw new Error('Injected boundary failure.');
        }
        return original(...args);
      };
    }
    const result = await invoke(fs);
    assert.equal(result.exitCode, 3, target);
    assert.equal(failed, true, target);
    assert.ok(
      result.result.changes.some((change) => change.status === 'pending'),
    );
    assert.ok(
      result.result.diagnostics.some(
        (item) =>
          item.code === 'RETRY_MIGRATION' &&
          item.message.includes('same options'),
      ),
    );
    assert.ok(exists(fs, 'agentscli-compose.yml'), target);
    if (!exists(fs, '.agentscli/config.yml'))
      for (const path of [
        'templates/AGENTS.tpl.md',
        'templates/testing/unit.tpl.md',
        'docs/conventions/testing/unit.md',
      ])
        assert.ok(exists(fs, path), `${target}: ${path}`);
    assertSuccess(await invoke(fs));
    assert.ok(!exists(fs, 'agentscli-compose.yml'), target);
    assertSuccess(
      await execute(
        'sync',
        { repoRoot: fs.root, check: true },
        { io: fs.io, resources },
      ),
    );
  }
});

test('published cleanup retries verify language, sources and full skill inventory', async () => {
  for (const mutation of [
    (fs) =>
      fs.put(
        '.agentscli/templates/conventions/testing/unit.tpl.md',
        convention + 'Changed.\n',
      ),
    (fs) =>
      fs.put('.agents/skills/agentscli-build-agents/SKILL.md', 'Edited.\n'),
    (fs) => fs.put('templates/extra.tpl.md', convention),
    (fs) => fs.put('docs/conventions/testing/unit.md', 'Manual.'),
  ]) {
    const fs = legacy();
    const unlink = fs.io.unlink;
    fs.io.unlink = (path) => {
      if (path === join(fs.root, 'docs/conventions/testing/unit.md'))
        throw new Error('Stop cleanup.');
      unlink(path);
    };
    assert.equal((await invoke(fs)).exitCode, 3);
    fs.io.unlink = unlink;
    mutation(fs);
    const count = fs.writes.length;
    assert.equal((await invoke(fs)).exitCode, 2);
    assert.equal(fs.writes.length, count);
  }
  const fs = legacy();
  const unlink = fs.io.unlink;
  fs.io.unlink = () => {
    throw new Error('Stop.');
  };
  assert.equal((await invoke(fs, { language: 'pt-br' })).exitCode, 3);
  fs.io.unlink = unlink;
  const count = fs.writes.length;
  assert.equal((await invoke(fs)).exitCode, 2);
  assert.equal(fs.writes.length, count);
  assertSuccess(await invoke(fs, { language: 'pt-br' }));
});

test('migration checks prepared destinations before configuration and source deletion', async () => {
  for (const stage of ['publication', 'cleanup']) {
    const fs = legacy();
    const rename = fs.io.rename;
    let changed = false;
    fs.io.rename = (from, to) => {
      rename(from, to);
      if (
        !changed &&
        to ===
          join(
            fs.root,
            stage === 'publication'
              ? '.agents/skills/agentscli-write-conventions/references/rule.md'
              : '.agentscli/config.yml',
          )
      ) {
        changed = true;
        fs.put(
          '.agentscli/templates/AGENTS.tpl.md',
          main + 'Concurrent edit.\n',
        );
      }
    };
    const result = await invoke(fs);
    assert.equal(result.exitCode, 3);
    assert.ok(exists(fs, 'templates/AGENTS.tpl.md'));
    assert.ok(exists(fs, 'docs/conventions/testing/unit.md'));
    assert.ok(exists(fs, 'agentscli-compose.yml'));
    if (stage === 'publication')
      assert.ok(!exists(fs, '.agentscli/config.yml'));
  }
});

test('changed old source is preserved at its deletion boundary', async () => {
  const fs = legacy();
  const unlink = fs.io.unlink;
  fs.io.unlink = (path) => {
    unlink(path);
    if (path === join(fs.root, 'docs/conventions/testing/unit.md'))
      fs.put('templates/AGENTS.tpl.md', main + 'Changed after planning.\n');
  };
  const result = await invoke(fs);
  assert.equal(result.exitCode, 3);
  assert.ok(exists(fs, 'templates/AGENTS.tpl.md'));
  assert.ok(exists(fs, 'agentscli-compose.yml'));
});

test('managed links are rebased in migrated source and generated output together', async () => {
  const source =
    convention.replace(
      'Read for rules.',
      'Read [other](handbook/other.md#card).',
    ) + '\n[Readme](../README.md?raw=1#top)\n[Other](other.md#body)\n';
  const fs = legacy({
    templates: 'rules/authored',
    outputs: 'handbook',
    sources: {
      'unit.tpl.md': source,
      'other.tpl.md': convention.replace('# Unit', '# Other'),
    },
    extras: { 'README.md': 'Readme.' },
  });
  assertSuccess(await invoke(fs));
  assert.ok(
    fs
      .text('.agentscli/templates/conventions/unit.tpl.md')
      .includes('../../README.md?raw=1#top'),
  );
  assert.ok(
    fs
      .text('.agentscli/conventions/unit.md')
      .includes('../../README.md?raw=1#top'),
  );
  assert.ok(
    fs.text('.agentscli/conventions/unit.md').includes('(other.md#body)'),
  );
  assert.ok(
    fs.text('AGENTS.md').includes('(.agentscli/conventions/other.md#card)'),
  );
});

test('interrupted empty-directory cleanup converges without removing unrelated content', async () => {
  const baseline = legacy();
  for (const target of planMigration(baseline.io, baseline.root, resources)
    .filter((effect) => effect.directory)
    .map((effect) => effect.path)) {
    const fs = legacy();
    const rmdir = fs.io.rmdir;
    let failed = false;
    fs.io.rmdir = (path) => {
      if (!failed && path === join(fs.root, target)) {
        failed = true;
        throw new Error('Injected directory cleanup failure.');
      }
      rmdir(path);
    };
    assert.equal((await invoke(fs)).exitCode, 3, target);
    assert.ok(exists(fs, 'agentscli-compose.yml'));
    assertSuccess(await invoke(fs));
    assert.equal(exists(fs, 'agentscli-compose.yml'), false);
  }
});
