# Spec Delta

## ADDED Requirements

### Requirement: A reduced manifest configures each target project

The target project SHALL use agents-compose.yml with exactly language, templates_dir, and conventions_dir. Language SHALL support en and pt-br. Roots SHALL be nonempty, nonoverlapping relative project directories. Unknown fields, unsafe paths, invalid YAML and unsupported languages SHALL fail validation. No schemaVersion, origins, pins, entries or per-convention selections SHALL exist.

#### Scenario: A user configures custom roots
- **WHEN** the manifest names rules/templates and rules/conventions
- **THEN** validate and sync use those roots without a selection list

#### Scenario: Legacy composition fields are present
- **WHEN** validate encounters entries, schemaVersion or remote source configuration
- **THEN** it reports the unsupported fields without converting or changing the manifest

### Requirement: Successful initialization replaces the manifest

Every successful init SHALL overwrite agents-compose.yml with the selected language (default en), templates_dir templates, and conventions_dir docs/conventions. Existing manifest values SHALL NOT override the new initialization configuration. Invalid old manifest content SHALL NOT prevent its deliberate replacement. Preflight errors and --dry-run SHALL still prevent all writes.

#### Scenario: Init is repeated on a customized manifest
- **WHEN** agents init runs with an existing pt-br manifest and custom roots
- **THEN** the manifest is replaced with en and the default roots
- **AND** files in previous source/output roots are not deleted

#### Scenario: Portuguese setup is requested
- **WHEN** agents init --lang pt-br succeeds
- **THEN** the written manifest has pt-br and the default directory roots even if it previously existed

### Requirement: Initialization creates usable instructions and preserves authored inputs

First init SHALL create the manifest, main/context templates, two project skills, AGENTS.md and initial conventions. It SHALL preserve valid existing templates and regular skill content while creating missing setup. Generated documents already present SHALL remain until sync is requested. An unmarked expected destination SHALL cause a preflight conflict. Removed convention sources SHALL not be recreated on repeated init.

#### Scenario: A new project initializes
- **WHEN** agents init succeeds in an empty target
- **THEN** agents-compose.yml, templates/AGENTS.tpl.md, templates/project-context.tpl.md, both skills, AGENTS.md and docs/conventions/project-context.md exist

#### Scenario: Existing authored content is encountered
- **WHEN** init finds customized valid templates and regular skill files
- **THEN** their contents are preserved while the manifest is replaced

### Requirement: Initialization preview leaves every file unchanged

Init --dry-run SHALL show manifest creation/replacement, missing setup/output creation, preservation and conflicts without writing files or directories. The plan SHALL use the same selected/default configuration and rendering as actual initialization.

#### Scenario: Existing manifest replacement is previewed
- **WHEN** init --dry-run runs beside an existing manifest
- **THEN** it reports the replacement without changing that manifest or any other file

### Requirement: All convention templates participate automatically

Every valid *.tpl.md below templates_dir SHALL participate recursively except its root AGENTS.tpl.md, reserved for the main document. Each convention SHALL map its relative path to conventions_dir with the suffix .md. Ordering SHALL use portable normalized relative paths and equivalent destinations SHALL be rejected. Files and directories SHALL create no parent/child relationships.

#### Scenario: Nested and dotted sources are present
- **WHEN** testing/unit.tpl.md and policy.details.tpl.md are added below templates_dir
- **THEN** both receive independent documents and direct AGENTS entries without registration

#### Scenario: Portable destination names collide
- **WHEN** discovered paths differ only by case or Unicode normalization
- **THEN** every generation mode rejects the collision before writes

### Requirement: Templates are the sole source of generated instructions

Sync SHALL recreate the complete root AGENTS.md from templates_dir/AGENTS.tpl.md and every convention from its template. The main template SHALL contain exactly one operational `<!-- agents:conventions -->` placeholder outside code examples. Content before and after it SHALL survive rendering. Output edits SHALL be replaced from source; renderer-added text SHALL use the manifest language.

#### Scenario: A source or generated document changes
- **WHEN** sync runs with valid templates
- **THEN** complete outputs reflect their source templates, replacing direct generated-body edits

### Requirement: Manifest language selects project resource text

The manifest SHALL be the only stored language configuration. Init SHALL default to en and support --lang pt-br, using lowercase identifiers. Scaffolds, missing setup resources and generated notices SHALL use that configuration. Existing authored template/skill text SHALL not be silently translated. The setting SHALL control file text only and SHALL NOT add a fixed agent reply-language instruction.

#### Scenario: A configured project synchronizes later
- **WHEN** its manifest has pt-br and sync runs without language flags
- **THEN** renderer-added prose uses pt-br while authored content is copied literally

### Requirement: The public interface has three command roots

The CLI SHALL expose init, validate and sync, with help/version as flags. Release, base, remote-source, and convention-management commands SHALL be absent. Supporting skills SHALL use the installed CLI and check unknown capabilities without automatically installing a replacement.

#### Scenario: Public help is requested
- **WHEN** agents --help runs
- **THEN** it describes the three commands and their manifest/template/document effects

### Requirement: Generated documents identify their source contract

Every generated document SHALL start with the exact first line `<!-- agents:generated -->` followed by a localized source-edit notice. Convention cards SHALL feed the flat AGENTS index and be removed from convention bodies. Technical markers and filenames SHALL remain language-independent.

#### Scenario: An output is inspected
- **WHEN** its source is rendered
- **THEN** the first line identifies generated output and the readable notice identifies its template

### Requirement: Cleanup is bounded by the configured output root

Sync SHALL create absent destinations and replace marked expected outputs. It SHALL recursively remove only stale marked *.md files inside the current conventions_dir. Unmarked files SHALL remain untouched; unmarked expected targets SHALL block preflight. Marker recognition SHALL require the exact first line, never a body/example occurrence. Old output roots SHALL not be cleaned after a manifest change.

#### Scenario: A template is removed or renamed
- **WHEN** sync computes the output set
- **THEN** it updates the index and removes only stale marked files inside the currently configured output root

#### Scenario: A foreign document mentions the marker
- **WHEN** that marker occurs only in the file body or an example
- **THEN** the file is not treated as generated

### Requirement: Project writes converge without recovery databases

Manifest/input/destination validation SHALL precede mutation. Generated-file replacement SHALL preserve whole individual files. Operational failures SHALL report partial completion and advise repeating sync. The CLI SHALL NOT maintain content locks, ownership databases, journals, rollback backups or mutex records. The reduced author-maintained manifest is configuration, not recovery state.

#### Scenario: A later write fails
- **WHEN** an earlier generated document has already been replaced
- **THEN** failure is reported without a rollback claim and a new sync recomputes the remaining work

### Requirement: The package supplies two supporting project skills

Init SHALL supply agents-write-conventions for template curation and agents-update-docs for manifest-driven validate/preview/sync/check. Existing regular skill content SHALL be preserved and differences reported without guessing their origin. Sync SHALL not change skills. OpenSpec and base-versioning skills SHALL not be installed into target projects. Direct CLI use SHALL not depend on skill presence.

#### Scenario: A user requests a preview only
- **WHEN** agents-update-docs handles the request
- **THEN** it reports the preview without applying it

### Requirement: The CLI source repository keeps handwritten instructions

This CLI repository SHALL not consume its own target-project generation. Its own AGENTS.md and necessary docs/conventions SHALL be handwritten in English. It SHALL have no active project manifest or active generated template/instruction tree. Bundled target templates SHALL remain package data outside that handwritten instruction set.

#### Scenario: Source repository instructions are maintained
- **WHEN** its AGENTS.md or own conventions need an edit
- **THEN** the files are edited directly in English without running init or sync against this repository

### Requirement: Guide content becomes conventions only when useful

During implementation the five guides SHALL be reviewed before deletion, using their restored files and Git as needed. Only useful current rules SHALL become handwritten English conventions with meaning preserved and disposition recorded in this change. After conversion/review, guides and presentation SHALL be deleted; docs SHALL contain only necessary conventions. Planning SHALL leave those source files unchanged.

#### Scenario: An old guide mixes rules and obsolete procedures
- **WHEN** its content is reviewed for conversion
- **THEN** only useful current rules enter conventions and the discarded material is not repackaged as a rule

#### Scenario: Only the proposal is being reviewed
- **WHEN** planning artifacts are revised before implementation is authorized
- **THEN** the guides, presentation, handwritten instructions, skills, templates, and runtime files remain unchanged

## REMOVED Requirements

### Requirement: The public interface has four command roots

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Node is supplied by the environment

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Initialization creates a usable local project

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Initialization preview is zero-write

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Local files determine inclusion

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Configuration remains in the manifest

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Base modes preserve independent authoring

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Validation includes applicable environment diagnostics

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Results preserve automation contracts

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Manifest-driven update is separate from authoring

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Skill guidance checks installed capabilities

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Base and consumer roles are exclusive

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: A base owns its simple AGENTS.md

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.
