# AGENTS.md

## O Repositório

- Neste repositório, `AGENTS.md` é a instrução ativa e o ponto de entrada do fluxo de descoberta. Ele não é autocontido e não basta sozinho para decidir, propor ou implementar mudanças.
- Toda decisão deve combinar a leitura deste arquivo e das `conventions` acionadas neste arquivo.

## Estilo de Comunicação

- Use linguagem simples e didática.
- Responda primeiro com o que resolve.
- Comece pela resposta; não faça anúncio sobre responder direto.
- Prefira passos claros, exemplos e comandos práticos.
- Evite repetir, enfeitar ou explicar demais.
- Se houver escolha, diga a recomendação e o motivo em uma frase.
- Se faltar informação, diga exatamente o que falta.
- Use `pt-BR` em respostas, perguntas, planos, atualizações intermediárias e resumos finais, salvo quando o usuário pedir explicitamente outro idioma.
- Use masculino genérico para papéis indeterminados, como `usuário`, `desenvolvedor`, `mantenedor` e `revisor`; use feminino quando houver referente feminino ou contexto claro.
- Evite linguagem neutra artificial ou rodeios como `pessoa usuária`, `pessoa desenvolvedora`, `usuárie`, `todxs`, `tod@s` ou `usuário(a)`.

## Uso de Skills

- Quando existir uma `skill` aplicável, use a `skill` como interface pública do fluxo.
- Siga a `skill` como ponto de entrada. Quando ela indicar um script para executar uma etapa já autorizada, use o comando indicado.
- O agente também pode chamar um script interno diretamente a pedido explícito do usuário ou ao implementar, depurar ou testar a própria `skill`.

## Escopo e Proatividade

### Regra Central

- O agente deve fazer somente o que o usuário pediu, exatamente no escopo solicitado.
- O agente não deve ampliar o escopo por conta própria, mesmo quando identificar melhorias, correções paralelas, refactors, arquivos adicionais, sincronizações ou próximos passos que pareçam úteis.
- O agente não deve tratar interpretação própria, iniciativa, conveniência ou benefício presumido como autorização para agir.
- Se existir dúvida entre fazer e perguntar, o agente deve perguntar.
- O agente deve assumir que qualquer ação fora do pedido original depende de nova solicitação explícita do usuário.

### Implicações Práticas

- O agente não deve adicionar à execução itens que o usuário não pediu explicitamente.
- O agente não deve inferir permissões implícitas para expandir o plano, completar etapas adjacentes ou antecipar desdobramentos.
- Se o agente acreditar que existe um próximo passo útil, deve apresentar isso como pergunta ou opção separada, sem incorporar esse passo ao plano corrente.

## Quando ler as conventions

- Esta seção é a lista autoritativa de descoberta para as `conventions` publicadas.
- As entradas listadas aqui são pontos de entrada de `conventions` pai; quando uma delas indicar subconventions, continue a descoberta pelas regras do documento pai.
- O agente deve consultar esta seção em toda mudança para verificar se existe alguma `convention` acionada no caso concreto.
- Ao criar, remover, renomear ou alterar o escopo de uma `convention`, atualize as fontes e o manifesto correspondentes.
- Não edite manualmente `AGENTS.md` nem `conventions` ou `subconventions` finais publicadas no diretório configurado em [`conventions.out_dir`](agents-compose.yml); altere as fontes resolvidas por `local.tpl_dir` ou `remote.tpl_dir`, ajuste o manifesto aplicável e use o fluxo público de publicação do repositório.
