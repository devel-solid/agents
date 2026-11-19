# project-instruction-workflows Specification

## Purpose

Prepare, validate, and regenerate project instructions and managed skills from local templates, with small manifests, explicit file effects, and write-free previews.

## Requirements

### Requirement: The internal manifest selects distributed skill directories

The source repository SHALL use agentscli.yml with only a skills list of contained directory paths. The listed directories SHALL determine distributed client skills. Missing/invalid SKILL.md entrypoints, name/directory mismatches, unsafe paths, and duplicate skill destinations SHALL block packaging. This manifest SHALL NOT configure client instruction generation.

#### Scenario: Shared and client-only sources are listed
- **WHEN** the list names the two shared .agents/skills directories and the client-only asset skill directory
- **THEN** packaging selects those three directories and excludes the unlisted internal release skill

#### Scenario: Two entries target the same skill name
- **WHEN** the build validates the distribution manifest
- **THEN** it reports the duplicate before assembling package resources

### Requirement: Initialization creates usable instructions without resetting authored content

First init SHALL create the fixed configuration, main template, three client skills, and generated instructions. The default convention SHALL be `project-context.tpl.md` in English or `contexto-do-projeto.tpl.md` in Portuguese, with the matching generated path. Repeated init SHALL preserve valid authored setup and SHALL NOT restore removed conventions.

#### Scenario: A new client initializes
- **WHEN** init succeeds in an empty project
- **THEN** the fixed configuration, editable main/context templates, three client skills, and generated instructions exist
- **AND** the context template and output use the canonical filename for the configured language

#### Scenario: Authored setup already exists
- **WHEN** init finds customized valid templates and regular skill files
- **THEN** it preserves their content and the configured language while completing missing setup

#### Scenario: A convention was deliberately removed
- **WHEN** a client removes its context convention template and repeats init
- **THEN** init does not restore that source or add another default convention

#### Scenario: First initialization was interrupted
- **WHEN** init is retried with the same options after a partial initial setup
- **THEN** it finishes the missing default setup without resetting the sources already created

### Requirement: Initialization preview leaves every file unchanged

Init --dry-run SHALL describe configuration creation or explicit language changes, missing setup/output creation, preserved content, and conflicts using the same plan as application. Init --migrate --dry-run SHALL describe migration writes and cleanup from the same migration plan as application. Neither preview SHALL create or change files or directories.

#### Scenario: Manifest replacement is previewed
- **WHEN** init --migrate --dry-run runs beside a supported legacy client manifest
- **THEN** it describes replacement by language-only fixed-layout configuration and final legacy manifest removal while leaving the manifest and all other files unchanged

#### Scenario: Configuration is previewed
- **WHEN** init --dry-run runs beside a valid pt-br configuration without --lang
- **THEN** it preserves that preference and leaves all files unchanged without proposing a default-language reset

#### Scenario: Migration cleanup is previewed
- **WHEN** init --migrate --dry-run can migrate a supported legacy client
- **THEN** its effects include source transfers, regenerated documents, managed skills, configuration, and legacy cleanup without writing

### Requirement: Every convention template participates automatically

Every valid `*.tpl.md` below `.agentscli/templates/conventions/` SHALL participate recursively and map its relative path to `.agentscli/conventions/` with suffix `.md`. The main source SHALL be `.agentscli/templates/AGENTS.tpl.md`. Ordering SHALL use portable normalized paths and equivalent destinations SHALL fail. Directories SHALL create no inheritance.

#### Scenario: Nested and dotted sources are present
- **WHEN** `testing/unit.tpl.md` has the heading “Unit” and `policy.details.tpl.md` has the heading “Policy details”
- **THEN** validation reports `policy-details.tpl.md` as the expected filename before writing
- **AND** after the source is renamed, both sources generate independent root AGENTS entries and the nested source keeps its directory

#### Scenario: Portable destinations collide
- **WHEN** source paths differ only by case or Unicode normalization
- **THEN** every generation mode rejects the collision before writing

#### Scenario: Discovery has no conventions
- **WHEN** the main template is valid and the convention subtree is empty or absent
- **THEN** generation succeeds with an empty convention index

#### Scenario: Templates are outside the convention subtree
- **WHEN** unrelated `*.tpl.md` files exist elsewhere, including directly beside `.agentscli/templates/AGENTS.tpl.md`
- **THEN** they do not become convention sources or generated outputs

### Requirement: Templates are the sole source of generated instructions

Sync SHALL recreate the complete AGENTS.md and every convention from their templates. The main template SHALL have one operational full-line <!-- agentscli:conventions --> comment outside examples. Custom titles/sections and content surrounding that comment SHALL be allowed and preserved; fixed heading wording SHALL NOT determine rendering.

#### Scenario: A user rearranges the main template
- **WHEN** titles, sections, and body change around its valid insertion marker
- **THEN** sync renders the complete new body and convention index without requiring default section titles

#### Scenario: An output body was edited directly
- **WHEN** sync runs with valid source templates
- **THEN** it replaces the generated-body edit from its template

### Requirement: Document format validation distinguishes examples from operational syntax

Templates SHALL be valid UTF-8 with one operational H1 outside examples. Convention templates SHALL have one complete nonempty AGENT-CARD block outside examples. Rendering SHALL use the H1/card for index discovery, remove the operational card from convention output, and preserve examples and ordinary Markdown.

#### Scenario: A template teaches Markdown syntax
- **WHEN** examples contain H1 headings, cards, or insertion comments
- **THEN** they remain literal examples and do not satisfy or duplicate operational structure

### Requirement: Manifest language selects document resource text

The only stored client language SHALL be language in .agentscli/config.yml. First init SHALL default to en; repeated init SHALL preserve the stored preference unless --lang is explicit. New resources and generated notices SHALL use the selected language. Existing authored bodies SHALL remain literal. Skills SHALL stay English and SHALL NOT prescribe chat language.

#### Scenario: Portuguese client content is authored
- **WHEN** a shared English skill handles a client with language pt-br
- **THEN** it guides Portuguese template authorship without translating itself or adding a chat-language rule

#### Scenario: A configured project synchronizes later
- **WHEN** .agentscli/config.yml contains pt-br
- **THEN** renderer-added notices use pt-br while authored text remains literal and skills remain English

#### Scenario: Language changes after initialization
- **WHEN** init --lang en runs on a valid pt-br client with existing templates and outputs
- **THEN** it changes the preference and uses English defaults only for missing resources, preserving existing text and output notices until sync

### Requirement: Generated documents identify their editing contract

Every generated document SHALL start with exactly <!-- agentscli:generated --> followed by a localized source-edit notice naming its template under .agentscli/templates/. The first-line marker and other technical identifiers SHALL be language-independent. Root AGENTS.md SHALL link relatively to generated .agentscli/conventions/ documents and include their discovery-card text.

#### Scenario: An output is inspected
- **WHEN** its template is rendered
- **THEN** its first line identifies generated output and its readable notice identifies the new template editing surface

#### Scenario: Convention discovery is rendered
- **WHEN** a nested convention is generated
- **THEN** its AGENTS entry links to its actual generated path, includes when to consult it, and the operational card is absent from the convention body

### Requirement: Cleanup preserves manual documents and stays inside the current output root

Sync SHALL create absent outputs, replace marked expected outputs, and remove only stale marked *.md files under .agentscli/conventions/. Unmarked expected targets SHALL block preflight; other unmarked documents SHALL remain untouched. Marker recognition SHALL require the exact first line. Ordinary sync SHALL NOT clean legacy roots; explicit migration alone owns their bounded cleanup.

#### Scenario: A template is renamed or removed
- **WHEN** sync computes expected outputs
- **THEN** it updates the index and removes only obsolete marked documents under .agentscli/conventions/

#### Scenario: A manual file mentions the generated marker
- **WHEN** the marker occurs only in its body or an example
- **THEN** it remains a manual file and blocks generation if it occupies a required output path

#### Scenario: An old output directory remains elsewhere
- **WHEN** ordinary sync runs after migration with marked documents outside .agentscli/conventions/
- **THEN** it does not delete those documents

### Requirement: The package distributes three complete English client skills

Build SHALL distribute the complete directories selected by agentscli.yml: agentscli-write-conventions, agentscli-update-agents, and agentscli-build-agents. Standard English SKILL.md entrypoints and all support files SHALL be included. The internal agentscli-release and OpenSpec skills SHALL be excluded. Runtime resources SHALL require no source checkout.

#### Scenario: A shared skill contains references or scripts
- **WHEN** build assembles package resources
- **THEN** those support files accompany its canonical SKILL.md without a second manually maintained copy

### Requirement: Synchronization restores the complete managed client skill trees

Sync SHALL create or replace each of the three distributed client skill directories from the installed package, removing extra/stale files inside those directories. Direct changes there SHALL be overwritten. Other skill directories SHALL remain untouched. Equal file inventories/bytes SHALL yield no changes; no historical ownership or merge system SHALL be required.

#### Scenario: A client edits a packaged skill and adds an extra file
- **WHEN** sync applies the installed package resources
- **THEN** the skill returns to packaged content, including support files, and the extra file is removed

#### Scenario: Another skill exists beside the managed skills
- **WHEN** sync updates the three managed directories
- **THEN** that other skill and its files remain unchanged

### Requirement: Preview and check include document and skill drift

Sync preview and --check SHALL use the same validated document/skill plan as application and write nothing. Missing, changed, and extra managed-skill files SHALL be reported alongside document effects. A valid check SHALL return 1 for either kind of drift and 0 only when both sets match.

#### Scenario: Only a support file is stale
- **WHEN** documents and SKILL.md match but a managed reference file differs
- **THEN** check returns 1 and preview describes replacement without writing

### Requirement: Project writes converge without recovery databases

All input/path/conflict validation SHALL precede mutation. Individual-file replacement SHALL preserve whole files and reject unsafe aliases. Operational failure SHALL report completed/remaining document, skill, configuration, and migration effects and advise retrying the same operation. No locks, ownership database, journal, rollback backup, or mutex record SHALL be maintained.

#### Scenario: A later skill write fails
- **WHEN** documents or earlier skill files have already been replaced during sync
- **THEN** failure reports partial completion and repeated sync recomputes remaining work without rollback claims

#### Scenario: Migration cleanup fails
- **WHEN** the new client is prepared but removal of a legacy file fails
- **THEN** failure identifies completed/pending effects, retains the old manifest, and directs repeating init --migrate with the same options

### Requirement: The source repository keeps direct handwritten instructions

The CLI repository SHALL keep English handwritten AGENTS.md and final conventions, with agentscli.yml but no active client configuration or template tree. All client CLI modes, including migration, SHALL reject roots with the internal manifest in the root or an ancestor. Product scaffolds SHALL remain package data, not this repository's generated instructions.

#### Scenario: A maintainer updates source instructions
- **WHEN** shared authoring detects only agentscli.yml
- **THEN** it edits final files directly without running init or sync against this repository

#### Scenario: Client init targets the source repository
- **WHEN** init detects agentscli.yml in its target root
- **THEN** it reports incompatible context before creating configuration or changing files

#### Scenario: Migration targets a source-repository subtree
- **WHEN** init --migrate targets a descendant of a root containing agentscli.yml
- **THEN** it rejects that context without changing files

### Requirement: Guide content becomes conventions only when useful

During implementation, the five restored guides SHALL be reviewed before deletion, consulting Git as needed. Only useful current rules SHALL become handwritten English conventions with meaning preserved and disposition recorded in this change. After review/conversion, guides and presentation SHALL be removed and docs SHALL contain only necessary conventions.

#### Scenario: A guide mixes rules and obsolete workflows
- **WHEN** its content is assessed
- **THEN** only useful current rules become conventions and obsolete material is discarded

### Requirement: Proposal revision changes planning artifacts only

Proposal revision SHALL edit only this change's proposal, design, tasks, and nine existing delta specs in English. It SHALL preserve restored guides/presentation, source, templates, skills, root instructions, manifests, and permanent specs. It SHALL NOT execute implementation tasks or perform repository rename, commit, push, tag, or publication.

#### Scenario: Only the approved planning update is requested
- **WHEN** these change artifacts are revised
- **THEN** all changes stay inside those artifacts and implementation checkboxes remain unchecked

### Requirement: Bundled main templates provide a consistent document entrypoint

Both bundled main templates SHALL start with `# AGENTS.md`. Each SHALL retain its localized working paragraph and convention-index section, with exactly one operational insertion marker. Its sole fill-in hint SHALL be a localized HTML comment requesting only project purpose and essential repository orientation. These defaults SHALL NOT impose fixed titles or sections on customized client templates.

#### Scenario: English defaults are initialized
- **WHEN** a new client initializes with the default language
- **THEN** its main template starts with `# AGENTS.md`, retains the English working paragraph and conventions section, and contains `<!-- Replace this comment with the project's purpose and essential repository orientation. -->` instead of the previous fill-in prose

#### Scenario: Portuguese defaults are initialized
- **WHEN** a new client initializes with `--lang pt-br`
- **THEN** its main template starts with `# AGENTS.md`, retains the Portuguese working paragraph and conventions section, and contains `<!-- Substitua este comentário pelo propósito do projeto e pela orientação essencial sobre o repositório. -->` instead of the previous fill-in prose

#### Scenario: A client customizes its heading and sections
- **WHEN** a structurally valid main template uses a different H1 and customized sections
- **THEN** validation and rendering accept and preserve those choices without requiring the bundled title or body

### Requirement: Bundled context templates separate discovery from fill-in guidance

Each bundled context template SHALL retain its localized title and complete operational AGENT-CARD. Its remaining body SHALL contain only one localized HTML comment requesting replacement with actual project context. The previous fill-in paragraphs and additional generic rules paragraph SHALL be absent.

#### Scenario: English context is initialized
- **WHEN** a new English client receives the context template
- **THEN** its title is `# Project context`, its card reads `Read when starting work or choosing the project's development workflow.`, and its body contains only `<!-- Replace this comment with the project's actual context. -->`

#### Scenario: Portuguese context is initialized
- **WHEN** a new `pt-br` client receives the context template
- **THEN** its title is `# Contexto do projeto`, its card reads `Leia ao iniciar um trabalho ou escolher o fluxo de desenvolvimento do projeto.`, and its body contains only `<!-- Substitua este comentário pelo contexto real do projeto. -->`

### Requirement: Fill-in comments preserve ordinary source rendering and ownership

Bundled fill-in hints SHALL remain ordinary HTML comments when rendered, without becoming visible Markdown prose or receiving special stripping behavior. Rendering SHALL preserve generated notices and the existing operational card/index behavior. Updated package defaults SHALL NOT replace existing valid client templates through init or sync.

#### Scenario: Untouched defaults are rendered
- **WHEN** the bundled main and context templates are rendered in either supported language
- **THEN** fill-in hints remain HTML comments, generated source-edit notices remain, the main insertion marker becomes the convention index, and the operational context card is removed from the convention output

#### Scenario: An existing client uses older or customized templates
- **WHEN** the updated CLI initializes or synchronizes that client
- **THEN** its valid source templates remain unchanged and any regenerated document body continues to follow those sources rather than the updated package defaults

### Requirement: Client configuration stores language only

Clients SHALL use .agentscli/config.yml containing exactly one language field set to en or pt-br. Invalid UTF-8/YAML, duplicate or unknown keys, YAML aliases, unsupported languages, and non-object values SHALL fail validation. Client directory mappings, version/origin fields, and selection lists SHALL NOT be supported.

#### Scenario: Language-only configuration is valid
- **WHEN** configuration contains exactly language: pt-br
- **THEN** validate and sync use the fixed paths and Portuguese resource text

#### Scenario: A client requests custom roots
- **WHEN** configuration contains templates_dir or conventions_dir
- **THEN** all operations reject it without writing or adopting those roots

#### Scenario: Invalid configuration would otherwise be replaced
- **WHEN** init encounters invalid configuration, even with --lang
- **THEN** it fails before any mutation and preserves the existing bytes

### Requirement: Client instruction sources and outputs are versioned together

The documented client workflow SHALL version .agentscli/config.yml, all authored sources under .agentscli/templates/, and generated documents under .agentscli/conventions/, alongside root AGENTS.md. Initialization and migration SHALL NOT ignore .agentscli/ or change Git state.

#### Scenario: A new client reviews the workflow
- **WHEN** the README and initialization guidance explain generated-file ownership
- **THEN** they instruct versioning the complete .agentscli/ tree and root AGENTS.md without running Git commands

### Requirement: Legacy clients require explicit migration

Only init --migrate SHALL read legacy client roots for conversion. It SHALL accept exactly the currently supported language/templates_dir/conventions_dir manifest and preserve its language unless --lang is explicit. Malformed manifests, older composition schemas, unsafe roots, and overlap with the new .agentscli/ namespace SHALL block migration before writes.

#### Scenario: A custom-root client migrates
- **WHEN** the legacy manifest names rules/sources and rules/final with language pt-br
- **THEN** migration discovers those actual roots and preserves pt-br without assuming templates/ or docs/conventions/

#### Scenario: An unsupported manifest is present
- **WHEN** the manifest is malformed or contains an older entries-based composition schema
- **THEN** migration reports the unsupported input and preserves all files

#### Scenario: Legacy roots overlap the target namespace
- **WHEN** a legacy root equals, contains, or is contained by .agentscli/
- **THEN** migration reports the overlapping paths without performing in-place destructive conversion

### Requirement: Migration preserves sources and rejects content conflicts

Migration SHALL transfer the legacy main template to .agentscli/templates/AGENTS.tpl.md and each other legacy *.tpl.md to .agentscli/templates/conventions/ using its full relative path. It SHALL preserve authored text except required link edits. Different occupied targets, manual expected outputs, and directly edited expected legacy outputs SHALL block all writes; identical planned targets SHALL allow retry.

#### Scenario: Nested legacy sources migrate
- **WHEN** rules/sources/testing/unit.tpl.md belongs to a supported legacy root
- **THEN** it becomes .agentscli/templates/conventions/testing/unit.tpl.md and generates .agentscli/conventions/testing/unit.md

#### Scenario: A legacy source has a conventions subdirectory
- **WHEN** the legacy relative source path is conventions/rule.tpl.md
- **THEN** migration preserves that relative subdirectory without heuristically stripping its name; generation adds no further conventions segment

#### Scenario: A destination or legacy output has authored divergence
- **WHEN** a new source differs from its planned transfer or an expected legacy generated document differs from both its old render and the planned migrated result
- **THEN** migration reports the conflict and writes nothing, allowing useful content to be reconciled in its template first

#### Scenario: Expected old outputs are missing
- **WHEN** valid legacy templates exist but some generated outputs do not
- **THEN** migration creates the new expected outputs from those templates

### Requirement: Migration repairs managed document references

Migration SHALL update managed source links and regenerated output links/notices for their new locations. Markdown inline links, reference definitions, and images SHALL retain their resolved targets, fragments, and queries. External URLs and literal code examples SHALL remain unchanged. An affected reference that cannot be converted safely SHALL block migration with a source location.

#### Scenario: A convention links to another generated document
- **WHEN** a legacy convention has a relative link to another migrated convention with a fragment
- **THEN** its migrated source renders a relative link resolving to the new output with the same fragment

#### Scenario: A convention links to an unchanged repository file
- **WHEN** moving a convention changes the base for its README or image reference
- **THEN** migration rebases the reference to the same unchanged repository file without moving unrelated resources

#### Scenario: An AGENT-CARD contains a link
- **WHEN** the card contributes linked discovery text to root AGENTS.md
- **THEN** migration resolves and rewrites that link using the AGENTS output context rather than the convention output context

#### Scenario: A reference is ambiguous
- **WHEN** a shared definition used in different output contexts needs incompatible URLs or an affected embedded HTML reference cannot be safely rebased
- **THEN** migration identifies the source location and blocks without a broad text replacement

### Requirement: Migration prepares destinations before removing legacy artifacts

Migration SHALL prepare and verify the complete new sources, generated documents, and managed skills before publishing .agentscli/config.yml and starting legacy cleanup. It SHALL delete only transferred equivalent sources and marked legacy Markdown in the declared output root, preserve unrelated/manual files, remove only empty legacy directories, and remove agentscli-compose.yml last.

#### Scenario: Migration completes
- **WHEN** all new files and configuration have been prepared and verified
- **THEN** it removes only eligible legacy artifacts, deletes the manifest last, and leaves one usable client contract with updated notices and discovery links

#### Scenario: Generic legacy directories contain unrelated files
- **WHEN** the source/output roots also contain non-template resources or unmarked manual documents
- **THEN** migration preserves them and their nonempty directories instead of deleting either tree recursively

#### Scenario: A transferred source changed before deletion
- **WHEN** an old source or its new equivalent changes after planning
- **THEN** migration refuses to delete that source and reports a partial operational failure

### Requirement: Migration resumes using existing project artifacts

Repeating init --migrate with the same options SHALL recompute remaining effects without persistent recovery metadata. Before configuration publication, existing new files MUST match the deterministic legacy conversion. After publication, the valid new layout and remaining legacy manifest SHALL support cleanup even if some old sources were already removed. Divergence SHALL block rather than guess.

#### Scenario: Copying was interrupted
- **WHEN** some new files exist but configuration has not been published
- **THEN** retry accepts only identical planned copies and completes preparation before deleting old artifacts

#### Scenario: Source deletion was interrupted
- **WHEN** valid new configuration exists, some old templates are gone, and the legacy manifest remains
- **THEN** retry uses the validated new layout to identify and verify remaining legacy artifacts and deletes the manifest only after cleanup succeeds

#### Scenario: Both contracts appear independently occupied
- **WHEN** existing new content is inconsistent with the deterministic migration or validated cleanup state
- **THEN** migration reports conflicting context and makes no new writes

### Requirement: Convention filename mismatches block generation

A convention basename SHALL equal its H1 in ASCII lowercase kebab case plus `.tpl.md`. Normalize the parsed title using Unicode NFKD, remove combining marks, and replace non-alphanumeric runs by single hyphens. Reject empty results and mismatches before any writes in init, validate, sync, previews, check, and migration.

#### Scenario: A client submits a mismatched filename
- **WHEN** `componentes.tpl.md` has the H1 “Aplicação web e componentes”
- **THEN** the CLI fails with validation exit code 2 and identifies the source and expected filename `aplicacao-web-e-componentes.tpl.md`
- **AND** it makes no changes to templates, outputs, or managed skills

#### Scenario: A convention has a valid nested path and a formatted heading
- **WHEN** `testing/api-e-validacao.tpl.md` has the H1 “**API** e validação”
- **THEN** the containing directory is preserved and the generated file is `testing/api-e-validacao.md`

#### Scenario: An H1 cannot produce a portable slug
- **WHEN** the parsed H1 has no ASCII letters or digits after normalization
- **THEN** validation fails with a diagnostic identifying the title to correct

#### Scenario: A legacy migration would transfer an invalid convention
- **WHEN** a legacy convention would produce a mismatched basename in the fixed layout
- **THEN** migration and its preview fail before writing and identify the required source correction
