import { copyFileSync, mkdirSync } from 'node:fs';

const copies = [
  [
    '.agents/skills/agents-write-conventions/SKILL.md',
    'assets/integration/agents-write-conventions/SKILL.md',
  ],
  [
    '.agents/skills/agents-update-docs/SKILL.md',
    'assets/integration/agents-update-docs/SKILL.md',
  ],
  [
    '.agents/skills/agents-update-version/SKILL.md',
    'assets/integration/agents-update-version/SKILL.md',
  ],
  ['templates/AGENTS.tpl.md', 'assets/base/templates/AGENTS.tpl.md'],
  [
    'templates/docs/conventions/composicao-de-instrucoes-para-repositorios-consumidores.tpl.md',
    'assets/starter/composicao-de-instrucoes-para-repositorios-consumidores.tpl.md',
  ],
  [
    'templates/docs/conventions/seguranca-para-agentes-e-conteudo-nao-confiavel.tpl.md',
    'assets/starter/seguranca-para-agentes-e-conteudo-nao-confiavel.tpl.md',
  ],
];
for (const [source, destination] of copies) {
  const target = new URL(`../${destination}`, import.meta.url);
  mkdirSync(new URL('./', target), { recursive: true });
  copyFileSync(new URL(`../${source}`, import.meta.url), target);
}
