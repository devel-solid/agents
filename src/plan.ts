import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadManifest, type LoadedManifest } from './manifest.js';
import { validateDestination } from './paths.js';
import {
  resolveComposition,
  type ResolvedComposition,
  type ResolveOptions,
} from './resolve.js';
import { renderComposition, type RenderedOutput } from './render.js';
import { validateComposition } from './validate.js';
import { assertConsumerRoot } from './roles.js';

export interface PlanChange extends RenderedOutput {
  action: 'create' | 'update';
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
}
export function buildSyncPlan(
  repoRoot: string,
  manifest?: LoadedManifest,
  options: ResolveOptions = {},
): SyncPlan {
  repoRoot = resolve(repoRoot);
  assertConsumerRoot(repoRoot);
  const composition = resolveComposition(
    repoRoot,
    manifest ?? loadManifest(repoRoot),
    options,
  );
  validateComposition(composition);
  const outputs = renderComposition(composition),
    changes: PlanChange[] = [];
  for (const output of outputs) {
    const target = validateDestination(
      repoRoot,
      output.path,
      output.path === 'AGENTS.md',
    );
    const present = existsSync(target);
    if (
      !present ||
      !readFileSync(target).equals(Buffer.from(output.content, 'utf8'))
    )
      changes.push({
        ...output,
        action: present ? 'update' : 'create',
        reason: present
          ? 'Conteúdo gerado diferente.'
          : 'Documento gerado ausente.',
      });
  }
  return {
    repoRoot,
    source: composition.source,
    templatePath: composition.templatePath,
    families: composition.families.length,
    changes,
    outputs,
    cacheActivity: composition.cacheActivity,
  };
}
