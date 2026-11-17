# Contratos de Composição

Referência pública do manifesto versão 1 e dos templates aceitos pela CLI instalada. A base Git fornece somente conteúdo; o motor e a integração vêm do pacote CLI.

## Fonte, manifesto e documentos

```text
templates .tpl.md + agents-compose.yml
  |
  +-> validate: conferir estrutura e pré-requisitos
  +-> sync --dry-run: mostrar o plano
  +-> sync: gerar AGENTS.md e documentos .md
```

Edite o conteúdo nas fontes e a configuração no manifesto. Os documentos gerados não devem ser editados manualmente. A CLI preserva fontes, manifesto e integração durante a geração.

## Schema v1: começar localmente

Este é um manifesto completo, sem uma base Git obrigatória:

```yaml
schemaVersion: 1
outputs:
  AGENTS.md:
    include:
      conventions:
        out_dir: docs/conventions
        local:
          tpl_dir: templates/docs/conventions-local
        remote:
          tpl_dir: templates/docs/conventions
        entries: []
```

- `local.tpl_dir`: todos os pais `.tpl.md` válidos dessa pasta, incluindo subpastas, entram com seus filhos. Criar ou copiar um arquivo basta; `entries` não aceita entradas locais.
- `out_dir`: os documentos preservam o caminho relativo, trocando `.tpl.md` por `.md`. `AGENTS.md` é gerado na raiz.
- Sem base, o template principal é `templates/AGENTS.tpl.md` do consumidor.
- `remote.tpl_dir`: raiz do catálogo dentro de uma base Git, quando ela for configurada. A seleção remota permanece explícita.

Para consumir conteúdo compartilhado, acrescente um bloco `agents` e as entradas remotas. Exemplo de configuração, com endereço e versão ilustrativos:

```yaml
schemaVersion: 1
agents:
  repository: https://git.example.com/equipe/instrucoes.git
  ref: v1.0.0
outputs:
  AGENTS.md:
    include:
      conventions:
        out_dir: docs/conventions
        local: { tpl_dir: templates/docs/conventions-local }
        remote: { tpl_dir: templates/docs/conventions }
        entries:
          - origin: remote
            from: commits.tpl.md
```

Com uma base configurada, seu template principal e as regras remotas vêm do checkout fixado. Os templates locais continuam sendo descobertos pela pasta. A CLI não seleciona todo o catálogo remoto automaticamente e não executa scripts dele. Para trocar a versão consumida, edite `agents.ref`, revise com `sync --dry-run` e gere com `sync`.

## Um único contrato

Declare `schemaVersion: 1`. Versão ausente, diferente de 1 ou entradas com `origin: local` são inválidas. Fontes locais são descobertas pela pasta; uma base é opcional e passa a ser obrigatória quando há entradas remotas. Não há suporte a formatos privados anteriores nem conversão automática.

O schema `schemas/agents-compose.v1.schema.json` acompanha o pacote e é usado sem download. YAML deve conter um único documento UTF-8, sem chaves duplicadas, campos desconhecidos ou aliases excessivos. Erros identificam campo e localização.

## Template de convenção completo

`commits.tpl.md`, criado com o editor ou copiado para a pasta configurada:

```markdown
# Mensagens de commit

<!-- AGENT-CARD START -->
Leia ao criar ou revisar um commit.
<!-- AGENT-CARD END -->

Use Conventional Commits.
Formato: tipo: descrição da alteração.
Descreva a mudança feita neste commit.
```

O bloco `AGENT-CARD` alimenta a descoberta em `AGENTS.md`. O corpo da regra vira `commits.md`, com aviso de documento gerado. As mensagens de commit variam conforme a mudança; o formato não obriga uma mensagem literal fixa.

Um pai `politica.tpl.md` pode ter filhos como `politica.detalhes.tpl.md` na mesma pasta. Seleciona-se o pai; seus filhos são validados e publicados junto da família. Um filho sem pai é erro. Cada fonte tem exatamente um H1 e um bloco de leitura completo e não vazio. Pais locais são ordenados por caminho normalizado portável; famílias remotas seguem a ordem declarada.

## Validação e proteção de arquivos

Nomes, caminhos relativos, aliases, colisões portáveis e destinos reservados são validados antes da geração. Equivalência de caixa, escapes por links, destinos sobrepostos e hardlinks de saída não permitem sobrescrever arquivos alheios. A publicação mantém a relação pai/filhos e identifica todos os documentos gerados.

A remoção de uma fonte muda a composição esperada, mas a CLI preserva saídas antigas fora dela. Não apague arquivos por inferência de nomes. Repetir uma geração sem mudanças preserva bytes e timestamps.

## Prévia e efeitos

| Operação | Resultado | Escrita |
| --- | --- | --- |
| `init --dry-run` | Caminhos a criar/preservar ou conflitos | Nenhuma. |
| `validate` | Estrutura, configuração e ambiente | Nenhuma escrita de projeto; pode preencher cache Git. |
| `sync --dry-run` | Creates, updates e no-ops previstos | Preserva documentos e configuração; pode preencher cache Git. |
| `sync --check` | Atualidade dos documentos | Mesmo limite da prévia; retorna 0 atual ou 1 divergente. |
| `sync` | Geração dos documentos previstos | Grava somente saídas alteradas e seguras. |
| `release --bump minor --dry-run` | Baseline, próxima tag e HEAD | Nenhuma escrita ou consulta de rede. |
| `release --bump minor` | Tag local no HEAD | Cria somente a tag calculada. |

Resultados JSON usam `{schemaVersion: 1, command, ok, changes, diagnostics, result}`; a versão desse envelope é independente da versão do manifesto. `result.mode` e `applied` distinguem prévia, checagem e aplicação. Saídas: 0 sucesso; 1 divergência no check; 2 uso/validação/conflito; 3 falha operacional. Detalhes técnicos exigem `--debug`; URLs com credenciais são redigidas.

## Integração do agente

`init` instala `.agents/skills/agents-write-conventions/` e `.agents/skills/agents-update-docs/` a partir do pacote CLI. A primeira orienta a autoria e curadoria das regras; a segunda somente valida e atualiza os documentos conforme o manifesto e as fontes existentes, sem editá-los. A CLI funciona no terminal sem carregar a skill; sua ausência isolada não impede geração. Personalizações da integração são preservadas e produzem conflito em uma tentativa de instalação incompatível. `sync` não substitui a skill por conteúdo Git e o manifesto não publica pacotes por `outputs.skills`.

A skill `agents-update-version` é o roteiro do mantenedor da base. `init --base` a instala em `.agents/skills/agents-update-version/` a partir do pacote CLI; não exige cópia manual. A prévia inclui esse arquivo sem gravá-lo. Uma cópia idêntica é preservada e uma skill personalizada ou com arquivos extras produz conflito antes de qualquer escrita. Ambos os modos instalam também `agents-write-conventions`; o init consumidor instala essa skill e `agents-update-docs`, enquanto `init --base` instala essa skill e `agents-update-version`. Todos os conflitos das skills do papel solicitado são verificados antes de gravar qualquer arquivo do setup. A skill de versão usa a prévia da CLI, justifica o aumento e exige confirmação antes dos efeitos aprovados. Tag local, publicação remota, alteração do pin e publicação npm são ações distintas.

## Raiz de base e raiz consumidora

`init --base` cria sete arquivos, incluindo `.agents/base.json` com `schemaVersion: 1` e `kind: base`, e um `AGENTS.md` próprio, UTF-8, não vazio e editável. Esse arquivo não é uma convention e não exige AGENT-CARD. Ao repetir init, uma cópia personalizada válida é preservada; arquivos inválidos ou links impedem toda a escrita.

A base não usa manifesto consumidor nem sync. Inicialização cruzada, manifesto inserido na base e operações consumidoras nela retornam `PROJECT_ROLE_CONFLICT`, saída 2, antes de escrever. Identificação inválida retorna `PROJECT_ROLE_INVALID`; `validate --base` e release sem inicialização retornam `BASE_NOT_INITIALIZED`. Subpastas da base não redirecionam operações a um consumidor ancestral.

O template `templates/AGENTS.tpl.md` da base continua separado e é usado na geração dos consumidores. A identidade interna não é exigida nos checkouts remotos selecionados pelo manifesto v1.
