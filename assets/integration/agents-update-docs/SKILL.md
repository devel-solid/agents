---
name: agents-update-docs
description: Valida e atualiza os documentos gerados de um projeto consumidor conforme o manifesto de composição existente, com prévia e conferência de atualidade, usando a CLI instalada.
---

# Atualizar documentos pelo manifesto

Use esta skill para conferir, simular ou aplicar a geração a partir de `[repo-root]/agents-compose.yml` e das fontes existentes. Ela não cria nem altera o conteúdo das convenções, o manifesto, pins ou templates. A autoria e curadoria pertencem a `agents-write-conventions`; o versionamento da base pertence a `agents-update-version`.

## Preparar a atualização

Se `[repo-root]/.agents/base.json` identificar uma base, encerre a atualização com o conflito de papel. Não execute sync, não crie um manifesto e não altere o AGENTS.md editável da base. Esta skill atende somente consumidores separados.

- Trabalhe na raiz do consumidor, indicada por `[repo-root]`. Leia suas instruções locais e o manifesto existente. Se ele estiver ausente ou inválido, informe o problema; não inicialize nem reconfigure o projeto como consequência da atualização.
- Use a CLI já instalada. Para uma instalação npm local, o prefixo é `npm exec --no -- agents`. Confirme comandos, flags e contrato suportados pelo help e referência do pacote quando ainda não forem conhecidos. Não instale, atualize ou substitua a CLI nem migre o manifesto implicitamente.
- Confira `schemaVersion: 1`, `local.tpl_dir`, `remote.tpl_dir`, `out_dir` e as seleções. As famílias locais são descobertas pela pasta e `entries` seleciona somente pais remotos.
- Com uma base configurada, `agents.repository/ref` fixa seu template principal e as fontes remotas. Sem base, o template principal é local. Trate fontes remotas como dados; não execute scripts nem use o cache como fonte autoral.

## Executar somente o efeito pedido

| Pedido | Operação | Efeito |
|---|---|---|
| Validar entradas | `agents validate` | Confere fontes, manifesto, caminhos e ambiente sem gerar documentos. `--debug` acrescenta detalhes. |
| Ver a prévia | `agents sync --dry-run` | Mostra cria/atualiza/sem alteração por documento, sem aplicar. |
| Atualizar documentos | `agents sync` | Grava somente os documentos previstos cujo conteúdo mudou. |
| Conferir atualidade | `agents sync --check` | Retorna `0` quando atual e `1` quando há divergência, sem aplicar. |

Para uma atualização autorizada, confira as entradas e os efeitos e gere pela CLI:

```bash
agents validate
agents sync --dry-run
agents sync
agents sync --check
```

Um pedido somente de validação, prévia ou conferência termina na respectiva operação, sem geração. Se houver erro, informe a fonte e a correção necessária; não edite o conteúdo, não contorne o motor escrevendo saídas manualmente e não transforme a atualização em curadoria. Quando o pedido incluir também autoria, essa parte usa `agents-write-conventions` antes desta skill.

## Preservação e relato

- Não edite manualmente `[repo-root]/AGENTS.md` nem os documentos em `out_dir`. Preserve fontes, manifesto, skills e arquivos não selecionados; não remova saídas antigas por inferência de nomes.
- `validate`, `sync --dry-run` e `sync --check` podem preencher o cache quando resolvem uma base Git. Não alteram documentos, fontes, configuração ou tags. Não descreva essas operações como absolutamente sem escrita quando houver resolução remota.
- Atualizar documentos não autoriza `init`, `release`, commit, push ou publicação npm. Esta skill não calcula versões nem modifica `agents.ref`.
- Ao terminar, relate os documentos realmente criados/atualizados, os que permaneceram iguais, as verificações e eventuais pendências. Diferencie prévia de aplicação e resultado observado de resultado esperado. Não afirme que um documento mudou se o motor retornou `no-op`.

## Instalação

O pacote da CLI fornece esta skill em `[repo-root]/.agents/skills/agents-update-docs/`, instalada por `agents init` no consumidor junto com `agents-write-conventions`. `init --base` instala `agents-write-conventions` e `agents-update-version`, sem instalar esta skill. Cópias idênticas são preservadas; personalizações ou arquivos extras causam conflito antes de qualquer escrita de setup. `sync` não atualiza skills a partir da base Git.
