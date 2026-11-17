# agentscli

Generate a project's `AGENTS.md` and conventions from editable Markdown templates.
Package **@devel-solid/agentscli**, experimental version **0.1.1**, licensed under MIT.
Requires Node.js 22, 24, or 26. The executable is `agentscli`.

## Use

Install the CLI, then run it inside your project:

~~~sh
npm install --global @devel-solid/agentscli
agentscli init --dry-run
agentscli init
agentscli validate
agentscli sync --dry-run
agentscli sync
agentscli sync --check
~~~

Use `agentscli init --lang pt-br` for Brazilian Portuguese document templates and
generated notices. The default is `en`. Skills, CLI help, and diagnostics stay English.
Authored template text is preserved literally.

The client manifest `agentscli-compose.yml` contains exactly:

~~~yaml
language: pt-br
templates_dir: templates
conventions_dir: docs/conventions
~~~

Every successful `init` overwrites that manifest using the requested language
(default `en`) and default roots. It creates missing templates, skills, and initial
documents while preserving valid existing templates, regular skill files, and
generated documents. Repeated initialization does not recreate intentionally
removed convention sources. Previous custom roots are not cleaned.

## Edit templates, then synchronize

~~~text
templates/AGENTS.tpl.md       -> AGENTS.md
templates/project.tpl.md      -> docs/conventions/project.md
templates/testing/unit.tpl.md -> docs/conventions/testing/unit.md
~~~

All convention `*.tpl.md` files participate automatically, including nested and
dotted names. An empty set is valid. No per-file registration or inheritance exists.

The main template needs one H1 and one full-line insertion comment outside examples.
Other headings, sections, and text are yours to customize:

~~~markdown
# AGENTS.md

## Working in this project

Read the project context convention before making changes. Follow the conventions relevant to the current task and keep changes within the requested scope.

<!-- Replace this comment with the project's purpose and essential repository orientation. -->

## Conventions

<!-- agentscli:conventions -->
~~~

Replace each fill-in comment itself with verified project content in its template;
keep the technical insertion and discovery markers. Upgrading the CLI does not replace
existing valid templates. To adopt new defaults, edit those templates deliberately,
then run `sync` when generation is requested.

Each convention template needs one H1 and one nonempty discovery card outside examples:

~~~markdown
# Testing

<!-- AGENT-CARD START -->
Read when changing tests.
<!-- AGENT-CARD END -->

Keep tests focused on observable behavior.
~~~

The card becomes part of the AGENTS index and is removed from the convention body.
Generated documents start with `<!-- agentscli:generated -->` and a source-edit notice.
`sync` replaces their entire content; put customizations in templates.

`validate` checks inputs, Markdown structure, paths, and destination conflicts.
`sync --dry-run` previews changes without writes. `sync --check` returns 1 for document
or managed-skill drift and 0 when current. Common options: `--repo-root <directory>`,
`--json`, `--help`; use `--version` by itself.

Unmarked documents occupying required output paths block all writes. Move useful
content into a template and resolve the destination before retrying. Other manual
documents remain untouched. Only stale marked Markdown below the **current**
conventions root is removed. Unsafe paths and file aliases are rejected.

Inputs and destinations are checked before writing. Files are replaced individually.
A failure can leave some documents or skills updated; diagnostics report completed
and remaining changes. Repeat `sync` to finish. Concurrent writes are unsupported.

JSON results contain `schemaVersion`, `command`, `ok`, `changes`, and `diagnostics`.
Exit codes: 0 success, 1 check drift, 2 usage/validation/conflict, 3 operational failure.

## Skills

| Skill | This repository | Client project |
| --- | --- | --- |
| `agentscli-write-conventions` | Edit final conventions | Edit convention templates |
| `agentscli-update-agents` | Edit handwritten AGENTS | Edit the main template |
| `agentscli-build-agents` | — | Validate, preview, synchronize, check |
| `agentscli-release` | Native CLI versioning/publication | — |

Shared authoring skills select context using exactly one manifest:
`agentscli.yml` means direct repository authorship; `agentscli-compose.yml` means client
templates. Both or neither produces a diagnostic before edits. AGENTS stays concise;
detailed or scoped rules belong in conventions.

Client skills are installed under `.agents/skills`. **Sync fully restores the three
distributed directories**, including support files and removal of extra files.
Direct skill edits are overwritten. Other skills remain untouched. Previews and checks
include skill changes. The CLI also works without loading skills.

## Develop and release

This repository keeps handwritten English AGENTS and conventions. It does not consume
itself: do not run client `init` or `sync` here. `agentscli.yml` only selects whole
skill directories for packaging and identifies direct authoring:

~~~yaml
skills:
  - .agents/skills/agentscli-write-conventions
  - .agents/skills/agentscli-update-agents
  - assets/templates/skills/agentscli-build-agents
~~~

Shared skills have one source under `.agents/skills`; the client-only build skill lives
under `assets/templates/skills`. Build copies listed trees into `dist/assets/skills`
and both document locales into `dist/assets/templates`. Internal release/OpenSpec skills
and the internal manifest are excluded from the package.

~~~sh
npm ci
npm run setup
npm run check
npm run build
npm pack --dry-run
npm pack --pack-destination .tmp
~~~

Run `npm run setup` after each clone to configure the native Git hook in
`.githooks/pre-push` using this checkout's local `core.hooksPath`. Repeating setup
is safe; a different existing hooks path is reported without replacing it.
The hook runs `npm run check` and blocks the push if that command fails.

`npm test` runs only lightweight unit tests with isolated data or mocked boundaries.
`check`, pre-push, and CI add type/format checks to that same unit gate. Build and
archive inspection are delivery checks. The package contains compiled runtime/client
resources, README, license, and metadata; installation performs no compilation or
resource download.

Use `agentscli-release` for native Git/npm versioning and publication. Review the source
commit, version/tag, archive contents, and integrity before delivery. Rename the existing
repository to `devel-solid/agentscli` preserving history. Commit, rename, tag, push, and
publish only within the corresponding authorization. Verify remote/registry identity
before retrying an ambiguous delivery; published tags and versions are immutable.
