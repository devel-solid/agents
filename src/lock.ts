import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute } from 'node:path';
import { Ajv } from 'ajv';
import { EngineError, type LoadedManifest } from './manifest.js';
import {
  portableKey,
  resolvedPath,
  safeJoin,
  validateRelativePath,
} from './paths.js';

export interface ContentLock {
  schemaVersion: 1;
  rendererContract: 1;
  normalization: 'utf8-lf';
  engineVersion: string;
  repository: string;
  requestedRef: string;
  commit: string;
  remote: { tplDir: string; entries: string[] };
  sources: { path: string; sha256: string }[];
}
export const RENDERER_CONTRACT = 1;
export const engineVersion = (
  JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version: string }
).version;
export function rawHash(bytes: string | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}
export function textHash(bytes: string | Uint8Array): string {
  let text: string;
  try {
    text =
      typeof bytes === 'string'
        ? bytes
        : new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new EngineError('CONTENT_UTF8', 'Conteúdo não é UTF-8 válido.');
  }
  return rawHash(text.replace(/\r\n?/gu, '\n'));
}
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value))
    return `[${Array.from(value, (entry) => (entry === undefined ? 'null' : canonicalJson(entry))).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`)
      .join(',')}}`;
  const serialized = JSON.stringify(value);
  if (serialized === undefined)
    throw new EngineError(
      'CANONICAL_JSON',
      'Valor sem representação JSON canônica.',
    );
  return serialized;
}
export function repositoryIdentity(repository: string): string {
  if (isAbsolute(repository) || /^[.][.\\/]/u.test(repository))
    return resolvedPath(repository).replaceAll('\\', '/');
  try {
    const url = new URL(repository);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return repository;
  }
}
export function remoteSelection(
  manifest: LoadedManifest,
): ContentLock['remote'] {
  const config = manifest.data.outputs['AGENTS.md'].include.conventions;
  return {
    tplDir: validateRelativePath(config.remote.tpl_dir),
    entries: config.entries
      .map((entry) => validateRelativePath(entry.from, 'entries.from', false))
      .sort(),
  };
}
export function lockMatchesManifest(
  lock: ContentLock,
  manifest: LoadedManifest,
): boolean {
  const base = manifest.data.agents;
  return (
    !!base &&
    lock.repository === repositoryIdentity(base.repository) &&
    lock.requestedRef === base.ref &&
    canonicalJson(lock.remote) === canonicalJson(remoteSelection(manifest))
  );
}
const validator = new Ajv({ allErrors: true, strict: true }).compile(
  JSON.parse(
    readFileSync(
      new URL('../schemas/agents-lock.v1.schema.json', import.meta.url),
      'utf8',
    ),
  ) as object,
);
export function validateLock(value: unknown): ContentLock {
  if (!validator(value))
    throw new EngineError(
      'LOCK_SCHEMA',
      'agents-lock.json inválido ou com versão não suportada.',
      2,
      {
        remediation:
          'Restaure o lock revisado; não edite seus hashes manualmente.',
      },
    );
  const lock = value as ContentLock;
  if (lock.rendererContract !== RENDERER_CONTRACT)
    throw new EngineError(
      'LOCK_RENDERER',
      'rendererContract do lock não é compatível com a CLI instalada.',
    );
  if (
    lock.repository !== repositoryIdentity(lock.repository) ||
    /[\r\n\0]/u.test(lock.repository + lock.requestedRef)
  )
    throw new EngineError(
      'LOCK_IDENTITY',
      'Identidade de conteúdo inválida no lock.',
    );
  if (lock.remote.tplDir !== validateRelativePath(lock.remote.tplDir))
    throw new EngineError('LOCK_PATH', 'Raiz não canônica no lock.');
  const entries = lock.remote.entries;
  if (canonicalJson(entries) !== canonicalJson([...new Set(entries)].sort()))
    throw new EngineError(
      'LOCK_SELECTION',
      'Seleção duplicada ou não determinística no lock.',
    );
  for (const path of entries)
    if (
      path !== validateRelativePath(path, 'lock.entries', false) ||
      !path.endsWith('.tpl.md')
    )
      throw new EngineError('LOCK_PATH', 'Seleção não canônica no lock.');
  const paths = lock.sources.map((source) => source.path);
  if (
    canonicalJson(paths) !== canonicalJson([...paths].sort()) ||
    new Set(paths.map(portableKey)).size !== paths.length
  )
    throw new EngineError(
      'LOCK_INVENTORY',
      'Inventário duplicado ou não determinístico no lock.',
    );
  for (const path of paths)
    if (path !== validateRelativePath(path, 'lock.sources', false))
      throw new EngineError('LOCK_PATH', 'Fonte não canônica no lock.');
  if (!paths.includes('templates/AGENTS.tpl.md'))
    throw new EngineError(
      'LOCK_INVENTORY',
      'O lock não contém o template principal.',
    );
  return lock;
}
export function readLock(repoRoot: string): ContentLock | undefined {
  const path = safeJoin(repoRoot, 'agents-lock.json', 'lock');
  if (!existsSync(path)) return;
  let value: unknown;
  try {
    value = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)),
    );
  } catch {
    throw new EngineError(
      'LOCK_SCHEMA',
      'agents-lock.json não é JSON UTF-8 válido.',
    );
  }
  return validateLock(value);
}
export function serializeLock(lock: ContentLock): string {
  validateLock(lock);
  return JSON.stringify(lock, null, 2) + '\n';
}
