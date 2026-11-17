import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const tests = readdirSync(new URL('../tests/node/', import.meta.url))
  .filter((file) => file.endsWith('.test.mjs'))
  .sort()
  .map((file) => new URL(`../tests/node/${file}`, import.meta.url));
const { fileURLToPath } = await import('node:url');
const result = spawnSync(
  process.execPath,
  ['--test', '--test-concurrency=1', ...tests.map(fileURLToPath)],
  {
    stdio: 'inherit',
  },
);
process.exitCode = result.status ?? 1;
