import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const major = Number(process.versions.node.split('.')[0]);
if (![22, 24, 26].includes(major)) {
  console.error('Install Node.js 22, 24, or 26, then run npm run setup.');
  process.exit(2);
}
if (spawnSync('git', ['--version'], { stdio: 'inherit' }).status !== 0) {
  console.error('Install Git and make its executable available on PATH.');
  process.exit(2);
}
const require = createRequire(import.meta.url);
const result = spawnSync(
  process.execPath,
  [require.resolve('lefthook/bin/index.js'), 'install'],
  {
    stdio: 'inherit',
    env: { ...process.env, LEFTHOOK: '1' },
  },
);
process.exitCode = result.status ?? 1;
