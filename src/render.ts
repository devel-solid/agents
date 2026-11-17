import { normalizeText, parseMarkdown } from './markdown.js';
import type {
  ConventionArtifact,
  ConventionFamily,
  ResolvedComposition,
} from './resolve.js';

export const GENERATED_NOTICE =
  '> Arquivo gerado. Não edite manualmente.\n> Altere a fonte e o manifesto aplicáveis e use o fluxo público de publicação do repositório.';
export const SECTION_HEADING = '## Quando ler as conventions';
const PREAMBLE = [
  '- Esta seção é a lista autoritativa de descoberta para as `conventions` publicadas.',
  '- O agente deve consultar esta seção em toda mudança para verificar se existe alguma `convention` acionada no caso concreto.',
  '- Ao criar, remover, renomear ou alterar o escopo de uma `convention`, atualize esta lista.',
];
function trimTrailing(lines: string[]): string[] {
  const result = [...lines];
  while (result.length && !result.at(-1)!.trim()) result.pop();
  return result;
}
function trimEdges(lines: string[]): string[] {
  const result = trimTrailing(lines);
  while (result.length && !result[0]!.trim()) result.shift();
  return result;
}
function blocks(artifacts: ConventionArtifact[]): string[] {
  return artifacts.flatMap((artifact, index) => [
    ...(index ? [''] : []),
    `### ${artifact.title}`,
    '',
    `Arquivo: \`${artifact.targetDisplay}\``,
    '',
    ...artifact.cardLines.map((line) => `- ${line}`),
  ]);
}
export function prefixGeneratedNotice(text: string): string {
  const lines = trimEdges(normalizeText(text).split('\n'));
  return (
    [GENERATED_NOTICE, ...(lines.length ? ['', ...lines] : [])]
      .join('\n')
      .trimEnd() + '\n'
  );
}
export function renderAgents(
  template: string,
  parents: ConventionArtifact[],
): string {
  template = normalizeText(template);
  const tree = parseMarkdown(template);
  const heading = tree.children.find(
    (node) =>
      node.type === 'heading' &&
      node.depth === 2 &&
      template
        .slice(node.position!.start.offset, node.position!.end.offset)
        .trim() === SECTION_HEADING,
  );
  const lines = template.split('\n');
  let prefix: string[], after: string[];
  if (heading) {
    prefix = lines.slice(0, heading.position!.end.line);
    after = lines.slice(heading.position!.end.line);
  } else {
    prefix = [...lines, '', SECTION_HEADING];
    after = [];
  }
  const firstEntry = tree.children.find(
    (node) =>
      node.type === 'heading' &&
      node.depth === 3 &&
      node.position!.start.line > (heading?.position?.end.line ?? 0),
  );
  const preamble = firstEntry
    ? after.slice(
        0,
        firstEntry.position!.start.line -
          (heading?.position?.end.line ?? lines.length) -
          1,
      )
    : after;
  const body = preamble.some((line) => line.trim())
    ? trimEdges(preamble)
    : PREAMBLE;
  return (
    [
      ...trimTrailing(prefix),
      '',
      ...body,
      ...(parents.length ? ['', ...blocks(parents)] : []),
    ]
      .join('\n')
      .trimEnd() + '\n'
  );
}
export function renderFamily(family: ConventionFamily): string {
  if (!family.children.length) return family.parent.body;
  return (
    [
      ...trimTrailing(family.parent.body.split('\n')),
      '',
      '## Quando ler as subconventions',
      '',
      ...blocks(family.children),
    ]
      .join('\n')
      .trimEnd() + '\n'
  );
}
export interface RenderedOutput {
  path: string;
  content: string;
}
export function renderComposition(
  composition: ResolvedComposition,
): RenderedOutput[] {
  const outputs: RenderedOutput[] = [];
  for (const family of composition.families) {
    outputs.push({
      path: family.parent.targetDisplay,
      content: prefixGeneratedNotice(renderFamily(family)),
    });
    for (const child of family.children)
      outputs.push({
        path: child.targetDisplay,
        content: prefixGeneratedNotice(child.body),
      });
  }
  outputs.push({
    path: 'AGENTS.md',
    content: prefixGeneratedNotice(
      renderAgents(
        composition.template,
        composition.families.map((family) => family.parent),
      ),
    ),
  });
  return outputs;
}
