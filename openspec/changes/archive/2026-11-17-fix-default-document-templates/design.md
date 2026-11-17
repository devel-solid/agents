# Design

## Context

See `proposal.md` for motivation. The four localized document assets contain the faulty default text. The existing renderer preserves ordinary HTML comments, substitutes the main index marker, and removes the operational convention card. Existing unit tests mostly inject synthetic templates; packaging copies locale assets without editorial checks.

The correction spans default resources, public examples, shared authoring guidance, and regression coverage. This design fixes their exact content contract without changing the runtime format or adding a migration mechanism.

## Goals / Non-Goals

**Goals:** Keep useful operational instructions, make unfinished authoring hints clearly replaceable comments, and verify the actual shipped defaults.

**Non-Goals:** Enforce the bundled title on custom templates, strip ordinary comments, rewrite existing client sources, add semantic validation of arbitrary client prose, regenerate this repository's handwritten documents, clean unrelated files such as `.gitignore`, or perform a release.

## Decisions

### Correct resource data instead of changing the renderer

Edit the four assets in their canonical locale directories. Preserve filenames, insertion/card markers, manifest language selection, and localized generated notices. Do not add placeholder parsing, runtime dependencies, or CLI flags: the current renderer already preserves the required comments. Removing every comment would also damage legitimate user content.

The exact intended defaults follow.

**`pt-br/AGENTS.tpl.md`**

```markdown
# AGENTS.md

## Trabalho neste projeto

Leia a convenção de contexto do projeto antes de fazer alterações. Siga as convenções relevantes para a tarefa atual e mantenha as alterações dentro do escopo solicitado.

<!-- Substitua este comentário pelo propósito do projeto e pela orientação essencial sobre o repositório. -->

## Convenções

<!-- agentscli:conventions -->
```

**`pt-br/project.tpl.md`**

```markdown
# Contexto do projeto

<!-- AGENT-CARD START -->
Leia ao iniciar um trabalho ou escolher o fluxo de desenvolvimento do projeto.
<!-- AGENT-CARD END -->

<!-- Substitua este comentário pelo contexto real do projeto. -->
```

**`en/AGENTS.tpl.md`**

```markdown
# AGENTS.md

## Working in this project

Read the project context convention before making changes. Follow the conventions relevant to the current task and keep changes within the requested scope.

<!-- Replace this comment with the project's purpose and essential repository orientation. -->

## Conventions

<!-- agentscli:conventions -->
```

**`en/project.tpl.md`**

```markdown
# Project context

<!-- AGENT-CARD START -->
Read when starting work or choosing the project's development workflow.
<!-- AGENT-CARD END -->

<!-- Replace this comment with the project's actual context. -->
```

### Align examples and canonical skills

Replace the README's `# Project instructions` / `Keep project-wide orientation here.` example with the English main default above. Explain that authoring replaces the fill-in comment itself in the template, while technical markers retain their operational roles. Document that package upgrades do not replace existing valid client templates; adopting these defaults requires an intentional template edit followed by authorized generation.

Update only the canonical `agentscli-update-agents` and `agentscli-write-conventions` sources. Add guidance for replacing applicable fill-in comments with verified project content and keeping any new fill-in hints inside explicit replacement comments. Preserve manifest-based target selection, English skill sources, client document language selection, scope boundaries, and the absence of fixed chat-language rules. Do not add skills or maintained copies.

The main default comment requests only purpose and essential orientation. This does not prohibit other justified entrypoint content when a user separately requests authorship. The context comment is replaced with actual context, not a fabricated catalog of commands or architecture. Review-only operation remains read-only.

### Exercise real assets through isolated units

Read the four canonical assets as small immutable test inputs. Parse them with the existing Markdown tooling to distinguish HTML comment nodes from ordinary prose, and exercise the existing renderer and planner with in-memory inputs/filesystem boundaries. Avoid full CLI subprocesses, temporary client projects, network access, and integration tests.

Cover the exact default headings, localized working text and replacement comments, operational structure, and the absence of the old fill-in/generic-rule paragraphs. Render both locales and verify the hints remain HTML comments, generated notices and discovery links remain correct, and operational card/index markers receive their existing transformations. Retain custom-heading coverage. Exercise initialization with real assets and verify existing valid sources remain preserved during repeated init and sync.

Prefer focused assertions for these observable contracts over broad unrelated snapshots or English-only checks. Skill guidance and README coherence receive a direct editorial review rather than tests that merely search their implementation wording.

## Risks / Trade-offs

- Existing clients retain old hints after upgrading -> explain source ownership and intentional adoption; do not silently overwrite client templates.
- HTML comments remain visible in raw Markdown to agents and editors -> make replacement explicit; they are authoring hints, not completed project instructions.
- An exact default title could become an unintended schema restriction -> test customized titles and keep validators unchanged.
- Synthetic resources can hide future asset regressions -> read the actual locale assets in focused unit coverage.

## Migration Plan

No automatic migration or compatibility change is required. Implement resource, guidance, and unit changes together during a later apply. Run `npm run check`; build and inspect assembled assets as delivery checks, not integration-test gates. No version bump, commit, tag, push, or publication is part of this change. Existing client adoption remains a separate, explicitly requested source edit.
