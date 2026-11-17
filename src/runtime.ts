import { containedPath } from './paths.js';
import { EngineError } from './manifest.js';
import {
  checkRoot,
  assertClientContext,
  disk,
  inspect,
  removeFile,
  replaceFile,
  type FileSystem,
} from './io.js';
import { loadResources, plan, type Effect, type Resources } from './plan.js';

export type Command = 'init' | 'validate' | 'sync';
export interface ExecuteOptions {
  repoRoot: string;
  language?: string;
  dryRun?: boolean;
  check?: boolean;
}
export interface Change {
  path: string;
  action: 'create' | 'update' | 'delete';
  status?: 'completed' | 'pending';
}
export interface Diagnostic {
  code: string;
  message: string;
  path?: string;
}
export interface RuntimeResult {
  schemaVersion: 1;
  command: Command;
  ok: boolean;
  changes: Change[];
  diagnostics: Diagnostic[];
}
export interface Dependencies {
  io?: FileSystem;
  resources?: Resources;
}
export async function execute(
  command: Command,
  options: ExecuteOptions,
  dependencies: Dependencies = {},
): Promise<{ exitCode: number; result: RuntimeResult }> {
  const result: RuntimeResult = {
    schemaVersion: 1,
    command,
    ok: true,
    changes: [],
    diagnostics: [],
  };
  const io = dependencies.io ?? disk;
  let effects: Effect[] = [];
  let completed = 0;
  let applying = false;
  try {
    const root = checkRoot(io, options.repoRoot);
    assertClientContext(io, root);
    effects = plan(
      io,
      root,
      command,
      dependencies.resources ?? loadResources(),
      options.language,
    );
    if (command === 'validate') return { exitCode: 0, result };
    result.changes = effects.map(({ path, action }) => ({
      path,
      action,
      status: 'pending',
    }));
    if (options.dryRun || options.check) {
      if (command === 'init' && options.dryRun)
        result.diagnostics.push({
          code: 'INIT_PRESERVED',
          message:
            'Existing valid templates, regular skill files, and marked outputs are preserved. Only missing setup is created; the client manifest is overwritten with the selected language and default roots.',
        });
      const exitCode = options.check && effects.length ? 1 : 0;
      result.ok = exitCode === 0;
      return { exitCode, result };
    }
    applying = true;
    for (const effect of effects) {
      if (effect.action === 'delete') {
        if (effect.directory) {
          if (inspect(io, root, effect.path, 'directory'))
            io.rmdir(containedPath(root, effect.path));
        } else removeFile(io, root, effect.path, effect.previous);
      } else
        replaceFile(io, root, effect.path, effect.content!, effect.previous);
      result.changes[completed]!.status = 'completed';
      completed++;
    }
    return { exitCode: 0, result };
  } catch (error) {
    result.ok = false;
    const known = error instanceof EngineError;
    result.diagnostics.push({
      code: known ? error.code : 'IO_FAILURE',
      message:
        error instanceof Error ? error.message : 'File operation failed.',
      ...(known && error.path ? { path: error.path } : {}),
    });
    if (applying)
      result.diagnostics.push({
        code: 'RETRY_SYNC',
        message: `${completed} of ${effects.length} effects completed. Fix the reported problem and ${command === 'init' ? 'repeat agentscli init with the same options to finish setup, then run agentscli sync' : 'run agentscli sync again to finish'}; no rollback was performed.`,
      });
    return { exitCode: applying ? 3 : known ? error.exitCode : 3, result };
  }
}
