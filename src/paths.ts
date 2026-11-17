import { existsSync, lstatSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { EngineError } from './manifest.js';

export function portableKey(path: string): string {
  return path.replaceAll('\\', '/').normalize('NFC').toLowerCase();
}
export function validateRelativePath(
  path: string,
  field = 'path',
  allowDot = true,
): string {
  if (allowDot && path === '.') return path;
  const parts = path.replaceAll('\\', '/').split('/');
  if (
    !path.trim() ||
    path !== path.trim() ||
    isAbsolute(path) ||
    /^[A-Za-z]:/u.test(path) ||
    /^[\\/]/u.test(path) ||
    parts.some(
      (p) =>
        !p ||
        p === '..' ||
        p === '.' ||
        /[<>:"|?*\x00-\x1f]/u.test(p) ||
        /[. ]$/u.test(p) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(p),
    )
  ) {
    throw new EngineError(
      'PATH_INVALID',
      `Caminho relativo inseguro em ${field}: ${path}.`,
      2,
      { field },
    );
  }
  return parts.join('/');
}
export function resolvedPath(path: string): string {
  const absolute = resolve(path);
  try {
    return realpathSync.native(absolute);
  } catch (error) {
    if (
      !['ENOENT', 'ENOTDIR'].includes(
        (error as NodeJS.ErrnoException).code ?? '',
      )
    )
      throw error;
    if (
      existsSync(absolute) ||
      (() => {
        try {
          return lstatSync(absolute).isSymbolicLink();
        } catch {
          return false;
        }
      })()
    ) {
      throw new EngineError(
        'PATH_LINK',
        `Link sem destino válido: ${absolute}.`,
      );
    }
    const parent = dirname(absolute);
    if (parent === absolute) return absolute;
    return join(resolvedPath(parent), relative(parent, absolute));
  }
}
export function assertWithin(
  path: string,
  root: string,
  field = 'path',
): string {
  const actual = resolvedPath(path),
    base = resolvedPath(root);
  const rel = relative(base, actual);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new EngineError(
      'PATH_ESCAPE',
      `Caminho fora da raiz permitida em ${field}: ${path}.`,
      2,
      { field },
    );
  return actual;
}
export function safeJoin(root: string, path: string, field = 'path'): string {
  const normalized = validateRelativePath(path, field);
  return assertWithin(resolve(root, normalized), root, field);
}
export function validateDestination(
  repoRoot: string,
  path: string,
  allowAgents = false,
): string {
  const normalized = validateRelativePath(path, 'destino', false);
  const parts = portableKey(normalized).split('/');
  if (
    parts.some((p) =>
      ['.git', '.cache', 'node_modules', '.agents'].includes(p),
    ) ||
    (!allowAgents && portableKey(normalized) === 'agents.md') ||
    ['agents-lock.json', 'agents-compose.yml'].includes(portableKey(normalized))
  ) {
    throw new EngineError('PATH_RESERVED', `Destino reservado: ${path}.`);
  }
  const target = safeJoin(repoRoot, normalized, 'destino');
  if (
    existsSync(target) &&
    lstatSync(resolve(repoRoot, normalized)).isSymbolicLink()
  )
    throw new EngineError(
      'DESTINATION_LINK',
      `Destino com link de arquivo preservado: ${path}.`,
      2,
      {
        remediation:
          'Restaure um arquivo regular no destino antes de sincronizar.',
      },
    );
  const actualRelative = relative(resolvedPath(repoRoot), target).replaceAll(
    '\\',
    '/',
  );
  if (
    ['agents-lock.json', 'agents-compose.yml'].includes(
      portableKey(actualRelative),
    ) ||
    actualRelative
      .split('/')
      .some((p) =>
        ['.git', '.cache', 'node_modules', '.agents'].includes(portableKey(p)),
      )
  )
    throw new EngineError(
      'PATH_RESERVED',
      `Destino resolvido em diretório reservado: ${path}.`,
    );
  if (existsSync(target) && !statSync(target).isFile())
    throw new EngineError('PATH_TARGET', `Destino não é arquivo: ${path}.`);
  if (existsSync(target) && statSync(target).nlink > 1)
    throw new EngineError(
      'DESTINATION_HARDLINK',
      `Destino com múltiplos vínculos físicos preservado: ${path}.`,
      2,
      {
        field: 'destino',
        location: { path: target, line: 1, column: 1 },
        remediation:
          'Remova o compartilhamento físico do arquivo antes de sincronizar; a ferramenta não pode sobrescrever arquivos alheios vinculados ao mesmo conteúdo.',
      },
    );
  let parent = dirname(target);
  while (parent !== dirname(parent)) {
    if (existsSync(parent) && !statSync(parent).isDirectory())
      throw new EngineError(
        'PATH_TARGET',
        `Diretório de destino é arquivo: ${path}.`,
      );
    if (parent === resolvedPath(repoRoot)) break;
    parent = dirname(parent);
  }
  return target;
}
export function assertUniqueDestinations(
  repoRoot: string,
  paths: string[],
): void {
  const declared = new Map<string, string>(),
    resolved = new Map<string, string>();
  for (const path of paths) {
    const target = validateDestination(repoRoot, path, path === 'AGENTS.md');
    for (const [map, key] of [
      [declared, portableKey(path)],
      [resolved, portableKey(target)],
    ] as const) {
      const previous = map.get(key);
      if (previous)
        throw new EngineError(
          'DESTINATION_COLLISION',
          `Destinos equivalentes: ${previous} e ${path}.`,
        );
      for (const [other, display] of map)
        if (key.startsWith(`${other}/`) || other.startsWith(`${key}/`))
          throw new EngineError(
            'DESTINATION_COLLISION',
            `Destinos sobrepostos: ${display} e ${path}.`,
          );
      map.set(key, path);
    }
  }
}
