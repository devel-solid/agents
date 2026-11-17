# Design

## Context

See proposal.md for motivation and scope. The current private package is @devel-solid/agents@3.0.2. It includes roles, remote resolution, content locks, ownership state, base versioning, and a transaction engine. Replace those mechanisms rather than carrying them into a private-format migration layer.

The existing default test runner already selects tests/unit, but historical process/integration suites and fixtures remain versioned. They must be removed during implementation. Four archived and two active changes were previously deleted at the user's request and remain deleted.

This revision changes planning artifacts only. The restored guides, presentation, runtime, templates, skills, root instructions, permanent specs, and Git/npm identity remain untouched until the corresponding implementation or delivery work is authorized.

## Goals / Non-Goals

**Goals:** A small deterministic generator, two small manifests with distinct purposes, reusable authoring skills, explicitly replaceable client skills, unit-only gates, and one complete native first release.

**Non-Goals:** Bases, global policy distribution, subconventions, remote instruction sources, composition graphs, generated-body merges, multilingual skills, a release engine, integration suites, independent public history, or a second language rollout.

## Decisions

### 1. Use two small manifests with separate responsibilities

The client manifest is agentscli-compose.yml with exactly three required fields:

~~~yaml
language: pt-br
templates_dir: templates
conventions_dir: docs/conventions
~~~

Support en and pt-br, with en as default. Require nonempty relative directory roots contained in the project and reject overlapping or unsafe roots, unknown fields, invalid YAML, and unsupported languages. There is no schemaVersion, source origin, version pin, or inclusion list. Retain YAML parsing and directly validate the few fields without Ajv.

The source repository's agentscli.yml has only a skills list:

~~~yaml
skills:
  - .agents/skills/agentscli-write-conventions
  - .agents/skills/agentscli-update-agents
  - assets/templates/skills/agentscli-build-agents
~~~

This internal manifest drives build-time distribution and identifies the direct-authoring context. It does not select conventions or configure instruction generation. Validate contained directory paths, existing standard SKILL.md entrypoints, matching skill names, and duplicate destinations before packaging. Do not add origins, runtime resource downloads, skill versions, locale settings, or a plugin registry.

The source repository has no client manifest and no active client template tree. Its own AGENTS.md and docs/conventions remain handwritten in English. Bundled client templates remain product assets. Client CLI operations reject a root containing the internal manifest instead of initializing the source repository as its own client.

### 2. Discover independent templates and regenerate whole documents

Map client files as follows:

~~~text
<templates_dir>/AGENTS.tpl.md          -> AGENTS.md
<templates_dir>/<relative>.tpl.md     -> <conventions_dir>/<relative>.md
~~~

Include every valid *.tpl.md recursively below templates_dir except its root main template. Preserve relative paths, sort portable normalized paths, reject equivalent case/Unicode destinations, and allow an empty convention set. Nested directories and dotted filenames create no parent/child semantics.

Validate UTF-8 and one H1 outside examples. Allow arbitrary main-template titles, sections, and prose; do not depend on translated headings or fixed wording. Require one operational full-line insertion comment outside examples:

~~~markdown
<!-- agentscli:conventions -->
~~~

Replace that marker with the convention index while preserving all surrounding template content. The default body is a starting point, not a mandatory section schema.

Convention templates retain one complete, nonempty AGENT-CARD START / AGENT-CARD END block outside examples and one H1. Extract title and card into the independent index, remove the operational card from the output convention body, and preserve ordinary Markdown/examples. Keep remark-parse and unified for real Markdown boundaries.

Regenerate the entire AGENTS.md and every convention body from templates. Direct output edits are disposable. No body merge, automatic import of existing handwritten output, or private-format converter is introduced.

### 3. Keep product text English and localize project resources

Ship English and Brazilian Portuguese templates/notices together in 0.1.0. Init defaults to en and supports --lang pt-br; normalize identifiers to lowercase and reject unsupported values before writing. File names, skill names, option names, cards, and parser comments are language-independent.

The client manifest is the only stored language configuration. It controls newly created templates and renderer-added prose. Existing authored template text is preserved literally rather than translated. All four canonical skills and their maintained support resources are English; shared authoring instructions direct the agent to use the client's manifest language when creating client content.

Maintain the repository's own prose, CLI help/diagnostics, README, and development artifacts in English. Do not prescribe an agent chat language in any scaffold, skill, AGENTS.md, or convention. The tool/environment controls communication.

### 4. Keep a three-command interface and one predictable plan

| Command | Command-specific options | Effect |
| --- | --- | --- |
| agentscli init | --lang, --dry-run | Replace the client manifest and create missing setup/initial outputs |
| agentscli validate | none | Validate client inputs and safe destinations without writes |
| agentscli sync | --dry-run or --check | Regenerate documents and restore distributed skills, or inspect drift |

Keep common --repo-root, --json, --help and standalone --version. Default to the current project root. Remove release, --base, --starter, --offline, --frozen, remote, provenance, and debugging options. Use Node's native argument parser instead of another CLI framework.

Retain the small JSON envelope (schemaVersion, command, ok, changes, diagnostics) and exit meanings: success 0, valid check drift 1, usage/validation/conflict 2, operational failure 3. Preview and check describe the same document and skill effects as sync and write nothing. Validate checks structural input/path validity; sync --check checks output and packaged-skill freshness. Missing client skills alone do not block direct CLI use.

Every successful init overwrites agentscli-compose.yml with the selected/default language and default roots templates and docs/conventions, even when the previous manifest is invalid or customized. Prior source/output roots are not cleaned. Preserve valid existing templates, regular skill files, and existing generated documents during init; create missing setup and initial outputs. Do not recreate intentionally removed convention sources on repeated init. Init --dry-run reports the same manifest replacement and setup effects without writes.

### 5. Recognize disposable outputs without ownership databases

Every generated document starts with exactly:

~~~markdown
<!-- agentscli:generated -->
~~~

Follow it with a localized notice naming the source template. Recognize the marker only on the first line, never from body text or code examples. This is a disposable-output contract, not cryptographic ownership.

Create absent outputs and replace marked expected outputs. An unmarked expected AGENTS.md or convention destination blocks preflight and instructs the user to preserve useful content in its template and resolve the collision. Preserve all unrelated manual documents.

Remove stale marked *.md files only inside the currently configured conventions_dir. Do not clean previous output roots after a manifest edit. Compare expected UTF-8/LF bytes and skip unchanged outputs; init manifest replacement is an explicit exception. There is no durable output inventory, hash history, journal, or adoption database.

### 6. Maintain four skills from single English sources

| Skill | Source | Use in source repository | Client installation |
| --- | --- | --- | --- |
| agentscli-write-conventions | .agents/skills/agentscli-write-conventions | Final conventions | Convention templates |
| agentscli-update-agents | .agents/skills/agentscli-update-agents | Handwritten AGENTS.md | Main AGENTS template |
| agentscli-build-agents | assets/templates/skills/agentscli-build-agents | Not a repository workflow | Installed CLI validate/preview/sync/check |
| agentscli-release | .agents/skills/agentscli-release | Native CLI versioning/publication | Excluded |

The two shared authoring skills select direct files when only agentscli.yml exists and client templates when only agentscli-compose.yml exists. If both or neither exist, report the context problem before writing. Do not fall back to guessing from directory names, prose language, or missing client configuration.

Convention authorship covers scope, actionable rules, small examples, exceptions, duplication, and contradictions. AGENTS authorship curates short project-wide orientation, actionable entrypoints, and convention discovery; move detailed or scoped rules into conventions. Validate the applicable format without imposing generation markers on this repository's handwritten AGENTS.md. Review-only requests change no files; authorized source edits do not imply publication.

Use standard SKILL.md with name/description matching its directory, concise instructions, and optional references/scripts/assets only as needed. Maintain no tool-specific or translated variants and no separate repository convention-authoring skill. Shared sources are copied during build, not maintained again in package assets.

The client-only build skill runs the installed CLI within requested scope; it does not silently install/upgrade it. The repository-only release skill guides native version changes, unit gates, build/package inspection, authorized Git/npm delivery, and verification. It does not reintroduce a release subcommand or publication engine. OpenSpec skills remain development tools, outside the product's four-skill inventory and client installation.

### 7. Synchronize whole managed skill directories

Build reads agentscli.yml and copies each listed directory recursively, including SKILL.md and all support resources. Assemble runtime resources under dist/assets/skills/<skill-name> and localized templates under dist/assets/templates/<language>. Runtime lookup is relative to the installed package; it does not read the source repository's distribution manifest.

Sync restores the complete three listed client skill directories under .agents/skills using the installed package. Create missing files, replace changed content, and remove extra/stale files inside those exact managed directories. Those directories are CLI-managed; direct edits are overwritten. Other skill directories, including OpenSpec, are untouched. Document this explicitly rather than inferring customization from bytes.

The document marker applies to documents, not skill files. The packaged list of destination directory names bounds skill replacement; no skill ownership database, hashes of historical versions, automatic merge, or update flag is needed. Compare inventories/bytes so an unchanged sync is a no-op. Include skill creation, replacement, and removal in previews, --check, JSON changes, and partial-failure reporting.

### 8. Preflight all writes and converge after interruption

Validate sources, manifest, planned output/skill effects, collisions, containment, and unsafe links before any mutation. Preserve relevant path protections, including symlink/junction and hard-link checks, for both output and managed-skill writes/removals. Reject unsafe aliases instead of repairing them.

After successful preflight, perform init setup if needed, write conventions, write AGENTS.md, apply managed-skill updates for sync, and remove obsolete managed files. Recheck destinations immediately before mutation. Write replacement files via temporary siblings and safe individual-file replacement, cleaning temporary files on ordinary failures.

Do not promise atomic multi-file or whole-directory replacement. On operational failure report completed and remaining effects with exit 3. A repeated sync recomputes expected document/skill contents and converges. No backups, transaction journal, mutex record, automatic rollback, or publication recovery engine is added. Concurrent mutating invocations remain unsupported.

### 9. Keep source documentation and tests lean

During implementation, review the five restored guides before deleting them: contratos-de-composicao.md, dependencias-node-cli.md, integracao-em-repositorio-consumidor.md, manutencao-do-repositorio-agents.md, and validacao-node-cli.md. Consult Git as needed, preserve the meaning of useful current rules in handwritten English conventions, and record disposition in this change. Discard obsolete workflows and inventories instead of turning them into rules.

Use the shared skills in direct-authoring mode for own conventions/AGENTS. Keep only necessary conventions in docs after removing the reviewed guides and presentation. Put essential use/development/publication information in the concise English README; add no replacement guide or presentation.

Version only lightweight unit tests and small unit data. Use pure parser/render/planner assertions and mocked filesystem boundaries for manifests, contexts, package mapping, safe writes, and failures. Remove process/integration/end-to-end suites, historical fixtures/snapshots, disposable Git scenarios, and the Python oracle. No fake registry, real package installation, network/subprocess tests, or opt-in integration suite is retained.

Keep npm test unit-only; npm run check adds types/formatting; Lefthook pre-push and the existing lightweight CI invoke the same gate. Add focused units alongside each implementation area, then review the overall unit-only boundary. No expanded platform/version matrix is introduced.

### 10. Deliver the ready-to-run package with existing history

Use repository devel-solid/agentscli, npm package @devel-solid/agentscli, executable agentscli, version 0.1.0, tag agentscli-v0.1.0, and MIT. Replace active old identities in metadata, links, examples, and project markers. Keep existing capability identifiers and removed-requirement headers where needed to address historical specifications correctly.

Rename the existing repository and update its remote/public metadata during the authorized delivery step. Preserve Git history, branches, and tags; do not export another checkout, initialize independent history, purge historical objects, or force-push to implement the rename.

Use a package files allowlist for compiled runtime code and required dist/assets resources, with README, LICENSE, and package metadata. Exclude source-only skills, the internal manifest, OpenSpec, tests, source maps, obsolete assets, and development checkout paths. Keep prepack building the runtime/resources. No install-time compiler, prepare/postinstall asset fetch, or network resource lookup is required.

The release skill uses native Git/npm. Choose version changes without incidental commit/tag side effects before authorization, inspect npm pack --dry-run contents and the actual candidate archive, then identify the exact commit/tag/tarball/integrity for delivery review. Build/package inspection are delivery operations, not disguised integration tests.

The public registry returned 404 for agentscli, but publication on 2026-11-17 was refused because it is too similar to agents-cli. The user selected @devel-solid/agentscli and agentscli-v0.1.0 while preserving version 0.1.0 and the repository/executable identity agentscli. Preserve the already-public v0.1.0 candidate tag at e59bf3b without moving or deleting it. A registry 404 is not a reservation or guaranteed permission to publish. Recheck names, account access, remote refs, and native authentication at the actual release. OIDC is optional infrastructure, not mandatory first-release scope. Never collect secrets in chat or embed them in artifacts.

After corresponding authorization, perform the repository rename, reviewed commit/tag/push, and exact npm artifact publication. Verify the public commit/tag and registry identity/integrity. Resolve ambiguous responses by inspecting remote state; do not replace conflicting published tags/versions. This change remains pending until actual authorized first delivery is verified.

## Risks / Trade-offs

- **Generated edits are discarded:** Templates are the source; managed client skills are replaced from the installed package. Document both overwrite contracts.
- **A document marker is not cryptographic ownership:** Bound cleanup by the current output root and exact first-line marker; preserve unmarked files.
- **A failed operation can leave mixed output:** Preserve whole individual files, report partial completion, and retry sync to converge without rollback.
- **Unit-only evidence has limits:** Report only actual unit/build/artifact checks, without claiming installed end-to-end verification.
- **External permissions or name restrictions can block delivery:** Keep real publication tasks open and report the account action needed; do not change the architecture to work around access.

## Migration Plan

1. Replace the old client contracts/engine with the reduced manifest, automatic templates, native argument parsing, markers, safe writes, and unit cases.
2. Add the internal distribution manifest, four canonical skills, whole-directory build resources, and managed client-skill sync.
3. Keep own instructions handwritten; review/convert useful guide rules, rewrite maintained text in English, then delete reviewed guides and presentation.
4. Remove obsolete tests/fixtures and old dependencies, finish the concise README, and verify unit-only default gates. Synchronize approved deltas and remove empty retired capability files only through the requested OpenSpec workflow; keep deleted changes deleted.
5. Pass npm run check, build, inspect package contents and candidate identity, and present concrete release readiness.
6. With corresponding execution authorization, rename the existing repository without rewriting history, publish the reviewed source/tag/artifact, and verify actual first delivery before completing the change.

Before publication, correct defects with ordinary source revisions. After publication, issue a new version for corrections rather than rewriting an immutable published identity. Proposal revision executes none of these implementation/delivery steps.
