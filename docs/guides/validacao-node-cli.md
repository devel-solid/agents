# Validação da CLI Node

`npm test` executa somente os testes unitários de `tests/unit/`, após compilar TypeScript. `npm run check` acrescenta tipos e formatação. Nenhum dos comandos executa integração, instalação de pacote, operações Git ou matriz de plataformas.

```text
npm ci -> npm run check
  -> tipos + formatação
  -> compilação TypeScript + testes unitários em tests/unit/
```

O CI executa esse mesmo gate uma vez, em Ubuntu com Node.js 24, sem matriz. Os testes preexistentes em `tests/node/` foram preservados e ficam fora dos dois comandos. A tabela abaixo descreve essa suíte histórica, não o gate unitário atual.

| Contrato | Evidência exercitada |
| --- | --- |
| Interface | Quatro comandos e doze opções; interfaces retiradas são rejeitadas sem escrita. |
| Init | Cinco arquivos no consumidor e sete na base, prévia sem escrita, repetição sem alteração e conflitos antes da gravação. |
| Manifestos | Contrato único v1, versão explícita, base opcional, descoberta local e entradas somente remotas; erros com localização. |
| Autoria | Editor/cópia, subpastas, famílias, filhos órfãos, ordenação e colisões portáveis. |
| Sync | Prévia, aplicação, check 0/1, adoção, remoção por propriedade e bytes/timestamps preservados. |
| Base | AGENTS.md próprio, marcador de papel, catálogo vazio/starter, famílias próprias, consumidores separados e conteúdo fixado tratado como dados. |
| Papéis | Inicialização cruzada, manifesto inserido na base e sync na base rejeitados; subpastas, marcadores inválidos e instruções personalizadas preservadas. |
| Release | Baseline numérico, primeira versão, prévia sem escrita, tag local, estado sujo e races sem sobrescrita. |
| Skills | Prefixo agents-, fonte igual ao asset, agents-update-docs no consumidor, agents-update-version na base, instalação automática e CLI direta sem skill. |
| Compatibilidade | Documentos históricos preservados; índice local esperado separado para a ordem automática do schema v1. |
| Proteção | Links, hardlinks, caminhos reservados, UTF-8, Markdown, credenciais redigidas e JSON único. |

## Fluxo local

Com Node e a CLI instalada:

```bash
agents init --dry-run
agents init
# Crie ou copie uma convenção completa na pasta local.tpl_dir do manifesto.
agents validate
agents sync --dry-run
agents sync
agents sync --check
```

A referência em `docs/guides/contratos-de-composicao.md` contém manifestos completos e um template válido. Os testes conferem os exemplos com os parsers da CLI.

## Fluxo de uma base

Em uma pasta descartável, com identidade Git configurada:

```bash
agents init --base
# Escreva ou copie regras completas em templates/docs/conventions/.
agents validate --base
git init
git add .
git commit -m "feat: adiciona base de instruções"
agents release --bump minor --dry-run
agents release --bump minor
```

Sem tag anterior, esse exemplo cria somente a tag local `v0.1.0`. Não envia a tag nem altera manifesto ou versão npm. A skill `agents-update-version` acrescenta análise de impacto, plano e confirmação antes da aplicação. Publicação remota depende do escopo aprovado.

## Evidência e limites

Os resultados do runtime anterior ficam no relatório arquivado de `introduce-node-cli`. A aceitação final de `harden-instruction-sync` segue a decisão do usuário de usar somente testes unitários; integração e matriz não fazem parte desse gate. O relatório `validation.md` acompanha a change arquivada e registra resultados e limitações. Os cinco testes unitários de hashes, serialização, lock, identidade de geração e redação de credenciais ficam em `tests/unit/hardening.test.mjs`. A suíte preexistente foi preservada fora dos comandos padrão. Essa aceitação não representa certificação de integração ou de plataformas.

`tests/fixtures/node-cli/validation-results.json` registra o port anterior à simplificação, não a interface atual. Os fixtures aceitos preservam sua proveniência e seus bytes.

Validação/preview/check online podem preencher o cache de entradas Git, sem inicializar metadados duráveis. `validate` inspeciona cache existente sem repará-lo.

Lock remoto e ownership são commitáveis; os dados de recuperação em `.cache/agents/` são ignorados e preservados enquanto necessários. Publicação automatizada, novo repositório, renomeação do produto e tradução continuam fora desta etapa.

