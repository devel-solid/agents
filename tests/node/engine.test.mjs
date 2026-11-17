import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtempSync,
  mkdirSync,
  linkSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { stringify } from 'yaml';
import { parseManifest } from '../../dist/manifest.js';
import { validateMarkdown } from '../../dist/markdown.js';
import { initialize } from '../../dist/init.js';
import {
  assertUniqueDestinations,
  safeJoin,
  validateRelativePath,
} from '../../dist/paths.js';
import { classifySource, resolveFamily, redact } from '../../dist/resolve.js';
import {
  prefixGeneratedNotice,
  renderAgents,
  renderFamily,
} from '../../dist/render.js';
import { validateBase, validateRemoteSelection } from '../../dist/validate.js';

function temporary(t) {
  const root = mkdtempSync(join(tmpdir(), 'agents-engine-'));
  t.after(() => rmSync(root, { recursive: true, force: true, maxRetries: 3 }));
  return root;
}
function write(root, path, content) {
  const target = join(root, path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
  return target;
}
function source(title = 'Exemplo', body = 'Texto autoral.\n') {
  return `# ${title}\n\n<!-- AGENT-CARD START -->\nLeia este documento ao trabalhar no exemplo.\nUse este documento para validar o exemplo.\n<!-- AGENT-CARD END -->\n\n${body}`;
}
function manifest() {
  return {
    schemaVersion: 1,
    agents: { repository: 'git@example.test:empresa/base.git', ref: 'v1.2.3' },
    outputs: {
      'AGENTS.md': {
        include: {
          conventions: {
            out_dir: 'docs/conventions',
            local: { tpl_dir: 'templates/local' },
            remote: { tpl_dir: 'templates/docs/conventions' },
            entries: [],
          },
        },
      },
    },
  };
}
function mutate(path, value) {
  const data = manifest();
  let node = data;
  for (const key of path.slice(0, -1)) node = node[key];
  if (value === undefined) delete node[path.at(-1)];
  else node[path.at(-1)] = value;
  return data;
}
const configuration = ['outputs', 'AGENTS.md', 'include', 'conventions'];

test('YAML 1.2 preserva comentários, aspas e o contrato único v1', () => {
  const original = stringify(manifest()).replace(
    'ref: v1.2.3',
    'ref: "v1.2.3" # versão fixada',
  );
  const parsed = parseManifest(original, 'configuração.yml');
  assert.equal(parsed.data.agents.ref, 'v1.2.3');
  assert.equal(parsed.source, original);
  assert.deepEqual(
    parseManifest(stringify(manifest())).data.agents,
    parsed.data.agents,
  );
  assert.equal(
    parseManifest(stringify(manifest())).data.outputs['AGENTS.md'].include
      .conventions.entries.length,
    0,
  );
});
test('YAML rejeita chaves duplicadas, tabs, tags desconhecidas, aliases excessivos e múltiplos documentos', () => {
  for (const text of [
    'agents:\n  ref: a\n  ref: b\n',
    'agents:\n\tref: a\n',
    'agents: !execute value\n',
    '---\na: 1\n---\na: 2\n',
  ])
    assert.throws(() => parseManifest(text), { code: 'MANIFEST_YAML' });
  let yaml = 'a: &a [x,x,x,x,x,x,x,x,x,x]\n';
  for (const name of ['b', 'c', 'd', 'e', 'f']) {
    const previous = String.fromCharCode(name.charCodeAt(0) - 1);
    yaml += `${name}: &${name} [${Array(10).fill(`*${previous}`).join(',')}]\n`;
  }
  assert.throws(() => parseManifest(yaml), { code: 'MANIFEST_YAML' });
});
test('schema rejeita campos ausentes, tipos inválidos e campos desconhecidos em todas as camadas', () => {
  const cases = [
    [[], null],
    [['schemaVersion'], undefined],
    [['agents', 'ref'], 1],
    [['agents', 'repository'], ' '],
    [['schemaVersion'], 2],
    [['schemaVersion'], 3],
    [['schemaVersion'], true],
    [['schemaVersion'], '1'],
    [['extra'], true],
    [['agents', 'root'], true],
    [['agents', 'source'], {}],
    [['agents', 'bootstrap'], true],
    [['outputs', 'skills'], {}],
    [configuration, undefined],
    [[...configuration, 'out_dir'], undefined],
    [[...configuration, 'out_dir'], false],
    [[...configuration, 'out_dir'], ' '],
    [[...configuration, 'local'], undefined],
    [[...configuration, 'remote'], {}],
    [[...configuration, 'local', 'tpl_dir'], null],
    [[...configuration, 'entries'], undefined],
    [[...configuration, 'entries'], {}],
    [[...configuration, 'extra'], true],
    [[...configuration, 'local', 'extra'], true],
    [[...configuration, 'remote', 'extra'], true],
    [[...configuration, 'entries'], [null]],
    [[...configuration, 'entries'], [{ origin: 'other', from: 'a.tpl.md' }]],
    [[...configuration, 'entries'], [{ origin: 'local', from: 'a.tpl.md' }]],
    [[...configuration, 'entries'], [{ origin: 'remote', from: 1 }]],
    [
      [...configuration, 'entries'],
      [{ origin: 'remote', from: 'a.tpl.md', extra: true }],
    ],
  ];
  for (const [path, value] of cases) {
    const data = path.length ? mutate(path, value) : value;
    assert.throws(
      () => parseManifest(stringify(data)),
      { code: 'MANIFEST_SCHEMA' },
      JSON.stringify(path),
    );
  }
});
test('diagnósticos de manifesto incluem campo e localização de origem', () => {
  assert.throws(
    () =>
      parseManifest(
        stringify({ ...manifest(), schemaVersion: 9 }),
        'agents-compose.yml',
      ),
    (error) =>
      error.field === 'schemaVersion' &&
      error.location.line === 1 &&
      error.location.path === 'agents-compose.yml',
  );
});

test('diagnósticos redigem userinfo de URLs sem expor usuário ou senha', () => {
  const message =
    'fatal: https://nome:segredo%40valor@git.example.test/base.git e ssh://outro:outro-segredo@git.example.test/regra';
  const result = redact(message);
  assert.doesNotMatch(result, /nome:|segredo|outro:/);
  assert.match(result, /https:\/\/\[redigido\]@git\.example\.test\/base\.git/);
});

test('preflight aceita contexto local virtual sem criar fonte nem diretório', (t) => {
  const root = temporary(t);
  const context = join(root, 'templates/local/contexto.tpl.md');
  const family = resolveFamily(
    root,
    'templates/local',
    'contexto.tpl.md',
    'docs/conventions',
    new Map([[context, source('Contexto virtual')]]),
  );
  assert.equal(family.parent.title, 'Contexto virtual');
  assert.equal(family.parent.targetDisplay, 'docs/conventions/contexto.md');
  assert.throws(() => readFileSync(context), { code: 'ENOENT' });
});
test('campos de caminho do manifesto usam validação compartilhada', () => {
  for (const invalid of [
    '../fora',
    'C:/fora',
    'C:\\fora',
    '//servidor/arquivo',
    'docs/../fora',
    'docs/NUL',
    'docs/nome.',
  ]) {
    for (const path of [
      [...configuration, 'out_dir'],
      [...configuration, 'local', 'tpl_dir'],
      [...configuration, 'remote', 'tpl_dir'],
    ])
      assert.throws(() => parseManifest(stringify(mutate(path, invalid))), {
        code: 'PATH_INVALID',
      });
    assert.throws(
      () =>
        parseManifest(
          stringify(
            mutate(
              [...configuration, 'entries'],
              [{ origin: 'remote', from: invalid }],
            ),
          ),
        ),
      { code: 'PATH_INVALID' },
    );
  }
  for (const from of ['a.md', 'templates/docs/conventions/a.tpl.md'])
    assert.throws(
      () =>
        parseManifest(
          stringify(
            mutate([...configuration, 'entries'], [{ origin: 'remote', from }]),
          ),
        ),
      { code: 'MANIFEST_SOURCE' },
    );
});
test('estrutura Markdown ignora exemplos cercados e indentados e preserva bytes autorais', () => {
  const body =
    'Texto com **ênfase**.\n\n```md\n# H1 de exemplo\n<!-- AGENT-CARD START -->\nExemplo.\n<!-- AGENT-CARD END -->\n```\n\n    # Outro exemplo\n    <!-- AGENT-CARD START -->\n    <!-- AGENT-CARD END -->\n\n- Lista  com  espaços\n';
  const parsed = validateMarkdown(source('Título', body), 'fonte.tpl.md');
  assert.equal(parsed.title, 'Título');
  assert.equal(parsed.cardLines.length, 2);
  assert.equal(parsed.body, `# Título\n\n${body}`);
  assert.equal(
    validateMarkdown(
      source('Título', body).replaceAll('\n', '\r\n'),
      'fonte.tpl.md',
    ).body,
    parsed.body,
  );
});
test('Markdown aceita H1 setext real e ignora marcadores inline', () => {
  const text =
    source().replace('# Exemplo', 'Exemplo\n=======') +
    '\nTexto `<!-- AGENT-CARD START -->`.\n';
  assert.equal(validateMarkdown(text, 'a.tpl.md').title, 'Exemplo');
});
test('Markdown rejeita H1/cards reais duplicados, ausentes, vazios ou invertidos com localização', () => {
  const cases = [
    [source() + '\n# Duplicado\n', 'SOURCE_H1'],
    [source().replace('# Exemplo', 'Texto'), 'SOURCE_H1'],
    [
      source() +
        '\n<!-- AGENT-CARD START -->\nLeia.\n<!-- AGENT-CARD END -->\n',
      'SOURCE_CARD',
    ],
    [source().replace('<!-- AGENT-CARD END -->', ''), 'SOURCE_CARD'],
    [
      '# Título\n\n<!-- AGENT-CARD START -->\n\n<!-- AGENT-CARD END -->\n',
      'SOURCE_CARD',
    ],
    [
      '# Título\n\n<!-- AGENT-CARD END -->\nTexto\n<!-- AGENT-CARD START -->\n',
      'SOURCE_CARD',
    ],
  ];
  for (const [text, code] of cases)
    assert.throws(
      () => validateMarkdown(text, 'a.tpl.md'),
      (error) => error.code === code && error.location.path === 'a.tpl.md',
    );
});
test('famílias preservam subdiretórios, ordem dos filhos, cards e avisos', (t) => {
  const root = temporary(t);
  write(
    root,
    'templates/docs/conventions/grupo/regra.tpl.md',
    source('Regra', 'Corpo pai.\n'),
  );
  write(
    root,
    'templates/docs/conventions/grupo/regra.z.tpl.md',
    source('Z', 'Corpo Z.\n'),
  );
  write(
    root,
    'templates/docs/conventions/grupo/regra.a.tpl.md',
    source('A', 'Corpo A.\n'),
  );
  write(root, 'templates/docs/conventions/outro/regra.tpl.md', source('Outra'));
  const family = resolveFamily(
    root,
    'templates/docs/conventions',
    'grupo/regra.tpl.md',
    'publicado/conventions',
  );
  assert.deepEqual(
    family.children.map((child) => child.title),
    ['A', 'Z'],
  );
  assert.equal(
    family.parent.targetDisplay,
    'publicado/conventions/grupo/regra.md',
  );
  const rendered = prefixGeneratedNotice(renderFamily(family));
  assert.ok(rendered.startsWith('> Arquivo gerado. Não edite manualmente.\n'));
  assert.ok(rendered.indexOf('### A') < rendered.indexOf('### Z'));
  assert.ok(
    rendered.includes('Arquivo: `publicado/conventions/grupo/regra.a.md`'),
  );
  const agents = renderAgents(
    '# AGENTS\n\n## Quando ler as conventions\n\nPreambulo próprio.\n',
    [family.parent],
  );
  assert.ok(agents.includes('Preambulo próprio.'));
  assert.ok(agents.includes('### Regra'));
  assert.ok(
    renderAgents('# AGENTS\n', [family.parent]).includes(
      '## Quando ler as conventions',
    ),
  );
  assertUniqueDestinations(root, [
    'AGENTS.md',
    family.parent.targetDisplay,
    'publicado/conventions/outro/regra.md',
  ]);
});
test('famílias rejeitam seleção de filho, órfão, nomes profundos e fonte ausente', (t) => {
  const root = temporary(t);
  write(root, 'templates/docs/conventions/regra.tpl.md', source());
  for (const name of [
    'regra.extra.tpl.md',
    'regra.extra.outro.tpl.md',
    'ausente.tpl.md',
  ])
    assert.throws(() =>
      resolveFamily(
        root,
        'templates/docs/conventions',
        name,
        'docs/conventions',
      ),
    );
  write(root, 'templates/docs/conventions/orfa.filha.tpl.md', source());
  assert.throws(
    () =>
      resolveFamily(
        root,
        'templates/docs/conventions',
        'regra.tpl.md',
        'docs/conventions',
      ),
    { code: 'SOURCE_ORPHAN' },
  );
  assert.throws(() => classifySource('a..tpl.md'), { code: 'SOURCE_NAME' });
});
test('base vazia ou catálogo arbitrário completo é validado sem manifesto ou Git', (t) => {
  const root = temporary(t);
  initialize(root, { base: true });
  write(
    root,
    'templates/AGENTS.tpl.md',
    '# AGENTS\n\n## Quando ler as conventions\n',
  );
  mkdirSync(join(root, 'templates/docs/conventions'), { recursive: true });
  assert.equal(validateBase(root).families.length, 0);
  for (const name of ['qualidade', 'revisao', 'operacao'])
    write(root, `templates/docs/conventions/${name}.tpl.md`, source(name));
  write(
    root,
    'templates/docs/conventions/qualidade.extra.tpl.md',
    source('Detalhes'),
  );
  assert.equal(validateBase(root).families.length, 3);
  const before = readFileSync(join(root, 'templates/AGENTS.tpl.md'));
  validateRemoteSelection(root, ['revisao.tpl.md', 'operacao.tpl.md']);
  assert.deepEqual(readFileSync(join(root, 'templates/AGENTS.tpl.md')), before);
  write(
    root,
    'templates/docs/conventions/nao-selecionada.tpl.md',
    '# Inválida\n',
  );
  assert.throws(() => validateBase(root), { code: 'SOURCE_CARD' });
});
test('destinos portáveis incluem AGENTS.md, reservados, equivalências e caminhos sobrepostos', (t) => {
  const root = temporary(t);
  for (const paths of [
    ['AGENTS.md', 'agents.md'],
    ['AGENTS.md', 'docs/Regra.md', 'docs/regra.md'],
    ['AGENTS.md', 'docs/a.md', 'docs/a.md/b.md'],
  ])
    assert.throws(() => assertUniqueDestinations(root, paths));
  for (const path of [
    '.git/config.md',
    '.cache/agents/a.md',
    '.agents/skills/agents-update-docs/a.md',
    'node_modules/a.md',
    'docs/CON.md',
    'docs/a:stream.md',
  ])
    assert.throws(() => assertUniqueDestinations(root, ['AGENTS.md', path]));
  for (const path of [
    '../a',
    'a/../b',
    'C:\\a',
    '\\\\server\\a',
    '/a',
    'a/./b',
    'a//b',
  ])
    assert.throws(() => validateRelativePath(path));
});
test('destinos e fontes rejeitam escapes por links e aliases resolvidos', (t) => {
  const root = temporary(t),
    outside = temporary(t);
  mkdirSync(join(root, 'docs/real'), { recursive: true });
  try {
    symlinkSync(
      join(root, 'docs/real'),
      join(root, 'docs/alias'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
    symlinkSync(
      outside,
      join(root, 'escape'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      t.skip(`Links indisponíveis: ${error.code}`);
      return;
    }
    throw error;
  }
  assert.throws(
    () =>
      assertUniqueDestinations(root, [
        'AGENTS.md',
        'docs/real/a.md',
        'docs/alias/a.md',
      ]),
    { code: 'DESTINATION_COLLISION' },
  );
  assert.throws(() => safeJoin(root, 'escape/a.tpl.md'), {
    code: 'PATH_ESCAPE',
  });
  assert.throws(
    () => assertUniqueDestinations(root, ['AGENTS.md', 'escape/a.md']),
    { code: 'PATH_ESCAPE' },
  );
});

test('famílias preservam caminho autoral por alias contido na raiz', (t) => {
  const root = temporary(t);
  const directory = join(root, 'templates/docs/conventions');
  write(root, 'templates/docs/conventions/real/regra.tpl.md', source('Regra'));
  write(
    root,
    'templates/docs/conventions/real/regra.extra.tpl.md',
    source('Filho'),
  );
  try {
    symlinkSync(
      join(directory, 'real'),
      join(directory, 'alias'),
      process.platform === 'win32' ? 'junction' : 'dir',
    );
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      t.skip(`Links indisponíveis: ${error.code}`);
      return;
    }
    throw error;
  }
  const family = resolveFamily(
    root,
    'templates/docs/conventions',
    'alias/regra.tpl.md',
    'docs/conventions',
  );
  assert.equal(family.parent.targetDisplay, 'docs/conventions/alias/regra.md');
  assert.equal(
    family.parent.sourceDisplay,
    'templates/docs/conventions/alias/regra.tpl.md',
  );
  assert.equal(
    family.children[0].targetDisplay,
    'docs/conventions/alias/regra.extra.md',
  );
});

test('separadores Windows em campos operacionais geram caminhos públicos portáveis', (t) => {
  const root = temporary(t);
  write(root, 'templates/docs/conventions/grupo/regra.tpl.md', source('Regra'));
  const family = resolveFamily(
    root,
    'templates\\docs\\conventions',
    'grupo\\regra.tpl.md',
    'docs\\conventions',
  );
  assert.equal(family.parent.targetDisplay, 'docs/conventions/grupo/regra.md');
  assert.equal(
    family.parent.sourceDisplay,
    'templates/docs/conventions/grupo/regra.tpl.md',
  );
});

test('destinos com hardlinks são preservados antes de qualquer publicação', (t) => {
  const root = temporary(t);
  const original = write(root, 'AGENTS.md', 'Arquivo próprio preservado.\n');
  mkdirSync(join(root, 'docs'), { recursive: true });
  try {
    linkSync(original, join(root, 'docs/regra.md'));
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      t.skip(`Hardlinks indisponíveis: ${error.code}`);
      return;
    }
    throw error;
  }
  assert.throws(
    () => assertUniqueDestinations(root, ['AGENTS.md', 'docs/regra.md']),
    { code: 'DESTINATION_HARDLINK' },
  );
  assert.equal(readFileSync(original, 'utf8'), 'Arquivo próprio preservado.\n');
  assert.equal(
    readFileSync(join(root, 'docs/regra.md'), 'utf8'),
    'Arquivo próprio preservado.\n',
  );
});
