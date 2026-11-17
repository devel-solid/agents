import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const major = Number(process.versions.node.split('.')[0]);
if (![22, 24, 26].includes(major)) {
  console.error('Instale Node.js LTS 22, 24 ou 26 e execute npm run setup.');
  process.exit(2);
}
if (spawnSync('git', ['--version'], { stdio: 'inherit' }).status !== 0) {
  console.error('Instale Git e disponibilize seu executável no PATH.');
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
