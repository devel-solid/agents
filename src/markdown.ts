import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Root, RootContent } from 'mdast';
import { EngineError } from './manifest.js';

export const CARD_START = '<!-- AGENT-CARD START -->';
export const CARD_END = '<!-- AGENT-CARD END -->';
export const INSERTION = '<!-- agentscli:conventions -->';
export const GENERATED = '<!-- agentscli:generated -->';
export const normalizeText = (text: string): string =>
  text.replace(/\r\n?/gu, '\n');
export function decode(bytes: Uint8Array, path: string): string {
  try {
    return normalizeText(
      new TextDecoder('utf-8', { fatal: true }).decode(bytes),
    );
  } catch {
    throw new EngineError('SOURCE_UTF8', `Invalid UTF-8: ${path}.`, 2, path);
  }
}
export function parseMarkdown(text: string): Root {
  return unified().use(remarkParse).parse(text);
}
interface Structure {
  text: string;
  title: string;
  lines: string[];
  markers: (marker: string) => number[];
}
function structure(input: string, path: string): Structure {
  const text = normalizeText(input),
    tree = parseMarkdown(text),
    lines = text.split('\n');
  const headings: RootContent[] = [];
  const html: Array<[number, number]> = [];
  function visit(node: {
    type: string;
    depth?: number;
    position?: { start: { offset?: number }; end: { offset?: number } };
    children?: unknown[];
  }): void {
    if (
      node.type === 'code' ||
      node.type === 'inlineCode' ||
      node.type === 'blockquote'
    )
      return;
    if (node.type === 'heading' && node.depth === 1)
      headings.push(node as RootContent);
    if (node.type === 'html') {
      const value = text.slice(
        node.position!.start.offset!,
        node.position!.end.offset!,
      );
      if ([CARD_START, CARD_END, INSERTION].includes(value.trim()))
        html.push([node.position!.start.offset!, node.position!.end.offset!]);
    }
    for (const child of node.children ?? [])
      visit(child as Parameters<typeof visit>[0]);
  }
  visit(tree);
  if (headings.length !== 1)
    throw new EngineError(
      'SOURCE_H1',
      `${path}:1: Expected exactly one H1 outside examples.`,
      2,
      path,
    );
  function inlineText(node: { value?: string; children?: unknown[] }): string {
    return (
      node.value ??
      (node.children ?? [])
        .map((child) => inlineText(child as Parameters<typeof inlineText>[0]))
        .join('')
    );
  }
  const title =
    inlineText(headings[0]! as Parameters<typeof inlineText>[0]).trim() ||
    'Convention';
  function markers(marker: string): number[] {
    let offset = 0;
    const found: number[] = [];
    lines.forEach((line, index) => {
      const start = offset + line.length - line.trimStart().length;
      if (
        line.trim() === marker &&
        html.some(([a, b]) => start >= a && start < b)
      )
        found.push(index);
      offset += line.length + 1;
    });
    return found;
  }
  return { text, title, lines, markers };
}
export function validateTemplate(
  text: string,
  path: string,
): { text: string; insertion: number } {
  const parsed = structure(text, path),
    found = parsed.markers(INSERTION);
  if (found.length !== 1)
    throw new EngineError(
      'TEMPLATE_MARKER',
      `${path}:1: Expected exactly one full-line ${INSERTION} outside examples.`,
      2,
      path,
    );
  return { text: parsed.text, insertion: found[0]! };
}
export interface ParsedConvention {
  title: string;
  card: string;
  body: string;
}
export function validateConvention(
  text: string,
  path: string,
): ParsedConvention {
  const parsed = structure(text, path),
    starts = parsed.markers(CARD_START),
    ends = parsed.markers(CARD_END);
  if (starts.length !== 1 || ends.length !== 1 || starts[0]! >= ends[0]!)
    throw new EngineError(
      'SOURCE_CARD',
      `${path}:1: Expected one complete AGENT-CARD outside examples.`,
      2,
      path,
    );
  const start = starts[0]!,
    end = ends[0]!,
    card = parsed.lines
      .slice(start + 1, end)
      .join('\n')
      .trim();
  if (!card)
    throw new EngineError(
      'SOURCE_CARD',
      `${path}:${start + 1}: AGENT-CARD must not be empty.`,
      2,
      path,
    );
  const body =
    [...parsed.lines.slice(0, start), ...parsed.lines.slice(end + 1)]
      .join('\n')
      .trimEnd() + '\n';
  return { title: parsed.title, card, body };
}
