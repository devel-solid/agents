# Integração em Repositório Consumidor

Use este guia para adotar a base em outro projeto. Para trabalhar na própria base, consulte o [guia de manutenção](manutencao-do-repositorio-agents.md).

## Pré-requisitos

| Ferramenta | Uso |
|---|---|
| Python >=3.10 | bootstrap e sincronização |
| Git | acesso à versão fixada da base |

## 1. Declare fontes e publicação

Crie `agents-compose.yml` na raiz do consumidor:

```yaml
agents:
  repository: https://github.com/devel-solid/agents.git
  ref: v4.0.0

outputs:
  AGENTS.md:
    include:
      conventions:
        out_dir: docs/conventions
        local:
          tpl_dir: templates/docs/conventions-local
        remote:
          tpl_dir: templates/docs/conventions
        entries:
          - origin: local
            from: contexto-do-projeto.tpl.md
          - origin: remote
            from: padrao-de-mensagem-de-commit.tpl.md
```

O exemplo usa `v4.0.0`, que contém o novo contrato. Não use `v3.0.2` neste exemplo: ela contém o esquema anterior.

- `agents.repository/ref` identifica o checkout fixado.
- `out_dir` define o destino dos documentos.
- `local.tpl_dir` e `remote.tpl_dir` definem as raízes das fontes.
- `entries[].from` aponta para um arquivo-pai `.tpl.md`, relativo à raiz da origem. Subdiretórios são preservados na publicação.
- Declare os dois blocos de origem, mesmo quando não houver entradas locais.
- Não use `agents.root`, `agents.source`, `agents.bootstrap` ou `outputs.skills`.

## 2. Escreva as fontes locais

No exemplo, crie `templates/docs/conventions-local/contexto-do-projeto.tpl.md`. Cada fonte deve ter exatamente um título H1 e um bloco `AGENT-CARD` não vazio. O corpo normativo fica fora do cartão.

## 3. Faça o bootstrap

Obtenha `bin/agents-bootstrap.py` da mesma tag declarada em `agents.ref`, coloque-o no consumidor e execute na raiz:

```sh
python3 bin/agents-bootstrap.py
```

No Windows, use `python` quando esse for o executável Python instalado.

O bootstrap instala apenas `.agents/skills/update-docs/`, sem gerar documentos. Depois, invoque a skill `update-docs` para sincronizar a documentação. Não há distribuição automática de outras skills pelo manifesto.

## 4. Sincronize e atualize

```text
alterar fontes ou manifesto
  |
  +-> update-docs
        +-> garantir checkout de agents.repository/ref
        +-> autoatualizar update-docs
        +-> gerar conventions e AGENTS.md
```

Para adotar uma nova versão, atualize `agents.ref`, invoque `update-docs` e revise o diff antes de commitar no consumidor. A referência deve existir no remoto antes da sincronização.

## OpenSpec opcional

Use o OpenSpec 2.0.0 do ambiente para gerar suas skills em `.agents/skills/`. O fluxo de arquivamento sincroniza os deltas em `openspec/specs/` e preserva a change em `openspec/changes/archive/`, conforme o workflow de `openspec-archive-change`.

As antigas conventions `fluxo-openspec-com-archive.tpl.md` e `fluxo-openspec-com-remocao-direta.tpl.md` não fazem parte deste contrato. Remova essas entradas ao migrar o manifesto e use as skills do OpenSpec.
