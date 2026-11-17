import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { parse, stringify } from 'yaml';
import {
  command,
  commit,
  copyTree,
  fixtureRoot,
  git,
  initGit,
  installArtifact,
  manifest,
  npmCli,
  projectRoot,
  snapshot,
  source,
  successful,
  walk,
  windows,
  write,
} from './helpers.mjs';

let artifact;
let company;
let remote;
let protectedRoot;
function rootPublicationState() {
  const records = {};
  const names = ['AGENTS.md', '.agents/base.json'];
  for (const relative of walk(path.join(projectRoot, '.agents/skills'))) {
    if (relative.startsWith('openspec-'))
      names.push(`.agents/skills/${relative}`);
  }
  for (const relative of names)
    records[relative] = createHash('sha256')
      .update(readFileSync(path.join(projectRoot, relative)))
      .digest('hex');
  return {
    records,
    head: git(projectRoot, 'rev-parse', 'HEAD'),
    tags: git(
      projectRoot,
      'for-each-ref',
      '--format=%(refname):%(objectname)',
      'refs/tags',
    ),
    remotes: git(projectRoot, 'remote', '-v'),
  };
}
before(
  () => {
    protectedRoot = rootPublicationState();
    artifact = installArtifact();
  },
  { timeout: 180000 },
);
after(() => {
  try {
    assert.deepEqual(
      rootPublicationState(),
      protectedRoot,
      'testes não publicam nem alteram a raiz real',
    );
  } finally {
    artifact?.cleanup();
  }
});

function location(name) {
  return path.join(artifact.root, name);
}
function assertPreserved(root, before) {
  assert.deepEqual(snapshot(root), before);
}
function assertNoEffects(root) {
  for (const absent of [
    '.git',
    'package.json',
    'agents-compose.yml',
    '.cache',
  ]) {
    assert.equal(existsSync(path.join(root, absent)), false, absent);
  }
  assert.ok(existsSync(path.join(root, 'AGENTS.md')));
  assert.ok(existsSync(path.join(root, '.agents/base.json')));
  assert.deepEqual(walk(path.join(root, '.agents/skills')), [
    'agents-update-version/SKILL.md',
    'agents-write-conventions/SKILL.md',
  ]);
}

test('o artefato instalado expõe o bin e somente assets públicos necessários', () => {
  const provenance = JSON.parse(
    readFileSync(path.join(fixtureRoot, 'provenance.json'), 'utf8'),
  );
  for (const relative of walk(path.join(fixtureRoot, 'accepted-inputs'))) {
    const normalized = readFileSync(
      path.join(fixtureRoot, 'accepted-inputs', relative),
      'utf8',
    ).replaceAll('\r\n', '\n');
    assert.equal(
      createHash('sha256').update(normalized).digest('hex'),
      provenance.accepted_stage0_candidate.files_sha256_lf[relative],
      `proveniência da entrada aceita ${relative}`,
    );
  }
  for (const profile of ['neutral', 'local']) {
    for (const [relative, hash] of Object.entries(
      provenance.output_sha256[profile],
    )) {
      assert.equal(
        createHash('sha256')
          .update(
            readFileSync(
              path.join(fixtureRoot, 'accepted-outputs', profile, relative),
            ),
          )
          .digest('hex'),
        hash,
        `proveniência da saída aceita ${profile}/${relative}`,
      );
    }
  }
  const metadata = JSON.parse(
    readFileSync(path.join(artifact.installedRoot, 'package.json'), 'utf8'),
  );
  assert.equal(metadata.name, '@devel-solid/agents');
  assert.equal(metadata.type, 'module');
  assert.equal(metadata.bin.agents, 'dist/cli.js');
  const files = artifact.metadata.files.map((file) => file.path);
  for (const excluded of [
    'src/',
    'tests/',
    '.git/',
    '.cache/',
    '.agents/',
    'templates/docs/conventions-local/',
  ]) {
    assert.equal(
      files.some((file) => file.startsWith(excluded)),
      false,
      excluded,
    );
  }
  assert.ok(
    files.some((file) => file.endsWith('agents-compose.v1.schema.json')),
  );
  assert.ok(files.some((file) => file.endsWith('contratos-de-composicao.md')));
  assert.equal(
    files.some((file) => file.endsWith('agents-compose.v2.schema.json')),
    false,
  );
  assert.equal(
    files.some((file) => file === 'dist/doctor.js'),
    false,
  );
  for (const skill of [
    'agents-update-docs',
    'agents-update-version',
    'agents-write-conventions',
  ])
    assert.ok(files.includes(`assets/integration/${skill}/SKILL.md`));
  assert.equal(
    existsSync(path.join(artifact.installedRoot, 'node_modules/typescript')),
    false,
  );
  for (const flag of ['--help', '--version']) {
    const result = command(process.execPath, [artifact.cli, flag], {
      env: artifact.runtimeEnv,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.ok(result.stdout.trim());
    assert.doesNotMatch(result.stdout + result.stderr, /Traceback|\.py\b/);
  }
  const installedShim = path.resolve(
    artifact.installedRoot,
    '../../.bin',
    windows ? 'agents.cmd' : 'agents',
  );
  assert.ok(existsSync(installedShim), 'npm deve instalar o executável agents');
  const result = windows
    ? command(
        process.env.ComSpec || 'cmd.exe',
        ['/d', '/c', 'agents.cmd', '--version'],
        { env: artifact.runtimeEnv, cwd: path.dirname(installedShim) },
      )
    : command(installedShim, ['--version'], { env: artifact.runtimeEnv });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(
    result.stdout,
    new RegExp(metadata.version.replaceAll('.', '\\.')),
  );
  const npmVersion = successful(
    process.execPath,
    [npmCli(), 'exec', '--no', '--', 'agents', '--version'],
    {
      cwd: path.resolve(artifact.installedRoot, '../../..'),
      env: {
        ...artifact.runtimeEnv,
        ...(windows ? {} : { npm_config_script_shell: '/bin/sh' }),
      },
    },
  );
  assert.equal(npmVersion, metadata.version);
});

test('init --base e validate --base funcionam sem Git, rede, Python, Make ou compilador', () => {
  const root = location('base vazia á');
  const preview = artifact.run(root, ['init', '--base', '--dry-run'], {
    env: artifact.nodeOnlyEnv,
  });
  assert.deepEqual(preview.changes.map((item) => item.path).sort(), [
    '.agents/base.json',
    '.agents/skills/agents-update-version/SKILL.md',
    '.agents/skills/agents-write-conventions/SKILL.md',
    'AGENTS.md',
    'README.md',
    'templates/AGENTS.tpl.md',
    'templates/docs/conventions/README.md',
  ]);
  assert.deepEqual(walk(root), []);
  artifact.run(root, ['init', '--base'], { env: artifact.nodeOnlyEnv });
  assertNoEffects(root);
  assert.equal(
    readFileSync(
      path.join(root, '.agents/skills/agents-update-version/SKILL.md'),
      'utf8',
    ),
    readFileSync(
      path.join(
        artifact.installedRoot,
        'assets/integration/agents-update-version/SKILL.md',
      ),
      'utf8',
    ),
  );
  assert.equal(
    existsSync(path.join(root, '.agents/skills/agents-update-docs')),
    false,
  );
  assert.ok(existsSync(path.join(root, 'templates/AGENTS.tpl.md')));
  assert.equal(
    walk(path.join(root, 'templates/docs/conventions')).filter((name) =>
      name.endsWith('.tpl.md'),
    ).length,
    0,
  );
  const before = snapshot(root);
  artifact.run(root, ['validate', '--base'], { env: artifact.nodeOnlyEnv });
  assert.equal(
    artifact.run(root, ['init', '--base'], { env: artifact.nodeOnlyEnv })
      .changes.length,
    0,
  );
  assertPreserved(root, before);
  for (const args of [
    ['init', '--starter', 'minimal'],
    ['init', '--base', '--repository', 'file:///invalid'],
    ['init', '--base', '--ref', 'v1'],
    ['init', '--base', '--convention', 'a.tpl.md'],
  ]) {
    artifact.run(root, args, { status: 2, env: artifact.nodeOnlyEnv });
    assertPreserved(root, before);
  }
});

test('init --base instala a skill ausente e preserva conflitos do pacote instalado', () => {
  const root = location('base skill instalação');
  const skill = '.agents/skills/agents-update-version/SKILL.md';
  artifact.run(root, ['init', '--base'], { env: artifact.nodeOnlyEnv });
  rmSync(path.join(root, '.agents/skills/agents-update-version'), {
    recursive: true,
  });
  const before = snapshot(root);
  const preview = artifact.run(root, ['init', '--base', '--dry-run'], {
    env: artifact.nodeOnlyEnv,
  });
  assert.deepEqual(
    preview.changes.map((c) => c.path),
    [skill],
  );
  assertPreserved(root, before);
  artifact.run(root, ['init', '--base'], { env: artifact.nodeOnlyEnv });
  const stable = snapshot(root);
  assert.deepEqual(
    artifact.run(root, ['init', '--base'], { env: artifact.nodeOnlyEnv })
      .changes,
    [],
  );
  assertPreserved(root, stable);
  for (const extra of [false, true]) {
    const conflict = location(`base skill conflito ${extra}`);
    const bundled = readFileSync(
      path.join(
        artifact.installedRoot,
        'assets/integration/agents-update-version/SKILL.md',
      ),
      'utf8',
    );
    write(conflict, skill, extra ? bundled : 'Skill personalizada\n');
    if (extra)
      write(
        conflict,
        '.agents/skills/agents-update-version/anotacoes.md',
        'Não remover\n',
      );
    const protectedFiles = snapshot(conflict);
    for (const args of [
      ['init', '--base', '--dry-run'],
      ['init', '--base'],
    ]) {
      const rejected = artifact.run(conflict, args, {
        status: 2,
        env: artifact.nodeOnlyEnv,
      });
      assert.ok(
        rejected.diagnostics.some((d) => d.code === 'INTEGRATION_CONFLICT'),
      );
      assertPreserved(conflict, protectedFiles);
    }
  }
});

test('os dois modos instalam a curadoria do pacote, reparam ausência e preservam cópias atuais', () => {
  const skill = '.agents/skills/agents-write-conventions/SKILL.md';
  const bundled = readFileSync(
    path.join(
      artifact.installedRoot,
      'assets/integration/agents-write-conventions/SKILL.md',
    ),
  );
  for (const mode of [[], ['--base']]) {
    const root = location(`curadoria ${mode.length ? 'base' : 'consumidor'}`);
    const args = ['init', ...mode];
    const preview = artifact.run(root, [...args, '--dry-run'], {
      env: artifact.nodeOnlyEnv,
    });
    assert.equal(preview.changes.length, mode.length ? 7 : 5);
    assert.ok(preview.changes.some((c) => c.path === skill));
    assert.deepEqual(walk(root), []);
    artifact.run(root, args, { env: artifact.nodeOnlyEnv });
    assert.deepEqual(readFileSync(path.join(root, skill)), bundled);
    const stable = snapshot(root, { skip: [] });
    const stamp = statSync(path.join(root, skill)).mtimeMs;
    assert.deepEqual(
      artifact.run(root, args, { env: artifact.nodeOnlyEnv }).changes,
      [],
    );
    assert.deepEqual(snapshot(root, { skip: [] }), stable);
    assert.equal(statSync(path.join(root, skill)).mtimeMs, stamp);
    rmSync(path.join(root, '.agents/skills/agents-write-conventions'), {
      recursive: true,
    });
    const missing = snapshot(root, { skip: [] });
    assert.deepEqual(
      artifact
        .run(root, [...args, '--dry-run'], { env: artifact.nodeOnlyEnv })
        .changes.map((c) => c.path),
      [skill],
    );
    assert.deepEqual(snapshot(root, { skip: [] }), missing);
    artifact.run(root, args, { env: artifact.nodeOnlyEnv });
    const repaired = snapshot(root, { skip: [] });
    assert.equal(repaired[skill].sha256, stable[skill].sha256);
    delete repaired[skill];
    const untouched = { ...stable };
    delete untouched[skill];
    assert.deepEqual(repaired, untouched);
  }
});

test('curadoria personalizada ou com arquivo extra bloqueia os dois modos antes de qualquer escrita', () => {
  const skill = '.agents/skills/agents-write-conventions/SKILL.md';
  const bundled = readFileSync(
    path.join(
      artifact.installedRoot,
      'assets/integration/agents-write-conventions/SKILL.md',
    ),
    'utf8',
  );
  for (const base of [false, true])
    for (const extra of [false, true]) {
      const root = location(`conflito curadoria ${base} ${extra}`);
      write(root, skill, extra ? bundled : 'Curadoria da equipe\n');
      if (extra)
        write(
          root,
          '.agents/skills/agents-write-conventions/notas.md',
          'Preservar\n',
        );
      const before = snapshot(root, { skip: [] });
      for (const dry of [true, false]) {
        const result = artifact.run(
          root,
          ['init', ...(base ? ['--base'] : []), ...(dry ? ['--dry-run'] : [])],
          { status: 2, env: artifact.nodeOnlyEnv },
        );
        assert.ok(
          result.diagnostics.some((d) => d.code === 'INTEGRATION_CONFLICT'),
        );
        assert.deepEqual(snapshot(root, { skip: [] }), before);
      }
    }
});

test('init rejeita os dois sentidos do papel híbrido antes de qualquer escrita', () => {
  for (const baseFirst of [true, false]) {
    const root = location(`dois papeis ${baseFirst}`);
    artifact.run(root, ['init', ...(baseFirst ? ['--base'] : [])], {
      env: artifact.nodeOnlyEnv,
    });
    const before = snapshot(root, { skip: [] });
    for (const dry of [true, false]) {
      const result = artifact.run(
        root,
        [
          'init',
          ...(baseFirst ? [] : ['--base']),
          ...(dry ? ['--dry-run'] : []),
        ],
        { status: 2, env: artifact.nodeOnlyEnv },
      );
      assert.ok(
        result.diagnostics.some((d) => d.code === 'PROJECT_ROLE_CONFLICT'),
      );
      assert.deepEqual(snapshot(root, { skip: [] }), before);
    }
  }
});

test('starter explícito tem duas fontes; conflitos impedem qualquer gravação e preservam edições', () => {
  const root = location('base starter');
  artifact.run(root, ['init', '--base', '--starter', 'minimal'], {
    env: artifact.nodeOnlyEnv,
  });
  artifact.run(root, ['validate', '--base'], { env: artifact.nodeOnlyEnv });
  assertNoEffects(root);
  assert.equal(
    walk(path.join(root, 'templates/docs/conventions')).filter((name) =>
      name.endsWith('.tpl.md'),
    ).length,
    2,
  );
  const before = snapshot(root);
  assert.equal(
    artifact.run(root, ['init', '--base', '--starter', 'minimal'], {
      env: artifact.nodeOnlyEnv,
    }).changes.length,
    0,
  );
  assertPreserved(root, before);
  const conflict = location('base conflito');
  write(conflict, 'templates/AGENTS.tpl.md', '# Minha base editada\n');
  const protectedBefore = snapshot(conflict);
  artifact.run(conflict, ['init', '--base', '--starter', 'minimal'], {
    status: 2,
    env: artifact.nodeOnlyEnv,
  });
  assertPreserved(conflict, protectedBefore);
});

test('validate --base inspeciona todas as famílias, órfãos e colisões portáveis sem gravar', () => {
  const root = location('base validação');
  artifact.run(root, ['init', '--base'], { env: artifact.nodeOnlyEnv });
  for (const name of ['alfa', 'beta', 'gamma'])
    write(root, `templates/docs/conventions/${name}.tpl.md`, source(name));
  write(
    root,
    'templates/docs/conventions/alfa.detalhes.tpl.md',
    source('Detalhes'),
  );
  artifact.run(root, ['validate', '--base'], { env: artifact.nodeOnlyEnv });
  const cases = [
    ['templates/docs/conventions/invalida.tpl.md', '# Sem card\n'],
    ['templates/docs/conventions/orfa.detalhes.tpl.md', source('Órfã')],
    [
      'templates/docs/conventions/extra.mais.nivel.tpl.md',
      source('Profundidade inválida'),
    ],
  ];
  if (!existsSync(path.join(root, 'templates/docs/conventions/ALFA.tpl.md'))) {
    cases.push([
      'templates/docs/conventions/ALFA.tpl.md',
      source('Mesmo nome portável'),
    ]);
  }
  for (const [relative, contents] of cases) {
    const target = write(root, relative, contents);
    const before = snapshot(root);
    const result = artifact.run(root, ['validate', '--base'], {
      status: 2,
      env: artifact.nodeOnlyEnv,
    });
    assert.ok(
      result.diagnostics.some(
        (diagnostic) => diagnostic.message || diagnostic.location,
      ),
    );
    assertPreserved(root, before);
    rmSync(target);
  }
});

test('uma base empresarial independente publica apenas em remoto Git descartável e atende dois consumidores', () => {
  company = location('empresa sem nomes padrão');
  remote = location('remote somente local.git');
  artifact.run(company, ['init', '--base'], { env: artifact.nodeOnlyEnv });
  for (const [name, title] of [
    ['engenharia', 'Engenharia da Empresa'],
    ['qualidade', 'Qualidade da Empresa'],
    ['entrega', 'Entrega da Empresa'],
  ]) {
    write(
      company,
      `templates/docs/conventions/${name}.tpl.md`,
      source(title, `Conteúdo empresarial ${name}.`),
    );
  }
  write(
    company,
    'templates/docs/conventions/engenharia.projetos.tpl.md',
    source('Projetos da Empresa', 'Detalhe empresarial próprio.'),
  );
  artifact.run(company, ['validate', '--base'], { env: artifact.nodeOnlyEnv });
  assertNoEffects(company);
  initGit(company);
  commit(company);
  git(company, 'tag', 'v1.0.0');
  successful('git', ['init', '--bare', remote]);
  git(company, 'remote', 'add', 'origin', remote);
  git(company, 'push', 'origin', 'main', 'v1.0.0');
  for (const [name, selections] of [
    ['consumer um', ['engenharia']],
    ['consumer dois', ['qualidade', 'entrega']],
  ]) {
    const root = location(name);
    artifact.run(root, ['init']);
    write(
      root,
      'agents-compose.yml',
      stringify(
        manifest(
          remote,
          'v1.0.0',
          selections.map((selection) => ({
            origin: 'remote',
            from: selection + '.tpl.md',
          })),
        ),
      ),
    );
    assert.equal(
      existsSync(path.join(root, 'AGENTS.md')),
      false,
      'init não gera documentos',
    );
    const parsed = parse(
      readFileSync(path.join(root, 'agents-compose.yml'), 'utf8'),
    );
    assert.equal(parsed.agents.repository, remote);
    const conventions = parsed.outputs['AGENTS.md'].include.conventions;
    assert.deepEqual(
      conventions.entries
        .filter((entry) => entry.origin === 'remote')
        .map((entry) => entry.from),
      selections.map((selection) => `${selection}.tpl.md`),
    );
    assert.equal(
      conventions.entries.some((entry) => entry.origin === 'local'),
      false,
      'v1 descobre o contexto pela pasta',
    );
    write(
      root,
      `${conventions.local.tpl_dir}/contexto-do-projeto.tpl.md`,
      source(`Contexto ${name}`, `Só ${name} recebe este contexto.`),
    );
    write(
      root,
      'docs/conventions/nao-remover.md',
      'Arquivo próprio não selecionado.\n',
    );
    write(
      root,
      'docs/conventions/engenharia.md',
      'Antigo arquivo plano não deve ser removido por inferência.\n',
    );
    artifact.run(root, ['validate']);
    const before = snapshot(root);
    const preview = artifact.run(root, ['sync', '--dry-run']);
    assert.ok(preview.changes.length > 0);
    assertPreserved(root, before);
    const check = artifact.run(root, ['sync', '--check'], { status: 1 });
    assert.deepEqual(check.changes, preview.changes);
    assertPreserved(root, before);
    artifact.run(root, ['sync']);
    const stable = snapshot(root);
    assert.equal(artifact.run(root, ['sync']).changes.length, 0);
    artifact.run(root, ['sync', '--check']);
    artifact.run(root, ['validate']);
    assertPreserved(root, stable);
    const allGenerated = walk(path.join(root, 'docs/conventions'))
      .map((file) =>
        readFileSync(path.join(root, 'docs/conventions', file), 'utf8'),
      )
      .join('\n');
    assert.ok(allGenerated.includes(`Só ${name} recebe este contexto.`));
    assert.equal(
      readFileSync(path.join(root, 'docs/conventions/nao-remover.md'), 'utf8'),
      'Arquivo próprio não selecionado.\n',
    );
    assert.doesNotMatch(
      allGenerated,
      /masculino genérico|Lefthook|Use `pt-BR`|devel-solid\/agents\.git/,
    );
    const manifestBefore = readFileSync(path.join(root, 'agents-compose.yml'));
    const outputsBefore = snapshot(root);
    assert.equal(artifact.run(root, ['init']).changes.length, 0);
    assertPreserved(root, outputsBefore);
    assert.deepEqual(
      readFileSync(path.join(root, 'agents-compose.yml')),
      manifestBefore,
    );
  }
});

test('init sem parâmetros preserva manifests e rejeita seleção por flags e integração personalizada', () => {
  const root = location('consumer sem seleção');
  artifact.run(root, ['init'], { env: artifact.nodeOnlyEnv });
  for (const args of [
    ['init', '--repository', remote, '--ref', 'v1.0.0'],
    [
      'init',
      '--repository',
      remote,
      '--ref',
      'v1.0.0',
      '--convention',
      'ausente.tpl.md',
    ],
  ]) {
    const before = snapshot(root);
    const result = artifact.run(root, args, { status: 2 });
    assert.ok(result.diagnostics.length > 0);
    assertPreserved(root, before);
  }
  const configured = location('consumer configurado');
  const initial = stringify(
    manifest(remote, 'v1.0.0', [
      { origin: 'remote', from: 'qualidade.tpl.md' },
    ]),
  );
  write(configured, 'agents-compose.yml', `# edição própria\n${initial}`);
  write(configured, 'AGENTS.md', 'Documento já existente.\n');
  artifact.run(configured, ['init']);
  assert.equal(
    readFileSync(path.join(configured, 'agents-compose.yml'), 'utf8'),
    `# edição própria\n${initial}`,
  );
  assert.equal(
    readFileSync(path.join(configured, 'AGENTS.md'), 'utf8'),
    'Documento já existente.\n',
  );
  const before = snapshot(configured);
  artifact.run(configured, ['init', '--repository', 'outro-repositorio'], {
    status: 2,
  });
  assertPreserved(configured, before);
  write(
    configured,
    '.agents/skills/agents-update-docs/SKILL.md',
    'Integração customizada pelo consumidor.\n',
  );
  const customized = snapshot(configured);
  artifact.run(configured, ['init'], { status: 2 });
  assertPreserved(configured, customized);
});

test('o pin controla conteúdo e nunca executa código nem substitui integração', () => {
  const root = location('consumer conteúdo como dados');
  artifact.run(root, ['init']);
  write(
    root,
    'agents-compose.yml',
    stringify(
      manifest(remote, 'v1.0.0', [
        { origin: 'remote', from: 'qualidade.tpl.md' },
      ]),
    ),
  );
  artifact.run(root, ['sync']);
  const integration = readFileSync(
    path.join(root, '.agents/skills/agents-update-docs/SKILL.md'),
  );
  const cacheRoot = path.join(root, '.cache/agents');
  const cachedCheckouts = readdirSync(cacheRoot);
  assert.equal(cachedCheckouts.length, 1);
  const cache = path.join(cacheRoot, cachedCheckouts[0]);
  write(
    cache,
    'templates/docs/conventions/qualidade.tpl.md',
    source('Não publicado', 'EDIÇÃO SUJA NÃO PUBLICAR.'),
  );
  artifact.run(root, ['sync']);
  assert.doesNotMatch(
    readFileSync(path.join(root, 'docs/conventions/qualidade.md'), 'utf8'),
    /EDIÇÃO SUJA/,
  );
  rmSync(path.join(cache, '.git'), {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
  artifact.run(root, ['sync']);
  assert.ok(
    existsSync(path.join(cache, '.git')),
    'cache inválido é reconstruído da fonte selecionada',
  );
  write(
    company,
    '.agents/skills/agents-update-docs/SKILL.md',
    'NÃO COPIAR ESTA SKILL REMOTA\n',
  );
  write(
    company,
    '.agents/skills/agents-update-docs/scripts/update_docs.py',
    'raise Exception("NÃO EXECUTAR")\n',
  );
  write(company, 'engine.js', 'throw new Error("NÃO EXECUTAR");\n');
  write(
    company,
    'templates/docs/conventions/qualidade.tpl.md',
    source('Qualidade da Empresa', 'Nova política autoral da empresa.'),
  );
  commit(company, 'conteúdo posterior');
  git(company, 'tag', 'v1.1.0');
  git(company, 'push', 'origin', 'main', 'v1.1.0');
  const config = parse(
    readFileSync(path.join(root, 'agents-compose.yml'), 'utf8'),
  );
  config.agents.ref = 'v1.1.0';
  write(root, 'agents-compose.yml', stringify(config));
  artifact.run(root, ['sync']);
  assert.match(
    readFileSync(path.join(root, 'docs/conventions/qualidade.md'), 'utf8'),
    /Nova política autoral/,
  );
  assert.deepEqual(
    readFileSync(path.join(root, '.agents/skills/agents-update-docs/SKILL.md')),
    integration,
  );
  assert.equal(
    existsSync(
      path.join(
        root,
        '.agents/skills/agents-update-docs/scripts/update_docs.py',
      ),
    ),
    false,
  );
  assert.equal(existsSync(path.join(root, 'engine.js')), false);
});

test('tarball preserva conteúdo histórico com descoberta local v1 e segunda sync vazia', () => {
  const seed = location('base candidata aceita');
  const inputs = path.join(fixtureRoot, 'accepted-inputs');
  copyTree(
    path.join(inputs, 'templates/docs/conventions'),
    path.join(seed, 'templates/docs/conventions'),
  );
  write(
    seed,
    'templates/AGENTS.tpl.md',
    readFileSync(path.join(inputs, 'templates/AGENTS.tpl.md')),
  );
  initGit(seed);
  commit(seed);
  git(seed, 'tag', 'v1.0.0');
  const provenance = JSON.parse(
    readFileSync(path.join(fixtureRoot, 'provenance.json'), 'utf8'),
  );
  for (const profile of ['neutral', 'local']) {
    const root = location(`perfil aceito ${profile}`);
    let config;
    if (profile === 'local') {
      config = parse(
        readFileSync(path.join(inputs, 'agents-compose.yml'), 'utf8'),
      );
      config.agents = { repository: seed, ref: 'v1.0.0' };
      // O manifesto privado é evidência histórica; apenas o teste adapta sua seleção ao contrato público.
      config.schemaVersion = 1;
      config.outputs['AGENTS.md'].include.conventions.entries = config.outputs[
        'AGENTS.md'
      ].include.conventions.entries.filter(
        (entry) => entry.origin === 'remote',
      );
      copyTree(
        path.join(inputs, 'templates/docs/conventions-local'),
        path.join(root, 'templates/docs/conventions-local'),
      );
    } else {
      const remoteNames = walk(
        path.join(seed, 'templates/docs/conventions'),
      ).filter((file) => file.endsWith('.tpl.md'));
      config = manifest(seed, 'v1.0.0', [
        ...remoteNames.map((from) => ({ origin: 'remote', from })),
      ]);
      // A fixture Python aceita posiciona o card após o corpo; o renderer remove o bloco sem alterar o restante.
      write(
        root,
        'templates/docs/conventions-local/contexto-do-projeto.tpl.md',
        '# Contexto do Consumidor\n\nEste projeto registra observações de pássaros.\n\n<!-- AGENT-CARD START -->\nLeia este documento antes de trabalhar no projeto de observação.\n<!-- AGENT-CARD END -->\n',
      );
    }
    write(root, 'agents-compose.yml', stringify(config));
    write(
      root,
      'docs/conventions/anotacoes-do-consumidor.md',
      'Anotações próprias: não remover.\n',
    );
    artifact.run(root, ['init']);
    artifact.run(root, ['sync']);
    const expectedRoot = path.join(fixtureRoot, 'accepted-outputs', profile);
    for (const relative of walk(expectedRoot)) {
      const reordered = profile === 'local' && relative === 'AGENTS.md';
      const expected = readFileSync(
        reordered
          ? path.join(fixtureRoot, 'schema-v1/local-AGENTS.md')
          : path.join(expectedRoot, relative),
      );
      const actual = readFileSync(path.join(root, relative));
      assert.deepEqual(actual, expected, `${profile}/${relative}`);
      if (!reordered)
        assert.equal(
          createHash('sha256').update(actual).digest('hex'),
          provenance.output_sha256[profile][relative],
        );
      assert.equal(actual.includes(13), false, 'UTF-8/LF');
    }
    const before = snapshot(root);
    assert.equal(artifact.run(root, ['sync']).changes.length, 0);
    artifact.run(root, ['sync', '--check']);
    assertPreserved(root, before);
    if (profile === 'neutral') {
      const all = walk(expectedRoot)
        .map((relative) => readFileSync(path.join(root, relative), 'utf8'))
        .join('\n');
      assert.doesNotMatch(
        all,
        /Lefthook|masculino genérico|Use `pt-BR`|O agente deve fazer somente/,
      );
    }
    const saved = snapshot(root);
    config.outputs['AGENTS.md'].include.conventions.entries = [
      { origin: 'remote', from: 'uuid-em-novas-implementacoes.tpl.md' },
    ];
    write(root, 'agents-compose.yml', stringify(config));
    const invalidBefore = snapshot(root);
    artifact.run(root, ['sync'], { status: 2 });
    assertPreserved(root, invalidBefore);
    assert.deepEqual(snapshot(root)['AGENTS.md'], saved['AGENTS.md']);
  }
});

test('todos os consumidores do manifesto rejeitam versão/chaves/YAML inválidos sem escrever', () => {
  const root = location('erros manifesto');
  const valid = manifest(remote, 'v1.0.0', [
    { origin: 'remote', from: 'qualidade.tpl.md' },
  ]);
  const cases = [
    stringify({ ...valid, schemaVersion: 2 }),
    stringify(
      Object.fromEntries(
        Object.entries(valid).filter(([key]) => key !== 'schemaVersion'),
      ),
    ),
    stringify({
      ...valid,
      outputs: {
        'AGENTS.md': {
          include: {
            conventions: {
              ...valid.outputs['AGENTS.md'].include.conventions,
              entries: [{ origin: 'local', from: 'regra.tpl.md' }],
            },
          },
        },
      },
    }),
    stringify({ ...valid, schemaVersion: 99 }),
    stringify({ ...valid, agents: { ...valid.agents, bootstrap: true } }),
    stringify({ ...valid, outputs: { ...valid.outputs, skills: [] } }),
    'agents:\n  ref: v1\n  ref: v2\n',
    'agents:\n\trepository: incorreto\n',
  ];
  for (const contents of cases) {
    write(root, 'agents-compose.yml', contents);
    const before = snapshot(root);
    for (const args of [
      ['init'],
      ['validate'],
      ['sync'],
      ['sync', '--dry-run'],
      ['sync', '--check'],
    ]) {
      const result = artifact.run(root, args, { status: 2 });
      assert.ok(result.diagnostics.length > 0, args.join(' '));
      assertPreserved(root, before);
    }
  }
});

test('códigos de saída distinguem Git ausente e falha operacional com credenciais redigidas', () => {
  const root = location('prerequisitos');
  write(root, 'agents-compose.yml', stringify(manifest(remote, 'v1.0.0', [])));
  const before = snapshot(root);
  for (const args of [['validate'], ['sync']]) {
    const result = artifact.run(root, args, {
      status: 2,
      env: artifact.nodeOnlyEnv,
    });
    assert.ok(
      result.diagnostics.some((diagnostic) => /git/i.test(diagnostic.message)),
    );
    assertPreserved(root, before);
  }
  artifact.run(root, ['init'], { env: artifact.nodeOnlyEnv });
  assert.equal(existsSync(path.join(root, '.cache')), false);
  write(
    root,
    'agents-compose.yml',
    stringify(
      manifest(
        'https://login:private-secret@example.invalid/private.git',
        'v1.0.0',
        [],
      ),
    ),
  );
  const result = artifact.run(root, ['sync'], { status: 3 });
  assert.doesNotMatch(JSON.stringify(result), /private-secret|login:/);
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.remediation ||
        /acesso|permiss|Git|git/.test(diagnostic.message),
    ),
  );
  artifact.run(root, ['comando-inexistente'], { status: 2 });
});

test('release do tarball calcula, simula e cria somente uma tag local', () => {
  const root = location('maintainer local');
  artifact.run(root, ['init', '--base']);
  initGit(root);
  const head = commit(root);
  git(root, 'tag', 'v1.2.3');
  const noGit = artifact.run(
    root,
    ['release', '--bump', 'minor', '--dry-run'],
    { status: 2, env: artifact.nodeOnlyEnv },
  );
  assert.ok(noGit.diagnostics.some((d) => d.code === 'GIT_MISSING'));
  const before = snapshot(root, { skip: [] });
  const preview = artifact.run(root, [
    'release',
    '--bump',
    'minor',
    '--dry-run',
  ]);
  assert.equal(preview.result.nextVersion, 'v1.3.0');
  assert.equal(preview.result.applied, false);
  assert.deepEqual(snapshot(root, { skip: [] }), before);
  const files = snapshot(root);
  const result = artifact.run(root, ['release', '--bump', 'minor']);
  assert.equal(result.result.applied, true);
  assert.equal(git(root, 'rev-parse', 'v1.3.0'), head);
  assert.deepEqual(snapshot(root), files);
  assert.equal(existsSync(path.join(root, 'agents-compose.yml')), false);
});

test('tarball completa init, cópia, validate e sync somente com Node', () => {
  const root = location('consumer local sem Git');
  const empty = snapshot(root);
  artifact.run(root, ['init', '--dry-run'], { env: artifact.nodeOnlyEnv });
  assertPreserved(root, empty);
  artifact.run(root, ['init'], { env: artifact.nodeOnlyEnv });
  write(
    root,
    'templates/docs/conventions-local/commits.tpl.md',
    source('Commits', 'Use Conventional Commits.'),
  );
  artifact.run(root, ['validate'], { env: artifact.nodeOnlyEnv });
  const authored = snapshot(root);
  const preview = artifact.run(root, ['sync', '--dry-run'], {
    env: artifact.nodeOnlyEnv,
  });
  assert.equal(preview.changes.length, 3);
  assertPreserved(root, authored);
  artifact.run(root, ['sync'], { env: artifact.nodeOnlyEnv });
  const stable = snapshot(root);
  artifact.run(root, ['sync', '--check'], { env: artifact.nodeOnlyEnv });
  artifact.run(root, ['init'], { env: artifact.nodeOnlyEnv });
  assertPreserved(root, stable);
  assert.equal(existsSync(path.join(root, '.cache')), false);
});
