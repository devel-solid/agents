# agents

Cria e atualiza arquivos de instruções para agentes de IA a partir de templates Markdown.

A equipe escreve as regras. O manifesto define as pastas e, quando necessário, uma base Git compartilhada. A CLI valida as fontes e gera `AGENTS.md` e os documentos de convenções.

## Quatro comandos

| Comando | Uso | Efeito |
| --- | --- | --- |
| `agents init` | Preparar um projeto | Cria manifesto versão 1, templates principal/contexto e as skills `agents-write-conventions` e `agents-update-docs`. |
| `agents validate` | Conferir configuração, fontes e ambiente | Aponta problemas sem gerar documentos. |
| `agents sync` | Gerar ou atualizar as instruções | Grava somente os documentos cujo conteúdo mudou. |
| `agents release --bump minor` | Versionar uma base | Calcula a próxima versão e cria somente sua tag local no commit atual. |

Node.js 22, 24 ou 26 deve estar instalado. O fluxo local não exige Git, rede, Python ou Make. Git é necessário para consumir uma base Git e para criar versões.

## Do projeto vazio aos documentos

Com a CLI instalada, execute dentro do projeto:

```bash
agents init --dry-run
agents init
# Crie uma regra no editor ou copie um template existente:
cp ../regras/commits.tpl.md templates/docs/conventions-local/
agents validate
agents sync --dry-run
agents sync
agents sync --check
```

`init` prepara as fontes, sem gerar documentos. `sync --dry-run` lista os arquivos previstos sem gravá-los. `sync --check` retorna 0 quando estão atuais ou 1 quando há diferenças. Fontes inválidas e conflitos impedem a geração.

O manifesto usa somente `schemaVersion: 1`, declarado explicitamente. Todos os templates locais válidos da pasta configurada participam da geração; `entries` seleciona somente pais remotos. Não há cadastro de regras locais por comando.

## Compartilhar uma base

```bash
agents init --base
# Escreva regras em templates/docs/conventions/.
agents validate --base
```

A base começa com seu próprio `AGENTS.md` editável, a identificação interna `.agents/base.json`, um template principal, um catálogo vazio e duas skills em `.agents/skills/`: `agents-write-conventions` para autoria e `agents-update-version` para versionamento. `--starter minimal` copia duas regras de exemplo opcionais. Manifesto consumidor, motor e repositório Git não são criados pelo comando.

A base não tem manifesto consumidor e não executa `sync`. Seu `AGENTS.md` orienta o trabalho na base; `templates/AGENTS.tpl.md` é destinado aos consumidores. `init --base` cria sete arquivos e preserva um `AGENTS.md` existente válido. Os dois papéis não podem ser combinados.

Depois de manter a base em um repositório Git com os arquivos commitados:

```bash
agents release --bump minor --dry-run
agents release --bump minor
```

A CLI descobre a maior tag estável alcançável a partir de HEAD e calcula o aumento. Sem versão anterior, parte numericamente de `v0.0.0`. `patch`, `minor` e `major` aumentam partes distintas. A prévia não grava nada; a aplicação cria uma tag local, sem commit, push, mudança no manifesto ou publicação npm.

Os consumidores configuram a base, a tag desejada e as regras remotas no manifesto. Isso é separado de criar uma versão da própria base.

## Três skills

| Skill | Instalada por | Responsabilidade |
| --- | --- | --- |
| `agents-write-conventions` | `init` e `init --base` | Criar, revisar e manter o conteúdo: escopo, clareza, exemplos e coerência entre convenções. |
| `agents-update-docs` | `init` no consumidor | Validar, simular e gerar documentos pelo manifesto existente, sem editar regras ou configuração. |
| `agents-update-version` | `init --base` na base | Analisar impacto, justificar o aumento, mostrar a prévia e exigir confirmação antes dos efeitos de release. |

Todas vêm do pacote CLI e ficam em `.agents/skills/<nome>/SKILL.md` do repositório correspondente, sem cópia manual. A autoria não implica geração ou versionamento. A CLI valida a estrutura, enquanto a skill de escrita orienta a curadoria do conteúdo. Os comandos também funcionam diretamente no terminal, sem carregar skills.

## Referências e desenvolvimento

- [Contrato completo de manifesto e templates](docs/guides/contratos-de-composicao.md)
- [Integração em um consumidor](docs/guides/integracao-em-repositorio-consumidor.md)
- [Manutenção e versionamento](docs/guides/manutencao-do-repositorio-agents.md)
- [Testes e evidências](docs/guides/validacao-node-cli.md)

```bash
npm ci
npm run setup
npm run check
npm pack --pack-destination .tmp
```

O build compila TypeScript e empacota os assets autorais. O tarball contém o executável, o schema v1, os scaffolds e a integração pública. Nenhum passo de desenvolvimento publica uma release real. `agents --help` lista as opções; `agents --version` informa a versão da CLI, independente das tags da base.
