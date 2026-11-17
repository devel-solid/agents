import { join } from 'node:path';
import {
  CONFIG_PATH,
  CONVENTION_ROOT,
  EngineError,
  MANIFEST,
  OUTPUT_ROOT,
  TEMPLATE_ROOT,
  language,
  parseLegacyManifest,
  parseManifest,
  serializeManifest,
} from './manifest.js';
import { assertClientContext, inspect, walk, type FileSystem } from './io.js';
import { decode } from './markdown.js';
import { rebaseLinks } from './migration-links.js';
import { containedPath, portableKey, uniquePaths } from './paths.js';
import {
  allDirectories,
  equalBytes,
  isGenerated,
  managedSkillEffects,
  plan,
  read,
  type Effect,
  type Resources,
} from './plan.js';
import { render, type ConventionInput } from './render.js';

const bytes = (text: string): Uint8Array => new TextEncoder().encode(text);
function conflict(path: string, message: string): never {
  throw new EngineError('MIGRATION_CONFLICT', `${path}: ${message}`, 2, path);
}
function raw(content: Uint8Array, path: string): string {
  decode(content, path); // Validate UTF-8 without normalizing the transferred bytes.
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(
    content,
  );
}
function snapshot(
  io: FileSystem,
  root: string,
  path: string,
): Uint8Array | undefined {
  return inspect(io, root, path, 'file') ? read(io, root, path) : undefined;
}
function verify(
  io: FileSystem,
  root: string,
  expected: ReadonlyMap<string, Uint8Array | undefined>,
): void {
  for (const [path, content] of expected) {
    const current = snapshot(io, root, path);
    if (
      !content !== !current ||
      (content && current && !equalBytes(content, current))
    )
      throw new EngineError(
        'MIGRATION_CHANGED',
        `${path} changed after migration planning. Repeat init --migrate with the same options.`,
        3,
        path,
      );
  }
}
function ordered(paths: string[]): string[] {
  return paths.sort((a, b) =>
    portableKey(a) < portableKey(b)
      ? -1
      : portableKey(a) > portableKey(b)
        ? 1
        : 0,
  );
}
function newSources(io: FileSystem, root: string): string[] {
  const main = `${TEMPLATE_ROOT}/AGENTS.tpl.md`;
  return ordered([
    ...(inspect(io, root, main, 'file') ? [main] : []),
    ...walk(io, root, CONVENTION_ROOT).filter((path) =>
      path.endsWith('.tpl.md'),
    ),
  ]);
}
function withoutLegacy(io: FileSystem, root: string): FileSystem {
  const legacy = containedPath(root, MANIFEST);
  return {
    ...io,
    info: (path) => (path === legacy ? undefined : io.info(path)),
    names: (path) =>
      io.names(path).filter((name) => join(path, name) !== legacy),
  };
}

/** One deterministic plan for preview, preparation and verified cleanup retries. */
export function planMigration(
  io: FileSystem,
  root: string,
  resources: Resources,
  selectedLanguage?: string,
): Effect[] {
  assertClientContext(io, root);
  const legacyBytes = snapshot(io, root, MANIFEST);
  const configBytes = snapshot(io, root, CONFIG_PATH);
  if (!legacyBytes) {
    if (!configBytes)
      throw new EngineError(
        'MIGRATION_MISSING',
        'No legacy client exists. Use agentscli init to create a new client.',
        2,
        MANIFEST,
      );
    plan(io, root, 'validate', resources);
    return [];
  }
  const legacy = parseLegacyManifest(decode(legacyBytes, MANIFEST));
  const selected =
    selectedLanguage === undefined
      ? legacy.language
      : language(selectedLanguage);
  const cleaning = !!configBytes;
  if (
    configBytes &&
    parseManifest(decode(configBytes, CONFIG_PATH)).language !== selected
  )
    conflict(
      CONFIG_PATH,
      'Language differs from the migration options. Retry with the same --lang selection.',
    );
  const oldMain = `${legacy.templates_dir}/AGENTS.tpl.md`;
  const main = `${TEMPLATE_ROOT}/AGENTS.tpl.md`;
  const oldSources = ordered(
    walk(io, root, legacy.templates_dir).filter((path) =>
      path.endsWith('.tpl.md'),
    ),
  );
  uniquePaths(oldSources);
  if (!cleaning && !oldSources.includes(oldMain))
    conflict(oldMain, 'Missing legacy main template.');
  const toNewSource = (source: string): string =>
    source === oldMain
      ? main
      : `${CONVENTION_ROOT}/${source.slice(legacy.templates_dir.length + 1)}`;
  const toOldSource = (source: string): string =>
    source === main
      ? oldMain
      : `${legacy.templates_dir}/${source.slice(CONVENTION_ROOT.length + 1)}`;
  const toOldOutput = (source: string): string =>
    source === oldMain
      ? 'AGENTS.md'
      : `${legacy.conventions_dir}/${source.slice(legacy.templates_dir.length + 1, -7)}.md`;
  const toNewOutput = (source: string): string =>
    source === main
      ? 'AGENTS.md'
      : `${OUTPUT_ROOT}/${source.slice(CONVENTION_ROOT.length + 1, -7)}.md`;
  const existingNewSources = newSources(io, root);
  const inventory = cleaning ? existingNewSources.map(toOldSource) : oldSources;
  if (cleaning && !inventory.includes(oldMain))
    conflict(main, 'Published client has no main template.');
  const mappings = new Map<string, string>();
  for (const source of inventory) {
    mappings.set(source, toNewSource(source));
    mappings.set(toOldOutput(source), toNewOutput(toNewSource(source)));
  }
  if (oldSources.some((source) => !inventory.includes(source)))
    conflict(
      legacy.templates_dir,
      'Remaining legacy sources are absent from the published new inventory.',
    );
  const expectedSourceNames = ordered(inventory.map(toNewSource));
  uniquePaths(expectedSourceNames);
  if (
    existingNewSources.some((source) => !expectedSourceNames.includes(source))
  )
    conflict(CONVENTION_ROOT, 'New sources do not belong to this migration.');

  const inputs = new Map<string, Uint8Array | undefined>([
    [MANIFEST, legacyBytes],
  ]);
  const transferred = new Map<string, Uint8Array>();
  const original = new Map<string, Uint8Array>();
  for (const source of oldSources) {
    const content = read(io, root, source);
    original.set(source, content);
    inputs.set(source, content);
    const destination = toNewSource(source);
    transferred.set(
      destination,
      bytes(
        rebaseLinks(
          raw(content, source),
          source,
          toOldOutput(source),
          toNewOutput(destination),
          mappings,
          source !== oldMain,
        ),
      ),
    );
  }
  if (cleaning) {
    for (const source of existingNewSources) {
      const content = read(io, root, source),
        converted = transferred.get(source);
      if (converted && !equalBytes(content, converted))
        conflict(
          source,
          'The remaining old source does not convert to this new source.',
        );
      transferred.set(source, content);
    }
  }
  const conventions: ConventionInput[] = expectedSourceNames
    .filter((source) => source !== main)
    .map((source) => ({
      source,
      output: toNewOutput(source),
      text: decode(transferred.get(source)!, source),
    }));
  const documents = render(
    { source: main, text: decode(transferred.get(main)!, main) },
    conventions,
    selected,
  );
  const newDocuments = new Map(
    [...documents].map(([path, text]) => [path, bytes(text)]),
  );
  // Render old bodies separately, including when cleanup has already removed main.
  const oldConventions: ConventionInput[] = oldSources
    .filter((source) => source !== oldMain)
    .map((source) => ({
      source,
      output: toOldOutput(source),
      text: decode(original.get(source)!, source),
    }));
  const oldDocuments = render(
    {
      source: oldMain,
      text: original.has(oldMain)
        ? decode(original.get(oldMain)!, oldMain)
        : '# Migration\n<!-- agentscli:conventions -->\n',
    },
    oldConventions,
    legacy.language,
  );
  if (!original.has(oldMain) || oldSources.length !== inventory.length)
    oldDocuments.delete('AGENTS.md');
  const oldOutputFiles = walk(io, root, legacy.conventions_dir);
  for (const path of new Set([
    ...oldOutputFiles,
    ...inventory.map(toOldOutput),
  ])) {
    const content = snapshot(io, root, path);
    if (!content) continue;
    if (oldDocuments.has(path)) {
      const converted = newDocuments.get(mappings.get(path)!);
      if (
        !isGenerated(content) ||
        (!equalBytes(content, bytes(oldDocuments.get(path)!)) &&
          !(converted && equalBytes(content, converted)))
      )
        conflict(
          path,
          'Legacy generated output was edited directly. Reconcile useful content in its template first.',
        );
    }
    if (mappings.has(path) && !isGenerated(content))
      conflict(path, 'A manual document occupies an expected legacy output.');
    inputs.set(path, content);
  }
  const effects: Effect[] = [];
  const prepared = new Map<string, Uint8Array | undefined>(transferred);
  for (const [path, content] of newDocuments) prepared.set(path, content);
  for (const [name, files] of Object.entries(resources.skills))
    for (const [relative, content] of Object.entries(files))
      prepared.set(`.agents/skills/${name}/${relative}`, content);
  const skills = managedSkillEffects(io, root, resources);
  for (const effect of skills)
    if (effect.action === 'delete' && !effect.directory)
      prepared.set(effect.path, undefined);
  function prepare(
    path: string,
    content: Uint8Array,
    rootDocument = false,
  ): void {
    const previous = snapshot(io, root, path);
    if (previous && !equalBytes(previous, content)) {
      const old = oldDocuments.get(path);
      if (!rootDocument || !old || !equalBytes(previous, bytes(old)))
        conflict(
          path,
          'Occupied new destination differs from its deterministic migration result.',
        );
    }
    if (!previous || !equalBytes(previous, content))
      effects.push({
        path,
        action: previous ? 'update' : 'create',
        content,
        previous,
      });
  }
  if (cleaning) {
    const drift = plan(withoutLegacy(io, root), root, 'sync', resources);
    if (drift.length)
      conflict(
        drift[0]!.path,
        'Published migration destinations or managed skills are incomplete or changed.',
      );
  } else {
    for (const [path, content] of transferred) prepare(path, content);
    for (const [path, content] of newDocuments)
      prepare(path, content, path === 'AGENTS.md');
    for (const path of walk(io, root, OUTPUT_ROOT))
      if (
        path.endsWith('.md') &&
        !newDocuments.has(path) &&
        isGenerated(read(io, root, path))
      )
        conflict(
          path,
          'Unexpected generated output occupies the new client tree.',
        );
    effects.push(...skills);
  }
  // Root AGENTS is an in-place replacement, unlike the retained legacy outputs.
  inputs.set('AGENTS.md', newDocuments.get('AGENTS.md'));
  const config =
    configBytes ?? bytes(serializeManifest({ language: selected }));
  const verifyPrepared = (current: FileSystem, currentRoot: string): void => {
    verify(current, currentRoot, prepared);
    const sources = newSources(current, currentRoot);
    if (
      sources.length !== expectedSourceNames.length ||
      sources.some((path, index) => path !== expectedSourceNames[index])
    )
      throw new EngineError(
        'MIGRATION_CHANGED',
        'New source inventory changed after planning.',
        3,
        CONVENTION_ROOT,
      );
    // Re-run ordinary planning against the prepared tree and a virtual published config.
    const hidden = withoutLegacy(current, currentRoot),
      configPath = containedPath(currentRoot, CONFIG_PATH);
    const configured: FileSystem = {
      ...hidden,
      info: (path) =>
        path === configPath ? { kind: 'file', nlink: 1 } : hidden.info(path),
      read: (path) => (path === configPath ? config : hidden.read(path)),
    };
    if (plan(configured, currentRoot, 'sync', resources).length)
      throw new EngineError(
        'MIGRATION_CHANGED',
        'Prepared client no longer matches the migration plan.',
        3,
        CONFIG_PATH,
      );
  };
  if (!cleaning)
    effects.push({
      path: CONFIG_PATH,
      action: 'create',
      content: config,
      precondition: (current, currentRoot) => {
        verify(current, currentRoot, inputs);
        verifyPrepared(current, currentRoot);
      },
    });
  const published = new Map<string, Uint8Array | undefined>([
    [CONFIG_PATH, config],
    [MANIFEST, legacyBytes],
  ]);
  const cleanupGuard = (current: FileSystem, currentRoot: string): void => {
    verify(current, currentRoot, published);
    verifyPrepared(current, currentRoot);
    // Earlier cleanup effects may already be absent. Every retained legacy
    // artifact must still match its preflight bytes before advancing cleanup.
    for (const [path, content] of inputs) {
      if (path === 'AGENTS.md' || !content) continue;
      const retained = snapshot(current, currentRoot, path);
      if (retained && !equalBytes(retained, content))
        throw new EngineError(
          'MIGRATION_CHANGED',
          `${path} changed during cleanup.`,
          3,
          path,
        );
    }
  };
  const deleted = new Set<string>();
  for (const path of oldOutputFiles) {
    const previous = read(io, root, path);
    if (path.endsWith('.md') && isGenerated(previous)) {
      effects.push({
        path,
        action: 'delete',
        previous,
        precondition: cleanupGuard,
      });
      deleted.add(path);
    }
  }
  for (const source of oldSources) {
    effects.push({
      path: source,
      action: 'delete',
      previous: original.get(source),
      precondition: cleanupGuard,
    });
    deleted.add(source);
  }
  // Directory removals are nonrecursive and only planned where every child is eligible.
  const directories = [
    ...new Set([
      legacy.templates_dir,
      legacy.conventions_dir,
      ...allDirectories(io, root, legacy.templates_dir),
      ...allDirectories(io, root, legacy.conventions_dir),
    ]),
  ].sort((a, b) => b.split('/').length - a.split('/').length);
  for (const path of directories) {
    if (!inspect(io, root, path, 'directory')) continue;
    if (
      io
        .names(containedPath(root, path))
        .every((name) => deleted.has(`${path}/${name}`))
    ) {
      effects.push({
        path,
        action: 'delete',
        directory: true,
        precondition: cleanupGuard,
      });
      deleted.add(path);
    }
  }
  const removed = new Map<string, Uint8Array | undefined>(
    [...deleted]
      .filter((path) => !directories.includes(path))
      .map((path) => [path, undefined]),
  );
  effects.push({
    path: MANIFEST,
    action: 'delete',
    previous: legacyBytes,
    precondition: (current, currentRoot) => {
      cleanupGuard(current, currentRoot);
      verify(current, currentRoot, removed);
      if (
        walk(current, currentRoot, legacy.templates_dir).some((path) =>
          path.endsWith('.tpl.md'),
        ) ||
        walk(current, currentRoot, legacy.conventions_dir).some(
          (path) =>
            path.endsWith('.md') &&
            isGenerated(read(current, currentRoot, path)),
        )
      )
        throw new EngineError(
          'MIGRATION_CHANGED',
          'Legacy inventory changed before final manifest removal.',
          3,
          MANIFEST,
        );
    },
  });
  uniquePaths(
    effects.filter((effect) => !effect.directory).map((effect) => effect.path),
  );
  return effects;
}
