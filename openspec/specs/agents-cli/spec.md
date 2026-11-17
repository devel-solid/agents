# agents-cli Specification

## Purpose

Provide a small installed command-line interface for generating a project's instructions from its own templates and packaged supporting skills.

## Requirements

### Requirement: The installed CLI runs with Node alone

The package SHALL expose agentscli using its declared Node.js runtime lines. Init, validate, and sync SHALL use installed package resources and project files without Git, Python, Make, a compiler, a development checkout, or runtime network access. Installation SHALL require no lifecycle build or additional resource download.

#### Scenario: A project has only Node and the installed CLI
- **WHEN** the developer initializes, validates, and synchronizes the project
- **THEN** the operations use packaged resources and project templates without external tools or network resource lookup

#### Scenario: A user installs the published artifact
- **WHEN** npm installs the prepared package
- **THEN** its executable and resources are ready without compiling TypeScript or fetching setup resources through install scripts

### Requirement: The public interface has three operations

The CLI SHALL expose only init, validate, and sync, with help/version flags. It SHALL retain --repo-root and --json, init --lang/--dry-run, and sync --dry-run/--check, and add --migrate only to init. No field or flag SHALL customize the fixed client directories. Removed, misplaced, repeated, or incompatible options SHALL fail without writes.

#### Scenario: Public help is requested
- **WHEN** agentscli --help runs
- **THEN** it describes the three operations, fixed client paths, preserved language/content, explicit migration, and document/skill effects

#### Scenario: An obsolete option is requested
- **WHEN** a caller requests release, --base, a removed remote option, or a directory-layout override
- **THEN** the CLI reports actionable usage failure without changing files

#### Scenario: Migration is requested explicitly
- **WHEN** init --migrate --lang pt-br --dry-run --json is parsed
- **THEN** it selects migration with the explicit language and write-free preview, using command init in the existing JSON envelope

#### Scenario: Migration is misplaced
- **WHEN** sync --migrate, validate --migrate, or init --migrate --check is requested
- **THEN** the CLI returns usage failure without dispatching writes

### Requirement: Validation and synchronization share one project plan

Validate, sync, sync --dry-run, and sync --check SHALL share source/path/conflict validation. Preview and check SHALL write nothing. Check SHALL return 1 for valid document or managed-skill drift; preview SHALL describe the same planned effects with exit 0. Invalid input SHALL fail before writes.

#### Scenario: Only a managed skill has drifted
- **WHEN** documents match but a packaged skill file differs or is missing
- **THEN** sync --check reports drift with exit 1 and preview describes the skill repair without writing

#### Scenario: A source is invalid
- **WHEN** validation finds an invalid template or unsafe managed destination
- **THEN** preview, check, and sync report the same blocking diagnostic without changing files

### Requirement: Results have stable JSON and exit semantics

Commands SHALL support a JSON envelope with schemaVersion, command, ok, changes, and diagnostics. Exit codes SHALL be 0 for success, 1 for check drift, 2 for usage/validation/conflicts, and 3 for operational failures. JSON stdout SHALL contain one document and distinguish planned effects from completed writes, including migration creations, updates, and deletions.

#### Scenario: A caller requests JSON preview
- **WHEN** sync --dry-run --json describes document and skill effects
- **THEN** stdout is one JSON result describing planned changes without claiming completed writes

#### Scenario: A file operation fails
- **WHEN** a planned write cannot complete
- **THEN** exit 3 identifies partial completion and unfinished work without claiming success

#### Scenario: Migration fails after some effects
- **WHEN** an operational failure interrupts init --migrate
- **THEN** the result reports completed and pending effects and instructs repeating init --migrate with the same options rather than ordinary sync

### Requirement: Validation checks project inputs without repairs

Validate SHALL check the root, .agentscli/config.yml, language, fixed template structure, safe paths, and destination conflicts without generating or installing anything. Malformed Markdown SHALL identify source locations. Missing skills alone SHALL NOT block direct validation or synchronization. A remaining agentscli-compose.yml SHALL block ordinary client operations with explicit migration guidance.

#### Scenario: A convention lacks its discovery card
- **WHEN** validate inspects .agentscli/templates/conventions/testing.tpl.md without its discovery card
- **THEN** it identifies the source and structural error with exit 2 without changing files

#### Scenario: Client skills are absent
- **WHEN** valid fixed-layout client configuration and templates exist without the distributed skills
- **THEN** direct validation is available and sync can recreate the missing skills

#### Scenario: Migration has not finished
- **WHEN** init without --migrate, validate, or sync in any mode encounters agentscli-compose.yml, even beside .agentscli/config.yml
- **THEN** it returns exit 2 with guidance to preview or finish init --migrate, without using the legacy roots for normal generation

### Requirement: Maintained CLI text is English

CLI help, diagnostics, and maintained developer documentation SHALL be English from 0.1.0. Init --lang SHALL select project document resource text without changing command names or prescribing the agent's chat language. All distributed skills SHALL remain English.

#### Scenario: Portuguese instructions are requested
- **WHEN** agentscli init --lang pt-br runs
- **THEN** new project templates/notices use Portuguese while CLI text, technical identifiers, and skills remain English

### Requirement: Versioned and default tests are lightweight units only

The repository SHALL version only lightweight unit tests and small unit data. npm test, npm run check, pre-push, and CI SHALL execute only units as their test workload. Integration/end-to-end/installed-package suites, subprocess/Git/registry tests, historical fixture matrices, and the Python oracle SHALL be absent.

#### Scenario: A default gate executes
- **WHEN** npm test, npm run check, pre-push, or CI runs
- **THEN** tests use isolated values or mocked boundaries without external processes, network, package installation, or disposable Git environments

#### Scenario: The test tree is reviewed
- **WHEN** obsolete test material is removed
- **THEN** only meaningful lightweight units/data remain and no opt-in integration suite or expanded acceptance matrix is introduced

### Requirement: Initialization preserves configured language and existing content

Init SHALL create missing fixed-layout setup and initial outputs while preserving valid existing templates, regular skill files, and marked output bodies until sync. Existing configuration SHALL retain its language unless --lang is explicit. Invalid configuration and unmarked required output destinations SHALL block all setup writes.

#### Scenario: Initialization is repeated
- **WHEN** init encounters a valid pt-br client with authored templates, edited regular skill files, and existing generated documents
- **THEN** it preserves the language and existing content while creating only missing required setup

#### Scenario: The language is explicitly changed
- **WHEN** init --lang en runs on that client
- **THEN** it changes the stored preference and uses English resources only for missing content without translating or replacing existing documents or templates

#### Scenario: Handwritten content occupies an output destination
- **WHEN** an unmarked AGENTS.md would be overwritten by initialization
- **THEN** init fails before setup writes and explains preserving useful content in the template and resolving the destination

#### Scenario: Invalid configuration is present
- **WHEN** init --lang pt-br encounters malformed .agentscli/config.yml
- **THEN** it reports a validation failure instead of replacing the configuration

### Requirement: Migration reuses the installed offline CLI

Init --migrate SHALL use only Node, installed resources, and project files. It SHALL support --dry-run without writing and retain common root/JSON options. With no legacy manifest and a valid new client it SHALL succeed with no effects; with neither client configuration it SHALL fail without implicitly initializing a project.

#### Scenario: A legacy client previews migration
- **WHEN** init --migrate --dry-run runs with the installed CLI
- **THEN** it reports the same validated effects as application without using Git, a network, package installation, or any writes

#### Scenario: Migration is repeated after completion
- **WHEN** init --migrate runs with no legacy manifest and an already valid fixed-layout client
- **THEN** it succeeds without changing files, including when --lang is supplied

#### Scenario: No client exists
- **WHEN** init --migrate encounters neither supported client configuration
- **THEN** it returns exit 2 and explains using ordinary init for a new client
