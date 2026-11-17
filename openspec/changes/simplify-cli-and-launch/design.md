# Design

## Context

See `proposal.md` for scope and motivation. The current package is `@devel-solid/agents@3.0.2`. Its 18 source modules include remote resolution, roles, schema-backed manifests, content locks, ownership, Git release, and a large transaction implementation. Rendering recognizes Portuguese discovery headings and regenerates complete documents. Initialization currently prepares inputs without generating the project documents.

The existing `npm test` runner selects only `tests/unit`; the larger `tests/node` and historical Python/composition fixtures are not that gate. The user now explicitly requires only lightweight unit tests to remain versioned and to run in every default test entrypoint. The old four archived and two active changes have already been deleted. Existing permanent specs still describe the old system and are replaced through this change.

Confirmed decisions: templates are the authoring surface for **both** AGENTS and conventions; regenerate all outputs; no bases or subconventions; lowercase `--lang pt-br`; English default; MIT; experimental `0.1.0`; one proposal from simplification through the complete first public release.

## Goals / Non-Goals

**Goals:** A small deterministic file generator, a directly usable init result, two client skills plus one repository-only authoring skill, predictable generated-file handling, lightweight unit gates, and ordinary package publication.

**Non-Goals:** Shared policy distribution, remote content, configurable composition graphs, generated-body merging, private-format migration, a new CLI release engine, a multilingual service, integration suites, a test registry, or a second language rollout.

## Decisions

### 1. Keep a three-field manifest and automatic inclusion

The project manifest remains agents-compose.yml with exactly three required fields:

```yaml
language: pt-br
templates_dir: templates
conventions_dir: docs/conventions
```

Use en by default. The directory fields are nonempty relative project directories; reject unsafe or overlapping roots. There is no schemaVersion, source origin, pin, entry list, or convention selection. Retain yaml and directly validate these three values without Ajv or an additional schema system.

```text
<templates_dir>/AGENTS.tpl.md                -> AGENTS.md
<templates_dir>/<relative-name>.tpl.md       -> <conventions_dir>/<relative-name>.md
.agents/skills/agents-write-conventions/SKILL.md
.agents/skills/agents-update-docs/SKILL.md
```

Templates remain available and editable in the project. The CLI regenerates the entire AGENTS body, not just an output index. Direct edits to marked output are disposable; all customization goes into templates. This implements the user's final clarification and removes the need to merge generated-body edits.

Discover every valid *.tpl.md recursively below templates_dir except the root AGENTS.tpl.md, which is the main template. Preserve each convention's relative path under conventions_dir. Directories and names such as policy.details.tpl.md never create parent/child relationships. There is no inclusion list. Sort portable normalized relative paths, reject case/Unicode collisions, and retain path protection. An empty convention set is valid.

The first setup includes templates/AGENTS.tpl.md and templates/project-context.tpl.md. Do not recreate intentionally removed conventions on repeated init. This CLI source repository is not a target project: keep its own AGENTS.md and conventions handwritten in English, no active agents-compose.yml, and no active project template tree. Keep product scaffolds only in package asset resources.

### 2. Use minimal, language-neutral template syntax

Validate UTF-8 and exactly one H1 per template outside examples. The main template has one insertion placeholder; language comes only from the manifest:

```markdown
# AGENTS.md

## Project
Describe this project here.

## Working on this project
Read the applicable conventions and use the project's own verification commands.

## Conventions
<!-- agents:conventions -->
```

The insertion marker must be an operational full-line comment outside examples. Replace it with the index while preserving template content before and after it. Do not parse translated section titles or store language in a template marker.

Convention templates retain the existing `AGENT-CARD START` / `AGENT-CARD END` comments with nonempty discovery text and one H1. Extract their title and card into the flat AGENTS index, remove the operational card from the generated convention body, and preserve examples and ordinary Markdown. Index links use the stable relative output paths; ordering and formatting are deterministic. Keep `remark-parse`/`unified` for correct Markdown boundaries rather than introducing ad hoc example detection.

### 3. Scope language selection to initial resources and project instructions

Support `en` and `pt-br` resources from the first release. Normalize identifiers to lowercase; reject unsupported values before writes. `init` defaults to `en`; `init --lang pt-br` selects Brazilian Portuguese templates and skill prose. Technical filenames, command names, comments used as parser markers, and the two skill identifiers remain stable.

The manifest language is authoritative for scaffolds and generated notices. Cards and authored bodies are copied, not translated; the setting controls created file text only. No scaffold, own instruction file, or skill prescribes a fixed agent reply language. The source repository keeps its maintained instruction files in English. Do not infer locale from prose or introduce another locale configuration file.

Every successful init overwrites agents-compose.yml using the selected language, defaulting to en, and default roots templates and docs/conventions. It does not preserve the previous manifest language or custom roots. Preserve existing template/skill content without silently translating it. Later validate/sync read the current manifest, including user-edited roots. Public text and the concise README are English from the first release.

### 4. Keep the public command surface small

| Command | Supported command-specific options | Effect |
| --- | --- | --- |
| `agents init` | `--lang`, `--dry-run` | Replace the manifest and prepare missing templates/skills/documents |
| `agents validate` | none | Validate inputs, locale, paths, and destination conflicts |
| `agents sync` | `--dry-run` or `--check` | Generate the complete marked document set or inspect its effects |

Keep common --repo-root, --json, --help and standalone --version. The current directory is the default root; validate/sync read its reduced manifest. Reject removed/misplaced options. Remove release, --base, --starter, --offline, --frozen, remote flags, and old provenance/debugging options.

Retain the small JSON envelope and exit meanings already understood by callers: success 0, valid check drift 1, usage/validation/conflict 2, operational failure 3. Preview describes planned creates/updates/removals; application reports completed effects. `validate` does not mean the generated files are current; `sync --check` supplies that assertion.

### 5. Make init safe and useful immediately

Build the complete init plan before writes. Replace the manifest on every successful invocation, even if an existing manifest is invalid, using the new requested/default configuration. Validate the planned configuration and targets before applying it. First init also creates the main/context templates, two skills and initial documents. Preserve existing valid templates, skills and generated documents; sync applies later template changes. --dry-run never overwrites the manifest or anything else.

Preserve differing skill files and report them as different content, not as proven customization. Do not introduce skill-version hashes, automatic merges, or another update flag. Document manual replacement after preserving custom edits when a user wants a newer bundled skill. Sync never changes skills.

An unmarked existing AGENTS or convention occupying a required generated destination is a conflict before setup writes. Preserve it and explain how to move its useful content into the template and explicitly resolve the destination. There is no silent import/adoption or private-version converter in `0.1.0`.

### 6. Recognize generated files without historical ownership

Every generated document has the exact first line `<!-- agents:generated -->`, followed by a short localized notice naming its template as the editing surface. Recognize that marker only on the first line, never from examples or body text. This is an explicit disposable-output contract, not a record of previous bytes or provenance.

Create absent destinations and replace marked expected outputs. Unmarked collisions block the plan; unrelated files remain untouched. Recursively remove stale marked *.md files only inside the currently configured conventions_dir. Never clean previous output roots after a manifest edit or delete source/skill files. Directories express paths only, not convention relationships.

Compare bytes with expected UTF-8/LF output and skip unchanged generated documents. The init manifest replacement is an explicit exception. Remove old composition/lock/ownership schemas and Ajv; retain yaml for the three-field manifest. Do not add persistent recovery state.

### 7. Replace the transaction engine with preflight and individual-file replacement

Validate every source, destination, planned deletion, filesystem collision, and unsafe link before applying changes. Preserve the relevant containment checks from `paths.ts`; do not allow a target symlink/junction or hard-link write to modify a different file. The simplest supported contract rejects unsafe aliases rather than trying to repair them.

Create missing source/skill setup without overwriting existing author files. For generated documents, write a temporary file beside the destination and safely replace that one destination, cleaning temporary files on ordinary failures. Write convention outputs, then AGENTS, then remove obsolete marked outputs. Recheck destination classification immediately before mutation. Keep temporary artifacts transient and excluded by the applicable development ignore patterns.

The operation is not an atomic multi-file transaction. On operational failure report completed and remaining effects with exit 3. The next sync recomputes from templates and converges; do not add a journal, backup database, lock record, automatic rollback, or publication recovery engine. Concurrent mutating invocations are unsupported and are documented as such.

### 8. Keep only two product skills and explicit localized package assets

`agents-write-conventions` owns source curation: applicability, rules, examples, duplication, and contradictions. `agents-update-docs` owns validate/preview/sync/check through the installed CLI. Both explain the generated-output contract and operate within the user's requested scope without gratuitous extra confirmations.

This source repository also needs its own authoring workflow because its conventions are handwritten. Add `.agents/skills/agents-write-repository-conventions/SKILL.md`, with English guidance for directly creating, reviewing, and maintaining `docs/conventions/*.md` and their discovery references in the handwritten root AGENTS.md. Reuse the content-quality principles, not the client generation procedure. The internal skill requires no manifest, template, init, or sync; it maintains English artifacts without adding a fixed chat-language instruction. Root AGENTS.md directs maintainers to this internal skill. It remains in the public source repository but is excluded from packaged assets and client initialization. A review-only request changes no files.

Remove the base-only agents-update-version source and distributed copy. Put essential native maintainer publication guidance in the README. The OpenSpec skills remain development tooling and are not installed in target projects.

Keep authored skill sources and locale companions under .agents/skills. Keep English/Portuguese scaffolds as package data under assets, never as this repository's own active templates. Package the selected skill prose under standard SKILL.md entrypoints. Use one explicit resource mapping, remove stale base/starter assets, and keep no checkout-only runtime reference.

The package mapping includes exactly the two client skills. Do not copy the repository-only skill into assets or install it in target projects.

### 9. Keep all tests small and unit-only

Retain `tests/unit` as the test home. Test pure option/root/locale handling, Markdown/template parsing, independent filename discovery and collision detection, index/document rendering, planning/cleanup classification, and individual-file writer error reporting using small in-memory values and mocked filesystem boundaries. Test meaningful observable decisions; do not mirror implementation text or spawn the compiled CLI.

Remove `tests/node` integration/process suites, their helpers, historical composition fixtures/snapshots, disposable Git scenarios, and the Python oracle. Move only useful isolated assertions into unit tests. Keep lightweight test data only when needed by those units. No fake registry, subprocess, real npm install, end-to-end fixture matrix, release rehearsal suite, or opt-in integration suite is introduced.

npm test stays unit-only; npm run check adds types/formatting; pre-push invokes that check. Preserve the existing lightweight CI workload without introducing a platform/version acceptance matrix. Build and package inspection are delivery operations, not hidden integration gates.

### 10. Complete one public launch using native Git/npm

Use product `agents-cli`, package `@devel-solid/agents-cli`, future repository `devel-solid/agents-cli`, executable `agents`, version `0.1.0`, tag `v0.1.0`, and MIT. Update package/lockfile metadata and public links; add `LICENSE` and retain required attribution for any retained third-party material. Do not use private version `3.0.2` or instruction-content tags as a release baseline.

Finish code, English documentation, both locale resources, unit gates, build, and package-content inspection here. Present a concrete final snapshot, source/artifact identities, target, commit/tag/version, file inventory, and publication effects for the later authorization required by this repository's instructions. This proposal is not that authorization.

After approval, retain access to this development checkout, create the reviewed public snapshot with independent history, and carry this single pending change so its delivery tasks can finish there. Rebuild/package against final public metadata and inspect the resulting allowlist. Publish the reviewed commit/tag and exact tarball using native account access. Do not copy the current `.git`, private refs, deleted changes, caches, obsolete output, or integration fixtures.

Use an authenticated native npm publishing method available at release time. OIDC is optional infrastructure, not a CLI feature or a prerequisite guessed for a nonexistent package; account/scope permissions are checked without collecting secrets in chat. After publication, verify public commit/tag, npm metadata, and `dist.integrity` against the artifact. These are delivery checks, not an installed-package test suite. For ambiguous responses inspect native remote state; never force a conflicting tag or republish an immutable version.

The change covers all implementation and first delivery. Do not mark it complete or archive it merely because local planning/readiness succeeds. No separate English change or second public release is required.

## Risks / Trade-offs

- **Generated-output edits are discarded:** Templates are the documented source; stable notices and previews make the effect explicit.
- **A marker is not cryptographic ownership:** Recognize only an exact first-line marker inside the configured output root; preserve unmarked files and reject collisions.
- **An interrupted update can leave a mixed generation:** Preserve whole individual files, report partial work, and let the next sync converge. No transaction-wide rollback is promised.
- **Unit-only tests do not establish installed end-to-end behavior:** Respect that limit in evidence and release claims; inspect package contents and actual registry delivery without introducing a hidden integration gate.
- **Skill content can lag after a CLI upgrade:** Preserve authored skill files and document explicit replacement; do not infer whether different bytes are old or customized.
- **External publication permissions or names can block delivery:** Verify them when preparing the concrete launch; keep delivery tasks pending rather than changing scope or inventing completion.

## Migration Plan

1. Replace the old engine/contracts/assets with the reduced-manifest workflow and unit-only tests.
2. During implementation, review the restored guides contratos-de-composicao.md, dependencias-node-cli.md, integracao-em-repositorio-consumidor.md, manutencao-do-repositorio-agents.md, and validacao-node-cli.md, consulting Git as needed. Convert only useful current rules into handwritten English docs/conventions, preserve their meaning, and record disposition in this change. Keep essential usage in the README; discard obsolete procedures and historical reports. After that review/conversion, delete the five guides and presentation. During proposal revisions, leave these restored files unchanged and create no conventions.
3. Keep the source repository's AGENTS.md/conventions handwritten, English, and separate from target scaffolds. Do not generate its instructions or create its own manifest.
4. Synchronize approved specification deltas through the public OpenSpec workflow when requested, update retained capability purposes, and remove empty retired capability files. Keep the user's deleted changes deleted.
5. Pass the unit-only check, build the candidate, inspect package resources/metadata, and present release readiness.
6. Perform only the later authorized snapshot handoff and native publication; verify actual public identities and artifact integrity before closing this same change.

Before publication, rollback is ordinary source revision in the development checkout. After publication, corrections require a new package version; do not rewrite an existing published identity. There is no external project migration obligation for the private pre-release composition formats.
