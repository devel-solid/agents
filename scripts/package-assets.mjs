import * as fs from 'node:fs';
import { basename, dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from 'yaml';

const portableKey = (path) => path.normalize('NFC').toLowerCase();

function containedPath(root, path) {
  if (
    typeof path !== 'string' ||
    !path ||
    path.includes('\\') ||
    path.split('/').some((part) => !part || part === '.' || part === '..') ||
    /[<>:"|?*\x00-\x1f]/u.test(path) ||
    path
      .split('/')
      .some(
        (part) =>
          /[. ]$/u.test(part) ||
          /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(part),
      )
  )
    throw new Error(`Unsafe resource path: ${String(path)}`);
  const absolute = resolve(root, path);
  const rel = relative(root, absolute);
  if (!rel || rel.startsWith(`..${sep}`) || rel === '..')
    throw new Error(`Resource escapes the repository: ${path}`);
  return absolute;
}

function checkedStat(root, absolute, io) {
  let current = root;
  for (const part of relative(root, absolute).split(sep)) {
    current = resolve(current, part);
    const stat = io.lstatSync(current);
    if (
      stat.isSymbolicLink() ||
      (stat.isFile() && stat.nlink > 1) ||
      io.realpathSync(current) !== current
    )
      throw new Error(`Aliased resource path: ${current}`);
  }
  return io.lstatSync(absolute);
}

export function skillDirectories(text) {
  const value = parse(text);
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.keys(value).length !== 1 ||
    !Array.isArray(value.skills) ||
    value.skills.length === 0
  )
    throw new Error('agentscli.yml must contain only a nonempty skills list.');
  const names = new Set();
  return value.skills.map((path) => {
    containedPath(resolve('/'), path);
    const name = basename(path);
    if (!/^agentscli-[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(name))
      throw new Error(`Invalid distributed skill directory: ${name}`);
    const key = portableKey(name);
    if (names.has(key)) throw new Error(`Duplicate skill destination: ${name}`);
    names.add(key);
    return { path, name };
  });
}

export function collectResources(root, io = fs) {
  root = io.realpathSync(root);
  checkedStat(root, resolve(root, 'agentscli.yml'), io);
  const skills = skillDirectories(
    io.readFileSync(resolve(root, 'agentscli.yml'), 'utf8'),
  );
  const resources = [];
  const destinations = new Set();
  function collect(source, destination) {
    const absolute = containedPath(root, source);
    const stat = checkedStat(root, absolute, io);
    if (stat.isDirectory()) {
      for (const name of io.readdirSync(absolute).sort())
        collect(`${source}/${name}`, `${destination}/${name}`);
    } else if (stat.isFile()) {
      const key = portableKey(destination);
      if (destinations.has(key))
        throw new Error(`Duplicate resource destination: ${destination}`);
      destinations.add(key);
      resources.push({ destination, content: io.readFileSync(absolute) });
    } else
      throw new Error(
        `Resource must be a regular file or directory: ${source}`,
      );
  }
  for (const { path, name } of skills) {
    const source = containedPath(root, path);
    if (!checkedStat(root, source, io).isDirectory())
      throw new Error(`Skill source must be a directory: ${path}`);
    const entry = resolve(source, 'SKILL.md');
    if (!checkedStat(root, entry, io).isFile())
      throw new Error(`Skill entrypoint must be a regular file: ${path}`);
    const text = io.readFileSync(entry, 'utf8');
    const header = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u.exec(text);
    const metadata = header ? parse(header[1]) : null;
    if (
      metadata?.name !== name ||
      typeof metadata?.description !== 'string' ||
      !metadata.description.trim()
    )
      throw new Error(
        `SKILL.md requires matching name and description: ${path}`,
      );
    collect(path, `skills/${name}`);
  }
  for (const language of ['en', 'pt-br'])
    collect(`assets/templates/${language}`, `templates/${language}`);
  return resources;
}

export function packageAssets(root, io = fs) {
  const resources = collectResources(root, io);
  const output = resolve(root, 'dist/assets');
  for (const { destination, content } of resources) {
    const target = containedPath(output, destination);
    io.mkdirSync(dirname(target), { recursive: true });
    io.writeFileSync(target, content);
  }
  return resources.length;
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
)
  packageAssets(fileURLToPath(new URL('../', import.meta.url)));
