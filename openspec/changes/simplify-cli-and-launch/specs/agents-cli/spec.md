# Spec Delta

## ADDED Requirements

### Requirement: The installed CLI runs with Node alone

The package SHALL expose `agents` using its declared Node.js runtime lines. Project initialization, validation, and generation SHALL run without Git, network, Python, Make, a compiler, or a development checkout. Runtime assets SHALL come from the installed package.

#### Scenario: A project has only Node and the installed CLI
- **WHEN** the developer initializes, validates, and synchronizes the project
- **THEN** the operations use packaged resources and project templates without external tool or network access

### Requirement: Initialization preserves authored project inputs

Initialization SHALL create missing setup and initial outputs, preserve valid existing templates and installed skills, and preserve existing generated documents until synchronization is requested. An unmarked file occupying a required generated destination SHALL cause a preflight conflict. Every successful init SHALL replace the reduced manifest; other valid existing authored files SHALL be preserved.

#### Scenario: Initialization is repeated
- **WHEN** init encounters an unchanged initialized project
- **THEN** the manifest is replaced using the requested/default configuration while valid existing templates, skills and generated documents are preserved

#### Scenario: Authored content already occupies a generated destination
- **WHEN** an unmarked AGENTS.md would be overwritten by initial generation
- **THEN** init reports the conflict before writing any setup and directs the author to preserve that content in the template

### Requirement: Validation and synchronization use one project plan

The CLI SHALL derive validate, sync, sync --dry-run, and sync --check from the same source and destination validation. Preview and check SHALL write nothing. Check SHALL return 1 for valid generated-document drift; preview SHALL describe the same planned document effects with exit 0. Invalid inputs SHALL fail before writes.

#### Scenario: Generated documents have drifted
- **WHEN** the templates are valid but generated documents differ
- **THEN** check identifies the affected paths with exit 1 and preview reports the same create, update, or removal actions without writing

#### Scenario: A source is invalid
- **WHEN** validation detects an invalid template or unsafe destination
- **THEN** preview, check, and sync return the same blocking diagnostic without changing any document

### Requirement: Results have stable JSON and exit semantics

Commands SHALL provide help and optional --json output with schemaVersion, command, ok, changes, and diagnostics. Exit codes SHALL be 0 for success, 1 for sync check drift, 2 for usage/validation/conflicts, and 3 for operational failures. JSON stdout SHALL contain one document and distinguish planned effects from completed writes.

#### Scenario: An unsupported operation is requested
- **WHEN** a caller requests release or a removed option
- **THEN** the CLI returns exit 2 and an actionable diagnostic without changing files

#### Scenario: A file operation fails
- **WHEN** synchronization cannot complete a planned write
- **THEN** the CLI returns exit 3, identifies incomplete work, and does not claim the generation completed

### Requirement: Validation checks project templates without repairs

Validate SHALL check the project root, reduced manifest, supported language, template structure, input/output paths, and destination conflicts without generating or installing anything. It SHALL report source locations for malformed Markdown. Missing skills alone SHALL NOT prevent valid direct CLI use.

#### Scenario: A convention lacks its discovery card
- **WHEN** validate inspects that template
- **THEN** it identifies the template path and structural error with exit 2 without changing files

#### Scenario: Skills are absent
- **WHEN** the project has valid templates but no installed supporting skill
- **THEN** validation and synchronization remain available directly from the terminal

### Requirement: Maintained CLI text is English from the first release

CLI help, diagnostics, and maintained developer documentation SHALL be English from version 0.1.0. The init --lang option SHALL select created file text without changing command names, technical markers, or public option names. It SHALL NOT prescribe the agent's reply language.

#### Scenario: Portuguese project instructions are requested
- **WHEN** init --lang pt-br runs
- **THEN** project resources are Portuguese while the CLI interface and technical identifiers remain English

### Requirement: Versioned and default tests are lightweight unit tests only

The repository SHALL version only lightweight unit tests and small unit data. npm test, npm run check, Lefthook pre-push, and CI SHALL execute only unit tests as their test workload. No integration, end-to-end, installed-package, subprocess/Git/registry test suite, Python oracle, or costly fixture matrix SHALL be retained or introduced.

#### Scenario: A developer runs a default gate
- **WHEN** npm test, npm run check, pre-push, or CI executes
- **THEN** its tests are limited to lightweight units with mocked boundaries and no external process, network, package installation, or disposable Git environment

#### Scenario: The obsolete test tree is removed
- **WHEN** the simplified repository is reviewed
- **THEN** retained tests cover the new contract as units and historical integration suites and fixtures are absent

#### Scenario: CI runs the default gate
- **WHEN** the existing lightweight CI workload executes
- **THEN** it runs the same unit/type/format checks without an expanded acceptance matrix or installed-artifact scenarios

## REMOVED Requirements

### Requirement: Runtime implementation follows the accepted content stage

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: A packaged command runs without Python

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Initialization is explicit and preserves existing documents

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: A company can initialize an independently owned content base

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Base initialization preserves authored files

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Base authors can validate the whole catalog independently

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: npm delivery is independent of instruction-base ownership

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Validation preview and synchronization share a result model

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Command results support humans and automation

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Validation explains applicable prerequisites

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: A base release creates one calculated local tag

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: The installed package is verified across supported platforms

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.
