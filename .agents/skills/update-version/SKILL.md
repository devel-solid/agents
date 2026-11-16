---
name: update-version
description: Gera a próxima versão semver deste repositório, com confirmação obrigatória antes de criar tag, atualizar o compose, sincronizar a documentação e publicar a release.
---

# Versionamento da release

Use a skill `update-version` quando a pessoa quiser gerar a próxima versão
semver deste repositório.
Trate a própria skill como a interface pública do fluxo.

## Escopo

- Esta skill sempre versiona apenas o `HEAD` atual da branch `main`.
- O `HEAD` limpo no momento da proposta é o commit de origem da release.
- Antes de qualquer proposta, faça apenas inspeção local e read-only.
- A worktree precisa estar limpa antes do fluxo de release.

## Responsabilidades

- A decisão de `major`, `minor` ou `patch` fica com o agente.
- Essa decisão deve considerar o range `origin/main..HEAD`, os caminhos
  alterados e o impacto sobre consumidores de `AGENTS.md`,
  `agents-compose.yml`, `templates/` e o diretório publicado configurado em
  `outputs.AGENTS.md.include.conventions.out_dir`.
- O helper interno só executa passos mecânicos e valida estados objetivos.
- Não empurre a classificação semântica para o script.

## Critérios do bump

- Use `major` quando a mudança quebrar contrato, compatibilidade ou
  comportamento esperado por consumidores.
- Trate como sinal de `major`: mudança incompatível em `agents-compose.yml`,
  alteração incompatível no formato de `AGENTS.md`, quebra na geração de
  `conventions`, quebra de bootstrap ou sincronização, remoção ou renomeação
  de algo publicado que faça consumidores existentes deixarem de funcionar.
- Use `minor` quando a mudança adicionar capacidade sem quebrar
  compatibilidade.
- Trate como sinal de `minor`: nova `convention` compartilhada, nova skill
  local, novo passo de automação compatível, nova forma de publicação sem
  remover o comportamento antigo, expansão do fluxo de release sem quebrar a
  interface pública existente.
- Use `patch` quando a mudança corrigir, refatorar ou documentar sem mudar
  contrato nem comportamento observável.
- Trate como sinal de `patch`: correção de texto, exemplos, refactor mecânico,
  bugfix sem impacto no contrato publicado ou melhoria de documentação sem
  mudança de comportamento.
- Em caso de dúvida, escolha o menor bump que preserve compatibilidade real.
- Se a classificação continuar ambígua, explique a ambiguidade na proposta e
  peça confirmação antes de seguir.

## Antes da confirmação

- Inspecione localmente:
  - `git status --short --branch`
  - `git branch --show-current`
  - `git rev-parse HEAD`
  - `git log --decorate=short --oneline -n 1`
  - `git show --stat --summary HEAD`
  - `git rev-parse refs/remotes/origin/main`
  - `git log --decorate=short --oneline -n 1 refs/remotes/origin/main`
  - `git log --oneline refs/remotes/origin/main..HEAD`
  - `git diff refs/remotes/origin/main..HEAD --`
  - `agents-compose.yml`
  - o último `tag` semver local, como `git tag --sort=-creatordate`
- Se `refs/remotes/origin/main` não existir localmente, pare antes da
  proposta e informe que é preciso atualizar a visão do remoto antes de
  classificar a release.
- Leia `agents.ref` em `agents-compose.yml` e valide que ele está em formato
  `vX.Y.Z`.
- Calcule a próxima versão com o helper interno:
  ```bash
  python3 -B .agents/skills/update-version/scripts/update_version.py \
    next-version \
    --current-ref vX.Y.Z \
    --bump major|minor|patch
  ```

## Proposta obrigatória

- Antes de qualquer side effect, sempre mostre:
  - versão proposta, como `v3.9.0`
  - tipo do bump: `major`, `minor` ou `patch`
  - motivo curto da classificação
  - commit de origem: `HEAD` e header do commit
  - base remota congelada: SHA de `origin/main` e header do commit apontado
    por `origin/main`
  - observação explícita de que o bump foi decidido pelo range
    `origin/main..HEAD`
  - mensagem exata do commit final:
    `chore(repo): atualiza referência e documentação para vX.Y.Z`
  - passos na ordem correta
  - arquivos e recursos esperados
  - observação explícita de que haverá `push` do `tag` e do `main`
- A skill usa uma confirmação única para o plano inteiro.
- Se o escopo mudar, se o `HEAD` mudar ou se o repositório deixar de estar
  limpo, recalcule a proposta e apresente um novo plano antes de agir.
- Sem confirmação explícita, não crie `tag`, não altere arquivos, não rode
  `update-docs`, não faça commit e não faça push.

## Execução depois da confirmação

- Atualize a visão do remoto antes de validar o estado, por exemplo com
  `git fetch origin --prune --tags`.
- Valide o estado mecânico com o helper interno:
  ```bash
  python3 -B .agents/skills/update-version/scripts/update_version.py \
    validate-state \
    --repo-root /caminho/do/repo \
    --expected-head <sha-do-head-planejado> \
    --expected-branch main \
    --expected-current-ref vX.Y.Z \
    --expected-origin-main-head <sha-de-origin-main-na-proposta> \
    --next-version vA.B.C
  ```
- Se a validação falhar ou se o remoto mudar o plano local, pare e proponha um
  novo plano antes de continuar.
- Crie o `tag` anotado no commit de origem:
  ```bash
  git tag -a vA.B.C <sha-do-head-planejado> -m vA.B.C
  ```
- Publique primeiro o `tag`:
  ```bash
  git push origin vA.B.C
  ```
- Atualize apenas `agents.ref` com o helper:
  ```bash
  python3 -B .agents/skills/update-version/scripts/update_version.py \
    set-compose-ref \
    --repo-root /caminho/do/repo \
    --next-ref vA.B.C
  ```
- Depois disso, use a skill `update-docs` para sincronizar `AGENTS.md` e as
  `conventions` publicadas no diretório configurado em
  `outputs.AGENTS.md.include.conventions.out_dir`.
- Valide os caminhos alterados com o helper:
  ```bash
  python3 -B .agents/skills/update-version/scripts/update_version.py \
    validate-release-paths \
    --repo-root /caminho/do/repo
  ```
- Se aparecer qualquer caminho fora do escopo esperado, interrompa a execução
  e apresente um novo plano.
- Quando os caminhos estiverem válidos, crie o commit final com a mensagem já
  aprovada e então publique `main`.

## Limites do commit final

- O commit final da release pode conter apenas:
  - `agents-compose.yml`
  - `AGENTS.md`
  - arquivos `.md` em qualquer profundidade sob o diretório configurado em
    `outputs.AGENTS.md.include.conventions.out_dir`
  - deleções de `.md` em subpastas desse diretório apenas quando forem
    limpeza legada da migração
  - `.agents/skills/update-docs/**` quando a própria `update-docs` for
    sincronizada pelo novo pin
- Não recomponha o commit manual do usuário.
- Não inclua arquivos fora desse escopo.
- Não crie dois `tags` para a mesma release.
- Não aponte `agents-compose.yml` para um `tag` que ainda não exista no remoto.
- Não rode `update-docs` antes de o `tag` novo existir no remoto.
- Não faça `push` automático sem confirmação explícita do plano corrente.
- Para regenerar a documentação durante a release, siga os passos da skill `update-docs` após atualizar `agents.ref`.
