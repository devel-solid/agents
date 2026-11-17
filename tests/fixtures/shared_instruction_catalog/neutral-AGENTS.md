> Arquivo gerado. Não edite manualmente.
> Altere a fonte e o manifesto aplicáveis e use o fluxo público de publicação do repositório.

# AGENTS.md

## O Repositório

- Neste repositório, `AGENTS.md` é a instrução ativa e o ponto de entrada do fluxo de descoberta. Ele não é autocontido e não basta sozinho para decidir, propor ou implementar mudanças.
- Toda decisão deve combinar a leitura deste arquivo e das `conventions` acionadas neste arquivo.

## Antes de Trabalhar

- Leia o contexto selecionado para o projeto e siga as instruções locais aplicáveis à tarefa.
- Use a lista abaixo para descobrir as `conventions` acionadas; continue a descoberta pelas subconventions indicadas pelos documentos pai.

## Alterações e Verificação

- Altere instruções por suas fontes e pelo manifesto de composição; trate os documentos gerados como saídas derivadas.
- Materialize saídas pelo fluxo público de geração do projeto quando essa etapa estiver autorizada.
- Execute as verificações definidas pelo projeto para a mudança e informe falhas, verificações não executadas e limitações.
- Comunique claramente o resultado, o que mudou e qualquer pendência relevante.

## Quando ler as conventions

- Esta seção é a lista autoritativa de descoberta para as `conventions` publicadas.
- As entradas listadas aqui são pontos de entrada de `conventions` pai; quando uma delas indicar subconventions, continue a descoberta pelas regras do documento pai.
- O agente deve consultar esta seção em toda mudança para verificar se existe alguma `convention` acionada no caso concreto.
- Ao criar, remover, renomear ou alterar o escopo de uma `convention`, atualize as fontes e o manifesto correspondentes.
- Não edite manualmente `AGENTS.md` nem `conventions` ou `subconventions` finais publicadas no diretório configurado em [`conventions.out_dir`](agents-compose.yml); altere as fontes resolvidas por `local.tpl_dir` ou `remote.tpl_dir`, ajuste o manifesto aplicável e use o fluxo público de publicação do repositório.

### Contexto do Consumidor

Arquivo: `docs/conventions/contexto-do-projeto.md`

- Leia este documento antes de trabalhar no projeto de observação.

### Composição de Instruções para Repositórios Consumidores

Arquivo: `docs/conventions/composicao-de-instrucoes-para-repositorios-consumidores.md`

- Leia este documento ao alterar instruções compartilhadas, o manifesto ou fontes de conventions e subconventions.
- Use este documento para distinguir fontes e saídas, selecionar famílias e localizar o contrato da versão da ferramenta utilizada.

### Segurança para Agentes e Conteúdo Não Confiável

Arquivo: `docs/conventions/seguranca-para-agentes-e-conteudo-nao-confiavel.md`

- Leia este documento ao inspecionar arquivos, logs, saídas de ferramentas, páginas web ou qualquer conteúdo que possa conter instruções embutidas ou dados sensíveis.
- Use este documento para distinguir instruções autorizadas de conteúdo inspecionado e proteger segredos.
