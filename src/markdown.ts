import { readFileSync } from 'node:fs';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, RootContent } from 'mdast';
import { EngineError } from './manifest.js';

export const CARD_START = '<!-- AGENT-CARD START -->';
export const CARD_END = '<!-- AGENT-CARD END -->';
export function normalizeText(text: string): string {
  return text.replace(/\r\n?/gu, '\n');
}
export function readText(path: string): string {
  try {
    return normalizeText(
      new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path)),
    );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      throw new EngineError('SOURCE_MISSING', `Fonte ausente: ${path}.`, 2, {
        location: { path, line: 1, column: 1 },
      });
    throw new EngineError(
      'SOURCE_READ',
      `Não foi possível ler a fonte UTF-8: ${path}.`,
      2,
      { location: { path, line: 1, column: 1 } },
    );
  }
}
export function parseMarkdown(text: string): Root {
  return unified().use(remarkParse).parse(text);
}
export interface ParsedSource {
  title: string;
  cardLines: string[];
  body: string;
  text: string;
}
export function validateMarkdown(text: string, path: string): ParsedSource {
  text = normalizeText(text);
  const tree = parseMarkdown(text);
  const headings: RootContent[] = [];
  const htmlRanges: Array<[number, number]> = [];
  function visit(node: {
    type: string;
    depth?: number;
    position?: { start: { offset?: number }; end: { offset?: number } };
    children?: unknown[];
  }): void {
    if (node.type === 'code' || node.type === 'inlineCode') return;
    if (node.type === 'heading' && node.depth === 1)
      headings.push(node as RootContent);
    if (node.type === 'html')
      htmlRanges.push([
        node.position!.start.offset!,
        node.position!.end.offset!,
      ]);
    for (const child of node.children ?? [])
      visit(child as Parameters<typeof visit>[0]);
  }
  visit(tree);
  const lines = text.split('\n');
  const offsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  const starts: number[] = [],
    ends: number[] = [];
  lines.forEach((line, index) => {
    const markerOffset =
      offsets[index]! + line.length - line.trimStart().length;
    if (
      !htmlRanges.some(
        ([start, end]) => markerOffset >= start && markerOffset <= end,
      )
    )
      return;
    if (line.trim() === CARD_START) starts.push(index);
    if (line.trim() === CARD_END) ends.push(index);
  });
  function fail(code: string, message: string, line = 1): never {
    throw new EngineError(code, `${path}:${line}: ${message}`, 2, {
      location: { path, line, column: 1 },
    });
  }
  if (headings.length !== 1)
    fail(
      'SOURCE_H1',
      'a fonte deve conter exatamente um heading Markdown de nível 1 fora de exemplos.',
      headings[1]?.position?.start.line ?? 1,
    );
  if (starts.length !== 1 || ends.length !== 1)
    fail(
      'SOURCE_CARD',
      'a fonte deve conter exatamente um bloco AGENT-CARD fora de exemplos.',
      (starts[1] ?? ends[1] ?? 0) + 1,
    );
  const start = starts[0]!,
    end = ends[0]!;
  if (start >= end) fail('SOURCE_CARD', 'AGENT-CARD malformado.', start + 1);
  const cardLines = lines
    .slice(start + 1, end)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!cardLines.length) fail('SOURCE_CARD', 'AGENT-CARD vazio.', start + 1);
  const heading = headings[0]!;
  const headingLine = lines[heading.position!.start.line - 1]!;
  const title = headingLine
    .replace(/^ {0,3}#\s+/u, '')
    .replace(/\s+#+\s*$/u, '')
    .trim();
  let removeEnd = end + 1;
  while (removeEnd < lines.length && !lines[removeEnd]!.trim()) removeEnd++;
  const body =
    (
      text.slice(0, offsets[start]) +
      text.slice(offsets[removeEnd] ?? text.length)
    ).trimEnd() + '\n';
  return { title, cardLines, body, text };
}
export function validateMarkdownFile(path: string): ParsedSource {
  return validateMarkdown(readText(path), path);
}
export function validateTemplate(text: string, path: string): void {
  const tree = parseMarkdown(normalizeText(text));
  const h1 = tree.children.filter(
    (node) => node.type === 'heading' && node.depth === 1,
  );
  if (h1.length !== 1)
    throw new EngineError(
      'TEMPLATE_H1',
      `${path}: o template deve conter exatamente um H1.`,
      2,
      { location: { path, line: 1, column: 1 } },
    );
  const discovery = tree.children.filter(
    (node) =>
      node.type === 'heading' &&
      node.depth === 2 &&
      text
        .slice(node.position!.start.offset, node.position!.end.offset)
        .trim() === '## Quando ler as conventions',
  );
  if (discovery.length > 1)
    throw new EngineError(
      'TEMPLATE_DISCOVERY',
      `${path}: a seção "## Quando ler as conventions" está duplicada fora de exemplos.`,
      2,
      { location: { path, line: 1, column: 1 } },
    );
}
