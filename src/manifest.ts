import { parseDocument, stringify } from 'yaml';
import { portableKey, relativePath } from './paths.js';

export class EngineError extends Error {
  constructor(
    public code: string,
    message: string,
    public exitCode = 2,
    public path?: string,
  ) {
    super(message);
  }
}
export type Language = 'en' | 'pt-br';
export interface Manifest {
  language: Language;
  templates_dir: string;
  conventions_dir: string;
}
export const MANIFEST = 'agentscli-compose.yml';
export const INTERNAL_MANIFEST = 'agentscli.yml';
export function language(value = 'en'): Language {
  const normalized = value.toLowerCase();
  if (normalized !== 'en' && normalized !== 'pt-br')
    throw new EngineError('LANGUAGE', 'Supported languages are en and pt-br.');
  return normalized;
}
export function defaultManifest(value?: string): Manifest {
  return {
    language: language(value),
    templates_dir: 'templates',
    conventions_dir: 'docs/conventions',
  };
}
export function parseManifest(text: string): Manifest {
  const document = parseDocument(text, { uniqueKeys: true });
  if (document.errors.length)
    throw new EngineError(
      'MANIFEST_YAML',
      `Invalid YAML: ${document.errors[0]!.message}`,
      2,
      MANIFEST,
    );
  let value: unknown;
  try {
    value = document.toJS({ maxAliasCount: 0 });
  } catch {
    throw new EngineError(
      'MANIFEST_YAML',
      'YAML aliases are not supported.',
      2,
      MANIFEST,
    );
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new EngineError(
      'MANIFEST_FIELDS',
      'Expected language, templates_dir, and conventions_dir.',
      2,
      MANIFEST,
    );
  const fields = value as Record<string, unknown>;
  const keys = ['language', 'templates_dir', 'conventions_dir'];
  if (
    Object.keys(fields).length !== 3 ||
    keys.some((key) => typeof fields[key] !== 'string') ||
    Object.keys(fields).some((key) => !keys.includes(key))
  )
    throw new EngineError(
      'MANIFEST_FIELDS',
      'Use exactly language, templates_dir, and conventions_dir; legacy composition is not supported.',
      2,
      MANIFEST,
    );
  const selected = language(fields.language as string);
  if (selected !== fields.language)
    throw new EngineError(
      'LANGUAGE',
      'Manifest language must be lowercase.',
      2,
      MANIFEST,
    );
  const templates = rootDirectory(fields.templates_dir as string);
  const conventions = rootDirectory(fields.conventions_dir as string);
  const a = portableKey(templates),
    b = portableKey(conventions);
  if (a === b || a.startsWith(`${b}/`) || b.startsWith(`${a}/`))
    throw new EngineError(
      'ROOT_OVERLAP',
      'Template and convention roots must not overlap.',
      2,
      MANIFEST,
    );
  return {
    language: selected,
    templates_dir: templates,
    conventions_dir: conventions,
  };
}
function rootDirectory(value: string): string {
  const normalized = relativePath(value);
  if (
    normalized
      .split('/')
      .some((part) =>
        ['.git', '.agents', '.cache', 'node_modules'].includes(
          portableKey(part),
        ),
      ) ||
    ['agents.md', MANIFEST, INTERNAL_MANIFEST].includes(
      portableKey(normalized.split('/')[0]!),
    )
  )
    throw new EngineError(
      'ROOT_RESERVED',
      `Reserved directory: ${value}.`,
      2,
      MANIFEST,
    );
  return normalized;
}
export function serializeManifest(manifest: Manifest): string {
  return stringify(manifest);
}
