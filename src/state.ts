import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { Ajv } from 'ajv';
import { EngineError } from './manifest.js';
import {
  portableKey,
  assertWithin,
  resolvedPath,
  safeJoin,
  validateDestination,
  validateRelativePath,
} from './paths.js';
import { canonicalJson, rawHash } from './lock.js';

export interface SourceProvenance {
  path: string;
  origin: 'local' | 'remote' | 'manifest';
  sha256: string;
  family?: string;
  repository?: string;
  commit?: string;
}
export interface OwnedOutput {
  path: string;
  sha256: string;
  sources: SourceProvenance[];
}
export interface OwnershipState {
  schemaVersion: 1;
  rendererContract: 1;
  normalization: 'utf8-lf';
  generation: string;
  inputs: SourceProvenance[];
  outputs: OwnedOutput[];
}
const validate = new Ajv({ allErrors: true, strict: true }).compile(
  JSON.parse(
    readFileSync(
      new URL('../schemas/agents-state.v1.schema.json', import.meta.url),
      'utf8',
    ),
  ) as object,
);
export function generationIdentity(
  state: Omit<OwnershipState, 'generation'> | OwnershipState,
): string {
  const { schemaVersion, rendererContract, normalization, inputs, outputs } =
    state;
  return rawHash(
    Buffer.from(
      canonicalJson({
        schemaVersion,
        rendererContract,
        normalization,
        inputs,
        outputs,
      }),
    ),
  );
}
export function serializeState(state: OwnershipState): string {
  if (!validate(state) || state.generation !== generationIdentity(state))
    throw new EngineError(
      'OWNERSHIP_SCHEMA',
      'Estado de geração inválido antes da publicação.',
    );
  return canonicalJson(state) + '\n';
}
export function readState(root: string): OwnershipState | undefined {
  const path = safeJoin(root, '.agents/agents-state.json', 'ownership');
  if (!existsSync(path)) return;
  let value: unknown;
  try {
    value = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)),
    );
  } catch {
    throw new EngineError(
      'OWNERSHIP_SCHEMA',
      'Registro de ownership inválido.',
    );
  }
  if (!validate(value))
    throw new EngineError(
      'OWNERSHIP_SCHEMA',
      'Formato ou renderer de ownership não suportado.',
    );
  const state = value as OwnershipState;
  const keys = new Set<string>();
  for (const output of state.outputs) {
    if (validateRelativePath(output.path, 'ownership', false) !== output.path)
      throw new EngineError(
        'OWNERSHIP_PATH',
        'Caminho de ownership não canônico.',
      );
    validateDestination(root, output.path, output.path === 'AGENTS.md');
    const key = portableKey(output.path);
    if (keys.has(key))
      throw new EngineError(
        'OWNERSHIP_PATH',
        'Destinos duplicados no ownership.',
      );
    keys.add(key);
  }
  for (const source of [
    ...state.inputs,
    ...state.outputs.flatMap((output) => output.sources),
  ]) {
    if (
      validateRelativePath(source.path, 'proveniência', false) !== source.path
    )
      throw new EngineError(
        'OWNERSHIP_PATH',
        'Fonte não canônica no ownership.',
      );
  }
  if (state.generation !== generationIdentity(state))
    throw new EngineError(
      'OWNERSHIP_IDENTITY',
      'Identidade de geração inconsistente. Restaure o registro junto com os documentos correspondentes.',
    );
  return state;
}
export function snapshotInventory(
  directory: string,
  allowedRoot = directory,
): string[] {
  if (!existsSync(directory)) return [];
  const records: string[] = [];
  const walk = (path: string, ancestors: Set<string>): void => {
    const actual = assertWithin(path, allowedRoot, 'inventário de fontes');
    if (ancestors.has(actual))
      throw new EngineError('SOURCE_LINK_CYCLE', 'Ciclo nas fontes.');
    const next = new Set(ancestors);
    next.add(actual);
    for (const entry of readdirSync(path).sort()) {
      const child = join(path, entry);
      assertWithin(child, allowedRoot, 'inventário de fontes');
      const directoryEntry = statSync(child).isDirectory();
      records.push(
        `${relative(directory, child).replaceAll('\\', '/')}|${resolvedPath(child)}|${directoryEntry ? 'directory' : 'file'}`,
      );
      if (directoryEntry) walk(child, next);
    }
  };
  walk(directory, new Set());
  return records.sort();
}
