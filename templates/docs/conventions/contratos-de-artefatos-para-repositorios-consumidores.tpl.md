# Contratos de Artefatos para Repositórios Consumidores

<!-- AGENT-CARD START -->
Leia este documento ao criar, revisar ou ajustar `agents-compose.yml`, `conventions` ou `subconventions` em um repositório consumidor.
Use este documento como ponto de entrada para o contrato público dos artefatos locais que participam da composição das instruções compartilhadas.
<!-- AGENT-CARD END -->

Este documento é o ponto de entrada para o tema de contratos de artefatos em repositórios consumidores.

## Propósito e escopo

- Esta `convention` reúne orientações públicas sobre os artefatos locais que entram na composição das instruções compartilhadas.
- Use este documento quando a dúvida for como criar ou revisar `agents-compose.yml`, `conventions`-fonte ou `subconventions`-fonte válidos.
- Use este documento para separar o contrato autoral público dos detalhes internos do fluxo de publicação.
- Quando a dúvida for sobre qual arquivo editar, fonte de verdade ou artefato final publicado, leia primeiro a `convention` de composição das instruções para repositórios consumidores.

## Papel desta família

```text
artefatos locais de composição
├── agents-compose.yml
├── convention-fonte
└── subconvention-fonte
     |
     +-> entram no fluxo de composição/publicação
```

- A `convention` de composição explica como interpretar fonte, manifesto e artefatos publicados.
- Esta família explica como estruturar os artefatos locais que participam desse fluxo.
- As subconventions publicadas a partir deste documento detalham o manifesto, a estrutura mínima dos arquivos-fonte e a relação entre `convention` pai e `subconvention` filha.
