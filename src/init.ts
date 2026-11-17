import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stringify } from 'yaml';
import {
  EngineError,
  loadManifest,
  parseManifest,
  type Manifest,
} from './manifest.js';
import { safeJoin, portableKey, resolvedPath } from './paths.js';
import {
  assertBaseRoot,
  assertConsumerRoot,
  baseMarkerPath,
  validateOwnedAgents,
} from './roles.js';
import {
  validateMarkdownFile,
  readText,
  validateTemplate,
} from './markdown.js';

export interface InitOptions {
  base?: boolean;
  starter?: string;
  dryRun?: boolean;
}
export interface FileChange {
  action: 'create' | 'update';
  path: string;
  reason: string;
  content: string;
}
const assets = fileURLToPath(new URL('../assets/', import.meta.url));
export const integrationPath = '.agents/skills/agents-update-docs';
export const baseIntegrationPath = '.agents/skills/agents-update-version';
export const authoringIntegrationPath =
  '.agents/skills/agents-write-conventions';
type IntegrationName =
  'agents-update-docs' | 'agents-update-version' | 'agents-write-conventions';
function initTarget(repoRoot: string, path: string): string {
  const target = safeJoin(repoRoot, path);
  const actual = portableKey(relative(resolvedPath(repoRoot), target));
  const parts = actual.split('/');
  const integration = [
    integrationPath,
    baseIntegrationPath,
    authoringIntegrationPath,
  ].find(
    (root) =>
      portableKey(path) === root || portableKey(path).startsWith(`${root}/`),
  );
  if (
    parts.some((part) => ['.git', '.cache', 'node_modules'].includes(part)) ||
    (parts.includes('.agents') &&
      !(
        (portableKey(path) === baseMarkerPath && actual === baseMarkerPath) ||
        (integration &&
          (actual === integration || actual.startsWith(`${integration}/`)))
      ))
  ) {
    throw new EngineError(
      'PATH_RESERVED',
      `Destino de inicialização resolve para um caminho reservado: ${path}.`,
    );
  }
  return target;
}
function asset(path: string): string {
  return readFileSync(join(assets, path), 'utf8');
}
function filesUnder(root: string, prefix = ''): string[] {
  const result: string[] = [];
  for (const entry of readdirSync(join(root, prefix), {
    withFileTypes: true,
  })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink())
      throw new EngineError(
        'INIT_CONFLICT',
        `Link não reconhecido na integração: ${path}.`,
      );
    if (entry.isDirectory()) result.push(...filesUnder(root, path));
    else if (entry.isFile()) result.push(path);
    else
      throw new EngineError(
        'INIT_CONFLICT',
        `Entrada não reconhecida: ${path}.`,
      );
  }
  return result.sort();
}
export function expectedIntegration(
  name: IntegrationName = 'agents-update-docs',
): Map<string, string> {
  const root = join(assets, 'integration', name);
  return new Map(
    filesUnder(root).map((path) => [
      path,
      readFileSync(join(root, path), 'utf8'),
    ]),
  );
}
export function inspectIntegration(
  repoRoot: string,
  name: IntegrationName = 'agents-update-docs',
): 'missing' | 'current' | 'conflict' {
  const path = `.agents/skills/${name}`;
  const destination = initTarget(repoRoot, path);
  if (!existsSync(destination)) return 'missing';
  if (
    lstatSync(join(repoRoot, path)).isSymbolicLink() ||
    !statSync(destination).isDirectory()
  )
    return 'conflict';
  try {
    const expected = expectedIntegration(name);
    const actual = filesUnder(destination);
    if (actual.length === 0) return 'missing';
    if (actual.length !== expected.size) return 'conflict';
    return actual.every(
      (path) =>
        expected.has(path) &&
        readFileSync(join(destination, path), 'utf8') === expected.get(path),
    )
      ? 'current'
      : 'conflict';
  } catch {
    return 'conflict';
  }
}
function planFiles(
  repoRoot: string,
  intended: Map<string, string>,
): FileChange[] {
  const paths = new Map<string, string>();
  const changes: FileChange[] = [];
  for (const [path, content] of intended) {
    const target = initTarget(repoRoot, path);
    const key = portableKey(resolvedPath(target));
    for (const [previousKey, previousPath] of paths) {
      if (
        key === previousKey ||
        key.startsWith(`${previousKey}/`) ||
        previousKey.startsWith(`${key}/`)
      )
        throw new EngineError(
          'INIT_CONFLICT',
          `Destinos sobrepostos: ${previousPath} e ${path}.`,
        );
    }
    paths.set(key, path);
    let parent = dirname(target);
    while (parent !== dirname(parent)) {
      if (existsSync(parent) && !statSync(parent).isDirectory())
        throw new EngineError(
          'INIT_CONFLICT',
          `Diretório ocupado por arquivo: ${path}.`,
        );
      parent = dirname(parent);
    }
    if (existsSync(target)) {
      if (
        !statSync(target).isFile() ||
        !readFileSync(target).equals(Buffer.from(content))
      )
        throw new EngineError(
          'INIT_CONFLICT',
          `Arquivo existente difere do conteúdo planejado: ${path}.`,
          2,
          {
            remediation:
              'Preserve suas edições e revise o conflito; init não substitui arquivos personalizados.',
          },
        );
    } else
      changes.push({
        action: 'create',
        path,
        content,
        reason: 'Configuração ausente explicitamente solicitada.',
      });
  }
  return changes;
}
function applyFiles(
  repoRoot: string,
  changes: FileChange[],
  dryRun?: boolean,
): void {
  if (dryRun) return;
  for (const change of changes) {
    const target = initTarget(repoRoot, change.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, change.content, { flag: 'wx' });
  }
}
export function initialize(
  repoRoot: string,
  options: InitOptions,
): { changes: FileChange[]; cacheActivity: string[]; preserved: string[] } {
  if (options.starter && !options.base)
    throw new EngineError('USAGE', '--starter exige --base.');
  if (options.base) assertBaseRoot(repoRoot, false);
  else assertConsumerRoot(repoRoot);
  const integrations: IntegrationName[] = [
    'agents-write-conventions',
    options.base ? 'agents-update-version' : 'agents-update-docs',
  ];
  for (const name of integrations)
    if (inspectIntegration(repoRoot, name) === 'conflict')
      throw new EngineError(
        'INTEGRATION_CONFLICT',
        `Integração desconhecida ou editada: .agents/skills/${name}.`,
        2,
        {
          remediation:
            'Revise a skill existente; nenhuma substituição automática é feita.',
        },
      );
  const intended = new Map<string, string>();
  for (const name of integrations)
    for (const [path, content] of expectedIntegration(name))
      intended.set(`.agents/skills/${name}/${path}`, content);
  if (options.base) {
    if (options.starter && options.starter !== 'minimal')
      throw new EngineError('USAGE', 'Starter desconhecido; use minimal.');
    for (const path of filesUnder(join(assets, 'base')))
      intended.set(path, asset(`base/${path}`));
    const preserved: string[] = [];
    if (existsSync(initTarget(repoRoot, 'AGENTS.md'))) {
      validateOwnedAgents(repoRoot);
      intended.delete('AGENTS.md');
      preserved.push('AGENTS.md');
    }
    if (existsSync(initTarget(repoRoot, baseMarkerPath))) {
      intended.delete(baseMarkerPath);
      preserved.push(baseMarkerPath);
    }
    if (options.starter)
      for (const path of filesUnder(join(assets, 'starter')))
        intended.set(
          `templates/docs/conventions/${path}`,
          asset(`starter/${path}`),
        );
    const changes = planFiles(repoRoot, intended);
    applyFiles(repoRoot, changes, options.dryRun);
    return {
      changes,
      cacheActivity: [],
      preserved: [
        ...preserved,
        ...[...intended.keys()].filter(
          (path) => !changes.some((change) => change.path === path),
        ),
      ],
    };
  }
  const preserved: string[] = [];
  const manifestPath = safeJoin(repoRoot, 'agents-compose.yml');
  if (existsSync(manifestPath)) {
    loadManifest(repoRoot);
    preserved.push('agents-compose.yml');
  } else {
    const templatePath = 'templates/AGENTS.tpl.md';
    const template = initTarget(repoRoot, templatePath);
    if (existsSync(template)) {
      validateTemplate(readText(template), template);
      preserved.push(templatePath);
    } else intended.set(templatePath, asset('base/templates/AGENTS.tpl.md'));
    const contextPath =
      'templates/docs/conventions-local/contexto-do-projeto.tpl.md';
    const context = initTarget(repoRoot, contextPath);
    if (existsSync(context)) {
      validateMarkdownFile(context);
      preserved.push(contextPath);
    } else intended.set(contextPath, asset('contexto-do-projeto.tpl.md'));
    const manifest: Manifest = {
      schemaVersion: 2,
      outputs: {
        'AGENTS.md': {
          include: {
            conventions: {
              out_dir: 'docs/conventions',
              local: { tpl_dir: 'templates/docs/conventions-local' },
              remote: { tpl_dir: 'templates/docs/conventions' },
              entries: [],
            },
          },
        },
      },
    };
    const yaml = stringify(manifest);
    parseManifest(yaml, manifestPath);
    intended.set('agents-compose.yml', yaml);
  }
  const changes = planFiles(repoRoot, intended);
  applyFiles(repoRoot, changes, options.dryRun);
  return {
    changes,
    cacheActivity: [],
    preserved: [
      ...preserved,
      ...[...intended.keys()].filter(
        (path) => !changes.some((change) => change.path === path),
      ),
    ],
  };
}
