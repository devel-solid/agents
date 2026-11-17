#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import {
  execute,
  type Command,
  type ExecuteOptions,
  type RuntimeResult,
} from './runtime.js';

const version = (
  JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as {
    version: string;
  }
).version;

export function helpText(packageVersion = version): string {
  return `agentscli ${packageVersion} — project instructions from editable templates

Usage:
  agentscli init [--lang en|pt-br] [--dry-run]
  agentscli validate
  agentscli sync [--dry-run | --check]
  agentscli --version

Common options: --repo-root <directory>, --json, --help.

init replaces agentscli-compose.yml with the requested language (default en)
and default roots. It creates missing templates, generated documents, and three
client skills while preserving valid existing templates and regular skill files.
validate checks the manifest, templates, safe paths, and destination conflicts
without writing. Missing skills alone do not block validation.
sync regenerates all AGENTS.md/convention content and replaces the three managed
skill directories, including support files. Customize document templates;
direct generated edits and changes inside managed skills are overwritten.
Manual documents and other skills are preserved. Destination conflicts block
all writes. Cleanup only removes obsolete marked conventions in the current root.
--dry-run previews document and skill changes without writing. --check returns
1 for document or skill drift. After a partial failure, repeat sync to finish.

Exit codes: 0 success; 1 check drift; 2 usage, validation, or conflict;
3 operational failure. Runtime operations use Node and packaged resources only.
`;
}

type ParsedArguments =
  | { action: 'help' | 'version'; json: boolean }
  | {
      action: 'execute';
      command: Command;
      options: ExecuteOptions;
      json: boolean;
    };

export function parseArguments(
  args: string[],
  cwd = process.cwd(),
): ParsedArguments {
  const { values, positionals, tokens } = parseArgs({
    args,
    strict: true,
    allowPositionals: true,
    tokens: true,
    options: {
      'repo-root': { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean' },
      version: { type: 'boolean' },
      lang: { type: 'string' },
      'dry-run': { type: 'boolean' },
      check: { type: 'boolean' },
    },
  });
  const seen = new Set<string>();
  for (const token of tokens) {
    if (token.kind !== 'option') continue;
    if (seen.has(token.name))
      throw new Error(`Repeated option: --${token.name}.`);
    seen.add(token.name);
  }
  const json = values.json === true;
  if (values.version) {
    if (positionals.length || seen.size !== 1)
      throw new Error('Use --version by itself.');
    return { action: 'version', json: false };
  }
  if (positionals.length > 1)
    throw new Error('Expected one command: init, validate, or sync.');
  const command = positionals[0];
  if (command && !['init', 'validate', 'sync'].includes(command))
    throw new Error(`Unknown command: ${command}. Use agentscli --help.`);
  if (!command && !values.help)
    throw new Error('Choose init, validate, or sync. Use agentscli --help.');
  const allowed: Record<string, string[]> = {
    init: ['lang', 'dry-run'],
    validate: [],
    sync: ['dry-run', 'check'],
  };
  for (const name of seen) {
    if (['repo-root', 'json', 'help'].includes(name)) continue;
    if (!command || !allowed[command]!.includes(name))
      throw new Error(`--${name} does not apply to ${command ?? 'help'}.`);
  }
  if (values['dry-run'] && values.check)
    throw new Error('Choose --dry-run or --check.');
  for (const name of ['repo-root', 'lang'] as const) {
    if (values[name] !== undefined && !values[name]!.trim())
      throw new Error(`Provide a nonempty value for --${name}.`);
  }
  if (values.help) return { action: 'help', json };
  return {
    action: 'execute',
    command: command as Command,
    json,
    options: {
      repoRoot: resolve(cwd, values['repo-root'] ?? '.'),
      ...(values.lang === undefined
        ? {}
        : { language: values.lang.toLowerCase() }),
      ...(values['dry-run'] ? { dryRun: true } : {}),
      ...(values.check ? { check: true } : {}),
    },
  };
}

interface CliDependencies {
  execute?: typeof execute;
  cwd?: string;
  version?: string;
}
interface CliResponse {
  exitCode: number;
  stdout: string;
  stderr: string;
}

function describeResult(
  result: RuntimeResult,
  preview: boolean,
): Omit<CliResponse, 'exitCode'> {
  const lines = result.changes.map(
    (change) =>
      `${change.status ?? (preview ? 'planned' : 'completed')} ${change.action}: ${change.path}`,
  );
  if (result.ok && result.command === 'validate')
    lines.unshift('Project inputs are valid.');
  else if (result.ok && !result.changes.length)
    lines.unshift('Everything is up to date.');
  else if (preview) lines.unshift('Planned changes; no files written.');
  const diagnostics = result.diagnostics.map(
    (item) =>
      `${item.code}: ${item.path ? `${item.path}: ` : ''}${item.message}`,
  );
  return {
    stdout: lines.length ? lines.join('\n') + '\n' : '',
    stderr: diagnostics.length ? diagnostics.join('\n') + '\n' : '',
  };
}

function failure(
  command: string,
  code: string,
  message: string,
  json: boolean,
  exitCode: number,
): CliResponse {
  const result = {
    schemaVersion: 1,
    command,
    ok: false,
    changes: [],
    diagnostics: [{ code, message }],
  };
  return json
    ? { exitCode, stdout: JSON.stringify(result) + '\n', stderr: '' }
    : { exitCode, stdout: '', stderr: `${code}: ${message}\n` };
}

export async function runCli(
  args: string[],
  dependencies: CliDependencies = {},
): Promise<CliResponse> {
  let parsed: ParsedArguments;
  try {
    parsed = parseArguments(args, dependencies.cwd);
  } catch (error) {
    return failure(
      args.find((arg) => ['init', 'validate', 'sync'].includes(arg)) ??
        'unknown',
      'USAGE',
      error instanceof Error ? error.message : 'Invalid arguments.',
      args.includes('--json'),
      2,
    );
  }
  if (parsed.action !== 'execute') {
    const text =
      parsed.action === 'version'
        ? (dependencies.version ?? version) + '\n'
        : helpText(dependencies.version);
    return {
      exitCode: 0,
      stdout: parsed.json
        ? JSON.stringify({
            schemaVersion: 1,
            command: parsed.action,
            ok: true,
            changes: [],
            diagnostics: [],
            text,
          }) + '\n'
        : text,
      stderr: '',
    };
  }
  try {
    const { exitCode, result } = await (dependencies.execute ?? execute)(
      parsed.command,
      parsed.options,
    );
    return parsed.json
      ? { exitCode, stdout: JSON.stringify(result) + '\n', stderr: '' }
      : {
          exitCode,
          ...describeResult(
            result,
            parsed.options.dryRun === true || parsed.options.check === true,
          ),
        };
  } catch (error) {
    return failure(
      parsed.command,
      'OPERATION_FAILED',
      error instanceof Error ? error.message : 'Operation failed.',
      parsed.json,
      3,
    );
  }
}

function isEntryPoint(): boolean {
  if (!process.argv[1]) return false;
  try {
    return realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
  } catch {
    return false;
  }
}

if (isEntryPoint()) {
  const response = await runCli(process.argv.slice(2));
  process.stdout.write(response.stdout);
  process.stderr.write(response.stderr);
  process.exitCode = response.exitCode;
}
