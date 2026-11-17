import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { EngineError, type LoadedManifest } from './manifest.js';
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
}
export interface ResolvedComposition {
  repoRoot: string;
  manifest: LoadedManifest;
  source: { repository?: string; ref?: string; checkout: string };
  templatePath: string;
  cacheActivity: string[];
  template: string;
  families: ConventionFamily[];
}
export function redact(text: string): string {
  return text.replace(
    /([a-z][a-z0-9+.-]*:\/\/)[^\s/@]+(?::[^\s/@]*)?@/giu,
    '$1[redigido]@',
  );
}
export function git(args: string[], cwd?: string): string {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT')
    throw new EngineError(
      'GIT_MISSING',
      'Git não está disponível no PATH.',
      2,
      { remediation: 'Instale Git e confirme git --version.' },
    );
  if (result.error || result.status !== 0)
    throw new EngineError(
      'GIT_OPERATION',
      `Falha ao acessar conteúdo Git: ${redact(result.stderr?.trim() || result.error?.message || 'operação encerrada sem sucesso')}`,
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
    .update(`${repository}\n${ref}`)
    .digest('hex')
    .slice(0, 16);
}
export function resolveContent(
  repoRoot: string,
  repository: string,
  ref: string,
): { checkout: string; cacheActivity: string[] } {
  git(['--version']);
  if (
    repository.startsWith('-') ||
    ref.startsWith('-') ||
    /[\r\n\0]/u.test(repository + ref)
  )
    throw new EngineError('SOURCE_IDENTITY', 'Repository/ref inválido.');
  const cacheRoot = safeJoin(repoRoot, '.cache/agents', 'cache');
  const checkout = assertWithin(
    join(cacheRoot, contentFingerprint(repository, ref)),
    cacheRoot,
    'cache',
  );
  if (
    portableKey(cacheRoot) !==
      portableKey(join(resolvedPath(repoRoot), '.cache', 'agents')) ||
    portableKey(checkout) !==
      portableKey(join(cacheRoot, contentFingerprint(repository, ref)))
  )
    throw new EngineError(
      'CACHE_PATH',
      'O cache de conteúdo não pode usar links ou aliases de diretório.',
    );
  const activity: string[] = [];
  if (existsSync(checkout)) {
    let valid = false;
    try {
      valid =
        portableKey(git(['-C', checkout, 'rev-parse', '--show-toplevel'])) ===
          portableKey(checkout) &&
        git(['-C', checkout, 'status', '--porcelain']) === '' &&
        git(['-C', checkout, 'remote', 'get-url', 'origin']) === repository;
    } catch {
      /* O cache inválido é descartável. */
    }
    if (!valid) {
      rmSync(checkout, { recursive: true, force: true, maxRetries: 3 });
      activity.push('Cache inválido/sujo recriado.');
    }
  }
  if (!existsSync(checkout)) {
    mkdirSync(dirname(checkout), { recursive: true });
    git(['clone', '--no-checkout', '--', repository, checkout]);
    activity.push('Checkout de conteúdo criado no cache.');
  }
  git([
    '-C',
    checkout,
    'fetch',
    '--prune',
    '--force',
    '--tags',
    'origin',
    '+refs/heads/*:refs/remotes/origin/*',
  ]);
  activity.push(
    'Ref consultada no cache de conteúdo; nenhum código da base foi executado.',
  );
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
  git([
    '-C',
    checkout,
    '-c',
    'advice.detachedHead=false',
    'checkout',
    '--force',
    '--detach',
    commit,
  ]);
  return { checkout, cacheActivity: activity };
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
  const content = base
    ? resolveContent(repoRoot, base.repository, base.ref)
    : { checkout: repoRoot, cacheActivity: [] };
  const template = loadTemplate(content.checkout);
  const entries = [
    ...listParentSources(repoRoot, config.local.tpl_dir).map((from) => ({
      origin: 'local' as const,
      from,
    })),
    ...config.entries,
  ];
  const families = entries.map((entry) =>
    resolveFamily(
      entry.origin === 'remote' ? content.checkout : repoRoot,
      entry.origin === 'remote' ? config.remote.tpl_dir : config.local.tpl_dir,
      entry.from,
      config.out_dir,
      entry.origin === 'local' ? options.localSources : undefined,
    ),
  );
  return {
    repoRoot,
    manifest,
    source: { ...manifest.data.agents, checkout: content.checkout },
    templatePath: safeJoin(
      content.checkout,
      'templates/AGENTS.tpl.md',
      'template',
    ),
    cacheActivity: content.cacheActivity,
    template,
    families,
  };
}
