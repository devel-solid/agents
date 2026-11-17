# project-instruction-workflows Specification

## Purpose

Prepare, validate, and regenerate project instructions and managed skills from local templates, with small manifests, explicit file effects, and write-free previews.

## Requirements

### Requirement: A reduced manifest configures each client project

The client SHALL use agentscli-compose.yml with exactly language, templates_dir, and conventions_dir. Language SHALL support en and pt-br. Roots SHALL be nonempty, nonoverlapping relative project directories. Invalid YAML, unknown fields, unsafe paths, and unsupported languages SHALL fail validation. No version, origin, pin, or selection list SHALL exist.

#### Scenario: A user configures custom roots
- **WHEN** the manifest names rules/templates and rules/conventions
- **THEN** validate and sync use those roots without selecting conventions individually

#### Scenario: Legacy composition fields remain
- **WHEN** validate encounters entries, schemaVersion, or remote sources
- **THEN** it reports unsupported configuration without converting or changing the manifest

### Requirement: The internal manifest selects distributed skill directories

The source repository SHALL use agentscli.yml with only a skills list of contained directory paths. The listed directories SHALL determine distributed client skills. Missing/invalid SKILL.md entrypoints, name/directory mismatches, unsafe paths, and duplicate skill destinations SHALL block packaging. This manifest SHALL NOT configure client instruction generation.

#### Scenario: Shared and client-only sources are listed
- **WHEN** the list names the two shared .agents/skills directories and the client-only asset skill directory
- **THEN** packaging selects those three directories and excludes the unlisted internal release skill

#### Scenario: Two entries target the same skill name
- **WHEN** the build validates the distribution manifest
- **THEN** it reports the duplicate before assembling package resources

### Requirement: Successful initialization replaces client configuration

Every successful init SHALL overwrite agentscli-compose.yml with selected language (default en), templates_dir templates, and conventions_dir docs/conventions. Old values or invalid old manifest content SHALL NOT prevent deliberate replacement. Preflight failures and --dry-run SHALL prevent all writes.

#### Scenario: Init is repeated on customized configuration
- **WHEN** agentscli init runs with a pt-br client manifest and custom roots
- **THEN** it replaces the manifest with en and default roots without deleting files under the previous roots

#### Scenario: Portuguese initialization is requested
- **WHEN** agentscli init --lang pt-br succeeds
- **THEN** its manifest contains pt-br and default roots even when an older manifest existed

### Requirement: Initialization creates usable instructions without resetting authored content

First init SHALL create the client manifest, main/context templates, three client skills, AGENTS.md, and initial conventions. It SHALL preserve valid existing templates, regular skill files, and existing generated documents while creating missing setup. Repeated init SHALL NOT recreate intentionally removed convention sources.

#### Scenario: A new client initializes
- **WHEN** init succeeds in an empty project
- **THEN** the client manifest, editable templates, three client skills, and generated instructions exist

#### Scenario: Authored setup already exists
- **WHEN** init finds customized valid templates and regular skill files
- **THEN** their content is preserved while the client manifest is replaced

### Requirement: Initialization preview leaves every file unchanged

Init --dry-run SHALL describe manifest creation/replacement, missing setup/output creation, preserved content, and conflicts using the same requested/default configuration as real initialization. It SHALL create or change no files or directories.

#### Scenario: Manifest replacement is previewed
- **WHEN** init --dry-run runs beside an existing client manifest
- **THEN** it describes replacement while leaving the manifest and all other files unchanged

### Requirement: Every convention template participates automatically

Every valid *.tpl.md below templates_dir SHALL participate recursively except the root AGENTS.tpl.md. Each convention SHALL map its relative path into conventions_dir with suffix .md. Ordering SHALL use portable normalized paths and equivalent destinations SHALL fail. Names/directories SHALL create no parent/child relationships.

#### Scenario: Nested and dotted sources are present
- **WHEN** testing/unit.tpl.md and policy.details.tpl.md exist below templates_dir
- **THEN** both receive independent outputs and direct AGENTS entries without registration

#### Scenario: Portable destinations collide
- **WHEN** paths differ only by case or Unicode normalization
- **THEN** every generation mode rejects the collision before writing

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

The client manifest SHALL be the only stored language setting. Init SHALL default to en and support lowercase --lang pt-br. Newly created document templates and generated notices SHALL use that language; existing authored bodies SHALL be copied literally. All skills SHALL stay English. Bundled resources and skills SHALL NOT prescribe chat language.

#### Scenario: Portuguese client content is authored
- **WHEN** a shared English skill handles a client with language pt-br
- **THEN** it guides Portuguese template authorship without translating itself or adding a chat-language rule

#### Scenario: A configured project synchronizes later
- **WHEN** its manifest contains pt-br
- **THEN** renderer-added notices use pt-br while authored text remains literal and skills remain English

### Requirement: Generated documents identify their editing contract

Every generated document SHALL start with exactly <!-- agentscli:generated --> followed by a localized source-edit notice naming its template. The first-line marker and other technical identifiers SHALL be language-independent.

#### Scenario: An output is inspected
- **WHEN** its template is rendered
- **THEN** the first line identifies disposable generated output and the readable notice identifies the template editing surface

### Requirement: Cleanup preserves manual documents and stays inside the current output root

Sync SHALL create absent outputs, replace marked expected outputs, and remove only stale marked *.md files under the current conventions_dir. Unmarked expected targets SHALL block preflight; other unmarked documents SHALL remain untouched. Marker recognition SHALL require the exact first line. Previous output roots SHALL NOT be cleaned.

#### Scenario: A template is renamed or removed
- **WHEN** sync computes expected outputs
- **THEN** it updates the index and removes only obsolete marked documents under the current output root

#### Scenario: A manual file mentions the generated marker
- **WHEN** the marker occurs only in its body or an example
- **THEN** it remains a manual file and blocks generation if it occupies a required output path

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

All input/path/conflict validation SHALL precede mutation. Individual-file replacement SHALL preserve whole files and reject unsafe aliases. Operational failure SHALL report completed/remaining document and skill effects and advise repeating sync. No locks, ownership database, journal, rollback backup, or mutex record SHALL be maintained.

#### Scenario: A later skill write fails
- **WHEN** documents or earlier skill files have already been replaced
- **THEN** the failure reports partial completion and a repeated sync recomputes the remaining work without rollback claims

### Requirement: The source repository keeps direct handwritten instructions

The CLI repository SHALL keep English handwritten AGENTS.md and necessary final conventions, with agentscli.yml but no client manifest or active client template tree. Client CLI operations SHALL reject roots containing the internal manifest. Product scaffolds SHALL remain package data, not this repository's generated instructions.

#### Scenario: A maintainer updates source instructions
- **WHEN** shared authoring detects only agentscli.yml
- **THEN** it edits final files directly without running init or sync against this repository

#### Scenario: Client init targets the source repository
- **WHEN** init detects agentscli.yml in its target root
- **THEN** it reports the incompatible context before creating a client manifest or changing files

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
