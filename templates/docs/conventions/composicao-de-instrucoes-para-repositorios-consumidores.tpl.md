# Composição de Instruções para Repositórios Consumidores

<!-- AGENT-CARD START -->
Leia este documento ao alterar instruções compartilhadas em um repositório consumidor.
Use este documento para distinguir fonte de verdade, manifesto de composição e artefatos finais publicados.
<!-- AGENT-CARD END -->

Este documento explica como um repositório consumidor deve interpretar a composição entre arquivos-fonte, manifesto de composição e artefatos finais publicados. Antes de alterar uma `convention` ou `subconvention`, identifique se o alvo citado é fonte, manifesto ou artefato publicado.

## Modelo de composição

```text
arquivos-fonte + manifesto de composição
  |
  +-> fluxo público de sincronização/publicação
        |
        +-> AGENTS.md
        +-> <conventions.out_dir>/<convention>.md
        +-> <conventions.out_dir>/<convention>.<subconvention>.md
```

## Papéis de cada camada

| Camada | Papel | Edição manual |
|---|---|---|
| arquivos-fonte | definem o conteúdo autoral em arquivos `.tpl.md` mantidos pelo repositório | permitida quando o pedido for alterar o conteúdo autoral |
| manifesto de composição | declara quais entradas participam da publicação final | permitida quando o pedido exigir incluir, remover, renomear, reordenar ou trocar a origem de entradas |
| `AGENTS.md` publicado | instrução ativa derivada da composição | proibida |
| `conventions` e `subconventions` finais publicadas | documentação normativa derivada da composição | proibida |

## Regra central

- Comece toda mudança em `conventions` identificando se o alvo é fonte, manifesto ou artefato final publicado.
- Faça alterações autorais nos arquivos-fonte `.tpl.md` aplicáveis.
- Faça mudanças de inclusão, remoção, renomeação, reordenação ou origem no manifesto de composição aplicável.
- Trate `AGENTS.md`, `conventions` finais e `subconventions` finais como saídas derivadas.
- Não edite manualmente esses arquivos publicados para refletir mudanças em `conventions`, mesmo quando a mudança parecer pequena ou localizada.
- Se a pessoa pedir alteração em um arquivo final publicado, interprete esse pedido como mudança na fonte ou no manifesto aplicáveis.
- Quando a dúvida for sobre qual arquivo mexer, descubra primeiro se o pedido altera conteúdo autoral ou a composição da publicação.

## Como aplicar uma mudança

1. Identifique se o alvo citado pela pessoa é fonte, manifesto ou artefato final publicado.
2. Se o alvo for um artefato final publicado, localize a fonte correspondente e o manifesto que o inclui na publicação.
3. Edite apenas a fonte e o manifesto que realmente precisam mudar.
4. Se for necessário materializar artefatos publicados, use o fluxo público de sincronização/publicação configurado no repositório.
5. Se o pedido cobrir apenas autoria e a política local separar autoria de publicação, conclua a autoria e informe qual fluxo público deve publicar ou sincronizar os artefatos depois. Não execute publicação ou sincronização fora do escopo autorizado.

## Fluxo público de sincronização/publicação

- A materialização de `AGENTS.md` e dos artefatos publicados em `conventions.out_dir` no manifesto `agents-compose.yml` deve usar o fluxo público configurado no repositório.
- Quando a skill `update-docs` for esse fluxo público no consumidor, use a skill `update-docs`.
- Execute os passos da skill escolhida para concluir a geração local dentro do escopo pedido.
- No repositório `agents`, a distribuição das fontes compartilhadas aos consumidores segue o fluxo de release da skill `update-version`.

## Sinais de interpretação correta

- Pedido para alterar texto normativo de uma `convention` publicada: muda a fonte correspondente, não o arquivo final.
- Pedido para adicionar, remover, renomear ou reordenar uma `convention` publicada: muda o manifesto de composição aplicável.
- Pedido para corrigir `AGENTS.md` publicado: verifica se a correção nasce em template-base, em fonte publicada ou no manifesto que controla a lista de `conventions`.
- Pedido para publicar ou sincronizar artefatos derivados: usa o fluxo público local, não edição manual dos arquivos finais.

## O que evitar

- Tratar arquivo publicado como fonte de verdade só porque ele é o arquivo aberto no editor.
- Corrigir `AGENTS.md` final diretamente para "ganhar tempo".
- Alterar `subconventions` finais publicadas como se fossem independentes da `convention` pai.
- Pular o fluxo público de sincronização/publicação depois de ajustar a fonte ou o manifesto.
- Usar o fluxo de release para uma mudança pedida apenas no checkout local.
