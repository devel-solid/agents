import { fileURLToPath } from 'node:url';
import {
  EngineError,
  MANIFEST,
  defaultManifest,
  parseManifest,
  serializeManifest,
  type Language,
} from './manifest.js';
import { decode, GENERATED } from './markdown.js';
import { containedPath, portableKey, uniquePaths } from './paths.js';
import {
  assertClientContext,
  disk,
  inspect,
  walk,
  type FileSystem,
} from './io.js';
import { render, type ConventionInput } from './render.js';

export interface Resources {
  templates: Record<Language, Record<string, Uint8Array>>;
  skills: Record<string, Record<string, Uint8Array>>;
}
export interface Effect {
  path: string;
  action: 'create' | 'update' | 'delete';
  content?: Uint8Array;
  previous?: Uint8Array;
  directory?: boolean;
}
const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);
export const equalBytes = (a: Uint8Array, b: Uint8Array): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index]);
export function isGenerated(content: Uint8Array): boolean {
  return (
    Buffer.from(content).toString('utf8').split(/\r?\n/u, 1)[0] === GENERATED
  );
}
export function loadResources(): Resources {
  const root = fileURLToPath(new URL('./assets/', import.meta.url));
  function tree(directory: string): Record<string, Uint8Array> {
    if (!inspect(disk, root, directory, 'directory'))
      throw new EngineError(
        'PACKAGE_RESOURCE',
        `Missing package resource: ${directory}.`,
        3,
      );
    return Object.fromEntries(
      walk(disk, root, directory).map((path) => [
        path.slice(directory.length + 1),
        disk.read(containedPath(root, path)),
      ]),
    );
  }
  if (!inspect(disk, root, 'skills', 'directory'))
    throw new EngineError(
      'PACKAGE_RESOURCE',
      'Package is missing its skills inventory.',
      3,
    );
  const names = disk.names(containedPath(root, 'skills')).sort();
  if (!names.length)
    throw new EngineError(
      'PACKAGE_RESOURCE',
      'Package has no distributed skills.',
      3,
    );
  return {
    templates: { en: tree('templates/en'), 'pt-br': tree('templates/pt-br') },
    skills: Object.fromEntries(
      names.map((name) => [name, tree(`skills/${name}`)]),
    ),
  };
}
function read(io: FileSystem, root: string, path: string): Uint8Array {
  if (!inspect(io, root, path, 'file'))
    throw new EngineError(
      'SOURCE_MISSING',
      `Missing source: ${path}. Run agentscli init to create missing setup.`,
      2,
      path,
    );
  return io.read(containedPath(root, path));
}
function directoryPaths(files: string[]): Set<string> {
  const paths = new Set<string>();
  for (const file of files) {
    const parts = file.split('/');
    for (let index = 1; index < parts.length; index++)
      paths.add(parts.slice(0, index).join('/'));
  }
  return paths;
}
function allDirectories(
  io: FileSystem,
  root: string,
  directory: string,
): string[] {
  if (!inspect(io, root, directory, 'directory')) return [];
  const result: string[] = [];
  for (const name of io.names(containedPath(root, directory))) {
    const path = `${directory}/${name}`;
    if (inspect(io, root, path)?.kind === 'directory')
      result.push(...allDirectories(io, root, path), path);
  }
  return result;
}
export function plan(
  io: FileSystem,
  root: string,
  command: 'init' | 'validate' | 'sync',
  resources: Resources,
  selectedLanguage?: string,
): Effect[] {
  assertClientContext(io, root);
  const initializing = command === 'init';
  const manifest = initializing
    ? defaultManifest(selectedLanguage)
    : parseManifest(decode(read(io, root, MANIFEST), MANIFEST));
  inspect(io, root, manifest.templates_dir, 'directory');
  inspect(io, root, manifest.conventions_dir, 'directory');
  const effects: Effect[] = [];
  function compare(
    path: string,
    content: Uint8Array,
    preserve = false,
    force = false,
  ): void {
    const existing = inspect(io, root, path, 'file');
    if (existing && preserve) return;
    const previous = existing ? io.read(containedPath(root, path)) : undefined;
    if (!existing || force || !equalBytes(previous!, content))
      effects.push({
        path,
        action: existing ? 'update' : 'create',
        content,
        previous,
      });
  }
  const virtual = new Map<string, Uint8Array>();
  for (const path of walk(io, root, manifest.templates_dir))
    if (path.endsWith('.tpl.md')) virtual.set(path, read(io, root, path));
  const main = `${manifest.templates_dir}/AGENTS.tpl.md`;
  let initialized = virtual.has(main);
  if (initializing && !initialized && inspect(io, root, MANIFEST, 'file')) {
    const oldBytes = read(io, root, MANIFEST);
    try {
      parseManifest(decode(oldBytes, MANIFEST));
      initialized = true;
    } catch (error) {
      if (!(error instanceof EngineError)) throw error;
    }
  }
  if (initializing) {
    const defaults = resources.templates[manifest.language];
    if (!defaults || !defaults['AGENTS.tpl.md'])
      throw new EngineError(
        'PACKAGE_RESOURCE',
        'Package is missing its main template.',
        3,
      );
    // Seed conventions before the main template: its presence must never hide
    // defaults that a previous interrupted init has not created yet.
    const defaultsInOrder = Object.entries(defaults).sort(([left], [right]) =>
      left === 'AGENTS.tpl.md'
        ? 1
        : right === 'AGENTS.tpl.md'
          ? -1
          : left < right
            ? -1
            : left > right
              ? 1
              : 0,
    );
    for (const [relative, content] of defaultsInOrder) {
      const path = `${manifest.templates_dir}/${relative}`;
      if ((path === main || !initialized) && !virtual.has(path)) {
        inspect(io, root, path, 'file');
        virtual.set(path, content);
        compare(path, content);
      }
    }
  }
  if (!virtual.has(main))
    throw new EngineError(
      'SOURCE_MISSING',
      `Missing main template: ${main}.`,
      2,
      main,
    );
  const ordered = [...virtual.keys()].sort((a, b) => {
    const left = portableKey(a),
      right = portableKey(b);
    return left < right ? -1 : left > right ? 1 : 0;
  });
  uniquePaths(ordered);
  const conventions: ConventionInput[] = ordered
    .filter((path) => path !== main)
    .map((source) => ({
      source,
      output: `${manifest.conventions_dir}/${source.slice(manifest.templates_dir.length + 1, -7)}.md`,
      text: decode(virtual.get(source)!, source),
    }));
  const documents = render(
    { source: main, text: decode(virtual.get(main)!, main) },
    conventions,
    manifest.language,
  );
  uniquePaths([...documents.keys()]);
  for (const [path, text] of documents) {
    const existing = inspect(io, root, path, 'file');
    if (existing && !isGenerated(io.read(containedPath(root, path))))
      throw new EngineError(
        'DOCUMENT_CONFLICT',
        `Manual document occupies ${path}. Preserve useful text in its template and resolve this destination before retrying.`,
        2,
        path,
      );
    compare(path, bytes(text), initializing);
  }
  const stale: Effect[] = [];
  if (!initializing)
    for (const path of walk(io, root, manifest.conventions_dir)) {
      if (
        path.endsWith('.md') &&
        !documents.has(path) &&
        isGenerated(io.read(containedPath(root, path)))
      )
        stale.push({
          path,
          action: 'delete',
          previous: io.read(containedPath(root, path)),
        });
    }
  const skillNames = Object.keys(resources.skills).sort();
  if (!skillNames.length)
    throw new EngineError(
      'PACKAGE_RESOURCE',
      'Package has no distributed skills.',
      3,
    );
  for (const name of skillNames) {
    if (!/^agentscli-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name))
      throw new EngineError(
        'PACKAGE_RESOURCE',
        `Invalid distributed skill name: ${name}.`,
        3,
      );
    const skill = resources.skills[name];
    if (!skill?.['SKILL.md'])
      throw new EngineError(
        'PACKAGE_RESOURCE',
        `Missing package skill: ${name}.`,
        3,
      );
    uniquePaths(Object.keys(skill));
    const directory = `.agents/skills/${name}`;
    inspect(io, root, directory, 'directory');
    const expected = new Set(
      Object.keys(skill).map((path) => `${directory}/${path}`),
    );
    for (const [relative, content] of Object.entries(skill))
      compare(`${directory}/${relative}`, content, initializing);
    if (!initializing) {
      for (const path of walk(io, root, directory))
        if (!expected.has(path))
          stale.push({
            path,
            action: 'delete',
            previous: io.read(containedPath(root, path)),
          });
      const expectedDirectories = directoryPaths([...expected]);
      for (const path of allDirectories(io, root, directory))
        if (!expectedDirectories.has(path))
          stale.push({ path, action: 'delete', directory: true });
    }
  }
  effects.push(...stale);
  // Publish client configuration only after the complete setup. Retry can use
  // the existing main template to distinguish completed setup from a fresh root.
  if (initializing)
    compare(MANIFEST, bytes(serializeManifest(manifest)), false, true);
  uniquePaths(
    effects.filter((effect) => !effect.directory).map((effect) => effect.path),
  );
  return effects;
}
