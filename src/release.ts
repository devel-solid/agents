import { spawnSync } from 'node:child_process';
import { relative } from 'node:path';
import { EngineError } from './manifest.js';
import { resolvedPath, portableKey } from './paths.js';
import { validateBase } from './validate.js';
import { assertBaseRoot } from './roles.js';

export type Bump = 'major' | 'minor' | 'patch';
const stable = /^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
function parts(ref: string): bigint[] {
  const match = stable.exec(ref);
  if (!match || match[0] !== ref)
    throw new EngineError('RELEASE_VERSION', `Tag semver inválida: ${ref}.`);
  return match.slice(1).map(BigInt);
}
export function nextVersion(current: string, bump: string): string {
  const index = ['major', 'minor', 'patch'].indexOf(bump);
  if (index < 0)
    throw new EngineError('USAGE', 'Informe --bump patch, minor ou major.');
  const numbers = parts(current);
  numbers[index] = numbers[index]! + 1n;
  for (let i = index + 1; i < 3; i++) numbers[i] = 0n;
  return `v${numbers.join('.')}`;
}
function git(
  repoRoot: string,
  args: string[],
  allowMissing = false,
): string | null {
  const result = spawnSync(
    'git',
    ['-c', 'core.fsmonitor=false', '-C', repoRoot, ...args],
    {
      encoding: 'utf8',
      windowsHide: true,
      maxBuffer: 16 * 1024 * 1024,
      env: {
        ...process.env,
        GIT_OPTIONAL_LOCKS: '0',
        GIT_TERMINAL_PROMPT: '0',
      },
    },
  );
  if (result.error && (result.error as NodeJS.ErrnoException).code === 'ENOENT')
    throw new EngineError(
      'GIT_MISSING',
      'Git é necessário para versionar uma base.',
    );
  if (allowMissing && result.status === 1 && !result.error) return null;
  if (result.error || result.status !== 0)
    throw new EngineError(
      'RELEASE_GIT',
      'A operação Git local falhou. Confira o repositório e o estado da tag.',
      3,
    );
  return result.stdout.trim();
}
export interface ReleasePlan {
  currentVersion: string;
  baselineTag: string | null;
  nextVersion: string;
  bump: Bump;
  head: string;
}
export function planRelease(repoRoot: string, bump: string): ReleasePlan {
  nextVersion('v0.0.0', bump);
  assertBaseRoot(repoRoot);
  const top = git(repoRoot, ['rev-parse', '--show-toplevel'])!;
  if (portableKey(resolvedPath(top)) !== portableKey(resolvedPath(repoRoot)))
    throw new EngineError(
      'RELEASE_ROOT',
      'Execute release na raiz Git da base ou use --repo-root.',
    );
  const head = git(
    repoRoot,
    ['rev-parse', '--verify', '--quiet', 'HEAD'],
    true,
  );
  if (!head)
    throw new EngineError(
      'RELEASE_HEAD',
      'Faça o primeiro commit da base antes de versioná-la.',
    );
  if (git(repoRoot, ['status', '--porcelain=v1', '--untracked-files=all']))
    throw new EngineError(
      'RELEASE_DIRTY',
      'Faça commit das alterações antes de versionar a base.',
    );
  const base = validateBase(repoRoot);
  const sources = [
    base.templatePath,
    ...base.families.flatMap((family) =>
      [family.parent, ...family.children].map((source) => source.sourcePath),
    ),
  ];
  for (const source of sources) {
    const paths = new Set([
      relative(repoRoot, source),
      relative(repoRoot, resolvedPath(source)),
    ]);
    for (const path of paths)
      if (!git(repoRoot, ['ls-files', '--error-unmatch', '--', path], true))
        throw new EngineError(
          'RELEASE_SOURCE_UNTRACKED',
          `A fonte precisa estar no commit da base: ${path}.`,
        );
  }
  const tags = git(repoRoot, ['tag', '--merged', head, '--list'])!
    .split(/\r?\n/)
    .filter((tag) => stable.test(tag));
  tags.sort((a, b) => {
    const aa = parts(a),
      bb = parts(b);
    for (let i = 0; i < 3; i++)
      if (aa[i] !== bb[i]) return aa[i]! < bb[i]! ? -1 : 1;
    return 0;
  });
  const baselineTag = tags.at(-1) ?? null;
  const currentVersion = baselineTag ?? 'v0.0.0';
  const next = nextVersion(currentVersion, bump);
  if (
    git(
      repoRoot,
      ['show-ref', '--verify', '--quiet', `refs/tags/${next}`],
      true,
    ) !== null
  )
    throw new EngineError(
      'RELEASE_TAG_EXISTS',
      `A tag ${next} já existe; nenhuma tag foi substituída.`,
    );
  return {
    currentVersion,
    baselineTag,
    nextVersion: next,
    bump: bump as Bump,
    head,
  };
}
export function release(repoRoot: string, bump: string, dryRun = false) {
  const plan = planRelease(repoRoot, bump);
  if (!dryRun) {
    const current = planRelease(repoRoot, bump);
    if (current.head !== plan.head || current.nextVersion !== plan.nextVersion)
      throw new EngineError(
        'RELEASE_STATE_CHANGED',
        'O estado mudou durante o cálculo. Revise uma nova prévia antes de continuar.',
      );
    // Criação sem force preserva uma tag criada concorrentemente.
    git(repoRoot, [
      '-c',
      'tag.gpgSign=false',
      'tag',
      '--no-sign',
      '--',
      plan.nextVersion,
      plan.head,
    ]);
  }
  return {
    result: { ...plan, mode: dryRun ? 'preview' : 'applied', applied: !dryRun },
    changes: [
      {
        action: 'create',
        path: `refs/tags/${plan.nextVersion}`,
        reason: dryRun
          ? 'Tag local prevista no commit atual.'
          : 'Tag local criada no commit atual.',
      },
    ],
    diagnostics: [],
  };
}
