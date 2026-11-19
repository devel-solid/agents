import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  defaultManifest,
  language,
  parseManifest,
  parseLegacyManifest,
  serializeManifest,
} from '../../dist/manifest.js';
import { relativePath, uniquePaths } from '../../dist/paths.js';
import {
  decode,
  CARD_END,
  CARD_START,
  GENERATED,
  INSERTION,
  parseMarkdown,
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
const contextBase = {
  en: 'project-context',
  'pt-br': 'contexto-do-projeto',
};
const resources = {
  templates: {
    en: {
      'AGENTS.tpl.md': bytes(main),
      [`conventions/${contextBase.en}.tpl.md`]: bytes(
        convention('Project context'),
      ),
    },
    'pt-br': {
      'AGENTS.tpl.md': bytes(main.replace('My project', 'Meu projeto')),
      [`conventions/${contextBase['pt-br']}.tpl.md`]: bytes(
        convention('Contexto do projeto'),
      ),
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
const documentResources = {
  ...resources,
  templates: Object.fromEntries(
    ['en', 'pt-br'].map((locale) => [
      locale,
      Object.fromEntries(
        ['AGENTS.tpl.md', `conventions/${contextBase[locale]}.tpl.md`].map(
          (filename) => [
            filename,
            readFileSync(
              new URL(
                `../../assets/templates/${locale}/${filename}`,
                import.meta.url,
              ),
            ),
          ],
        ),
      ),
    ]),
  ),
};
const defaultCopy = {
  en: {
    sections: ['Working in this project', 'Conventions'],
    working:
      'Read the project context convention before making changes. Follow the conventions relevant to the current task and keep changes within the requested scope.',
    mainHint:
      "<!-- Replace this comment with the project's purpose and essential repository orientation. -->",
    contextTitle: 'Project context',
    card: "Read when starting work or choosing the project's development workflow.",
    contextHint:
      "<!-- Replace this comment with the project's actual context. -->",
    notice: 'Generated file. Edit the template',
  },
  'pt-br': {
    sections: ['Trabalho neste projeto', 'Convenções'],
    working:
      'Leia a convenção de contexto do projeto antes de fazer alterações. Siga as convenções relevantes para a tarefa atual e mantenha as alterações dentro do escopo solicitado.',
    mainHint:
      '<!-- Substitua este comentário pelo propósito do projeto e pela orientação essencial sobre o repositório. -->',
    contextTitle: 'Contexto do projeto',
    card: 'Leia ao iniciar um trabalho ou escolher o fluxo de desenvolvimento do projeto.',
    contextHint:
      '<!-- Substitua este comentário pelo contexto real do projeto. -->',
    notice: 'Arquivo gerado. Edite o template',
  },
};
function markdownNodes(text) {
  const nodes = [];
  function visit(node) {
    nodes.push(node);
    for (const child of node.children ?? []) visit(child);
  }
  visit(parseMarkdown(text));
  return nodes;
}
const nodeText = (node) =>
  node.value ?? (node.children ?? []).map(nodeText).join('');
const values = (text, type) =>
  markdownNodes(text)
    .filter((node) => node.type === type)
    .map(nodeText);

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
    '.agentscli/config.yml': serializeManifest(defaultManifest()),
    '.agentscli/templates/AGENTS.tpl.md': main,
    ...files,
  });
}
const invoke = (fs, command, options = {}) =>
  execute(command, { repoRoot: fs.root, ...options }, { io: fs.io, resources });

test('configuration accepts exactly a lowercase language and CLI language normalizes', () => {
  assert.deepEqual(parseManifest('language: pt-br\n'), { language: 'pt-br' });
  assert.equal(language('PT-BR'), 'pt-br');
  assert.equal(defaultManifest().language, 'en');
  for (const text of [
    '[]',
    'language: [',
    'language: en\nlanguage: en',
    'language: EN',
    'language: es',
    'language: &lang en\nother: *lang',
    'language: &lang [*lang]',
    'language: null',
    'version: 1',
    'language: EN\ntemplates_dir: templates\nconventions_dir: .agentscli/conventions',
    'language: es\ntemplates_dir: templates\nconventions_dir: .agentscli/conventions',
    'language: en\ntemplates_dir: templates',
    'language: en\ntemplates_dir: templates\nconventions_dir: .agentscli/conventions\nentries: []',
    'language: en\ntemplates_dir: rules\nconventions_dir: rules/final',
    'language: en\ntemplates_dir: rules\nconventions_dir: RULES',
    'language: en\ntemplates_dir: .agents/x\nconventions_dir: .agentscli/conventions',
    'language: en\ntemplates_dir: AGENTS.md/x\nconventions_dir: .agentscli/conventions',
    'language: en\ntemplates_dir: ../templates\nconventions_dir: .agentscli/conventions',
  ])
    assert.throws(() => parseManifest(text), undefined, text);
});

test('legacy parsing is isolated and retains strict supported roots', () => {
  const legacy =
    'language: pt-br\ntemplates_dir: rules/templates\nconventions_dir: rules/final\n';
  assert.deepEqual(parseLegacyManifest(legacy), {
    language: 'pt-br',
    templates_dir: 'rules/templates',
    conventions_dir: 'rules/final',
  });
  for (const roots of [
    ['rules', 'rules/final'],
    ['rules', 'RULES'],
    ['../templates', 'final'],
    ['.agents/x', 'final'],
    ['AGENTS.md/x', 'final'],
    ['.agentscli', 'final'],
    ['source', '.agentscli/final'],
  ])
    assert.throws(() =>
      parseLegacyManifest(
        `language: en\ntemplates_dir: ${roots[0]}\nconventions_dir: ${roots[1]}\n`,
      ),
    );
  assert.throws(() => parseLegacyManifest('language: en\nentries: []'));
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
    {
      source: '.agentscli/templates/AGENTS.tpl.md',
      text: main.replaceAll('\n', '\r\n'),
    },
    [
      {
        source: '.agentscli/templates/conventions/nested/a b(/rules.tpl.md',
        output: '.agentscli/conventions/nested/a b(/rules.md',
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
    /Before\.[\s\S]*\[Rules\]\(\.agentscli\/conventions\/nested\/a%20b%28\/rules\.md\)[\s\S]*After\./u,
  );
  assert.match(
    output.get('.agentscli/conventions/nested/a b(/rules.md'),
    /Keep useful rules/u,
  );
  assert.ok(
    output
      .get('.agentscli/conventions/nested/a b(/rules.md')
      .includes('.agentscli/templates/conventions/nested/a b(/rules.tpl.md;'),
  );
  assert.doesNotMatch(
    output.get('.agentscli/conventions/nested/a b(/rules.md'),
    /AGENT-CARD/u,
  );
  assert.doesNotMatch(output.get('AGENTS.md'), /\r/u);
  assert.equal(isGenerated(bytes('Manual\n' + GENERATED)), false);
  assert.equal(isGenerated(bytes('\ufeff' + GENERATED + '\n')), false);
  assert.equal(isGenerated(bytes(GENERATED + '\r\n')), true);
});

for (const [locale, copy] of Object.entries(defaultCopy)) {
  const basename = contextBase[locale];
  const filename = `${basename}.tpl.md`;
  const source = `.agentscli/templates/conventions/${filename}`;
  const destination = `.agentscli/conventions/${basename}.md`;
  test(`${locale} bundled defaults keep authoring hints in comments and render usable discovery`, () => {
    const defaults = documentResources.templates[locale];
    const mainText = decode(defaults['AGENTS.tpl.md'], 'AGENTS.tpl.md');
    const contextText = decode(defaults[`conventions/${filename}`], filename);
    assert.ok(mainText.startsWith('# AGENTS.md\n'));
    assert.deepEqual(values(mainText, 'heading'), [
      'AGENTS.md',
      ...copy.sections,
    ]);
    assert.deepEqual(values(mainText, 'paragraph'), [copy.working]);
    assert.deepEqual(values(mainText, 'html'), [copy.mainHint, INSERTION]);
    assert.deepEqual(values(contextText, 'heading'), [copy.contextTitle]);
    assert.deepEqual(values(contextText, 'paragraph'), [copy.card]);
    assert.deepEqual(values(contextText, 'html'), [
      CARD_START,
      CARD_END,
      copy.contextHint,
    ]);
    validateTemplate(mainText, 'AGENTS.tpl.md');
    assert.equal(validateConvention(contextText, source).card, copy.card);

    const output = render(
      { source: '.agentscli/templates/AGENTS.tpl.md', text: mainText },
      [
        {
          source,
          output: destination,
          text: contextText,
        },
      ],
      locale,
    );
    const generatedMain = output.get('AGENTS.md');
    const generatedContext = output.get(destination);
    assert.ok(
      generatedMain.startsWith(
        `${GENERATED}\n<!-- ${copy.notice} .agentscli/templates/AGENTS.tpl.md;`,
      ),
    );
    assert.ok(
      generatedContext.startsWith(
        `${GENERATED}\n<!-- ${copy.notice} ${source};`,
      ),
    );
    assert.deepEqual(values(generatedMain, 'heading'), [
      'AGENTS.md',
      ...copy.sections,
    ]);
    assert.ok(
      generatedMain.includes(
        `- [${copy.contextTitle}](${destination})\n  ${copy.card}`,
      ),
    );
    assert.ok(!generatedMain.includes(INSERTION));
    assert.deepEqual(values(generatedContext, 'heading'), [copy.contextTitle]);
    assert.deepEqual(values(generatedContext, 'paragraph'), []);
    assert.ok(!generatedContext.includes('AGENT-CARD'));
    assert.ok(!generatedContext.includes(copy.card));
    for (const [text, hint] of [
      [generatedMain, copy.mainHint],
      [generatedContext, copy.contextHint],
    ]) {
      assert.equal(
        values(text, 'html').filter((value) => value === hint).length,
        1,
      );
      assert.ok(
        values(text, 'paragraph').every(
          (value) => !value.includes(hint.slice(5, -4)),
        ),
      );
    }
  });

  test(`${locale} real defaults initialize in memory without replacing valid customized sources`, async () => {
    const fs = memory();
    const run = (command) =>
      execute(
        command,
        { repoRoot: fs.root, language: locale },
        { io: fs.io, resources: documentResources },
      );
    assert.equal((await run('init')).exitCode, 0);
    const defaults = documentResources.templates[locale];
    for (const [name, content] of Object.entries(defaults))
      assert.equal(
        fs.text(`.agentscli/templates/${name}`),
        decode(content, name),
      );
    assert.ok(fs.text('AGENTS.md').includes(copy.mainHint));
    assert.ok(fs.text(destination).includes(copy.contextHint));
    assert.equal(
      parseManifest(fs.text('.agentscli/config.yml')).language,
      locale,
    );

    let previousSource = source;
    for (const authored of [
      {
        basename: 'project-context',
        main:
          '# Project instructions\n\nCustomize this template with the project purpose.\n\n' +
          INSERTION +
          '\n',
        context:
          '# Project context\n\n' +
          CARD_START +
          '\nRead before working.\n' +
          CARD_END +
          '\n\nRecord actual project information here.\n',
      },
      {
        basename: 'workspace-overview',
        main:
          '# Team handbook\n\n## Entry points\n\nUse the existing workspace.\n\n' +
          INSERTION +
          '\n\n## Additional section\n\nKeep this authored text.\n',
        context:
          '# Workspace overview\n\n' +
          CARD_START +
          '\nRead before changing this workspace.\n' +
          CARD_END +
          '\n\nThis project processes local input files.\n',
      },
    ]) {
      const authoredSource = `.agentscli/templates/conventions/${authored.basename}.tpl.md`;
      const authoredOutput = `.agentscli/conventions/${authored.basename}.md`;
      fs.nodes.delete(join(fs.root, previousSource));
      fs.put('.agentscli/templates/AGENTS.tpl.md', authored.main);
      fs.put(authoredSource, authored.context);
      previousSource = authoredSource;
      const oldOutput = fs.text('AGENTS.md');
      assert.equal((await run('init')).exitCode, 0);
      assert.equal(fs.text('AGENTS.md'), oldOutput);
      assert.equal(
        fs.text('.agentscli/templates/AGENTS.tpl.md'),
        authored.main,
      );
      assert.equal(fs.text(authoredSource), authored.context);
      assert.equal((await run('sync')).exitCode, 0);
      assert.equal(
        fs.text('.agentscli/templates/AGENTS.tpl.md'),
        authored.main,
      );
      assert.equal(fs.text(authoredSource), authored.context);
      const expected = render(
        { source: '.agentscli/templates/AGENTS.tpl.md', text: authored.main },
        [
          {
            source: authoredSource,
            output: authoredOutput,
            text: authored.context,
          },
        ],
        locale,
      );
      assert.equal(fs.text('AGENTS.md'), expected.get('AGENTS.md'));
      assert.equal(fs.text(authoredOutput), expected.get(authoredOutput));
    }
  });
}

test('discovery maps independent canonical names and preserves nesting and display titles', async () => {
  const fs = client({
    '.agentscli/templates/conventions/testing/api-e-validacao.tpl.md':
      convention('**API** e validação'),
    '.agentscli/templates/conventions/policy-details.tpl.md':
      convention('Policy... Details!'),
    '.agentscli/templates/conventions/readme.md': 'ignored',
    '.agentscli/templates/ignored.tpl.md': '# Invalid unrelated source',
    '.agentscli/templates/other/ignored.tpl.md': '# Invalid unrelated source',
    '.agentscli/templates/conventions/agents.tpl.md': convention('AGENTS'),
  });
  const effects = plan(fs.io, fs.root, 'sync', resources);
  assert.ok(
    effects.find(
      (item) =>
        item.path === '.agentscli/conventions/testing/api-e-validacao.md',
    ),
  );
  assert.ok(
    effects.find(
      (item) => item.path === '.agentscli/conventions/policy-details.md',
    ),
  );
  assert.ok(!effects.find((item) => item.path.endsWith('AGENTS.md.md')));
  assert.ok(
    effects.find((item) => item.path === '.agentscli/conventions/agents.md'),
  );
  assert.ok(!effects.some((item) => item.path.includes('ignored')));
  assert.ok(
    !effects.some((item) => item.path.includes('conventions/conventions/')),
  );
  assert.equal(
    plan(client().io, fs.root, 'sync', resources).filter((item) =>
      item.path.startsWith('.agentscli/conventions'),
    ).length,
    0,
  );
  fs.put(
    '.agentscli/templates/conventions/POLICY-DETAILS.tpl.md',
    convention('Policy details'),
  );
  assert.throws(() => plan(fs.io, fs.root, 'sync', resources), {
    code: 'PATH_ALIAS',
  });
  assert.equal(fs.writes.length, 0);
  fs.nodes.delete(
    join(fs.root, '.agentscli/templates/conventions/POLICY-DETAILS.tpl.md'),
  );
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.ok(
    fs
      .text('AGENTS.md')
      .includes(
        '[API e validação](.agentscli/conventions/testing/api-e-validacao.md)',
      ),
  );
});

test('invalid convention basenames block all ordinary modes before writes', async () => {
  for (const [filename, title, message] of [
    [
      'componentes.tpl.md',
      'Aplicação web e componentes',
      'Expected filename aplicacao-web-e-componentes.tpl.md',
    ],
    [
      'policy.details.tpl.md',
      'Policy... Details!',
      'Expected filename policy-details.tpl.md',
    ],
    ['RULE.tpl.md', 'Rule', 'Expected filename rule.tpl.md'],
    ['café.tpl.md', 'Café', 'Expected filename cafe.tpl.md'],
    ['rule.tpl.md', '！？', 'cannot form a filename'],
    ['rule.tpl.md', '', 'cannot form a filename'],
  ]) {
    const source = `.agentscli/templates/conventions/nested/${filename}`;
    const authored = convention(title);
    const output = GENERATED + '\nKeep old generated output until corrected.\n';
    const fs = client({ [source]: authored, 'AGENTS.md': output });
    for (const [command, options] of [
      ['init', {}],
      ['init', { dryRun: true }],
      ['validate', {}],
      ['sync', {}],
      ['sync', { dryRun: true }],
      ['sync', { check: true }],
    ]) {
      const { exitCode, result } = await invoke(fs, command, options);
      assert.equal(exitCode, 2, source);
      assert.deepEqual(result.changes, []);
      assert.equal(result.diagnostics[0].code, 'SOURCE_FILENAME');
      assert.equal(result.diagnostics[0].path, source);
      assert.ok(result.diagnostics[0].message.includes(message));
      assert.equal(fs.writes.length, 0);
      assert.equal(fs.text(source), authored);
      assert.equal(fs.text('AGENTS.md'), output);
    }
  }
});

test('explicit init language changes only preference and missing resources until sync', async () => {
  for (const [previous, selected] of [
    ['pt-br', 'en'],
    ['en', 'pt-br'],
  ]) {
    const fs = memory();
    assert.equal(
      (await invoke(fs, 'init', { language: previous })).exitCode,
      0,
    );
    const mainBefore = fs.text('.agentscli/templates/AGENTS.tpl.md');
    const source = `.agentscli/templates/conventions/${contextBase[previous]}.tpl.md`;
    const destination = `.agentscli/conventions/${contextBase[previous]}.md`;
    const conventionBefore = fs.text(source);
    const rootBefore = fs.text('AGENTS.md');
    const outputBefore = fs.text(destination);
    fs.nodes.delete(
      join(fs.root, '.agents/skills/agentscli-build-agents/references/rule.md'),
    );
    const changed = await invoke(fs, 'init', { language: selected });
    assert.equal(changed.exitCode, 0);
    assert.deepEqual(
      changed.result.changes.map(({ path }) => path).sort(),
      [
        '.agents/skills/agentscli-build-agents/references/rule.md',
        '.agentscli/config.yml',
      ].sort(),
    );
    assert.equal(fs.text('.agentscli/templates/AGENTS.tpl.md'), mainBefore);
    assert.equal(fs.text(source), conventionBefore);
    assert.equal(fs.text('AGENTS.md'), rootBefore);
    assert.equal(fs.text(destination), outputBefore);
    assert.equal(
      parseManifest(fs.text('.agentscli/config.yml')).language,
      selected,
    );
    assert.equal((await invoke(fs, 'init')).result.changes.length, 0);
    assert.equal((await invoke(fs, 'sync')).exitCode, 0);
    assert.match(
      fs.text('AGENTS.md'),
      selected === 'en' ? /Generated file/u : /Arquivo gerado/u,
    );
    assert.equal(fs.text('.agentscli/templates/AGENTS.tpl.md'), mainBefore);
  }
  const missingMain = memory({ '.agentscli/config.yml': 'language: en\n' });
  assert.equal(
    (await invoke(missingMain, 'init', { language: 'pt-br' })).exitCode,
    0,
  );
  assert.match(
    missingMain.text('.agentscli/templates/AGENTS.tpl.md'),
    /Meu projeto/u,
  );
  assert.equal(
    missingMain.nodes.has(
      join(
        missingMain.root,
        '.agentscli/templates/conventions/contexto-do-projeto.tpl.md',
      ),
    ),
    false,
  );
});

test('ordinary operations reject a remaining legacy manifest in every mode', async () => {
  for (const configured of [false, true]) {
    const fs = configured ? client() : memory();
    fs.put(
      'agentscli-compose.yml',
      'language: en\ntemplates_dir: templates\nconventions_dir: docs/conventions\n',
    );
    for (const [command, options] of [
      ['init', {}],
      ['init', { dryRun: true }],
      ['validate', {}],
      ['sync', {}],
      ['sync', { dryRun: true }],
      ['sync', { check: true }],
    ]) {
      const result = await invoke(fs, command, options);
      assert.equal(result.exitCode, 2);
      assert.equal(result.result.diagnostics[0].code, 'MIGRATION_REQUIRED');
      assert.match(result.result.diagnostics[0].message, /init --migrate/u);
      assert.equal(fs.writes.length, 0);
    }
  }
});

test('init previews and creates missing setup without writes during preview', async () => {
  const fs = memory({
    'old-output/keep.md': 'Manual old file',
  });
  const preview = await invoke(fs, 'init', { language: 'PT-BR', dryRun: true });
  assert.equal(preview.exitCode, 0);
  assert.equal(preview.result.diagnostics[0].code, 'INIT_PRESERVED');
  assert.equal(fs.writes.length, 0);
  assert.equal(
    preview.result.changes.find(
      (change) => change.path === '.agentscli/config.yml',
    ).action,
    'create',
  );
  assert.ok(
    preview.result.changes.some(
      (change) =>
        change.path ===
        '.agentscli/templates/conventions/contexto-do-projeto.tpl.md',
    ),
  );
  const applied = await invoke(fs, 'init', { language: 'PT-BR' });
  assert.equal(applied.exitCode, 0);
  assert.match(fs.text('.agentscli/config.yml'), /language: pt-br/u);
  assert.match(fs.text('AGENTS.md'), /Meu projeto/u);
  assert.equal(fs.text('old-output/keep.md'), 'Manual old file');
  assert.ok(
    applied.result.changes.every((change) => change.status === 'completed'),
  );
});

test('first init preserves unrelated template resources and invalid config blocks all writes', async () => {
  const fs = memory({
    '.agentscli/templates/unrelated.txt': 'Keep',
  });
  assert.equal((await invoke(fs, 'init')).exitCode, 0);
  assert.ok(
    fs.nodes.has(
      join(fs.root, '.agentscli/templates/conventions/project-context.tpl.md'),
    ),
  );
  assert.equal(fs.text('.agentscli/templates/unrelated.txt'), 'Keep');
  assert.match(fs.text('.agentscli/config.yml'), /language: en/u);
  for (const invalid of [
    'not: [valid',
    Uint8Array.from([0xc3, 0x28]),
    'language: en\ntemplates_dir: other',
  ]) {
    const broken = memory({ '.agentscli/config.yml': invalid });
    for (const options of [{}, { language: 'pt-br' }, { dryRun: true }]) {
      assert.equal((await invoke(broken, 'init', options)).exitCode, 2);
      assert.equal(broken.writes.length, 0);
    }
  }
});

test('repeated init preserves valid sources, regular skill edits, generated bodies and removed convention sources', async () => {
  const fs = client({
    'AGENTS.md': GENERATED + '\nEdited output\n',
    '.agents/skills/agentscli-update-agents/SKILL.md': 'Customized skill',
    'old-root/keep.md': GENERATED + '\nOld',
  });
  fs.put(
    '.agentscli/config.yml',
    '# Preserve formatting too\nlanguage: pt-br\n',
  );
  const result = await invoke(fs, 'init');
  assert.equal(result.exitCode, 0);
  assert.equal(fs.text('.agentscli/templates/AGENTS.tpl.md'), main);
  assert.equal(fs.text('AGENTS.md'), GENERATED + '\nEdited output\n');
  assert.equal(
    fs.text('.agents/skills/agentscli-update-agents/SKILL.md'),
    'Customized skill',
  );
  assert.equal(
    fs.nodes.has(
      join(
        fs.root,
        '.agentscli/templates/conventions/contexto-do-projeto.tpl.md',
      ),
    ),
    false,
  );
  assert.equal(
    fs.text('.agentscli/config.yml'),
    '# Preserve formatting too\nlanguage: pt-br\n',
  );
  assert.ok(
    !result.result.changes.some(({ path }) => path === '.agentscli/config.yml'),
  );
  assert.equal(fs.text('old-root/keep.md'), GENERATED + '\nOld');
});

test('manual destination conflicts and malformed sources prevent every setup write', async () => {
  for (const files of [
    { 'AGENTS.md': '# Manual' },
    { '.agentscli/templates/AGENTS.tpl.md': '# Missing marker' },
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
    '.agentscli/templates/conventions/rule.tpl.md': convention('Rule'),
    'AGENTS.md': GENERATED + '\nDirect edit',
    '.agentscli/conventions/stale.md': GENERATED + '\nOld',
    '.agentscli/conventions/manual.md': '# Manual\n' + GENERATED,
    '.agentscli/conventions/not-markdown.txt': GENERATED,
    'previous/stale.md': GENERATED + '\nOld',
  });
  const result = await invoke(fs, 'sync');
  assert.equal(result.exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /My project/u);
  assert.equal(
    fs.nodes.has(join(fs.root, '.agentscli/conventions/stale.md')),
    false,
  );
  assert.match(fs.text('.agentscli/conventions/manual.md'), /Manual/u);
  assert.equal(fs.text('.agentscli/conventions/not-markdown.txt'), GENERATED);
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
    '.agentscli/config.yml': 'schemaVersion: 1\nentries: []',
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
    ['.agentscli/conventions', '', { kind: 'link' }],
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
  const fs = client({
    '.agentscli/templates/conventions/rule.tpl.md': convention('Rule'),
  });
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

test('fixed outputs use configured notice language and preserve literal authored text and old roots', async () => {
  const fs = memory({
    '.agentscli/config.yml': 'language: pt-br\n',
    '.agentscli/templates/AGENTS.tpl.md': main,
    '.agentscli/templates/conventions/nested/english-authored-title.tpl.md':
      convention('English authored title'),
    'docs/conventions/previous.md': GENERATED + '\nPrevious output',
  });
  assert.equal((await invoke(fs, 'sync')).exitCode, 0);
  assert.match(fs.text('AGENTS.md'), /Arquivo gerado/u);
  assert.match(fs.text('AGENTS.md'), /My project/u);
  assert.match(
    fs.text('AGENTS.md'),
    /\.agentscli\/conventions\/nested\/english-authored-title\.md/u,
  );
  assert.match(
    fs.text('.agentscli/conventions/nested/english-authored-title.md'),
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
  for (const original of [
    {},
    { '.agentscli/templates/unrelated.txt': 'Keep' },
  ]) {
    const clean = memory(original);
    const baseline = await invoke(clean, 'init', { language: 'pt-br' });
    assert.equal(baseline.exitCode, 0);
    const plannedPaths = baseline.result.changes.map((change) => change.path);
    assert.ok(
      plannedPaths.indexOf(
        '.agentscli/templates/conventions/contexto-do-projeto.tpl.md',
      ) < plannedPaths.indexOf('.agentscli/templates/AGENTS.tpl.md'),
    );
    assert.equal(plannedPaths.at(-1), '.agentscli/config.yml');
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
        join(
          interrupted.root,
          '.agentscli/templates/conventions/contexto-do-projeto.tpl.md',
        ),
      );
      assert.equal(
        (await invoke(interrupted, 'init', { language: 'pt-br' })).exitCode,
        0,
      );
      assert.equal(
        interrupted.nodes.has(
          join(
            interrupted.root,
            '.agentscli/templates/conventions/contexto-do-projeto.tpl.md',
          ),
        ),
        false,
      );
    }
  }
});
