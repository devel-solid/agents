import { existsSync, lstatSync, realpathSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, resolve } from 'node:path';
const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)));
const target = resolve(root, 'dist');
if (dirname(target) !== root || basename(target) !== 'dist')
  throw new Error('Destino de build fora do projeto.');
if (
  existsSync(target) &&
  (lstatSync(target).isSymbolicLink() || dirname(realpathSync(target)) !== root)
)
  throw new Error('O diretório dist não pode usar um alias.');
rmSync(target, { recursive: true, force: true });
