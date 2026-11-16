# Manutenção do Repositório `agents`

Para adotar a base em outro projeto, consulte o [guia de integração](integracao-em-repositorio-consumidor.md).

## Setup e testes

O setup exige Python >=3.10, Node >=22 e npm. O OpenSpec 2.0.0 é instalado globalmente, sem dependência local neste projeto.

```sh
make setup
make tests
```

`make setup` valida o ambiente, executa `npm ci` e instala o Lefthook local. O hook `pre-push` executa a suíte geral. No Windows, a suíte também pode ser executada com `python -B -m unittest discover -s tests -v`.

## O que editar

| Mudança | Fonte |
|---|---|
| Instruções gerais | `templates/AGENTS.tpl.md` |
| Conventions compartilhadas | `templates/docs/conventions/` |
| Conventions locais | `templates/docs/conventions-local/` |
| Origem, referência e composição | `agents-compose.yml` |
| Sincronização | `.agents/skills/update-docs/` |
| Publicação de versões | `.agents/skills/update-version/` |

`AGENTS.md` e `docs/conventions/` são gerados. Use a skill `update-docs` para materializá-los. As skills OpenSpec são mantidas pelo gerador, com `openspec update`.

## Sincronização

O manifesto usa `agents.repository/ref`; não existe modo raiz. Fontes remotas e o template-base vêm sempre da referência fixada, inclusive neste repositório. A skill também atualiza sua própria cópia local a partir desse checkout.

Durante a autoria, alterar um template compartilhado local não o torna disponível no checkout fixado. A publicação da nova tag precisa acontecer antes da atualização de `agents.ref` e da sincronização final.

## Publicação de versões

Invoque `update-version` quando quiser publicar uma versão. Após a confirmação do plano, o fluxo:

```text
HEAD de origem limpo em main
  |
  +-> validar estado e próxima versão
  +-> criar e publicar tag no HEAD de origem
  +-> atualizar agents.ref
  +-> update-docs gera os documentos
  +-> validar caminhos da release
  +-> commitar referência e documentos
  +-> publicar main
```

A tag contém as fontes da release; o commit posterior em `main` atualiza a referência e os documentos gerados. A versão é conduzida por `agents.ref` e pelas tags, sem prévia isolada nem sincronização automática da versão em `package.json`.

Consumidores que usam `v3.0.2` precisam migrar o manifesto e adotar `v4.0.1` ou uma versão posterior com o novo contrato e a correção de recuperação do cache no Windows.

## OpenSpec

Confira a geração com `openspec update --dry-run`. As seis skills ficam em `.agents/skills/`; use `openspec-archive-change` para sincronizar specs permanentes e arquivar changes concluídas. O idioma continua em inglês conforme `openspec/config.yaml`.

Valide as specs com:

```sh
openspec validate --all --strict
```
