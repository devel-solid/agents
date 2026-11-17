import {
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { EngineError } from './manifest.js';
import { portableKey, resolvedPath, safeJoin } from './paths.js';

/** Cache and recovery data are disposable/host-specific, including this ignore rule. */
export function ensureRuntimeIgnored(repoRoot: string): void {
  const root = resolvedPath(repoRoot),
    directory = safeJoin(root, '.cache/agents', 'runtime');
  const path = safeJoin(root, '.cache/agents/.gitignore', 'runtime');
  if (
    portableKey(directory) !== portableKey(join(root, '.cache/agents')) ||
    portableKey(path) !== portableKey(join(root, '.cache/agents/.gitignore'))
  )
    throw new EngineError(
      'RUNTIME_PATH',
      'O runtime não pode usar links ou aliases.',
      3,
    );
  mkdirSync(directory, { recursive: true });
  try {
    writeFileSync(path, '*\n', { encoding: 'utf8', flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    if (
      !existsSync(path) ||
      !statSync(path).isFile() ||
      statSync(path).nlink > 1 ||
      readFileSync(path, 'utf8') !== '*\n'
    )
      throw new EngineError(
        'RUNTIME_IGNORE',
        'A regra de exclusão do runtime está alterada ou insegura. Preserve evidências e restaure .cache/agents/.gitignore para uma linha com *.',
        3,
      );
  }
}
