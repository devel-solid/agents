import { join, resolve } from 'node:path';
import { assertBaseRoot, validateOwnedAgents } from './roles.js';
import { assertUniqueDestinations, validateRelativePath } from './paths.js';
import {
  listParentSources,
  loadTemplate,
  resolveFamily,
  type ConventionFamily,
  type ResolvedComposition,
} from './resolve.js';

export function validateComposition(composition: ResolvedComposition): void {
  const paths = [
    'AGENTS.md',
    ...composition.families.flatMap((family) =>
      [family.parent, ...family.children].map(
        (artifact) => artifact.targetDisplay,
      ),
    ),
  ];
  assertUniqueDestinations(composition.repoRoot, paths);
}
export function validateBase(repoRoot: string): {
  families: ConventionFamily[];
  templatePath: string;
} {
  repoRoot = resolve(repoRoot);
  assertBaseRoot(repoRoot);
  validateOwnedAgents(repoRoot);
  loadTemplate(repoRoot);
  const parents = listParentSources(repoRoot);
  const families = parents.map((parent) =>
    resolveFamily(
      repoRoot,
      'templates/docs/conventions',
      parent,
      'docs/conventions',
    ),
  );
  assertUniqueDestinations(repoRoot, [
    'AGENTS.md',
    ...families.flatMap((family) =>
      [family.parent, ...family.children].map(
        (artifact) => artifact.targetDisplay,
      ),
    ),
  ]);
  return {
    families,
    templatePath: join(repoRoot, 'templates', 'AGENTS.tpl.md'),
  };
}
export function validateRemoteSelection(
  checkout: string,
  conventions: string[],
  tplDir = 'templates/docs/conventions',
  outDir = 'docs/conventions',
): void {
  validateRelativePath(tplDir, 'remote.tpl_dir');
  validateRelativePath(outDir, 'out_dir');
  loadTemplate(checkout);
  const families = conventions.map((parent) =>
    resolveFamily(checkout, tplDir, parent, outDir),
  );
  assertUniqueDestinations(checkout, [
    'AGENTS.md',
    ...families.flatMap((family) =>
      [family.parent, ...family.children].map(
        (artifact) => artifact.targetDisplay,
      ),
    ),
  ]);
}
