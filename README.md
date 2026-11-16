# Base de instruções para agentes

Este repositório centraliza instruções e conventions reutilizáveis. Os projetos consumidores fixam uma versão da base e usam `update-docs` para gerar seus documentos.

```text
fontes + agents-compose.yml
  |
  +-> update-docs
        +-> AGENTS.md
        +-> diretório publicado de conventions
        +-> .agents/skills/update-docs/ (autoatualização)
```

## Leituras principais

| Objetivo | Leia |
|---|---|
| Manter a base | [Guia de manutenção](docs/guides/manutencao-do-repositorio-agents.md) |
| Integrar outro projeto | [Guia de integração](docs/guides/integracao-em-repositorio-consumidor.md) |
| Entender o manifesto | [Contrato dos artefatos](docs/conventions/contratos-de-artefatos-para-repositorios-consumidores.md) |

## Modelo

`agents.repository` identifica a base e `agents.ref` fixa sua versão. Entradas `origin: local` usam fontes do consumidor; entradas `origin: remote` usam o checkout fixado, inclusive neste repositório. Não existe modo `agents.root` nem publicação declarativa de skills em `outputs.skills`.

```yaml
agents:
  repository: https://github.com/devel-solid/agents.git
  ref: v4.0.1
```

O exemplo usa `v4.0.1`, que inclui a correção de recuperação do cache no Windows. O novo contrato foi introduzido em `v4.0.0`; a tag `v3.0.2` usa o contrato anterior.

## Estrutura

| Caminho | Papel |
|---|---|
| `templates/AGENTS.tpl.md` | template de instruções |
| `templates/docs/conventions/` | fontes compartilhadas |
| `templates/docs/conventions-local/` | fontes locais |
| `agents-compose.yml` | origem, referência e composição |
| `AGENTS.md` e `docs/conventions/` | documentos gerados |
| `.agents/skills/update-docs/` | sincronização e bootstrap |
| `.agents/skills/update-version/` | publicação de versões da base |
| `.agents/skills/openspec-*/` | workflows gerados pelo OpenSpec 2.0.0 |

Altere as fontes e use a skill `update-docs` para materializar documentos. As skills próprias são mantidas diretamente em `.agents/skills/`.

## OpenSpec

Use o OpenSpec global 2.0.0. As skills incluem `openspec-propose`, `openspec-explore`, `openspec-apply-change`, `openspec-update-change`, `openspec-sync-specs` e `openspec-archive-change`.

O fluxo preserva specs em `openspec/specs/` e changes concluídas em `openspec/changes/archive/`. Para atualizar as skills, confira `openspec update --dry-run` antes de executar `openspec update`. O idioma continua definido em `openspec/config.yaml`.
