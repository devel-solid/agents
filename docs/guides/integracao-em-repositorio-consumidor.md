# Integração em um repositório consumidor

O ambiente precisa de Node.js 22, 24 ou 26 e da CLI instalada. Git só é necessário quando o manifesto aponta para uma base Git. Em uma instalação npm local, use `npm exec --no -- agents` em vez de `agents`, sem permitir download de uma ferramenta ausente.

## Preparar

Dentro do projeto:

```bash
agents init --dry-run
agents init
```

Um projeto novo recebe cinco arquivos:

```text
projeto/
├── .agents/
│   └── skills/
│       ├── agents-update-docs/
│       │   └── SKILL.md
│       └── agents-write-conventions/
│           └── SKILL.md
├── templates/
│   ├── docs/
│   │   └── conventions-local/
│   │       └── contexto-do-projeto.tpl.md
│   └── AGENTS.tpl.md
└── agents-compose.yml
```

A prévia não cria arquivos ou diretórios. A aplicação preserva arquivos válidos existentes; conflitos de integração ou destinos impedem a escrita. O init não cria Git nem gera os documentos finais.

## Escrever ou copiar uma regra

Edite o contexto do projeto e crie uma fonte válida na pasta `local.tpl_dir`. Se já recebeu o arquivo de outro lugar, copie-o. Exemplo:

```bash
cp ../regras/commits.tpl.md templates/docs/conventions-local/
agents validate
agents sync --dry-run
agents sync
agents sync --check
```

O resultado inclui `AGENTS.md`, `docs/conventions/contexto-do-projeto.md` e `docs/conventions/commits.md`. O manifesto concentra os caminhos; o schema v1 descobre os templates locais pela pasta, sem registrá-los em `entries`.

`validate` confere estrutura e ambiente. `sync --dry-run` lista criações, atualizações, remoções seguras, adoções e metadados; `sync` aplica o plano em uma transação recuperável. `sync --check` preserva os arquivos e retorna 1 quando falta gerar alguma saída ou metadado durável. Um template inválido ou conflito bloqueia toda a geração.

## Propriedade e edições

O primeiro `sync` cria `.agents/agents-state.json` com os caminhos, hashes e fontes dos documentos gerados. Um destino existente só é adotado se seu conteúdo normalizado corresponder à geração esperada; o aviso de arquivo gerado não basta. Se houver divergência, compare a saída com a fonte, incorpore a alteração autorizada na fonte e reconcilie o documento antes de repetir. A ferramenta não tem opção de sobrescrita forçada.

Depois disso, edições diretas das saídas impedem substituições e remoções. Ao remover um pai ou filho da seleção, ou mover `out_dir`, a CLI remove somente saídas antigas registradas e inalteradas. Arquivos alheios permanecem. Não apague o registro de propriedade para tentar contornar um conflito.

## Adotar uma base Git opcional

Configure `agents.repository`, `agents.ref` e as entradas remotas no manifesto. Escolha as regras desejadas; não há seleção automática de todo o catálogo remoto. Leia o [contrato completo](contratos-de-composicao.md) para exemplos do schema v1.

Uma mudança do pin é uma edição do manifesto, seguida de prévia e geração. Criar uma tag na base não altera automaticamente todos os consumidores. Acesso a bases privadas usa o Git e o credential helper já configurados; não grave credenciais no manifesto.

No primeiro `sync`, `agents-lock.json` registra a identidade da base, a ref solicitada, o commit resolvido, a seleção remota, sua integridade e o contrato do renderer. Com configuração igual, novas execuções usam o commit registrado, mesmo se uma tag ou branch se mover. Para adotar esse movimento intencionalmente, selecione uma nova tag ou o novo commit no manifesto. Mudanças locais continuam renderizáveis sem atualizar o lock remoto.

```bash
# Depois de editar explicitamente agents.ref no manifesto:
agents sync --dry-run
agents sync
# CI não inicializa nem troca uma seleção remota:
agents sync --frozen --check
# Depois de preencher o cache online, trabalhar sem rede:
agents sync --offline
agents validate --debug --offline --json
```

`--frozen` falha se faltar um lock remoto ou a configuração divergir dele. `--offline` não consulta a rede: exige o lock e seu cache íntegro para conteúdo remoto. Cache ausente ou alterado impede a operação; uma execução online pode reconstruí-lo no commit fixado. Prévia e check online podem preencher somente o cache ignorado, sem publicar documentos ou metadados. A CLI instalada continua sendo o motor; nunca é baixada ou executada outra versão a partir da base.

## Três estados distintos

| Caminho | Finalidade | Versionar no consumidor? |
| --- | --- | --- |
| `agents-lock.json` | Commit e integridade das entradas remotas; dispensável no projeto somente local | Sim, quando há base Git. |
| `.agents/agents-state.json` | Propriedade e proveniência dos documentos, com identidade determinística da geração | Sim, junto dos documentos. |
| `.cache/agents/` | Conteúdo Git verificado, exclusão de escrita e journal/backups de recuperação | Não; mantenha ignorado. |

Hashes de texto usam SHA-256 com normalização `utf8-lf`; UTF-8 inválido é rejeitado. A versão informativa da CLI no lock não instala outro motor. O contrato de renderer precisa ser compatível. Execuções sem mudanças não regravam metadados nem timestamps.

Esses metadados não dependem de arquivos temporários de uma sessão. Em uma exportação pública com histórico novo, não copie locks, ownership, cache ou journals do desenvolvimento: regenere o estado contra a identidade publicada da nova base, com a autorização correspondente.

## Diagnosticar e recuperar

`agents validate --debug --offline --json` mostra proveniência local/remota, famílias, commit, renderer, integridade, propriedade e recuperação pendente sem reparar o projeto. Fontes locais continuam identificadas como locais; arquivos desconhecidos são não gerenciados. A saída mantém o envelope JSON versão 1, independente do manifesto e dos metadados.

Se a geração for interrompida, preserve `.cache/agents/` e siga o [procedimento de recuperação](manutencao-do-repositorio-agents.md#recuperar-uma-sincronizacao). Não remova locks, journals ou backups para desbloquear uma operação.

## Trabalhar com o agente

Use `agents-write-conventions` para criar, revisar e manter as regras locais: ela identifica a fonte, orienta o escopo, escreve exemplos e verifica ambiguidades, duplicações e contradições. Um pedido apenas de autoria não gera documentos. Um pedido apenas de revisão não altera fontes.

Use `agents-update-docs` para atualizar documentos conforme o manifesto e as fontes existentes. Ela valida, mostra a prévia, gera quando autorizado e confere a atualidade. Não edita convenções, templates, configuração ou pins. Uma falha é relatada para correção na etapa de autoria, sem reparo implícito. Um pedido só de prévia termina sem aplicação.

O init consumidor instala ambas em `.agents/skills/`. Na base, `init --base` instala `agents-write-conventions` e `agents-update-version`, esta última para preparar e aplicar versões aprovadas. As três vêm do pacote CLI; nenhuma exige cópia manual. Cópias idênticas são preservadas e personalizações ou arquivos extras nas skills do papel solicitado impedem toda a escrita do setup. Skills exclusivas do outro papel permanecem intactas.

Os comandos também podem ser usados diretamente no terminal sem carregar skills. Não carregue código ou skills do checkout remoto como implementação do motor.

## Base e consumidor são separados

Execute este fluxo no projeto consumidor, não na base. A CLI rejeita `init`, `validate` consumidor e todas as modalidades de `sync` dentro de uma base identificada. Na base, use `validate --base` e `release`; seu `AGENTS.md` é próprio e editável. Não insira um manifesto consumidor na base. O marcador de papel é da raiz de trabalho e não é exigido das bases Git remotas antigas usadas como fonte.
