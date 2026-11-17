import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
} from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { EngineError, type LoadedManifest } from './manifest.js';
import { ensureRuntimeIgnored } from './runtime.js';
import {
  canonicalJson,
  engineVersion,
  lockMatchesManifest,
  readLock,
  remoteSelection,
  repositoryIdentity,
  textHash,
  type ContentLock,
} from './lock.js';
import {
  assertWithin,
  portableKey,
  resolvedPath,
  safeJoin,
  validateRelativePath,
} from './paths.js';
import {
  readText,
  validateMarkdown,
  validateMarkdownFile,
  validateTemplate,
  type ParsedSource,
} from './markdown.js';

export interface ConventionArtifact extends ParsedSource {
  sourcePath: string;
  sourceDisplay: string;
  targetDisplay: string;
}
export interface ConventionFamily {
  parent: ConventionArtifact;
  children: ConventionArtifact[];
  origin?: 'local' | 'remote';
}
export interface ResolvedComposition {
  repoRoot: string;
  manifest: LoadedManifest;
  source: {
    repository?: string;
    ref?: string;
    checkout: string;
    commit?: string;
  };
  templatePath: string;
  cacheActivity: string[];
  template: string;
  families: ConventionFamily[];
  lock?: ContentLock;
  previousLock?: ContentLock;
}
export function redact(text: string): string {
  return text
    .replace(
      /([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+(?::[^\s/@]*)?@/giu,
      '$1[redigido]@',
    )
    .replace(
      /([?&](?:access_token|token|password|secret|key|auth|credential)=)[^&\s'"<>]+/giu,
      '$1[redigido]',
    )
    .replace(
      /\b(?:gh[pousr]_[a-z0-9_]+|github_pat_[a-z0-9_]+|glpat-[a-z0-9_-]+)\b/giu,
      '[redigido]',
    )
    .replace(
      /((?:authorization\s*:\s*(?:bearer|basic)|password|access_token|secret|token)\s*[=: ]\s*)[^\s'"<>]+/giu,
      '$1[redigido]',
    );
}
export function git(args: string[], cwd?: string): string {
  const configured = process.env.AGENTS_GIT_TIMEOUT_MS ?? '30000';
  const timeout = Number(configured);
  if (
    !/^\d+$/u.test(configured) ||
    !Number.isSafeInteger(timeout) ||
    timeout < 1 ||
    timeout > 300000
  )
    throw new EngineError(
      'GIT_TIMEOUT_CONFIG',
      'AGENTS_GIT_TIMEOUT_MS deve ser um inteiro entre 1 e 300000 milissegundos.',
    );
  const supervised = spawnSync(
    process.execPath,
    [
      fileURLToPath(new URL('./git-process.js', import.meta.url)),
      String(timeout),
      ...args,
    ],
    {
      cwd,
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 40 * 1024 * 1024,
      timeout: timeout + 5000,
      killSignal: 'SIGKILL',
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    },
  );
  if (
    supervised.error &&
    (supervised.error as NodeJS.ErrnoException).code === 'ETIMEDOUT'
  )
    throw new EngineError(
      'GIT_TIMEOUT',
      `Git excedeu o limite de ${timeout} ms e foi encerrado.`,
      3,
      {
        remediation:
          'Confira o acesso à base e a rede; ajuste AGENTS_GIT_TIMEOUT_MS (1–300000) se necessário.',
      },
    );
  let result: {
    stdout: string;
    stderr: string;
    status: number | null;
    errorCode?: string;
    timedOut?: boolean;
    cancelled?: boolean;
    overflow?: boolean;
  };
  try {
    result = JSON.parse(supervised.stdout) as typeof result;
  } catch {
    throw new EngineError(
      'GIT_OPERATION',
      'O supervisor Git não concluiu a operação.',
      3,
    );
  }
  if (result.timedOut)
    throw new EngineError(
      'GIT_TIMEOUT',
      `Git excedeu o limite de ${timeout} ms; sua árvore de processos foi encerrada.`,
      3,
      {
        remediation:
          'Confira o acesso à base e a rede; ajuste AGENTS_GIT_TIMEOUT_MS (1–300000) se necessário.',
      },
    );
  if (result.cancelled)
    throw new EngineError(
      'GIT_CANCELLED',
      'Operação Git cancelada; sua árvore de processos foi encerrada.',
      3,
    );
  if (result.errorCode === 'ENOENT')
    throw new EngineError(
      'GIT_MISSING',
      'Git não está disponível no PATH.',
      2,
      { remediation: 'Instale Git e confirme git --version.' },
    );
  if (result.errorCode || result.overflow || result.status !== 0)
    throw new EngineError(
      'GIT_OPERATION',
      `Falha ao acessar conteúdo Git: ${redact(result.stderr?.trim() || (result.overflow ? 'saída excedeu o limite de 16 MiB' : 'operação encerrada sem sucesso'))}`,
      3,
      {
        remediation:
          'Confira repository/ref e o acesso com Git. Para bases privadas, use o agente SSH ou credential helper já configurado; não grave credenciais no manifesto.',
      },
    );
  return result.stdout.trim();
}
export function contentFingerprint(repository: string, ref: string): string {
  return createHash('sha256')
    .update(`${repositoryIdentity(repository)}\n${ref}`)
    .digest('hex')
    .slice(0, 16);
}
export function resolveContent(
  repoRoot: string,
  repository: string,
  ref: string,
  options: {
    commit?: string;
    lock?: ContentLock;
    offline?: boolean;
    inspect?: boolean;
  } = {},
): { checkout: string; cacheActivity: string[]; commit: string } {
  if (
    repository.startsWith('-') ||
    ref.startsWith('-') ||
    /[\r\n\0]/u.test(repository + ref)
  )
    throw new EngineError('SOURCE_IDENTITY', 'Repository/ref inválido.');
  const cacheRoot = safeJoin(repoRoot, '.cache/agents/content', 'cache');
  if (
    portableKey(cacheRoot) !==
    portableKey(join(resolvedPath(repoRoot), '.cache', 'agents', 'content'))
  )
    throw new EngineError(
      'CACHE_PATH',
      'O cache de conteúdo não pode usar links ou aliases de diretório.',
    );
  const activity: string[] = [];
  let commit = options.commit;
  const cachePath = (sha: string): string => {
    const path = join(cacheRoot, contentFingerprint(repository, sha));
    if (
      portableKey(assertWithin(path, cacheRoot, 'cache')) !== portableKey(path)
    )
      throw new EngineError(
        'CACHE_PATH',
        'A entrada de cache não pode usar links ou aliases.',
      );
    return path;
  };
  if (commit) {
    const checkout = cachePath(commit);
    if (existsSync(checkout)) {
      try {
        verifyCheckout(checkout, repository, commit, options.lock);
        return {
          checkout,
          commit,
          cacheActivity: ['Conteúdo imutável verificado no cache.'],
        };
      } catch (error) {
        if (
          !(error instanceof EngineError) ||
          [
            'GIT_MISSING',
            'GIT_TIMEOUT',
            'GIT_TIMEOUT_CONFIG',
            'GIT_CANCELLED',
          ].includes(error.code)
        )
          throw error;
        if (options.offline || options.inspect)
          throw new EngineError(
            'CACHE_INTEGRITY',
            `Cache inválido para ${repositoryIdentity(repository)} em ${commit}.`,
            2,
            {
              remediation:
                'Execute agents sync online para reparar o conteúdo no commit registrado.',
            },
          );
        activity.push(
          'Cache inválido/sujo será recriado no commit registrado.',
        );
      }
    } else if (options.offline || options.inspect)
      throw new EngineError(
        'CACHE_MISSING',
        `Cache verificado ausente para ${repositoryIdentity(repository)} em ${commit}.`,
        2,
        { remediation: 'Execute agents sync online para preencher o cache.' },
      );
  } else if (options.offline)
    throw new EngineError(
      'CACHE_OFFLINE',
      'Uma seleção remota nova não pode ser resolvida offline.',
    );
  ensureRuntimeIgnored(repoRoot);
  mkdirSync(cacheRoot, { recursive: true });
  const stage = mkdtempSync(join(cacheRoot, '.stage-'));
  try {
    git(['clone', '--no-hardlinks', '--no-checkout', '--', repository, stage]);
    if (commit) {
      // Fetch the immutable object, never the possibly moved requested ref.
      git(['-C', stage, 'fetch', '--no-tags', 'origin', commit]);
    } else commit = resolveCommit(stage, ref);
    git([
      '-C',
      stage,
      '-c',
      'advice.detachedHead=false',
      'checkout',
      '--force',
      '--detach',
      commit,
    ]);
    verifyCheckout(stage, repository, commit, options.lock);
    const checkout = cachePath(commit);
    if (existsSync(checkout)) {
      try {
        verifyCheckout(checkout, repository, commit, options.lock);
        return { checkout, commit, cacheActivity: activity };
      } catch (error) {
        if (
          error instanceof EngineError &&
          [
            'GIT_MISSING',
            'GIT_TIMEOUT',
            'GIT_TIMEOUT_CONFIG',
            'GIT_CANCELLED',
          ].includes(error.code)
        )
          throw error;
        // Rename first: no reader can observe a half-populated replacement.
        const retired = `${stage}-invalid`;
        renameSync(checkout, retired);
        rmSync(retired, { recursive: true, force: true, maxRetries: 5 });
      }
    }
    try {
      renameSync(stage, checkout);
    } catch (error) {
      if (!existsSync(checkout)) throw error;
      verifyCheckout(checkout, repository, commit, options.lock);
    }
    activity.push(
      'Checkout imutável publicado no cache; nenhum código da base foi executado.',
    );
    return { checkout, commit, cacheActivity: activity };
  } finally {
    rmSync(stage, { recursive: true, force: true, maxRetries: 5 });
  }
}
function resolveCommit(checkout: string, ref: string): string {
  const candidates = ref.startsWith('refs/heads/')
    ? [`refs/remotes/origin/${ref.slice('refs/heads/'.length)}`]
    : ref.startsWith('refs/')
      ? [ref]
      : [`refs/tags/${ref}`, `refs/remotes/origin/${ref}`, ref];
  let commit: string | undefined;
  for (const candidate of candidates) {
    try {
      // Uma branch local criada pelo clone nunca representa a atualização remota.
      if (candidate === ref && !ref.startsWith('refs/')) {
        const symbolic = git([
          '-C',
          checkout,
          'rev-parse',
          '--symbolic-full-name',
          '--verify',
          '--end-of-options',
          ref,
        ]);
        if (symbolic.startsWith('refs/heads/')) continue;
      }
      commit = git([
        '-C',
        checkout,
        'rev-parse',
        '--verify',
        '--end-of-options',
        `${candidate}^{commit}`,
      ]);
      break;
    } catch (error) {
      if (!(error instanceof EngineError) || error.code !== 'GIT_OPERATION')
        throw error;
    }
  }
  if (!commit) {
    throw new EngineError(
      'SOURCE_REF',
      `Ref de conteúdo não encontrada: ${redact(ref)}.`,
      2,
      {
        field: 'agents.ref',
        remediation: 'Escolha uma ref existente no repositório selecionado.',
      },
    );
  }
  return commit;
}
function selectedSources(
  checkout: string,
  selection: ContentLock['remote'],
): ContentLock['sources'] {
  const paths = new Set(['templates/AGENTS.tpl.md']);
  for (const from of selection.entries) {
    const parent = safeJoin(
      safeJoin(checkout, selection.tplDir),
      from,
      'lock.source',
    );
    const classification = classifySource(basename(from));
    if (!classification || classification.kind !== 'parent')
      throw new EngineError(
        'SOURCE_PARENT',
        `Selecione um pai .tpl.md: ${from}.`,
      );
    // Diagnose a missing selection before scanning its possibly absent directory.
    readText(parent);
    const scan = scanDirectory(
      dirname(parent),
      safeJoin(checkout, selection.tplDir),
    );
    paths.add(relative(checkout, parent).replaceAll('\\', '/'));
    for (const child of scan.children.get(classification.root) ?? [])
      paths.add(relative(checkout, child).replaceAll('\\', '/'));
  }
  return [...paths].sort().map((path) => ({
    path,
    sha256: textHash(readText(safeJoin(checkout, path, 'lock.source'))),
  }));
}
function verifyCheckout(
  checkout: string,
  repository: string,
  commit: string,
  lock?: ContentLock,
): void {
  if (
    portableKey(git(['-C', checkout, 'rev-parse', '--show-toplevel'])) !==
      portableKey(checkout) ||
    git(['-C', checkout, 'rev-parse', 'HEAD']) !== commit ||
    git(['-C', checkout, 'rev-parse', '--abbrev-ref', 'HEAD']) !== 'HEAD' ||
    repositoryIdentity(git(['-C', checkout, 'remote', 'get-url', 'origin'])) !==
      repositoryIdentity(repository) ||
    git([
      '-C',
      checkout,
      'status',
      '--porcelain',
      '--untracked-files=all',
      '--ignored',
    ]) !== ''
  )
    throw new EngineError(
      'CACHE_INTEGRITY',
      'Identidade, commit ou arquivos do cache foram alterados.',
    );
  if (
    lock &&
    canonicalJson(selectedSources(checkout, lock.remote)) !==
      canonicalJson(lock.sources)
  )
    throw new EngineError(
      'CACHE_INTEGRITY',
      'Inventário ou integridade das fontes do cache divergente do lock.',
    );
}
export interface ClassifiedSource {
  kind: 'parent' | 'child';
  root: string;
}
export function classifySource(name: string): ClassifiedSource | undefined {
  if (!name.endsWith('.tpl.md')) return;
  const stem = name.slice(0, -7),
    parts = stem.split('.');
  if (!parts.every(Boolean) || parts.length > 2)
    throw new EngineError(
      'SOURCE_NAME',
      `Nome de família inválido: ${name}. Use pai.tpl.md ou pai.filho.tpl.md.`,
    );
  validateRelativePath(name, 'nome de fonte', false);
  return { kind: parts.length === 1 ? 'parent' : 'child', root: parts[0]! };
}
export function scanDirectory(
  directory: string,
  sourceBase = directory,
): { parents: Map<string, string>; children: Map<string, string[]> } {
  const parents = new Map<string, string>(),
    children = new Map<string, string[]>(),
    portable = new Map<string, string>();
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
    (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  )) {
    const classification = classifySource(entry.name);
    if (!classification) continue;
    const path = join(directory, entry.name);
    assertWithin(path, sourceBase, 'fonte');
    if (!statSync(path).isFile())
      throw new EngineError('SOURCE_TYPE', `Fonte não é arquivo: ${path}.`);
    const key = portableKey(entry.name),
      previous = portable.get(key);
    if (previous)
      throw new EngineError(
        'SOURCE_COLLISION',
        `Fontes equivalentes: ${previous} e ${path}.`,
      );
    portable.set(key, path);
    if (classification.kind === 'parent')
      parents.set(classification.root, path);
    else
      children.set(classification.root, [
        ...(children.get(classification.root) ?? []),
        path,
      ]);
  }
  for (const [root, paths] of children)
    if (!parents.has(root))
      throw new EngineError(
        'SOURCE_ORPHAN',
        `Subconvention órfã sem pai correspondente: ${paths[0]}.`,
        2,
        { location: { path: paths[0]!, line: 1, column: 1 } },
      );
  return { parents, children };
}
export function listParentSources(
  sourceRoot: string,
  tplDir = 'templates/docs/conventions',
): string[] {
  const base = resolve(sourceRoot, validateRelativePath(tplDir, 'tpl_dir'));
  assertWithin(base, sourceRoot, 'tpl_dir');
  if (!existsSync(base))
    throw new EngineError('SOURCE_ROOT', `Raiz de fontes ausente: ${base}.`);
  const parents: string[] = [],
    keys = new Map<string, string>();
  function walk(directory: string, ancestry: Set<string>): void {
    const actual = assertWithin(directory, base, 'fonte');
    if (ancestry.has(actual))
      throw new EngineError(
        'SOURCE_LINK_CYCLE',
        `Ciclo de links nas fontes: ${directory}.`,
      );
    const next = new Set(ancestry);
    next.add(actual);
    const scan = scanDirectory(directory, base);
    for (const path of scan.parents.values())
      parents.push(relative(base, path).replaceAll('\\', '/'));
    for (const entry of readdirSync(directory, { withFileTypes: true }).sort(
      (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
    )) {
      const path = join(directory, entry.name);
      assertWithin(path, base, 'fonte');
      if (statSync(path).isDirectory()) walk(path, next);
    }
  }
  walk(base, new Set());
  for (const parent of parents) {
    const key = portableKey(parent);
    if (keys.has(key))
      throw new EngineError(
        'SOURCE_COLLISION',
        `Fontes equivalentes: ${keys.get(key)} e ${parent}.`,
      );
    keys.set(key, parent);
  }
  return parents.sort((a, b) =>
    portableKey(a) < portableKey(b)
      ? -1
      : portableKey(a) > portableKey(b)
        ? 1
        : 0,
  );
}
export function resolveFamily(
  sourceRoot: string,
  tplDir: string,
  from: string,
  outDir: string,
  overlay?: Map<string, string>,
): ConventionFamily {
  from = validateRelativePath(from, 'entries.from', false);
  outDir = validateRelativePath(outDir, 'out_dir');
  const classification = classifySource(basename(from));
  if (!classification || classification.kind !== 'parent')
    throw new EngineError(
      'SOURCE_PARENT',
      `Selecione um pai .tpl.md, sem componente de filho: ${from}.`,
    );
  const base = resolve(sourceRoot, validateRelativePath(tplDir, 'tpl_dir'));
  assertWithin(base, sourceRoot, 'tpl_dir');
  const sourcePath = resolve(base, from);
  assertWithin(sourcePath, base, 'entries.from');
  if (!existsSync(sourcePath) && !overlay?.has(sourcePath))
    throw new EngineError(
      'SOURCE_MISSING',
      `Fonte de convention ausente: ${sourcePath}.`,
      2,
      { location: { path: sourcePath, line: 1, column: 1 } },
    );
  const scan = existsSync(dirname(sourcePath))
    ? scanDirectory(dirname(sourcePath), base)
    : {
        parents: new Map<string, string>(),
        children: new Map<string, string[]>(),
      };
  function artifact(path: string): ConventionArtifact {
    const relativePath = relative(base, path).replaceAll('\\', '/');
    return {
      ...(overlay?.has(path)
        ? validateMarkdown(overlay.get(path)!, path)
        : validateMarkdownFile(path)),
      sourcePath: path,
      sourceDisplay: relative(sourceRoot, path).replaceAll('\\', '/'),
      targetDisplay:
        outDir === '.'
          ? relativePath.slice(0, -7) + '.md'
          : `${outDir}/${relativePath.slice(0, -7)}.md`,
    };
  }
  return {
    parent: artifact(sourcePath),
    children: (scan.children.get(classification.root) ?? []).map(artifact),
  };
}
export function loadTemplate(sourceRoot: string): string {
  const path = safeJoin(sourceRoot, 'templates/AGENTS.tpl.md', 'template');
  const template = readText(path);
  validateTemplate(template, path);
  return template;
}
export interface ResolveOptions {
  localSources?: Map<string, string>;
  offline?: boolean;
  frozen?: boolean;
  inspect?: boolean;
}
export function resolveComposition(
  repoRoot: string,
  manifest: LoadedManifest,
  options: ResolveOptions = {},
): ResolvedComposition {
  repoRoot = resolve(repoRoot);
  const config = manifest.data.outputs['AGENTS.md'].include.conventions;
  for (const [field, value] of [
    ['out_dir', config.out_dir],
    ['local.tpl_dir', config.local.tpl_dir],
    ['remote.tpl_dir', config.remote.tpl_dir],
  ] as const)
    validateRelativePath(value, field);
  const base = manifest.data.agents;
  const previousLock = readLock(repoRoot);
  const matching = previousLock && lockMatchesManifest(previousLock, manifest);
  if (options.frozen && (base || previousLock) && !matching)
    throw new EngineError(
      previousLock ? 'LOCK_MISMATCH' : 'LOCK_REQUIRED',
      previousLock
        ? 'A seleção difere do lock; --frozen não permite adoção.'
        : 'agents-lock.json é obrigatório com --frozen.',
    );
  if (options.offline && base && !matching)
    throw new EngineError(
      'LOCK_REQUIRED',
      'O modo offline requer um lock compatível com a seleção.',
    );
  const content = base
    ? resolveContent(repoRoot, base.repository, base.ref, {
        commit: matching ? previousLock.commit : undefined,
        lock: matching ? previousLock : undefined,
        offline: options.offline,
        inspect: options.inspect,
      })
    : { checkout: repoRoot, cacheActivity: [] };
  const lock: ContentLock | undefined = base
    ? matching
      ? previousLock
      : {
          schemaVersion: 1,
          rendererContract: 1,
          normalization: 'utf8-lf',
          engineVersion,
          repository: repositoryIdentity(base.repository),
          requestedRef: base.ref,
          commit: 'commit' in content ? content.commit! : '',
          remote: remoteSelection(manifest),
          sources: selectedSources(content.checkout, remoteSelection(manifest)),
        }
    : undefined;
  const template = loadTemplate(content.checkout);
  const entries = [
    ...listParentSources(repoRoot, config.local.tpl_dir).map((from) => ({
      origin: 'local' as const,
      from,
    })),
    ...config.entries,
  ];
  const families = entries.map((entry) => ({
    ...resolveFamily(
      entry.origin === 'remote' ? content.checkout : repoRoot,
      entry.origin === 'remote' ? config.remote.tpl_dir : config.local.tpl_dir,
      entry.from,
      config.out_dir,
      entry.origin === 'local' ? options.localSources : undefined,
    ),
    origin: entry.origin,
  }));
  if (lock) {
    // Bind parsed bytes to the verified lock, including changes during resolution.
    const parsed = [
      { path: 'templates/AGENTS.tpl.md', sha256: textHash(template) },
      ...families.flatMap((family, index) =>
        entries[index]!.origin === 'remote'
          ? [family.parent, ...family.children].map((artifact) => ({
              path: artifact.sourceDisplay,
              sha256: textHash(artifact.text),
            }))
          : [],
      ),
    ].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    if (
      canonicalJson(parsed) !== canonicalJson(lock.sources) ||
      canonicalJson(selectedSources(content.checkout, lock.remote)) !==
        canonicalJson(lock.sources)
    )
      throw new EngineError(
        'CACHE_INTEGRITY',
        'As fontes remotas mudaram durante a resolução; nenhuma saída foi aplicada.',
      );
  }
  return {
    repoRoot,
    manifest,
    source: {
      ...(base
        ? {
            repository: repositoryIdentity(base.repository),
            ref: base.ref,
            commit: lock?.commit,
          }
        : {}),
      checkout: content.checkout,
    },
    templatePath: safeJoin(
      content.checkout,
      'templates/AGENTS.tpl.md',
      'template',
    ),
    cacheActivity: content.cacheActivity,
    template,
    families,
    lock,
    previousLock,
  };
}
