import { readFileSync } from 'node:fs';
import { Ajv, type ErrorObject } from 'ajv';
import { LineCounter, parseDocument, type Document } from 'yaml';
import { safeJoin, validateRelativePath } from './paths.js';
import { assertConsumerRoot } from './roles.js';

export interface ConventionEntry {
  origin: 'local' | 'remote';
  from: string;
}
export interface Manifest {
  schemaVersion?: 1 | 2;
  agents?: { repository: string; ref: string };
  outputs: {
    'AGENTS.md': {
      include: {
        conventions: {
          out_dir: string;
          local: { tpl_dir: string };
          remote: { tpl_dir: string };
          entries: ConventionEntry[];
        };
      };
    };
  };
}
export interface ErrorDetails {
  field?: string;
  location?: { path: string; line: number; column: number };
  remediation?: string;
}
export class EngineError extends Error {
  readonly field?: string;
  readonly location?: ErrorDetails['location'];
  readonly remediation?: string;
  constructor(
    readonly code: string,
    message: string,
    readonly exitCode = 2,
    details: ErrorDetails = {},
  ) {
    super(message);
    this.name = 'EngineError';
    Object.assign(this, details);
  }
}
export interface LoadedManifest {
  data: Manifest;
  source: string;
  path: string;
  document: Document.Parsed;
}
const validators = new Map(
  [1, 2].map((version) => [
    version,
    new Ajv({ allErrors: true, strict: true }).compile(
      JSON.parse(
        readFileSync(
          new URL(
            `../schemas/agents-compose.v${version}.schema.json`,
            import.meta.url,
          ),
          'utf8',
        ),
      ) as object,
    ),
  ]),
);

function schemaField(error: ErrorObject): string[] {
  const parts = error.instancePath
    .split('/')
    .filter(Boolean)
    .map((p) => p.replace(/~1/g, '/').replace(/~0/g, '~'));
  const name =
    error.params['additionalProperty'] ?? error.params['missingProperty'];
  if (typeof name === 'string') parts.push(name);
  return parts;
}
export function parseManifest(
  source: string,
  path = 'agents-compose.yml',
): LoadedManifest {
  const lineCounter = new LineCounter();
  const document = parseDocument(source, {
    lineCounter,
    uniqueKeys: true,
    strict: true,
    keepSourceTokens: true,
  });
  const parseIssue = document.errors[0] ?? document.warnings[0];
  if (parseIssue) {
    const position = lineCounter.linePos(parseIssue.pos[0]);
    throw new EngineError(
      'MANIFEST_YAML',
      `YAML inválido em ${path}:${position.line}:${position.col}: ${parseIssue.code}.`,
      2,
      {
        location: { path, line: position.line, column: position.col },
        remediation:
          'Use um único documento YAML 1.2, sem chaves duplicadas, tags customizadas ou aliases excessivos.',
      },
    );
  }
  let data: unknown;
  try {
    data = document.toJS({ maxAliasCount: 100 });
  } catch {
    throw new EngineError('MANIFEST_YAML', `Aliases excessivos em ${path}.`);
  }
  const declaredVersion =
    data && typeof data === 'object' && 'schemaVersion' in data
      ? data.schemaVersion
      : 1;
  const validator = validators.get(declaredVersion === 2 ? 2 : 1)!;
  if (!validator(data)) {
    const error = validator.errors![0]!;
    const parts = schemaField(error);
    let node = document.getIn(parts, true);
    if (!node) node = document.getIn(parts.slice(0, -1), true);
    const offset =
      node && typeof node === 'object' && 'range' in node
        ? ((node as { range?: number[] }).range?.[0] ?? 0)
        : 0;
    const position = lineCounter.linePos(offset);
    const field = parts.join('.') || '(raiz)';
    throw new EngineError(
      'MANIFEST_SCHEMA',
      `Campo inválido ou não suportado: ${field} (${path}:${position.line}:${position.col}).`,
      2,
      {
        field,
        location: { path, line: position.line, column: position.col },
        remediation:
          'Consulte o schema da versão 1 ou 2 do manifesto; entradas locais explícitas pertencem somente à versão 1.',
      },
    );
  }
  const manifest = data as Manifest;
  for (const [field, value] of [
    ['agents.repository', manifest.agents?.repository],
    ['agents.ref', manifest.agents?.ref],
  ] as const) {
    if (value === undefined) continue;
    if (!value.trim() || value.trim() !== value || /[\r\n\0]/u.test(value))
      throw new EngineError('MANIFEST_SCHEMA', `Valor inválido: ${field}.`, 2, {
        field,
      });
  }
  const config = manifest.outputs['AGENTS.md'].include.conventions;
  for (const [field, value] of [
    ['out_dir', config.out_dir],
    ['local.tpl_dir', config.local.tpl_dir],
    ['remote.tpl_dir', config.remote.tpl_dir],
  ] as const)
    validateRelativePath(value, field);
  for (const [index, entry] of config.entries.entries()) {
    const source = validateRelativePath(
      entry.from,
      `entries.${index}.from`,
      false,
    );
    if (!source.endsWith('.tpl.md'))
      throw new EngineError(
        'MANIFEST_SOURCE',
        `entries.${index}.from deve terminar em .tpl.md.`,
        2,
        { field: `entries.${index}.from` },
      );
    const base =
      entry.origin === 'local' ? config.local.tpl_dir : config.remote.tpl_dir;
    if (source.startsWith(`${base}/`))
      throw new EngineError(
        'MANIFEST_SOURCE',
        `entries.${index}.from deve ser relativo ao tpl_dir, sem repeti-lo.`,
        2,
        { field: `entries.${index}.from` },
      );
  }
  return { data: manifest, source, path, document };
}
export function loadManifest(repoRoot: string): LoadedManifest {
  assertConsumerRoot(repoRoot);
  const path = safeJoin(repoRoot, 'agents-compose.yml', 'manifesto');
  let source: string;
  try {
    source = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
      readFileSync(path),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new EngineError(
        'MANIFEST_MISSING',
        `Manifesto ausente: ${path}.`,
        2,
        {
          remediation:
            'Execute agents init para preparar o projeto e depois configure o manifesto, se necessário.',
        },
      );
    if (error instanceof TypeError)
      throw new EngineError(
        'MANIFEST_UTF8',
        `Manifesto não é UTF-8 válido: ${path}.`,
        2,
        { location: { path, line: 1, column: 1 } },
      );
    throw new EngineError(
      'MANIFEST_READ',
      `Não foi possível ler ${path} como UTF-8.`,
      3,
    );
  }
  return parseManifest(source, path);
}
