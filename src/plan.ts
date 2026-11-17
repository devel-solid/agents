import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, relative, join, basename } from 'node:path';
import { EngineError, loadManifest, type LoadedManifest } from './manifest.js';
import {
  portableKey,
  resolvedPath,
  safeJoin,
  validateDestination,
} from './paths.js';
import {
  resolveComposition,
  scanDirectory,
  classifySource,
  type ResolvedComposition,
  type ResolveOptions,
} from './resolve.js';
import { renderComposition, type RenderedOutput } from './render.js';
import { validateComposition } from './validate.js';
import { assertConsumerRoot } from './roles.js';
import { rawHash, serializeLock, textHash } from './lock.js';
import {
  generationIdentity,
  readState,
  serializeState,
  snapshotInventory,
  type OwnershipState,
  type OwnedOutput,
  type SourceProvenance,
} from './state.js';

export interface PlanChange extends RenderedOutput {
  action: 'create' | 'update' | 'remove' | 'adopt' | 'metadata';
  reason: string;
}
export interface SyncPlan {
  repoRoot: string;
  source: ResolvedComposition['source'];
  templatePath: string;
  families: number;
  changes: PlanChange[];
  outputs: RenderedOutput[];
  cacheActivity: string[];
  preconditions: Record<string, string | null>;
  pathIdentities: Record<string, string>;
  sourceInventories: {
    path: string;
    entries: string[];
    identity?: string;
    allowedRoot?: string;
  }[];
  ownership: OwnershipState;
  previousSource?: { repository: string; requestedRef: string; commit: string };
  provenance: (OwnedOutput & {
    ownership: 'owned' | 'unmanaged';
    drift: boolean;
  })[];
  conflicts: { path: string; reason: string }[];
  unmanagedTargets: { path: string; ownership: 'unmanaged' }[];
}
export interface PlanOptions extends ResolveOptions {
  inspection?: boolean;
  allowConflicts?: boolean;
}
export function buildSyncPlan(
  repoRoot: string,
  manifest?: LoadedManifest,
  options: PlanOptions = {},
): SyncPlan {
  repoRoot = resolvedPath(repoRoot);
  assertConsumerRoot(repoRoot);
  const loaded = manifest ?? loadManifest(repoRoot);
  const config = loaded.data.outputs['AGENTS.md'].include.conventions;
  safeJoin(repoRoot, config.local.tpl_dir, 'local.tpl_dir');
  const localDirectory = join(repoRoot, config.local.tpl_dir);
  const localInventory = {
    path: localDirectory,
    identity: resolvedPath(localDirectory),
    entries: snapshotInventory(localDirectory),
  };
  const durablePaths = [
    'agents-compose.yml',
    'agents-lock.json',
    '.agents/agents-state.json',
  ];
  const durableBefore = new Map(
    durablePaths.map((path) => {
      const absolute = join(repoRoot, path);
      return [
        absolute,
        existsSync(absolute) ? rawHash(readFileSync(absolute)) : null,
      ] as const;
    }),
  );
  if (
    durableBefore.get(join(repoRoot, 'agents-compose.yml')) !==
    rawHash(loaded.source)
  )
    throw new EngineError(
      'PLAN_PRECONDITION',
      'O manifesto mudou antes do planejamento; refaça a prévia.',
    );
  const composition = resolveComposition(repoRoot, loaded, options);
  validateComposition(composition);
  const previous = readState(repoRoot),
    outputs = renderComposition(composition),
    changes: PlanChange[] = [],
    conflicts: SyncPlan['conflicts'] = [];
  const preconditions: Record<string, string | null> = {};
  const pathIdentities: Record<string, string> = {};
  const record = (path: string): void => {
    preconditions[path] = existsSync(path) ? rawHash(readFileSync(path)) : null;
    pathIdentities[path] = resolvedPath(path);
  };
  record(join(repoRoot, 'agents-compose.yml'));
  record(join(repoRoot, 'agents-lock.json'));
  record(join(repoRoot, '.agents/agents-state.json'));
  for (const [path, expected] of durableBefore)
    if (preconditions[path] !== expected)
      throw new EngineError(
        'PLAN_PRECONDITION',
        `Entrada durável mudou durante o planejamento: ${path}.`,
      );
  const inputs: SourceProvenance[] = [];
  const provenanceFor = (
    path: string,
    origin: 'remote' | 'local',
    family?: string,
    expected?: string,
  ): SourceProvenance => {
    const bytes = readFileSync(path);
    if (expected !== undefined && textHash(bytes) !== textHash(expected))
      throw new EngineError(
        'PLAN_PRECONDITION',
        `Fonte mudou durante o planejamento: ${path}.`,
      );
    preconditions[path] = rawHash(bytes);
    pathIdentities[path] = resolvedPath(path);
    const base = origin === 'remote' ? composition.source.checkout : repoRoot;
    const result: SourceProvenance = {
      path: relative(base, path).replaceAll('\\', '/'),
      origin,
      sha256: textHash(bytes),
      ...(family ? { family } : {}),
    };
    if (origin === 'remote')
      Object.assign(result, {
        repository: composition.lock?.repository,
        commit: composition.source.commit,
      });
    inputs.push(result);
    return result;
  };
  const template = provenanceFor(
    composition.templatePath,
    loaded.data.agents ? 'remote' : 'local',
    undefined,
    composition.template,
  );
  const outputSources = new Map<string, SourceProvenance[]>();
  const parents: SourceProvenance[] = [];
  for (const family of composition.families) {
    const origin = family.origin;
    if (!origin)
      throw new EngineError(
        'SOURCE_ORIGIN',
        'Origem da família não identificada.',
      );
    const parent = provenanceFor(
      family.parent.sourcePath,
      origin,
      family.parent.sourceDisplay,
      family.parent.text,
    );
    parents.push(parent);
    const children = family.children.map((child) => {
      const entry = provenanceFor(
        child.sourcePath,
        origin,
        family.parent.sourceDisplay,
        child.text,
      );
      outputSources.set(child.targetDisplay, [entry]);
      return entry;
    });
    outputSources.set(family.parent.targetDisplay, [parent, ...children]);
  }
  outputSources.set('AGENTS.md', [template, ...parents]);
  inputs.push({
    path: 'agents-compose.yml',
    origin: 'manifest',
    sha256: textHash(loaded.source),
  });
  const ownedOutputs = outputs.map((output) => ({
    path: output.path,
    sha256: textHash(output.content),
    sources: outputSources.get(output.path)!,
  }));
  const stateBase = {
    schemaVersion: 1 as const,
    rendererContract: 1 as const,
    normalization: 'utf8-lf' as const,
    inputs,
    outputs: ownedOutputs,
  };
  const ownership: OwnershipState = {
    ...stateBase,
    generation: generationIdentity(stateBase),
  };
  const oldOutputs = new Map(
    previous?.outputs.map((output) => [portableKey(output.path), output]) ?? [],
  );
  const conflict = (path: string): void => {
    conflicts.push({
      path,
      reason:
        'Documento difere do estado gerado comprovado. Reconcilie a alteração na fonte e restaure o documento antes de sincronizar.',
    });
  };
  const provenance: SyncPlan['provenance'] = [];
  for (const output of outputs) {
    const target = validateDestination(
      repoRoot,
      output.path,
      output.path === 'AGENTS.md',
    );
    record(join(repoRoot, output.path));
    const present = existsSync(target),
      current = present ? textHash(readFileSync(target)) : undefined,
      desired = textHash(output.content),
      owned = oldOutputs.get(portableKey(output.path));
    if (present && current !== (owned?.sha256 ?? desired))
      conflict(output.path);
    else if (!present || current !== desired)
      changes.push({
        ...output,
        action: present ? 'update' : 'create',
        reason: present
          ? 'Conteúdo gerado diferente.'
          : 'Documento gerado ausente.',
      });
    else if (!owned)
      changes.push({
        ...output,
        action: 'adopt',
        reason:
          'Conteúdo esperado comprovado; registrar ownership sem regravar o documento.',
      });
    provenance.push({
      ...ownedOutputs.find((item) => item.path === output.path)!,
      ownership: owned ? 'owned' : 'unmanaged',
      drift: present ? current !== desired : true,
    });
  }
  const desiredKeys = new Set(
    outputs.map((output) => portableKey(output.path)),
  );
  for (const old of previous?.outputs ?? []) {
    if (desiredKeys.has(portableKey(old.path))) continue;
    const target = validateDestination(
      repoRoot,
      old.path,
      old.path === 'AGENTS.md',
    );
    record(join(repoRoot, old.path));
    if (existsSync(target)) {
      if (textHash(readFileSync(target)) !== old.sha256) conflict(old.path);
      else
        changes.push({
          path: old.path,
          content: '',
          action: 'remove',
          reason:
            'Documento não selecionado, com ownership e bytes comprovados.',
        });
    }
  }
  const metadata = (path: string, content: string | undefined): void => {
    const target = safeJoin(repoRoot, path);
    if (content === undefined) {
      if (existsSync(target))
        changes.push({
          path,
          content: '',
          action: 'remove',
          reason: 'Base remota removida explicitamente do manifesto.',
        });
    } else if (!existsSync(target) || readFileSync(target, 'utf8') !== content)
      changes.push({
        path,
        content,
        action: 'metadata',
        reason: 'Metadados duráveis da geração.',
      });
  };
  metadata(
    'agents-lock.json',
    composition.lock ? serializeLock(composition.lock) : undefined,
  );
  metadata('.agents/agents-state.json', serializeState(ownership));
  const directories = new Map(
    composition.families.map((f) => [
      dirname(f.parent.sourcePath),
      f.origin === 'remote'
        ? safeJoin(composition.source.checkout, config.remote.tpl_dir)
        : localDirectory,
    ]),
  );
  const sourceInventories = [
    localInventory,
    ...[...directories]
      .filter(([path]) => resolvedPath(path) !== resolvedPath(localDirectory))
      .map(([path, allowedRoot]) => ({
        path,
        allowedRoot,
        identity: resolvedPath(path),
        entries: snapshotInventory(path, allowedRoot),
      })),
  ];
  if (
    localInventory.identity !== resolvedPath(localDirectory) ||
    JSON.stringify(localInventory.entries) !==
      JSON.stringify(snapshotInventory(localDirectory))
  )
    throw new EngineError(
      'PLAN_PRECONDITION',
      'O inventário local mudou durante o planejamento.',
    );
  for (const family of composition.families.filter(
    (item) => item.origin === 'remote',
  )) {
    const scan = scanDirectory(
      dirname(family.parent.sourcePath),
      safeJoin(composition.source.checkout, config.remote.tpl_dir),
    );
    const root = classifySource(basename(family.parent.sourcePath))!.root;
    if (
      JSON.stringify(scan.children.get(root) ?? []) !==
      JSON.stringify(family.children.map((item) => item.sourcePath))
    )
      throw new EngineError(
        'PLAN_PRECONDITION',
        'O inventário remoto mudou durante o planejamento.',
      );
  }
  const unmanagedTargets: SyncPlan['unmanagedTargets'] = [];
  const scanUnmanaged = (directory: string): void => {
    if (!existsSync(directory)) return;
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (
        ['.git', '.cache', '.agents', 'node_modules'].includes(
          portableKey(entry.name),
        )
      )
        continue;
      const child = join(directory, entry.name);
      if (entry.isDirectory()) scanUnmanaged(child);
      else if (entry.isFile() && entry.name.endsWith('.md')) {
        const path = relative(repoRoot, child).replaceAll('\\', '/');
        if (
          !desiredKeys.has(portableKey(path)) &&
          !oldOutputs.has(portableKey(path))
        )
          unmanagedTargets.push({ path, ownership: 'unmanaged' });
      }
    }
  };
  if (options.inspection) scanUnmanaged(safeJoin(repoRoot, config.out_dir));
  if (conflicts.length && !options.inspection && !options.allowConflicts)
    throw new EngineError(
      'OWNERSHIP_CONFLICT',
      conflicts.map((c) => `${c.path}: ${c.reason}`).join('\n'),
      2,
      {
        remediation:
          'Altere as fontes autorais; não apague ownership para forçar substituição.',
      },
    );
  return {
    repoRoot,
    source: composition.source,
    templatePath: composition.templatePath,
    families: composition.families.length,
    changes,
    outputs,
    cacheActivity: composition.cacheActivity,
    preconditions,
    pathIdentities,
    sourceInventories,
    ownership,
    provenance,
    conflicts,
    unmanagedTargets,
    ...(composition.previousLock
      ? {
          previousSource: {
            repository: composition.previousLock.repository,
            requestedRef: composition.previousLock.requestedRef,
            commit: composition.previousLock.commit,
          },
        }
      : {}),
  };
}
