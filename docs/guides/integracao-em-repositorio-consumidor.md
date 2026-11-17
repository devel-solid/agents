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

O resultado inclui `AGENTS.md`, `docs/conventions/contexto-do-projeto.md` e `docs/conventions/commits.md`. O manifesto concentra os caminhos; não é preciso registrar cada template local na versão 2.

`validate` confere estrutura e ambiente. `sync --dry-run` lista os documentos previstos; `sync` grava somente o conteúdo alterado. `sync --check` preserva os arquivos e retorna 1 quando falta gerar alguma saída. Um template inválido bloqueia a geração sem editar documentos manualmente.

## Adotar uma base Git opcional

Configure `agents.repository`, `agents.ref` e as entradas remotas no manifesto. Escolha as regras desejadas; não há seleção automática de todo o catálogo remoto. Leia o [contrato completo](contratos-de-composicao.md) para exemplos v1/v2.

Uma mudança do pin é uma edição do manifesto, seguida de prévia e geração. Criar uma tag na base não altera automaticamente todos os consumidores. Acesso a bases privadas usa o Git e o credential helper já configurados; não grave credenciais no manifesto.

## Trabalhar com o agente

Use `agents-write-conventions` para criar, revisar e manter as regras locais: ela identifica a fonte, orienta o escopo, escreve exemplos e verifica ambiguidades, duplicações e contradições. Um pedido apenas de autoria não gera documentos. Um pedido apenas de revisão não altera fontes.

Use `agents-update-docs` para atualizar documentos conforme o manifesto e as fontes existentes. Ela valida, mostra a prévia, gera quando autorizado e confere a atualidade. Não edita convenções, templates, configuração ou pins. Uma falha é relatada para correção na etapa de autoria, sem reparo implícito. Um pedido só de prévia termina sem aplicação.

O init consumidor instala ambas em `.agents/skills/`. Na base, `init --base` instala `agents-write-conventions` e `agents-update-version`, esta última para preparar e aplicar versões aprovadas. As três vêm do pacote CLI; nenhuma exige cópia manual. Cópias idênticas são preservadas e personalizações ou arquivos extras nas skills do papel solicitado impedem toda a escrita do setup. Skills exclusivas do outro papel permanecem intactas.

Os comandos também podem ser usados diretamente no terminal sem carregar skills. Não carregue código ou skills do checkout remoto como implementação do motor.

## Base e consumidor são separados

Execute este fluxo no projeto consumidor, não na base. A CLI rejeita `init`, `validate` consumidor e todas as modalidades de `sync` dentro de uma base identificada. Na base, use `validate --base` e `release`; seu `AGENTS.md` é próprio e editável. Não insira um manifesto consumidor na base. O marcador de papel é da raiz de trabalho e não é exigido das bases Git remotas antigas usadas como fonte.
