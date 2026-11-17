# Manutenção e versionamento

A CLI tem quatro comandos públicos: `init`, `validate`, `sync` e `release`. As skills autorais deste projeto são `agents-write-conventions`, `agents-update-docs` e `agents-update-version`, mantidas em `.agents/skills/`.

## Base de instruções

```bash
agents init --base
# Edite templates/AGENTS.tpl.md e o catálogo templates/docs/conventions/.
agents validate --base
```

A base recebe seu `AGENTS.md` simples e editável, a identificação `.agents/base.json` e um catálogo inicialmente vazio. Também recebe `agents-write-conventions` e `agents-update-version` em `.agents/skills/` do pacote CLI. Não é preciso copiar a skill manualmente. `agents init --base --starter minimal` copia duas fontes de exemplo opcionais. Os autores criam ou copiam outras famílias diretamente no catálogo; cada pai tem seu H1, bloco AGENT-CARD e corpo. A base não precisa de manifesto consumidor, package.json ou scripts do motor.

## Criar uma versão local

Mantenha a base na raiz de um repositório Git com suas fontes commitadas e sem alterações pendentes:

```bash
agents release --bump minor --dry-run
agents release --bump minor
```

A CLI calcula a partir da maior tag estável alcançável do HEAD, com ordenação numérica. Aceita tags leves e anotadas como baseline e ignora versões de branches não alcançáveis. Sem tag anterior, parte de `v0.0.0`. O aumento é patch, minor ou major; não se informa a versão atual ou futura.

A prévia faz as mesmas conferências e não grava arquivos, tags ou cache nem consulta rede. A aplicação recalcula e revalida o estado antes de criar uma tag local sem force. Fontes ignoradas fora do commit, conteúdo inválido, mudanças pendentes e conflitos de tag impedem a operação. Uma prévia não reserva seu número.

O comando preserva fontes, manifesto, documentos e versões npm. Ele não cria commits nem publica no remoto. Esses efeitos têm autorizações distintas.

## Skill do mantenedor

`agents-update-version`, instalada na base por `init --base`, lê o impacto das mudanças, justifica o tipo de aumento, obtém a prévia da CLI e apresenta um plano. Exige confirmação antes de criar a tag ou executar efeitos adicionais. Se o commit, a versão ou o escopo mudar, solicita aprovação de um plano atualizado. A branch de publicação vem da política local da base.

A prévia de init inclui o caminho da skill sem gravar arquivos. Uma instalação repetida preserva bytes e timestamps idênticos. Conteúdo personalizado ou arquivos extras na skill causam conflito antes de qualquer escrita. O consumidor recebe `agents-write-conventions` e `agents-update-docs` pelo init comum. Base e consumidor são papéis exclusivos: inicialização cruzada, manifesto consumidor na base e sync na base são rejeitados antes de qualquer escrita.

Se o plano incluir publicar a tag, a skill verifica o remoto e confirma o resultado. Ela não altera pins nem gera documentos consumidores. A adoção da tag é um trabalho separado no projeto consumidor. Publicar npm é uma operação independente, não um efeito implícito do release.

`agents-write-conventions` cuida da autoria e curadoria na base e no consumidor: regras acionáveis, exemplos válidos, escopo e coerência entre convenções. Não gera documentos nem versiona implicitamente. `agents-update-docs` apenas valida e atualiza os documentos conforme o manifesto existente, sem editar conteúdo ou configuração. O empacotamento copia as três fontes autorais para `assets/integration/<nome>/`; `sync` não as substitui por código do pin remoto.

## Instruções da própria base

O `AGENTS.md` da raiz é um arquivo autoral, preservado pela CLI. O `templates/AGENTS.tpl.md` e o catálogo são fontes destinadas a outros projetos. `validate --base` e `release` exigem uma base inicializada, com identificação válida e sem manifesto consumidor. Não execute sync para atualizar as instruções desta raiz.

Este repositório usa esse mesmo modelo, com uma seção curta de desenvolvimento da CLI. As fontes locais e saídas do antigo autoconsumo foram retiradas; as fixtures históricas permanecem isoladas nos testes.

## Desenvolvimento

```bash
npm ci
npm run setup
npm run check
npm pack --pack-destination .tmp
```

`npm run build` limpa somente o diretório compilado dist, compila e copia os assets autorais. Testes usam repositórios e consumidores descartáveis; não alteram tags, histórico ou remotos da raiz. A publicação real é uma ação separada da implementação e da validação local.
