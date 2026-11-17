import { isAbsolute, relative, resolve, sep } from 'node:path';
import { EngineError } from './manifest.js';

export function portableKey(path: string): string {
  return path.replaceAll('\\', '/').normalize('NFC').toLowerCase();
}
export function relativePath(path: string): string {
  const parts = path.replaceAll('\\', '/').split('/');
  if (
    !path.trim() ||
    path !== path.trim() ||
    isAbsolute(path) ||
    /^[A-Za-z]:/u.test(path) ||
    parts.some(
      (part) =>
        !part ||
        part === '.' ||
        part === '..' ||
        /[<>:"|?*\x00-\x1f]/u.test(part) ||
        /[. ]$/u.test(part) ||
        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(part),
    )
  )
    throw new EngineError(
      'PATH_INVALID',
      `Unsafe relative path: ${path}.`,
      2,
      path,
    );
  return parts.join('/');
}
export function containedPath(root: string, path: string): string {
  const target = resolve(root, relativePath(path));
  const rel = relative(root, target);
  if (!rel || rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
    throw new EngineError(
      'PATH_ESCAPE',
      `Path escapes the project: ${path}.`,
      2,
      path,
    );
  return target;
}
export function uniquePaths(paths: string[]): void {
  const seen = new Map<string, string>();
  for (const path of paths) {
    const key = portableKey(relativePath(path));
    for (const [other, display] of seen) {
      if (
        key === other ||
        key.startsWith(`${other}/`) ||
        other.startsWith(`${key}/`)
      )
        throw new EngineError(
          'PATH_COLLISION',
          `Equivalent or overlapping paths: ${display} and ${path}.`,
          2,
          path,
        );
    }
    seen.set(key, path);
  }
}
