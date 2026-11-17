# Spec Delta

## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: Initialization preserves authored inputs while replacing client configuration

**Reason**: Unconditional replacement discards the client's language and root mappings before an explicit migration can preserve its content.
**Migration**: Use fixed-layout initialization with preserved language, or init --migrate for a supported legacy client.

## ADDED Requirements

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
