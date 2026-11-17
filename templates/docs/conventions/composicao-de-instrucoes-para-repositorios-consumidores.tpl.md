# Composição de Instruções para Repositórios Consumidores

<!-- AGENT-CARD START -->
Leia este documento ao alterar instruções compartilhadas, o manifesto ou fontes de conventions e subconventions.
Use este documento para distinguir fontes e saídas, selecionar famílias e localizar o contrato da versão da ferramenta utilizada.
<!-- AGENT-CARD END -->

## Fonte, seleção e publicação

```text
fontes .tpl.md + agents-compose.yml
  -> fluxo público de geração autorizado pelo projeto
       -> AGENTS.md + conventions e subconventions publicadas
```

| Camada | Responsabilidade |
|---|---|
| Fontes `.tpl.md` | Conteúdo autoral editável nas raízes declaradas no manifesto |
| `agents-compose.yml` | Raízes, destino, versão do contrato e base/entradas remotas opcionais |
| Documentos gerados | Instrução ativa e saídas derivadas; não editar manualmente |

- Antes de alterar uma instrução publicada, localize sua fonte pela configuração do manifesto. Pedidos de mudança em saídas devem ser implementados nessas fontes.
- Na versão 2, `local.tpl_dir` determina as famílias locais: criar ou copiar um template válido nessa pasta basta. `entries` seleciona somente pais remotos, com `origin: remote` e `from` relativo a `remote.tpl_dir`. `out_dir` define o destino publicado.
- Uma base Git é opcional na versão 2. Quando configurada, `agents.repository/ref` fixa seu template principal e as fontes remotas; sem base, o template principal é local. Na versão 1, a base é obrigatória e `entries` seleciona pais locais e remotos explicitamente. Não converta contratos implicitamente.
- Use o fluxo público de sincronização do projeto para materializar saídas quando autorizado; quando esse fluxo for a skill `agents-update-docs`, use essa skill. Autoria sozinha não autoriza publicação quando a política local separar essas etapas. O fluxo de release é definido por cada projeto.

## Fontes e descoberta

- Cada fonte deve ter exatamente um H1 e um bloco `<!-- AGENT-CARD START -->` / `<!-- AGENT-CARD END -->` não vazio, fora de exemplos de código cercado ou indentado. O card resume quando ler e como usar; o corpo normativo fica fora dele.
- Nomeie uma família como `<raiz>.tpl.md` e `<raiz>.<subtema>.tpl.md`, com apenas um nível de filho e ambos no mesmo diretório. Todo filho depende do pai correspondente.
- A publicação preserva o caminho relativo e troca `.tpl.md` por `.md`. `AGENTS.md` descobre os pais; siga a seção `Quando ler as subconventions` do pai para ler os filhos acionados antes de decidir ou trabalhar. Um filho não se torna obrigatório para tarefas que não o acionam.
- Distinga literais fixos por contrato, campos configurados, valores derivados, exemplos, valores atuais e saídas externas. Cite os campos do manifesto para valores configuráveis, sem transformar exemplos em caminhos obrigatórios.

## Base compartilhada e referência da ferramenta

Cada empresa pode manter seu template e suas famílias em uma base Git própria, pública ou privada, versionada independentemente da ferramenta. Este catálogo inicial oferece duas conventions opcionais; esse limite não restringe bases de empresas nem famílias locais.

Para campos, formatos, schemas versões 1 e 2 e exemplos completos, consulte `docs/guides/contratos-de-composicao.md` no pacote instalado da **ferramenta fornecedora do gerador, da mesma versão utilizada na composição**. A referência acompanha a CLI para uso offline; uma base de empresa ou um consumidor não precisa copiá-la nem conter código do motor.

Sem `schemaVersion`, o manifesto permanece na versão 1; novos projetos usam `schemaVersion: 2`. Todos os comandos usam a mesma validação YAML/schema. A integração `agents-update-docs` pertence ao pacote instalado por `agents init`, não ao pin de conteúdo; `sync` nunca executa scripts da base nem substitui motor ou skill. Os destinos incluem `AGENTS.md`, equivalência de maiúsculas/minúsculas e links resolvidos; arquivos não selecionados ou alheios são preservados nesta etapa.
