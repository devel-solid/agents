#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { EngineError } from './manifest.js';
import { buildSyncPlan } from './plan.js';
import { applyPlan } from './apply.js';
import { validateBase } from './validate.js';
import { initialize } from './init.js';
import { diagnose, type Diagnostic } from './diagnostics.js';
import { redact } from './resolve.js';
import { release } from './release.js';
import { findBaseRoot } from './roles.js';

const version = (
  JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version: string }
).version;
const help = `agents ${version} — instruções para agentes de IA

agents init [--dry-run]
agents init --base [--starter minimal] [--dry-run]
agents validate [--base]
agents sync [--dry-run | --check]
agents release --bump patch|minor|major [--dry-run]

init cria manifesto, templates e as skills agents-write-conventions e agents-update-docs. Não gera documentos.
init --base cria AGENTS.md editável, identificação da base, templates e as skills de escrita e versão.
validate confere configuração, fontes e ambiente; --base confere uma base independente.
sync gera AGENTS.md e convenções. --dry-run mostra o plano; --check retorna 1 se há diferenças.
release descobre a versão pelas tags Git e cria somente uma tag local no HEAD.
release --dry-run mostra a próxima versão sem gravar arquivos ou tags.
Declare schemaVersion: 1; regras locais são descobertas por local.tpl_dir e entries seleciona somente pais remotos.
agents-write-conventions orienta a autoria e curadoria das regras na base ou no consumidor.
agents-update-docs atualiza documentos pelo manifesto existente, sem editar regras ou configuração.
agents-update-version orienta a versão da base; não atualiza consumidores automaticamente.
Base e consumidor são papéis exclusivos. A base não usa manifesto consumidor nem sync.

Opções comuns: --repo-root <diretório>, --json, --debug, --help; --version sem comando.
Node.js deve estar instalado (LTS 22, 24 ou 26). Git só é necessário para entradas Git e release.
As prévias de init e release não gravam nada. Validate e sync podem preencher o cache de entradas Git.
sync preserva fontes, manifesto e skills. Arquivos antigos fora da composição são preservados.
Saídas: 0 sucesso; 1 divergência em sync --check; 2 uso, validação ou conflito; 3 falha operacional.
`;
type Options = Record<string, string | boolean>;
interface Change {
  action: string;
  path: string;
  reason: string;
}
interface Envelope {
  schemaVersion: 1;
  command: string;
  ok: boolean;
  changes: Change[];
  diagnostics: Diagnostic[];
  result?: unknown;
  cacheActivity?: string[];
}
const booleans = new Set([
  'json',
  'help',
  'version',
  'debug',
  'base',
  'dry-run',
  'check',
]);
const strings = new Set(['repo-root', 'starter', 'bump']);
function parse(args: string[]): { words: string[]; options: Options } {
  const words: string[] = [],
    options: Options = {};
  for (let index = 0; index < args.length; index++) {
    const arg = args[index]!;
    if (!arg.startsWith('-')) {
      words.push(arg);
      continue;
    }
    if (!arg.startsWith('--'))
      throw new EngineError('USAGE', `Opção desconhecida: ${arg}.`);
    const equal = arg.indexOf('=');
    const name = arg.slice(2, equal === -1 ? undefined : equal);
    if (Object.hasOwn(options, name))
      throw new EngineError('USAGE', `Opção repetida: --${name}.`);
    if (booleans.has(name)) {
      if (equal !== -1)
        throw new EngineError('USAGE', `A opção --${name} não aceita valor.`);
      options[name] = true;
    } else if (strings.has(name)) {
      const value = equal === -1 ? args[++index] : arg.slice(equal + 1);
      if (!value || value.startsWith('--'))
        throw new EngineError('USAGE', `Informe um valor para --${name}.`);
      options[name] = value;
    } else
      throw new EngineError(
        'USAGE',
        `Opção desconhecida: --${name}. Consulte agents --help e configure as fontes no manifesto.`,
      );
  }
  return { words, options };
}
function projectRoot(explicit: unknown, search: boolean): string {
  if (typeof explicit === 'string') return resolve(explicit);
  let path = process.cwd();
  if (search) {
    const base = findBaseRoot(path);
    if (base) return base;
    while (true) {
      if (existsSync(join(path, 'agents-compose.yml'))) return path;
      if (existsSync(join(path, '.git'))) break;
      const parent = dirname(path);
      if (parent === path) break;
      path = parent;
    }
  }
  return process.cwd();
}
function checkOptions(command: string, options: Options): void {
  const allowed: Record<string, string[]> = {
    init: ['base', 'starter', 'dry-run'],
    validate: ['base'],
    sync: ['dry-run', 'check'],
    release: ['bump', 'dry-run'],
  };
  if (!Object.hasOwn(allowed, command)) {
    const retiredGuidance: Record<string, string> = {
      doctor: 'Use agents validate; --debug acrescenta detalhes.',
      'release next-version':
        'Use agents release --bump patch|minor|major --dry-run.',
      'release validate-state':
        'Use agents release --bump patch|minor|major --dry-run.',
      'release validate-release-paths':
        'Use agents release --bump patch|minor|major --dry-run.',
      'release set-compose-ref':
        'Edite agents.ref no manifesto e revise com agents sync --dry-run.',
    };
    throw new EngineError(
      'USAGE',
      `Comando desconhecido: ${command}. ${retiredGuidance[command] ?? 'Use agents --help.'}`,
    );
  }
  for (const name of Object.keys(options))
    if (
      !['repo-root', 'json', 'debug', 'help'].includes(name) &&
      !allowed[command]!.includes(name)
    )
      throw new EngineError('USAGE', `--${name} não se aplica a ${command}.`);
  if (options['dry-run'] && options.check)
    throw new EngineError('USAGE', 'Escolha --dry-run ou --check.');
}
function sanitize(value: unknown): unknown {
  if (typeof value === 'string') return redact(value);
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, sanitize(entry)]),
    );
  return value;
}
const rawArgs = process.argv.slice(2);
let json = rawArgs.includes('--json'),
  debug = rawArgs.includes('--debug');
let envelope: Envelope = {
  schemaVersion: 1,
  command: '',
  ok: true,
  changes: [],
  diagnostics: [],
};
let exitCode = 0;
try {
  const { words, options } = parse(rawArgs);
  json = options.json === true;
  debug = options.debug === true;
  const command = words.join(' ');
  envelope.command = command || (options.version ? 'version' : 'help');
  if (![22, 24, 26].includes(Number(process.versions.node.split('.')[0])))
    throw new EngineError(
      'RUNTIME_UNSUPPORTED',
      `Node.js ${process.versions.node} não suportado; use LTS 22, 24 ou 26.`,
    );
  if (command) checkOptions(command, options);
  if (options.version) {
    if (
      command ||
      Object.keys(options).some(
        (key) => !['json', 'version', 'debug'].includes(key),
      )
    )
      throw new EngineError('USAGE', '--version deve ser usado sem comando.');
    envelope.result = version;
  } else if (options.help || !command) {
    if (
      !command &&
      Object.keys(options).some(
        (key) => !['help', 'json', 'debug'].includes(key),
      )
    )
      throw new EngineError(
        'USAGE',
        'Informe um comando antes das opções operacionais.',
      );
    envelope.result = help;
  } else {
    const repoRoot = projectRoot(
      options['repo-root'],
      ['sync', 'validate'].includes(command) && !options.base,
    );
    const dryRun = options['dry-run'] === true;
    if (command === 'init') {
      const result = initialize(repoRoot, {
        base: options.base === true,
        starter: options.starter as string | undefined,
        dryRun,
      });
      envelope.changes = result.changes.map(({ action, path, reason }) => ({
        action,
        path,
        reason,
      }));
      envelope.cacheActivity = result.cacheActivity;
      envelope.result = {
        mode: dryRun ? 'preview' : 'applied',
        applied: !dryRun,
        preserved: result.preserved,
      };
    } else if (command === 'validate') {
      envelope.diagnostics = diagnose(repoRoot, options.base === true);
      if (
        envelope.diagnostics.some(
          (diagnostic) => diagnostic.severity === 'error',
        )
      )
        exitCode = 2;
      else if (options.base) {
        const result = validateBase(repoRoot);
        envelope.result = {
          families: result.families.length,
          templatePath: result.templatePath,
          mode: 'validate',
          applied: false,
        };
      } else {
        const plan = buildSyncPlan(repoRoot);
        envelope.cacheActivity = plan.cacheActivity;
        envelope.result = {
          families: plan.families,
          templatePath: plan.templatePath,
          mode: 'validate',
          applied: false,
        };
      }
    } else if (command === 'sync') {
      const plan = buildSyncPlan(repoRoot);
      envelope.cacheActivity = plan.cacheActivity;
      envelope.changes = plan.changes.map(({ action, path, reason }) => ({
        action,
        path,
        reason,
      }));
      const mode = options.check ? 'check' : dryRun ? 'preview' : 'applied';
      if (options.check && plan.changes.length) exitCode = 1;
      else if (mode === 'applied') applyPlan(plan);
      envelope.result = {
        mode,
        applied: mode === 'applied',
        templatePath: plan.templatePath,
        source: plan.source,
        outputs: plan.outputs.map((output) => ({
          path: output.path,
          action:
            plan.changes.find((change) => change.path === output.path)
              ?.action ?? 'no-op',
        })),
      };
    } else {
      const result = release(
        repoRoot,
        typeof options.bump === 'string' ? options.bump : '',
        dryRun,
      );
      envelope.result = result.result;
      envelope.changes = result.changes;
      envelope.diagnostics = result.diagnostics;
    }
  }
  envelope.ok = exitCode === 0;
} catch (error) {
  const known = error instanceof EngineError;
  exitCode = known ? error.exitCode : 3;
  envelope.ok = false;
  envelope.diagnostics.push({
    code: known ? error.code : 'OPERATION_FAILED',
    severity: 'error',
    message: error instanceof Error ? error.message : 'Falha operacional.',
    ...(known
      ? {
          field: error.field,
          location: error.location,
          remediation: error.remediation,
        }
      : {}),
  });
  if (debug && error instanceof Error) envelope.result = { stack: error.stack };
}
envelope = sanitize(envelope) as Envelope;
if (json) process.stdout.write(JSON.stringify(envelope) + '\n');
else {
  if (typeof envelope.result === 'string')
    process.stdout.write(envelope.result.replace(/\n?$/u, '\n'));
  else if (envelope.result && typeof envelope.result === 'object') {
    const result = envelope.result as Record<string, unknown>;
    if (
      envelope.command === 'release' &&
      typeof result.nextVersion === 'string'
    ) {
      process.stdout.write(
        `Versão atual: ${result.currentVersion}\nPróxima tag: ${result.nextVersion}\n`,
      );
      process.stdout.write(
        result.applied
          ? 'Tag local criada no commit atual.\n'
          : 'Prévia concluída. Nenhuma tag criada.\n',
      );
    } else if (envelope.command === 'init') {
      process.stdout.write(
        result.applied
          ? `${envelope.changes.length} arquivo(s) criado(s).\n`
          : `Prévia: ${envelope.changes.length} arquivo(s) seria(m) criado(s). Nenhum arquivo gravado.\n`,
      );
    } else if (envelope.command === 'validate' && envelope.ok)
      process.stdout.write(
        'Fontes e configuração válidas. Nenhum documento gerado.\n',
      );
    else if (envelope.command === 'sync' && Array.isArray(result.outputs)) {
      if (result.mode === 'check')
        process.stdout.write(
          envelope.ok
            ? 'Documentos atualizados.\n'
            : 'Há documentos para criar ou atualizar.\n',
        );
      else
        process.stdout.write(
          result.mode === 'preview'
            ? `Prévia: ${envelope.changes.length} documento(s) previsto(s), sem gravação.\n`
            : `${envelope.changes.length} documento(s) criado(s) ou atualizado(s).\n`,
        );
    } else process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  }
  for (const change of envelope.changes)
    process.stdout.write(
      `${change.action}: ${change.path} — ${change.reason}\n`,
    );
  for (const message of envelope.cacheActivity ?? [])
    process.stdout.write(`cache: ${message}\n`);
  for (const diagnostic of envelope.diagnostics) {
    const target =
      diagnostic.severity === 'error' ? process.stderr : process.stdout;
    target.write(
      `${diagnostic.code}: ${diagnostic.message}${diagnostic.remediation ? ' ' + diagnostic.remediation : ''}\n`,
    );
  }
}
process.exitCode = exitCode;
