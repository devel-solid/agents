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

## Recuperar uma sincronização

Este procedimento é executado no consumidor afetado, nunca na base:

```bash
agents validate --debug --offline --json
agents sync --dry-run
agents sync
# A recuperação termina sem gerar a próxima composição:
agents sync
agents sync --frozen --check
```

Uma operação normal prepara os documentos e metadados, salva os bytes anteriores e um journal e substitui cada arquivo. Só uma operação de escrita pode atuar na mesma raiz física. A propriedade durável marca a geração concluída. Há uma janela intermediária entre substituições: a transação é recuperável, mas não promete visibilidade atômica de todos os arquivos ao mesmo tempo.

Depois de uma interrupção, `validate --debug` informa o estado sem reparar. `sync --dry-run` mostra as ações registradas de rollback sem gravar; `sync` obtém acesso exclusivo, verifica a evidência, restaura o estado anterior e para. Outra execução faz a geração normal. Em um projeto somente local, a última checagem não precisa de lock remoto.

Se algum arquivo tiver uma edição independente após a interrupção, a recuperação preserva a edição e os backups e informa conflito. Compare o arquivo com os estados registrados e reconcilie-o com cuidado antes de repetir. Evidência ausente ou proprietário ambíguo exige reconciliação manual; um PID inexistente, isoladamente, não prova que o lock possa ser removido. Não apague `.cache/agents/` enquanto houver uma transação pendente e não tente resolver contenção apagando a exclusão de escrita.

O journal e os backups ficam separados dos checkouts descartáveis de conteúdo em `.cache/agents/`. Reparar um checkout não remove a evidência de recuperação. Backups são retidos enquanto necessários; depois da conclusão verificada, a limpeza pode terminar na próxima execução. Commit, lock remoto, ownership e documentos devem representar o mesmo estado revisado antes de trocar versões da ferramenta.

## Diagnósticos operacionais

Use `agents validate --debug --offline --json` para inspecionar proveniência e evidência local sem rede. `sync --check` retorna 1 para diferenças ou metadados ausentes, sem inicializá-los. `--frozen` rejeita lock ausente ou seleção alterada. Conflitos e pré-requisitos retornam 2; falhas operacionais, timeout e recuperação não concluída retornam 3. A saída JSON contém um único resultado estruturado; stderr do Git é capturado e credenciais são redigidas.

Git usa os acessos já configurados no ambiente, com limite padrão de 30000 ms por operação. Configure `AGENTS_GIT_TIMEOUT_MS` como inteiro de 1 a 300000 ms quando necessário. `GIT_TIMEOUT_CONFIG` identifica configuração inválida (saída 2); `GIT_TIMEOUT` identifica o limite excedido (saída 3). Um timeout encerra o Git e não publica resultados parciais. Falha de acesso exige corrigir o acesso Git à base configurada; não há fallback para o catálogo opcional desta ferramenta.

| Código | Próxima ação |
| --- | --- |
| `LOCK_REQUIRED` / `LOCK_MISMATCH` | Confira a seleção; inicialize ou adote o conteúdo por um sync normal revisado, sem `--frozen`. |
| `LOCK_SCHEMA` / `LOCK_RENDERER` | Restaure metadados válidos e use uma CLI compatível; não edite o contrato para suprimir o erro. |
| `CACHE_MISSING` / `CACHE_OFFLINE` / `CACHE_INTEGRITY` | Preserve recuperação pendente; use uma execução online para repor conteúdo no commit fixado. |
| `GIT_OPERATION` / `GIT_MISSING` | Confira Git no PATH, repository/ref e o acesso à base privada pelo Git existente. |

## Desenvolvimento

```bash
npm ci
npm run setup
npm run check
npm pack --pack-destination .tmp
```

`npm run build` limpa somente o diretório compilado dist, compila e copia os assets autorais. Testes usam repositórios e consumidores descartáveis; não alteram tags, histórico ou remotos da raiz. A publicação real é uma ação separada da implementação e da validação local.
