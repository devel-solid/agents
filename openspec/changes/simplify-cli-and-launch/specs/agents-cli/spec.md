# Spec Delta

## ADDED Requirements

### Requirement: The installed CLI runs with Node alone

The package SHALL expose agentscli using its declared Node.js runtime lines. Init, validate, and sync SHALL use installed package resources and project files without Git, Python, Make, a compiler, a development checkout, or runtime network access. Installation SHALL require no lifecycle build or additional resource download.

#### Scenario: A project has only Node and the installed CLI
- **WHEN** the developer initializes, validates, and synchronizes the project
- **THEN** the operations use packaged resources and project templates without external tools or network resource lookup

#### Scenario: A user installs the published artifact
- **WHEN** npm installs the prepared package
- **THEN** its executable and resources are ready without compiling TypeScript or fetching setup resources through install scripts

### Requirement: The public interface has three operations

The CLI SHALL expose only init, validate, and sync, with help/version flags. It SHALL retain --repo-root and --json, init --lang/--dry-run, and sync --dry-run/--check. Removed release/base/remote options and misplaced or incompatible options SHALL fail without writes.

#### Scenario: Public help is requested
- **WHEN** agentscli --help runs
- **THEN** it describes the three operations and their manifest, template, document, and skill effects

#### Scenario: An obsolete option is requested
- **WHEN** a caller requests release, --base, or a removed remote option
- **THEN** the CLI reports actionable usage failure without changing files

### Requirement: Initialization preserves authored inputs while replacing client configuration

Every successful init SHALL replace agentscli-compose.yml with requested/default language and default roots. It SHALL create missing setup/initial outputs and preserve valid existing templates, regular skill files, and existing generated documents until sync. An unmarked required document destination SHALL block preflight.

#### Scenario: Initialization is repeated
- **WHEN** init encounters an initialized project
- **THEN** it replaces the manifest while preserving valid existing templates, skills, and generated documents

#### Scenario: Handwritten content occupies an output destination
- **WHEN** an unmarked AGENTS.md would be overwritten by initialization
- **THEN** init fails before setup writes and explains preserving useful content in the template and resolving the destination

### Requirement: Validation and synchronization share one project plan

Validate, sync, sync --dry-run, and sync --check SHALL share source/path/conflict validation. Preview and check SHALL write nothing. Check SHALL return 1 for valid document or managed-skill drift; preview SHALL describe the same planned effects with exit 0. Invalid input SHALL fail before writes.

#### Scenario: Only a managed skill has drifted
- **WHEN** documents match but a packaged skill file differs or is missing
- **THEN** sync --check reports drift with exit 1 and preview describes the skill repair without writing

#### Scenario: A source is invalid
- **WHEN** validation finds an invalid template or unsafe managed destination
- **THEN** preview, check, and sync report the same blocking diagnostic without changing files

### Requirement: Results have stable JSON and exit semantics

Commands SHALL support a JSON envelope with schemaVersion, command, ok, changes, and diagnostics. Exit codes SHALL be 0 for success, 1 for check drift, 2 for usage/validation/conflicts, and 3 for operational failures. JSON stdout SHALL contain one document and distinguish planned effects from completed writes.

#### Scenario: A caller requests JSON preview
- **WHEN** sync --dry-run --json describes document and skill effects
- **THEN** stdout is one JSON result describing planned changes without claiming completed writes

#### Scenario: A file operation fails
- **WHEN** a planned write cannot complete
- **THEN** exit 3 identifies partial completion and unfinished work without claiming success

### Requirement: Validation checks project inputs without repairs

Validate SHALL check root, client manifest, language, template structure, safe paths, and destination conflicts without generating or installing anything. Malformed Markdown SHALL identify source locations. Missing skills alone SHALL NOT block direct validation or synchronization.

#### Scenario: A convention lacks its discovery card
- **WHEN** validate inspects that template
- **THEN** it identifies the source and structural error with exit 2 without changing files

#### Scenario: Client skills are absent
- **WHEN** valid client templates exist without the distributed skills
- **THEN** direct validation is available and sync can recreate the missing skills

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
