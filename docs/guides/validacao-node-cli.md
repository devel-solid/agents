# Validação da CLI Node

O gate usa o pacote instalado e projetos descartáveis. Não publica versões neste repositório.

```text
npm ci -> npm run check
  -> tipos + formatação + build limpo
  -> contratos, caminhos, CLI e release
  -> npm pack + instalação fora do checkout
  -> consumidores e bases Git descartáveis
```

A instalação usa `--omit=dev --ignore-scripts`. Os cenários restringem o PATH para comprovar execução sem Python, Make ou compilador; o fluxo local também funciona sem Git. A instalação pode consultar o registro para dependências ausentes. A composição usa apenas repositórios Git locais descartáveis.

| Contrato | Evidência exercitada |
| --- | --- |
| Interface | Quatro comandos e dez opções; interfaces retiradas são rejeitadas sem escrita. |
| Init | Cinco arquivos no consumidor e sete na base, prévia sem escrita, repetição sem alteração e conflitos antes da gravação. |
| Manifestos | V1 explícita preservada, V2 com base opcional e descoberta local, erros com localização. |
| Autoria | Editor/cópia, subpastas, famílias, filhos órfãos, ordenação e colisões portáveis. |
| Sync | Prévia, aplicação, check 0/1, updates/no-ops e bytes/timestamps preservados. |
| Base | AGENTS.md próprio, marcador de papel, catálogo vazio/starter, famílias próprias, consumidores separados e conteúdo fixado tratado como dados. |
| Papéis | Inicialização cruzada, manifesto inserido na base e sync na base rejeitados; subpastas, marcadores inválidos e instruções personalizadas preservadas. |
| Release | Baseline numérico, primeira versão, prévia sem escrita, tag local, estado sujo e races sem sobrescrita. |
| Skills | Prefixo agents-, fonte igual ao asset, agents-update-docs no consumidor, agents-update-version na base, instalação automática e CLI direta sem skill. |
| Compatibilidade | Bytes/hashes dos quatro documentos neutros e dezenove locais dos fixtures v1 aceitos. |
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

Os resultados atuais ficam no relatório de implementação da change `introduce-node-cli`. Execução real e configuração de CI são evidências distintas; configurar uma matriz não comprova aprovação em um sistema sem executor.

`tests/fixtures/node-cli/validation-results.json` registra o port anterior à simplificação, não a interface atual. Os fixtures aceitos preservam sua proveniência e seus bytes.

Esta versão permite cache em validação/preview/check de entradas Git e preserva documentos fora da composição. Lock, limpeza por ownership, recuperação transacional e publicação automatizada continuam em propostas separadas; não são operações disponíveis.

