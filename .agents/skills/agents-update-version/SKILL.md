---
name: agents-update-version
description: Planeja e executa o versionamento de uma base de instruções com a CLI instalada, justificando o tipo de aumento e exigindo confirmação do plano antes de criar a tag ou publicar alterações.
---

# Versionar uma base de instruções

Use esta skill para pedidos de preparação ou criação de uma versão da base. O agente avalia o impacto e apresenta o plano. A CLI calcula o número, valida a base e cria somente a tag local. A publicação remota depende do pedido e do plano aprovado.

## Instalação e localização

O pacote da CLI fornece esta skill. `agents init --base` instala seus arquivos em `[repo-root]/.agents/skills/agents-update-version/` na própria base, sem cópia manual ou acesso ao Git remoto. Uma cópia idêntica é preservada; personalizações ou arquivos extras geram conflito antes de qualquer escrita. `init --base --dry-run` mostra a instalação prevista sem criar arquivos ou diretórios. Ambos os modos de init instalam também `agents-write-conventions` para autoria e curadoria. O init comum instala `agents-update-docs` no consumidor, sem instalar esta skill de versão.

## Escopo e pré-requisitos

- Trabalhe na raiz Git da base, indicada por `[repo-root]`. Respeite a branch de publicação definida pelas instruções locais da base; esta skill não impõe um nome de branch.
- Use a CLI já instalada. Se ela for local por npm, use o prefixo `npm exec --no -- agents`. Não instale nem atualize a ferramenta como parte do versionamento.
- Confirme o suporte a `release --bump` e `--dry-run` pelo help da versão instalada quando ainda não for conhecido. Se faltar suporte, informe a incompatibilidade e pare, sem substituir o fluxo por operações manuais.
- Antes da confirmação do plano, faça somente inspeção local e prévias. A base precisa ter um commit e estar limpa, incluindo arquivos não rastreados. Informe o que impede o versionamento; não faça commit nem descarte alterações para resolver isso por conta própria.
- Se houver `[repo-root]/agents-compose.yml`, informe o conflito de papel e não versione essa raiz. A CLI usa as tags SemVer alcançáveis a partir de `HEAD`, com comparação numérica; pins de consumidores não entram nesse cálculo.

Esta skill opera somente em uma base inicializada, identificada por `[repo-root]/.agents/base.json`, sem manifesto consumidor. O `[repo-root]/AGENTS.md` da base é editável e não participa de geração. Consumidores adotam versões em projetos separados, fora deste workflow.

## Inspecionar e escolher o tipo de aumento

1. Confira branch, `HEAD`, estado e histórico locais. Valide o catálogo com `agents validate --base` quando precisar investigar suas fontes.
2. Obtenha o baseline pela prévia JSON da CLI. Uma consulta inicial com `patch` serve apenas para ler `baselineTag`, `currentVersion` e `head`; ela não decide o aumento definitivo:

```bash
agents release --bump patch --dry-run --json
```

3. Leia as mudanças entre o commit identificado por `baselineTag` e o `head` informado. Se `baselineTag` for nulo, avalie o conteúdo completo do primeiro lançamento. Não classifique apenas o último commit nem o intervalo entre a branch local e o remoto.
4. Escolha e justifique o tipo pelo impacto real nos consumidores:
   - `major`: mudança incompatível de contrato, geração, formato ou conteúdo publicado.
   - `minor`: capacidade ou regra adicional compatível com o contrato existente.
   - `patch`: correção compatível, incluindo texto, exemplos e bugs sem quebra de contrato.
5. Repita a prévia com o tipo escolhido. `minor` abaixo é um exemplo, não uma escolha fixa:

```bash
agents release --bump minor --dry-run --json
```

A CLI retorna o baseline, o próximo número e o commit. Sem tag anterior, calcula a partir de `v0.0.0`; o usuário não precisa informar versões ou SHAs. Só tags estáveis locais que alcançam `HEAD` participam. A prévia não consulta o remoto nem reserva um número.

## Apresentar o plano e aguardar confirmação

Antes de criar a tag, alterar arquivos ou acessar o remoto, apresente:

- Versão calculada, tipo de aumento e motivo da classificação.
- Commit de origem e branch esperados.
- Efeito padrão: criar uma tag local nesse commit, preservando os arquivos.
- A publicação da tag somente quando solicitada, com o remoto e a tag exatos. Alteração de pins e geração de documentos consumidores não pertencem a este workflow.
- O destino remoto e os recursos afetados pelos efeitos de publicação aprovados.

A skill exige confirmação explícita desse plano. Um pedido só de prévia termina aqui, sem criar tag. Não altere pins nem gere documentos consumidores neste workflow. Não inclua push, commits ou publicação npm que não façam parte do pedido. Não edite o histórico nem recomponha commits manuais do usuário.

## Executar o plano confirmado

1. Refaça a prévia com o mesmo tipo e confira branch, estado, `head` e `nextVersion` contra o plano aprovado. Se qualquer um mudar, pare e apresente um novo plano para confirmação.
2. Se o plano incluir publicação remota, confira o destino e a disponibilidade da tag antes da criação. Uma consulta ou atualização do remoto que mude o plano exige nova confirmação. O comando local não garante exclusividade de uma tag no remoto.
3. Crie a tag pela CLI, usando o tipo aprovado. Exemplo:

```bash
agents release --bump minor --json
```

4. Confira que a tag e o commit retornados correspondem ao plano. Em divergência, interrompa as etapas seguintes e relate o estado; não remova nem substitua tags automaticamente.
5. Se o plano autorizar, envie apenas a tag aprovada ao remoto e confirme que aponta para o commit correto. Não trate a tag local como uma publicação já concluída.

A execução padrão de `release` não altera fontes, manifesto, documentos ou versão npm; não cria commits nem faz fetch/push. A base não consome instruções, nem de si própria nem de outra base. A distribuição de uma versão da CLI no npm é uma operação adicional, com seu próprio fluxo e autorização.

## Encerrar com evidências

Relate a versão, o motivo do aumento, o commit e a tag realmente criada. Diferencie prévia, tag local e publicação remota verificada. Liste arquivos e verificações apenas quando tiverem sido alterados ou executados. Em falha ou interrupção, informe o estado observado e não repita uma ação de publicação sem conferir o resultado anterior.

