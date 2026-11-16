> Arquivo gerado. Não edite manualmente.
> Altere a fonte e o manifesto aplicáveis e use o fluxo público de publicação do repositório.

# Convenções para Skills

Este documento é o ponto de entrada para o tema `skills` neste repositório.

## Propósito e escopo

- Esta `convention` reúne orientações gerais sobre `skills`.
- Use este documento quando estiver criando, revisando ou ajustando uma `skill`.
- Use este documento para decidir o que pertence ao workflow público da `skill`, incluindo checkpoints explícitos quando eles forem necessários.
- Quando a decisão exigir separar responsabilidade entre agente e automação determinística, leia a subconvention de semântica e determinismo.

## Diretórios de skills

- Neste repositório, os pacotes próprios `update-docs` e `update-version` são mantidos diretamente em `.agents/skills/`.
- Nos consumidores, `.agents/skills/update-docs/` é instalada pelo bootstrap e autoatualizada a partir do checkout fixado em `agents.repository/ref`.
- O manifesto compõe documentos; ele não publica pacotes adicionais por `outputs.skills`.
- As skills `openspec-*` são geradas pelo OpenSpec 2.0.0 em `.agents/skills/`. Use o workflow público `openspec update` para atualizá-las.
- Antes de alterar uma skill, identifique se o pacote é autoral deste repositório, instalado de uma base fixada ou gerado por uma ferramenta.

## Paths no corpo da skill

- Quando a `skill` citar arquivo ou diretório usado pelo próprio workflow, escreva o path com uma âncora explícita.
- Use `[repo-root]/...` para caminhos resolvidos a partir da raiz do repositório consumidor.
- Use `[skill-dir]/...` para caminhos internos ao diretório do pacote da própria `skill`, incluindo o diretório que contém `SKILL.md`.
- Não use path relativo sem âncora como regra pública, como `.tmp/foo` ou `scripts/bar.py`, quando a base de resolução não estiver declarada.
- Não use path absoluto local como regra pública; reserve esse formato para evidência operacional ou diagnóstico do ambiente atual.
- Quando o caminho vier de manifesto, contrato ou campo normativo já publicado, prefira citar o campo correspondente em vez de cristalizar o valor literal atual do repositório.

## Checkpoints de workflow

- A `skill` é responsável pelos próprios checkpoints, coleta adicional de contexto e pausas deliberadas previstos no seu workflow.
- Quando uma `skill` precisar pausar antes de uma etapa relevante, esse checkpoint deve estar definido no workflow público da própria `skill`.
- Esta regra vale para `skills` do OpenSpec e para qualquer outra `skill` publicada pelos repositórios consumidores.

## Quando ler as subconventions

### Semântica e Determinismo em Skills

Arquivo: `docs/conventions/convencoes-para-skills.semantica-e-determinismo.md`

- Leia este documento ao projetar, implementar, revisar ou refatorar `skills` neste repositório.
- Use este documento para decidir o que deve ficar com o agente e o que pode ser automatizado de forma determinística.
