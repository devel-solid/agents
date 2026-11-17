import type { Language } from './manifest.js';
import { GENERATED, validateConvention, validateTemplate } from './markdown.js';

export interface ConventionInput {
  source: string;
  output: string;
  text: string;
}
function notice(source: string, language: Language): string {
  const message =
    language === 'pt-br'
      ? `Arquivo gerado. Edite o template ${source}; alterações diretas serão sobrescritas.`
      : `Generated file. Edit the template ${source}; direct changes will be overwritten.`;
  return `${GENERATED}\n<!-- ${message} -->\n\n`;
}
function link(path: string): string {
  return path
    .split('/')
    .map((part) =>
      encodeURIComponent(part).replace(/[()]/gu, (character) =>
        character === '(' ? '%28' : '%29',
      ),
    )
    .join('/');
}
export function render(
  main: { source: string; text: string },
  conventions: ConventionInput[],
  language: Language,
): Map<string, string> {
  const template = validateTemplate(main.text, main.source),
    outputs = new Map<string, string>();
  const entries = conventions.map((input) => {
    const parsed = validateConvention(input.text, input.source);
    outputs.set(input.output, notice(input.source, language) + parsed.body);
    const title = parsed.title.replace(/[\\[\]]/gu, '\\$&');
    return `- [${title}](${link(input.output)})\n${parsed.card
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n')}`;
  });
  const lines = template.text.split('\n');
  lines.splice(template.insertion, 1, entries.join('\n\n'));
  outputs.set(
    'AGENTS.md',
    notice(main.source, language) + lines.join('\n').trimEnd() + '\n',
  );
  return outputs;
}
