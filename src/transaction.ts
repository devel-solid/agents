import { createHash, randomUUID } from 'node:crypto';
import {
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { hostname } from 'node:os';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { EngineError } from './manifest.js';
import {
  portableKey,
  resolvedPath,
  safeJoin,
  validateDestination,
  validateRelativePath,
} from './paths.js';
import { assertConsumerRoot } from './roles.js';
import type { SyncPlan } from './plan.js';
import { snapshotInventory } from './state.js';
import { ensureRuntimeIgnored } from './runtime.js';

interface Owner {
  schemaVersion: 1;
  pid: number;
  host: string;
  processStart: string;
  token: string;
  root: string;
  transactionId: string;
  recoveryOfToken?: string;
}
interface Entry {
  path: string;
  identity: string;
  beforeHash: string | null;
  afterHash: string | null;
  backup?: string;
  staged?: string;
}
interface Journal {
  schemaVersion: 1;
  id: string;
  root: string;
  owner: Owner;
  status: 'prepared' | 'applying' | 'rolling-back' | 'complete';
  files: Entry[];
}
export interface ApplyOptions {
  onBoundary?: (boundary: string, index?: number) => void;
}
export interface RecoveryInspection {
  transactionId: string;
  status: Journal['status'];
  changes: { action: 'rollback' | 'cleanup'; path: string; reason: string }[];
  conflicts: string[];
}
const digest = (bytes: Uint8Array): string =>
  createHash('sha256').update(bytes).digest('hex');
const validHash = (value: unknown): value is string | null =>
  value === null ||
  (typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value));
const identifier = (value: unknown): value is string =>
  typeof value === 'string' && /^[a-f0-9-]{36}$/u.test(value);
function runtime(root: string, suffix = ''): string {
  root = resolvedPath(root);
  const value = safeJoin(
    root,
    `.cache/agents${suffix ? '/' + suffix : ''}`,
    'transação',
  );
  if (portableKey(value) !== portableKey(join(root, '.cache/agents', suffix)))
    throw new EngineError(
      'TRANSACTION_PATH',
      'Os dados de recuperação não podem usar links ou aliases.',
      3,
    );
  return value;
}
function target(root: string, path: string): string {
  if (
    [
      'agents-lock.json',
      '.agents/agents-state.json',
      'agents-compose.yml',
    ].includes(path)
  ) {
    const actual = safeJoin(root, path, 'metadados');
    if (
      portableKey(actual) !== portableKey(join(resolvedPath(root), path)) ||
      (existsSync(actual) &&
        (!statSync(actual).isFile() || statSync(actual).nlink > 1))
    )
      throw new EngineError(
        'TRANSACTION_PATH',
        `Metadados inseguros: ${path}.`,
        2,
      );
    return actual;
  }
  return validateDestination(root, path, path === 'AGENTS.md');
}
function hashAt(path: string): string | null {
  try {
    if (!statSync(path).isFile())
      throw new EngineError('PLAN_PRECONDITION', `Esperado arquivo: ${path}.`);
    return digest(readFileSync(path));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
}
function flushDirectory(path: string): void {
  if (process.platform === 'win32') return;
  const fd = openSync(path, 'r');
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function durableWrite(path: string, bytes: Uint8Array | string): void {
  const fd = openSync(path, 'wx', 0o600);
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  flushDirectory(dirname(path));
}
function replace(path: string, bytes: Uint8Array, transactionId: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const staged = join(
    dirname(path),
    `.agents-${transactionId}-${randomUUID()}.tmp`,
  );
  try {
    durableWrite(staged, bytes);
    renameSync(staged, path);
    flushDirectory(dirname(path));
  } finally {
    if (existsSync(staged)) unlinkSync(staged);
  }
}
function persist(root: string, journal: Journal): void {
  const path = runtime(root, 'transactions/active/journal.json');
  replace(path, Buffer.from(JSON.stringify(journal) + '\n'), journal.id);
}
function processStart(pid: number): string | undefined {
  if (process.platform === 'linux') {
    try {
      const stat = readFileSync(`/proc/${pid}/stat`, 'utf8');
      const boot = readFileSync(
        '/proc/sys/kernel/random/boot_id',
        'utf8',
      ).trim();
      return `${boot}:${stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19]}`;
    } catch {
      return;
    }
  }
  if (process.platform === 'win32') {
    const shell = join(
      process.env.SystemRoot ?? 'C:\\Windows',
      'System32/WindowsPowerShell/v1.0/powershell.exe',
    );
    const result = spawnSync(
      shell,
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().Ticks`,
      ],
      {
        encoding: 'utf8',
        windowsHide: true,
        timeout: 5000,
      },
    );
    if (
      !result.error &&
      result.status === 0 &&
      /^\d+$/u.test(result.stdout.trim())
    )
      return result.stdout.trim();
  }
  return;
}
function validOwner(value: unknown, root: string): value is Owner {
  if (!value || typeof value !== 'object') return false;
  const owner = value as Owner;
  return (
    owner.schemaVersion === 1 &&
    Number.isSafeInteger(owner.pid) &&
    owner.pid > 0 &&
    typeof owner.host === 'string' &&
    typeof owner.processStart === 'string' &&
    !!owner.processStart &&
    identifier(owner.token) &&
    identifier(owner.transactionId) &&
    (owner.recoveryOfToken === undefined ||
      identifier(owner.recoveryOfToken)) &&
    owner.root === resolvedPath(root)
  );
}
function ownerAt(root: string): Owner {
  try {
    const owner: unknown = JSON.parse(
      readFileSync(runtime(root, 'mutation.lock/owner.json'), 'utf8'),
    );
    if (validOwner(owner, root)) return owner;
  } catch {
    /* Never discard ambiguous owner evidence. */
  }
  throw new EngineError(
    'MUTATION_OWNER',
    'O proprietário da trava não pode ser verificado; preserve os dados de recuperação.',
    3,
  );
}
function readJournal(root: string): Journal | undefined {
  const active = runtime(root, 'transactions/active');
  const cleanup = runtime(root, 'transactions/cleanup.json');
  if (!existsSync(active) && !existsSync(cleanup)) return;
  let journal: Journal;
  try {
    journal = JSON.parse(
      readFileSync(
        existsSync(cleanup)
          ? cleanup
          : runtime(root, 'transactions/active/journal.json'),
        'utf8',
      ),
    ) as Journal;
    if (
      journal.schemaVersion !== 1 ||
      !identifier(journal.id) ||
      journal.root !== resolvedPath(root) ||
      !validOwner(journal.owner, root) ||
      journal.owner.transactionId !== journal.id ||
      !['prepared', 'applying', 'rolling-back', 'complete'].includes(
        journal.status,
      ) ||
      !Array.isArray(journal.files)
    )
      throw new Error();
    const seen = new Set<string>();
    for (const entry of journal.files) {
      if (
        typeof entry.path !== 'string' ||
        validateRelativePath(entry.path, 'journal', false) !== entry.path ||
        typeof entry.identity !== 'string' ||
        !isAbsolute(entry.identity) ||
        !relative(root, entry.identity) ||
        /^\.\.(?:[\\/]|$)/u.test(relative(root, entry.identity)) ||
        isAbsolute(relative(root, entry.identity)) ||
        !validHash(entry.beforeHash) ||
        !validHash(entry.afterHash) ||
        seen.has(portableKey(entry.path))
      )
        throw new Error();
      seen.add(portableKey(entry.path));
      target(root, entry.path);
      for (const key of ['backup', 'staged'] as const) {
        const name = entry[key];
        if (name !== undefined && !/^\d+\.(?:before|after)$/u.test(name))
          throw new Error();
      }
      if (
        (entry.beforeHash !== null) !== (entry.backup !== undefined) ||
        (entry.afterHash !== null) !== (entry.staged !== undefined)
      )
        throw new Error();
    }
    return journal;
  } catch (error) {
    if (error instanceof EngineError) throw error;
    throw new EngineError(
      'RECOVERY_DATA',
      'Journal de recuperação ausente ou inválido; preserve os backups.',
      3,
    );
  }
}
function verifyEvidence(root: string, journal: Journal): string[] {
  const conflicts: string[] = [];
  if (journal.status === 'complete') return conflicts;
  for (const entry of journal.files) {
    for (const [name, expected] of [
      [entry.backup, entry.beforeHash],
      [entry.staged, entry.afterHash],
    ] as const) {
      if (
        name &&
        hashAt(runtime(root, `transactions/active/${name}`)) !== expected
      )
        throw new EngineError(
          'RECOVERY_DATA',
          `Evidência ausente ou alterada para ${entry.path}; preserve os backups.`,
          3,
        );
    }
    const path = target(root, entry.path);
    if (!matchesIdentity(path, entry.identity)) {
      conflicts.push(entry.path);
      continue;
    }
    const current = hashAt(path);
    if (current !== entry.beforeHash && current !== entry.afterHash)
      conflicts.push(entry.path);
  }
  return conflicts;
}
function matchesIdentity(path: string, identity: string): boolean {
  const actual = resolvedPath(path);
  return process.platform === 'win32'
    ? portableKey(actual) === portableKey(identity)
    : actual === identity;
}
function inspectJournal(root: string, journal: Journal): RecoveryInspection {
  return {
    transactionId: journal.id,
    status: journal.status,
    changes:
      journal.status === 'complete'
        ? [
            {
              action: 'cleanup',
              path: '.cache/agents/transactions/active',
              reason: 'Geração concluída; descartar somente dados temporários.',
            },
          ]
        : journal.files.map((entry) => ({
            action: 'rollback',
            path: entry.path,
            reason: 'Restaurar preimagem bruta da transação interrompida.',
          })),
    conflicts: verifyEvidence(root, journal),
  };
}
export function inspectRecovery(
  repoRoot: string,
): RecoveryInspection | undefined {
  const root = resolvedPath(repoRoot);
  if (
    existsSync(runtime(root, 'mutation.lock')) &&
    !existsSync(runtime(root, 'transactions/active/journal.json')) &&
    !existsSync(runtime(root, 'transactions/cleanup.json'))
  ) {
    const owner = ownerAt(root);
    if (
      owner.host === hostname() &&
      processStart(owner.pid) === owner.processStart
    )
      throw new EngineError(
        'MUTATION_CONTENTION',
        'Outra operação ativa detém a trava deste projeto; aguarde sua conclusão.',
        2,
      );
  }
  const journal = readJournal(root);
  if (journal) return inspectJournal(root, journal);
  if (existsSync(runtime(root, 'mutation.lock'))) {
    const owner = ownerAt(root);
    if (
      owner.host === hostname() &&
      processStart(owner.pid) === owner.processStart
    )
      throw new EngineError(
        'MUTATION_CONTENTION',
        'Outra operação ativa detém a trava deste projeto; aguarde sua conclusão.',
        2,
      );
    throw new EngineError(
      'RECOVERY_DATA',
      'Há trava de mutação sem journal verificável; aguarde a operação ativa ou preserve a evidência para reconciliação.',
      3,
    );
  }
  return;
}
function isStale(owner: Owner): boolean {
  if (owner.host !== hostname()) return false;
  const current = processStart(owner.pid);
  if (current) return current !== owner.processStart;
  try {
    process.kill(owner.pid, 0);
    return false;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'ESRCH';
  }
}
function acquire(
  root: string,
  transactionId: string,
  recovery?: Journal,
): Owner {
  const lock = runtime(root, 'mutation.lock');
  ensureRuntimeIgnored(root);
  mkdirSync(dirname(lock), { recursive: true });
  if (existsSync(lock)) {
    const previous = ownerAt(root);
    if (
      !recovery ||
      previous.transactionId !== recovery.id ||
      !(
        (previous.token === recovery.owner.token &&
          previous.processStart === recovery.owner.processStart &&
          previous.pid === recovery.owner.pid &&
          previous.host === recovery.owner.host) ||
        previous.recoveryOfToken === recovery.owner.token
      ) ||
      !isStale(previous)
    )
      throw new EngineError(
        'MUTATION_CONTENTION',
        'Outra operação ou proprietário ambíguo detém a trava deste projeto.',
        2,
        {
          remediation:
            'Aguarde a operação ativa. Após interrupção, examine agents sync --dry-run; não apague os backups.',
        },
      );
    const claim = join(lock, 'reclaim');
    try {
      mkdirSync(claim);
    } catch {
      throw new EngineError(
        'MUTATION_CONTENTION',
        'Outra recuperação está verificando a trava; preserve os dados.',
        2,
      );
    }
    const retired = runtime(root, `retired-${randomUUID()}`);
    try {
      if (JSON.stringify(ownerAt(root)) !== JSON.stringify(previous))
        throw new Error();
      renameSync(lock, retired);
      const actual = JSON.parse(
        readFileSync(join(retired, 'owner.json'), 'utf8'),
      ) as Owner;
      if (JSON.stringify(actual) !== JSON.stringify(previous))
        throw new Error();
      rmSync(retired, { recursive: true, force: true });
    } catch {
      if (existsSync(claim)) rmSync(claim, { recursive: true, force: true });
      throw new EngineError(
        'MUTATION_CONTENTION',
        'A trava mudou durante a aquisição; tente novamente sem remover evidência.',
        2,
      );
    }
  }
  try {
    mkdirSync(lock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new EngineError(
        'MUTATION_CONTENTION',
        'Outra operação detém a trava deste projeto.',
        2,
      );
    throw error;
  }
  const owner: Owner = {
    schemaVersion: 1,
    pid: process.pid,
    host: hostname(),
    processStart:
      processStart(process.pid) ??
      `unverified:${Date.now() - Math.round(process.uptime() * 1000)}`,
    token: randomUUID(),
    root,
    transactionId,
    ...(recovery ? { recoveryOfToken: recovery.owner.token } : {}),
  };
  try {
    durableWrite(join(lock, 'owner.json'), JSON.stringify(owner) + '\n');
  } catch (error) {
    rmSync(lock, { recursive: true, force: true });
    throw error;
  }
  return owner;
}
function release(root: string, owner: Owner): void {
  if (ownerAt(root).token !== owner.token)
    throw new EngineError(
      'MUTATION_OWNER',
      'A identidade da trava mudou; evidência preservada.',
      3,
    );
  rmSync(runtime(root, 'mutation.lock'), { recursive: true, force: true });
  flushDirectory(runtime(root));
}
function clean(root: string, journal?: Journal): void {
  if (journal) {
    const marker: Journal = { ...journal, status: 'complete', files: [] };
    replace(
      runtime(root, 'transactions/cleanup.json'),
      Buffer.from(JSON.stringify(marker) + '\n'),
      journal.id,
    );
  }
  rmSync(runtime(root, 'transactions/active'), {
    recursive: true,
    force: true,
    maxRetries: 3,
  });
  flushDirectory(runtime(root, 'transactions'));
}
function finalize(root: string, owner: Owner): void {
  release(root, owner);
  const cleanup = runtime(root, 'transactions/cleanup.json');
  if (
    existsSync(cleanup) &&
    !existsSync(runtime(root, 'transactions/active'))
  ) {
    const marker = readJournal(root);
    if (marker?.id === owner.transactionId) {
      unlinkSync(cleanup);
      flushDirectory(runtime(root, 'transactions'));
    }
  }
}
function rollback(
  root: string,
  journal: Journal,
  boundary: NonNullable<ApplyOptions['onBoundary']> = () => {},
): void {
  const conflicts = verifyEvidence(root, journal);
  if (conflicts.length)
    throw new EngineError(
      'RECOVERY_CONFLICT',
      `Recuperação bloqueada por alterações independentes: ${conflicts.join(', ')}.`,
      2,
      {
        remediation:
          'Reconcilie as fontes e os documentos com as preimagens registradas; mantenha journal e backups.',
      },
    );
  journal.status = 'rolling-back';
  persist(root, journal);
  for (const [index, entry] of [...journal.files].reverse().entries()) {
    boundary('before-rollback-file', index);
    const path = target(root, entry.path);
    if (!matchesIdentity(path, entry.identity))
      throw new EngineError(
        'RECOVERY_CONFLICT',
        `Destino redirecionado após interrupção: ${entry.path}. Evidência preservada.`,
        2,
      );
    const current = hashAt(path);
    if (current !== entry.beforeHash && current !== entry.afterHash)
      throw new EngineError(
        'RECOVERY_CONFLICT',
        `Edição independente preservada: ${entry.path}.`,
        2,
      );
    if (current === entry.beforeHash) {
      boundary('after-rollback-file', index);
      continue;
    }
    if (entry.backup)
      replace(
        path,
        readFileSync(runtime(root, `transactions/active/${entry.backup}`)),
        journal.id,
      );
    else if (existsSync(path)) {
      unlinkSync(path);
      flushDirectory(dirname(path));
    }
    boundary('after-rollback-file', index);
  }
  journal.status = 'complete';
  persist(root, journal);
  clean(root, journal);
}
export function recoverTransaction(
  repoRoot: string,
  dryRun = false,
  options: ApplyOptions = {},
): RecoveryInspection | undefined {
  const root = resolvedPath(repoRoot);
  assertConsumerRoot(root);
  const journal = readJournal(root);
  if (!journal) {
    inspectRecovery(root);
    return;
  }
  const inspection = inspectJournal(root, journal);
  if (inspection.conflicts.length)
    throw new EngineError(
      'RECOVERY_CONFLICT',
      `Recuperação bloqueada: ${inspection.conflicts.join(', ')}. Edições e backups preservados.`,
      2,
    );
  if (dryRun) return inspection;
  const owner = acquire(root, journal.id, journal);
  try {
    options.onBoundary?.('recovery-acquired');
    const current = readJournal(root);
    if (!current || current.id !== journal.id)
      throw new EngineError(
        'RECOVERY_DATA',
        'Journal mudou durante a aquisição.',
        3,
      );
    current.owner = owner;
    persist(root, current);
    if (current.status === 'complete') clean(root, current);
    else rollback(root, current, options.onBoundary);
  } finally {
    finalize(root, owner);
  }
  return inspection;
}
function verifyPreconditions(plan: SyncPlan): void {
  const extra = plan as SyncPlan & {
    preconditions?: Record<string, string | null>;
    sourceInventories?: {
      path: string;
      entries: string[];
      identity?: string;
      allowedRoot?: string;
    }[];
    pathIdentities?: Record<string, string>;
  };
  if (!extra.preconditions)
    throw new EngineError(
      'PLAN_PRECONDITION',
      'O plano não possui precondições brutas verificáveis.',
    );
  for (const [path, expected] of Object.entries(extra.preconditions)) {
    if (!validHash(expected))
      throw new EngineError(
        'PLAN_PRECONDITION',
        'Hash de precondição inválido.',
      );
    const actual = isAbsolute(path)
      ? path
      : safeJoin(plan.repoRoot, path, 'precondição');
    if (
      extra.pathIdentities?.[path] &&
      resolvedPath(actual) !== extra.pathIdentities[path]
    )
      throw new EngineError(
        'PLAN_PRECONDITION',
        `Caminho mudou após o planejamento: ${path}.`,
        2,
      );
    if (hashAt(actual) !== expected)
      throw new EngineError(
        'PLAN_PRECONDITION',
        `Arquivo mudou após o planejamento: ${path}.`,
        2,
        {
          remediation:
            'Revise as alterações independentes e execute uma nova prévia antes de sincronizar.',
        },
      );
  }
  for (const inventory of extra.sourceInventories ?? []) {
    if (
      inventory.identity &&
      resolvedPath(inventory.path) !== inventory.identity
    )
      throw new EngineError(
        'PLAN_PRECONDITION',
        `A raiz de fontes mudou após o planejamento: ${inventory.path}.`,
        2,
      );
    if (
      JSON.stringify(
        snapshotInventory(inventory.path, inventory.allowedRoot),
      ) !== JSON.stringify(inventory.entries)
    )
      throw new EngineError(
        'PLAN_PRECONDITION',
        `Inventário de fontes mudou após o planejamento: ${inventory.path}.`,
        2,
      );
  }
}
export function applyPlan(plan: SyncPlan, options: ApplyOptions = {}): void {
  const root = resolvedPath(plan.repoRoot);
  assertConsumerRoot(root);
  if (plan.conflicts?.length)
    throw new EngineError(
      'OWNERSHIP_CONFLICT',
      `Conflitos impedem a transação: ${plan.conflicts.map((conflict) => conflict.path).join(', ')}.`,
      2,
      {
        remediation:
          'Reconcilie fontes e documentos antes de planejar novamente.',
      },
    );
  const pending = readJournal(root);
  if (pending) {
    if (existsSync(runtime(root, 'mutation.lock')) && !isStale(ownerAt(root)))
      throw new EngineError(
        'MUTATION_CONTENTION',
        'Outra operação ou proprietário ambíguo detém a trava deste projeto.',
        2,
      );
    throw new EngineError(
      'RECOVERY_PENDING',
      'Há recuperação pendente. Use agents sync --dry-run e depois agents sync para recuperar antes de gerar.',
      3,
    );
  }
  const id = randomUUID();
  const owner = acquire(root, id);
  let journal: Journal | undefined;
  let complete = false;
  const boundary = options.onBoundary ?? (() => {});
  try {
    const active = runtime(root, 'transactions/active');
    mkdirSync(active, { recursive: true });
    journal = {
      schemaVersion: 1,
      id,
      root,
      owner,
      status: 'prepared',
      files: [],
    };
    // Publish an empty recoverable journal before staging any file. A crash
    // while staging can then discard the incomplete staging without writes.
    persist(root, journal);
    boundary('lock-acquired');
    verifyPreconditions(plan);
    const changes = plan.changes
      .filter((change) => change.action !== 'adopt')
      .sort(
        (a, b) =>
          Number(a.path === '.agents/agents-state.json') -
          Number(b.path === '.agents/agents-state.json'),
      );
    if (!changes.length) {
      clean(root, journal);
      return;
    }
    for (const [index, change] of changes.entries()) {
      const path = target(root, change.path);
      const beforeHash = hashAt(path);
      const after =
        change.action === 'remove' ? null : Buffer.from(change.content, 'utf8');
      const entry: Entry = {
        path: change.path,
        identity: resolvedPath(path),
        beforeHash,
        afterHash: after === null ? null : digest(after),
      };
      if (beforeHash !== null) {
        entry.backup = `${index}.before`;
        durableWrite(join(active, entry.backup), readFileSync(path));
      }
      if (after !== null) {
        entry.staged = `${index}.after`;
        durableWrite(join(active, entry.staged), after);
      }
      journal.files.push(entry);
    }
    persist(root, journal);
    boundary('staged');
    verifyPreconditions(plan);
    verifyEvidence(root, journal);
    journal.status = 'applying';
    persist(root, journal);
    for (const [index, entry] of journal.files.entries()) {
      boundary('before-file', index);
      const path = target(root, entry.path);
      if (!matchesIdentity(path, entry.identity))
        throw new EngineError(
          'PLAN_PRECONDITION',
          `Destino redirecionado durante a transação: ${entry.path}.`,
          2,
        );
      const logical = join(root, entry.path);
      const identities = (
        plan as SyncPlan & { pathIdentities?: Record<string, string> }
      ).pathIdentities;
      const expectedIdentity =
        identities?.[entry.path] ?? identities?.[logical];
      if (expectedIdentity && resolvedPath(logical) !== expectedIdentity)
        throw new EngineError(
          'PLAN_PRECONDITION',
          `Destino mudou após o planejamento: ${entry.path}.`,
          2,
        );
      if (hashAt(path) !== entry.beforeHash)
        throw new EngineError(
          'PLAN_PRECONDITION',
          `Destino mudou após o planejamento: ${entry.path}.`,
        );
      if (
        entry.staged &&
        hashAt(runtime(root, `transactions/active/${entry.staged}`)) !==
          entry.afterHash
      )
        throw new EngineError(
          'RECOVERY_DATA',
          `Dados preparados foram alterados: ${entry.path}.`,
          3,
        );
      if (entry.staged)
        replace(
          path,
          readFileSync(runtime(root, `transactions/active/${entry.staged}`)),
          id,
        );
      else if (existsSync(path)) {
        unlinkSync(path);
        flushDirectory(dirname(path));
      }
      boundary('after-file', index);
    }
    boundary('before-commit');
    for (const entry of journal.files)
      if (
        !matchesIdentity(target(root, entry.path), entry.identity) ||
        hashAt(target(root, entry.path)) !== entry.afterHash
      )
        throw new EngineError(
          'PLAN_PRECONDITION',
          `Destino mudou durante a transação: ${entry.path}.`,
        );
    journal.status = 'complete';
    persist(root, journal);
    complete = true;
    boundary('after-commit');
    boundary('before-cleanup');
    clean(root, journal);
    boundary('after-cleanup');
  } catch (error) {
    if (
      journal &&
      !complete &&
      existsSync(runtime(root, 'transactions/active/journal.json'))
    ) {
      try {
        rollback(root, journal);
      } catch (recoveryError) {
        if (recoveryError instanceof EngineError) throw recoveryError;
        throw new EngineError(
          'RECOVERY_FAILED',
          'Falha na restauração; journal e backups preservados. Use agents sync --dry-run.',
          3,
        );
      }
    } else if (!complete && existsSync(runtime(root, 'transactions/active'))) {
      clean(root);
    }
    if (error instanceof EngineError) throw error;
    throw new EngineError(
      'TRANSACTION_FAILED',
      `A transação falhou${complete ? ' após confirmar a geração' : '; os arquivos anteriores foram restaurados'}.`,
      3,
      {
        remediation:
          'Examine agents sync --dry-run e valide o projeto antes de continuar.',
      },
    );
  } finally {
    finalize(root, owner);
  }
}
