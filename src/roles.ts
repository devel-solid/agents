import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { EngineError } from './manifest.js';
import { portableKey, resolvedPath, safeJoin } from './paths.js';

export const baseMarkerPath = '.agents/base.json';
export const baseMarkerContent =
  '{\n  "schemaVersion": 1,\n  "kind": "base"\n}\n';

function present(path: string): boolean {
  try {
    lstatSync(path);
    return true;
  } catch (error) {
    if (
      ['ENOENT', 'ENOTDIR'].includes(
        (error as NodeJS.ErrnoException).code ?? '',
      )
    )
      return false;
    throw error;
  }
}

export function hasBaseMarker(root: string): boolean {
  return present(join(root, baseMarkerPath));
}

export function readBaseMarker(root: string): void {
  const path = safeJoin(root, baseMarkerPath);
  const actual = portableKey(relative(resolvedPath(root), path));
  if (actual !== baseMarkerPath)
    throw new EngineError(
      'PATH_RESERVED',
      `O marcador da base resolve para outro caminho: ${baseMarkerPath}.`,
    );
  try {
    const info = lstatSync(join(root, baseMarkerPath));
    if (!info.isFile() || info.isSymbolicLink() || info.nlink > 1)
      throw new Error();
    const value: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)),
    );
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error();
    const data = value as Record<string, unknown>;
    if (
      data.schemaVersion !== 1 ||
      data.kind !== 'base' ||
      Object.keys(data).length !== 2
    )
      throw new Error();
  } catch {
    throw new EngineError(
      'PROJECT_ROLE_INVALID',
      `Marcador de base inválido: ${baseMarkerPath}. Preserve os arquivos e confira sua identificação.`,
    );
  }
}

export function findBaseRoot(start: string): string | null {
  let current = resolvedPath(start);
  while (true) {
    if (hasBaseMarker(current)) {
      readBaseMarker(current);
      return current;
    }
    if (present(join(current, '.git'))) return null;
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

export function assertConsumerRoot(root: string): void {
  const base = findBaseRoot(root);
  if (base)
    throw new EngineError(
      'PROJECT_ROLE_CONFLICT',
      'Esta raiz pertence a uma base. Use validate --base ou release; init consumidor e sync não operam na base.',
    );
}

export function assertBaseRoot(root: string, requireMarker = true): void {
  root = resolve(root);
  if (present(join(root, 'agents-compose.yml')))
    throw new EngineError(
      'PROJECT_ROLE_CONFLICT',
      'Uma base não pode conter manifesto consumidor. Use um projeto separado para consumir as instruções.',
    );
  const base = findBaseRoot(root);
  if (
    base &&
    portableKey(resolvedPath(base)) !== portableKey(resolvedPath(root))
  )
    throw new EngineError(
      'PROJECT_ROLE_CONFLICT',
      'Execute a operação na raiz da base ou use --repo-root.',
    );
  if (requireMarker && !base)
    throw new EngineError(
      'BASE_NOT_INITIALIZED',
      'Base não inicializada. Prepare uma raiz separada com agents init --base.',
    );
}

export function validateOwnedAgents(root: string): void {
  const path = safeJoin(root, 'AGENTS.md');
  if (!existsSync(path))
    throw new EngineError(
      'BASE_INSTRUCTIONS_MISSING',
      'AGENTS.md da base ausente. Use agents init --base para criar as instruções padrão.',
    );
  try {
    const info = lstatSync(join(root, 'AGENTS.md'));
    if (!info.isFile() || info.isSymbolicLink() || info.nlink > 1)
      throw new Error();
    if (
      !new TextDecoder('utf-8', { fatal: true })
        .decode(readFileSync(path))
        .trim()
    )
      throw new Error();
  } catch {
    throw new EngineError(
      'INIT_CONFLICT',
      'AGENTS.md da base deve ser um arquivo UTF-8 não vazio, sem links. Nenhuma substituição automática é feita.',
    );
  }
}
