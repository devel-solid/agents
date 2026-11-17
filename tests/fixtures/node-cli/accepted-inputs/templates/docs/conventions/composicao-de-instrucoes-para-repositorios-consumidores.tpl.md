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
| `agents-compose.yml` | Base e ref fixadas, raízes, destino e entradas selecionadas |
| Documentos gerados | Instrução ativa e saídas derivadas; não editar manualmente |

- Antes de alterar uma instrução publicada, localize sua fonte e a entrada do manifesto. Pedidos de mudança em saídas devem ser implementados nessas fontes e seleções.
- O manifesto fixa a base em `agents.repository/ref`. Em `outputs.AGENTS.md.include.conventions`, `local.tpl_dir` e `remote.tpl_dir` resolvem as fontes locais e da base fixada; `out_dir` define o destino publicado.
- Cada item de `entries` usa `origin: local` ou `origin: remote` e `from` relativo à raiz correspondente. Registre apenas o pai; inclusão, remoção, ordem e origem pertencem ao manifesto.
- Use o fluxo público de sincronização do projeto para materializar saídas quando autorizado; quando esse fluxo for a skill `update-docs`, use essa skill. Autoria sozinha não autoriza publicação quando a política local separar essas etapas. O fluxo de release é definido por cada projeto.

## Fontes e descoberta

- Cada fonte deve ter exatamente um H1 e um bloco `<!-- AGENT-CARD START -->` / `<!-- AGENT-CARD END -->` não vazio. O card resume quando ler e como usar; o corpo normativo fica fora dele.
- Nomeie uma família como `<raiz>.tpl.md` e `<raiz>.<subtema>.tpl.md`, com apenas um nível de filho e ambos no mesmo diretório. Todo filho depende do pai correspondente.
- A publicação preserva o caminho relativo e troca `.tpl.md` por `.md`. `AGENTS.md` descobre os pais; siga a seção `Quando ler as subconventions` do pai para ler os filhos acionados antes de decidir ou trabalhar. Um filho não se torna obrigatório para tarefas que não o acionam.
- Distinga literais fixos por contrato, campos configurados, valores derivados, exemplos, valores atuais e saídas externas. Cite os campos do manifesto para valores configuráveis, sem transformar exemplos em caminhos obrigatórios.

## Base compartilhada e referência da ferramenta

Cada empresa pode manter seu template e suas famílias em uma base Git própria, pública ou privada, versionada independentemente da ferramenta. Este catálogo inicial oferece duas conventions opcionais; esse limite não restringe bases de empresas nem famílias locais.

Para campos, formatos e exemplos completos, consulte `docs/guides/contratos-de-composicao.md` no checkout da **ferramenta fornecedora do gerador, da mesma versão utilizada na composição**. Neste estágio Python, nossa base e a ferramenta vêm do mesmo checkout fixado por `agents.repository/ref`; consulte o guia nesse checkout, não a revisão mais recente por padrão. Uma base de empresa ou um consumidor não precisa conter esse guia nem o código do motor. A referência pertence à ferramenta; sua distribuição independente acompanha a etapa de CLI.
