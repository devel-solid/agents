> Arquivo gerado. Não edite manualmente.
> Altere a fonte e o manifesto aplicáveis e use o fluxo público de publicação do repositório.

# Manifesto `agents-compose.yml`

Este documento explica o contrato público de `agents-compose.yml` para composição de instruções compartilhadas.

## Propósito e escopo

- Esta `convention` define a estrutura pública mínima do manifesto usada para compor `AGENTS.md` e `conventions` publicadas.
- Use este documento quando precisar criar um manifesto novo, completar um manifesto incompleto ou revisar uma mudança estrutural no arquivo.
- Este documento cobre apenas os blocos e campos públicos necessários para a composição das instruções.
- Este documento não substitui a política local de versionamento, publicação ou atualização do repositório consumidor.

## Estrutura mínima

```text
agents-compose.yml
├── agents
│   ├── repository
│   └── ref
└── outputs
    └── AGENTS.md
        └── include
            └── conventions
                ├── out_dir
                ├── local.tpl_dir
                ├── remote.tpl_dir
                └── entries[]
```

## Campos públicos

| Campo | Papel |
|---|---|
| `agents.repository` | identifica o repositório base de instruções compartilhadas |
| `agents.ref` | fixa a versão, tag ou ref usada como base da composição |
| `outputs.AGENTS.md.include.conventions.out_dir` | define o diretório dos artefatos publicados |
| `outputs.AGENTS.md.include.conventions.local.tpl_dir` | define a raiz das fontes mantidas no repositório consumidor |
| `outputs.AGENTS.md.include.conventions.remote.tpl_dir` | define a raiz das fontes vindas da base compartilhada |
| `outputs.AGENTS.md.include.conventions.entries` | lista quais arquivos-fonte pai participam da publicação |

## Estrutura de `entries`

Cada item de `entries` representa uma `convention` pai incluída na publicação.

| Campo | Regra pública |
|---|---|
| `origin` | use `local` para fonte mantida no repositório consumidor ou `remote` para fonte vinda da base compartilhada |
| `from` | use o caminho do arquivo `.tpl.md` relativo ao `tpl_dir` da origem escolhida |

## Regras operacionais

- Use apenas os blocos públicos esperados em `outputs.AGENTS.md.include.conventions`: `out_dir`, `local`, `remote` e `entries`.
- Use apenas `tpl_dir` dentro dos blocos `local` e `remote`.
- Use apenas `origin` e `from` em cada item de `entries`.
- Faça cada item de `entries` apontar para um arquivo-fonte pai, não para uma `subconvention` filha.
- Use em `from` apenas um arquivo `.tpl.md` que pertença à origem declarada pelo campo `origin`.

## O que esta convention não decide

- o conteúdo normativo de cada `convention`
- a ordem interna das etapas de publicação
- mensagens de erro, validações auxiliares ou detalhes internos da automação
