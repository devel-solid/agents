# Baseline do port Node

Esta fixture preserva o candidato aceito de `simplify-shared-conventions`, antes das adaptações do runtime. Não é uma nova publicação de conteúdo nem uma matriz de suporte a versões privadas.

| Diretório/arquivo | Evidência |
| --- | --- |
| `accepted-inputs/` | Fontes e manifesto aceitos, normalizados para LF |
| `accepted-outputs/neutral/` | Quatro documentos esperados do consumidor neutro |
| `accepted-outputs/local/` | Dezenove documentos esperados com políticas locais explicitamente selecionadas |
| `provenance.json` | Identidade original do candidato e SHA-256 de todas as saídas |
| `scenario-map.json` | Destino dos 61 cenários Python, incluindo correções e detalhes internos retirados |

Os outputs foram capturados uma única vez com o motor Python anterior e conferidos contra `tests/fixtures/shared_instruction_catalog/candidate.json`. A identidade aceita é `874db2ba0b7588c16ee5d8d675e7c7ca3718a6f97fc8adba60cf1c082fbb8604`. Os testes Node não executam Python nem regravam as expectativas históricas.

`tests/node/integration.test.mjs` publica essas entradas somente em Git local descartável e compara os documentos produzidos pelo tarball instalado fora do checkout. O teste adapta o manifesto privado em memória ao único contrato público: `schemaVersion: 1`, descoberta local pela pasta e `entries` somente remotas. O formato antigo não é aceito pela CLI. O índice local agora segue a ordenação automática; sua expectativa separada está em `schema-v1/local-AGENTS.md`. Os demais documentos continuam comparados com os bytes e hashes históricos. As políticas locais presentes no perfil `local` são dados de teste, nunca assets padrão do pacote.

Correções deliberadas: YAML compartilhado com comentários e aspas; headings/cards somente fora de exemplos Markdown; destinos reservados, aliases e nomes equivalentes por caixa rejeitados; arquivos sem ownership preservados. Helpers internos Python de remoção e descoberta pelo caminho do launcher foram substituídos pela interface instalada e por `--repo-root`.

Execute `npm test`. Alterar estas expectativas exige nova revisão explícita; a manutenção do CLI não atualiza silenciosamente o baseline aceito.
