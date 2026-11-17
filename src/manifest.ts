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
}
export interface LegacyManifest extends Manifest {
  templates_dir: string;
  conventions_dir: string;
}
export const CONFIG_PATH = '.agentscli/config.yml';
export const TEMPLATE_ROOT = '.agentscli/templates';
export const CONVENTION_ROOT = `${TEMPLATE_ROOT}/conventions`;
export const OUTPUT_ROOT = '.agentscli/conventions';
export const MANIFEST = 'agentscli-compose.yml';
export const INTERNAL_MANIFEST = 'agentscli.yml';
export function language(value = 'en'): Language {
  const normalized = value.toLowerCase();
  if (normalized !== 'en' && normalized !== 'pt-br')
    throw new EngineError('LANGUAGE', 'Supported languages are en and pt-br.');
  return normalized;
}
export function defaultManifest(value?: string): Manifest {
  return { language: language(value) };
}
function parseFields(text: string, path: string): Record<string, unknown> {
  const document = parseDocument(text, { uniqueKeys: true });
  if (document.errors.length)
    throw new EngineError(
      'MANIFEST_YAML',
      `Invalid YAML: ${document.errors[0]!.message}`,
      2,
      path,
    );
  let value: unknown;
  try {
    value = document.toJS({ maxAliasCount: 0 });
  } catch {
    throw new EngineError(
      'MANIFEST_YAML',
      'YAML aliases are not supported.',
      2,
      path,
    );
  }
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new EngineError(
      'MANIFEST_FIELDS',
      'Expected a configuration mapping.',
      2,
      path,
    );
  return value as Record<string, unknown>;
}
function storedLanguage(value: unknown, path: string): Language {
  if (typeof value !== 'string' || (value !== 'en' && value !== 'pt-br'))
    throw new EngineError(
      'LANGUAGE',
      'Stored language must be lowercase en or pt-br.',
      2,
      path,
    );
  return value;
}
export function parseManifest(text: string): Manifest {
  const fields = parseFields(text, CONFIG_PATH);
  if (Object.keys(fields).length !== 1 || !Object.hasOwn(fields, 'language'))
    throw new EngineError(
      'MANIFEST_FIELDS',
      'Use exactly language: en or language: pt-br; client paths are fixed.',
      2,
      CONFIG_PATH,
    );
  return { language: storedLanguage(fields.language, CONFIG_PATH) };
}
export function parseLegacyManifest(text: string): LegacyManifest {
  const fields = parseFields(text, MANIFEST);
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
  const selected = storedLanguage(fields.language, MANIFEST);
  const templates = rootDirectory(fields.templates_dir as string);
  const conventions = rootDirectory(fields.conventions_dir as string);
  const a = portableKey(templates),
    b = portableKey(conventions);
  if (
    [a, b].some(
      (root) => root === '.agentscli' || root.startsWith('.agentscli/'),
    )
  )
    throw new EngineError(
      'ROOT_OVERLAP',
      'Legacy roots must not overlap the .agentscli namespace.',
      2,
      MANIFEST,
    );
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
