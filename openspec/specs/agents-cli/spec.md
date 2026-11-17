# agents-cli Specification

## Purpose

Provide a supported, installable command-line interface for composing shared agent instructions without exposing implementation script paths.

## Requirements

### Requirement: Runtime implementation follows the accepted content stage

Runtime implementation SHALL start only after `simplify-shared-conventions` has been validated, accepted by the user, synchronized into permanent specifications, and archived. Its authored-candidate gate SHALL suffice without requiring an external content release or a later modernization stage.

#### Scenario: Catalog simplification is not yet accepted
- **WHEN** runtime implementation is about to begin
- **THEN** the workflow reports the unmet content-stage prerequisite and stops before implementing the CLI

### Requirement: A packaged command runs without Python

The tool SHALL expose the executable `agents` from a public-npm-ready package. Its packed artifact SHALL support local installation and npm execution with Node.js and Git, without Python, Make, a source checkout, or a TypeScript compiler on the consumer machine.

#### Scenario: A fresh consumer installs the packed artifact
- **WHEN** the package tarball is installed in an environment containing a supported Node.js runtime and Git but no Python or Make
- **THEN** `agents --version`, `agents --help`, and the documented consumer commands run from the installed artifact
- **AND** no runtime dependency is resolved from the development checkout

### Requirement: Initialization is explicit and preserves existing documents

Parameter-free agents init SHALL create a local-only v2 manifest, main/context templates, and the packaged agents-write-conventions and agents-update-docs integrations. It SHALL discover local families through the configured directory, preserve valid existing v1/v2 manifests and documents, reject integration conflicts before partial writes, and remain idempotent.

#### Scenario: A consumer already has a valid manifest
- **WHEN** `agents init` is run beside a valid version-1 `agents-compose.yml`
- **THEN** its bytes and the existing `AGENTS.md` remain unchanged
- **AND** the packaged integration is installed or a precise conflict is reported

#### Scenario: Initialization is repeated
- **WHEN** initialization succeeds and is repeated without input changes
- **THEN** no existing source, manifest, integration, or document is rewritten

#### Scenario: A new consumer selects the simplified content base
- **WHEN** a new local v2 project is initialized and its author explicitly adds a pinned base and remote selections to the manifest
- **THEN** its manifest selects the two initial shared conventions and consumer-owned local context
- **AND** it does not copy or mandate this repository's local operational, language, commit, testing, or skill policies

#### Scenario: A new consumer selects a company-owned base
- **WHEN** the author initializes locally and configures the selected company repository, ref, and remote parent entries in the manifest
- **THEN** its manifest selects those families and its own local context without assuming our repository or starter filenames
- **AND** validation rejects invalid remote configuration before generating documents

### Requirement: A company can initialize an independently owned content base

`agents init --base` SHALL scaffold its owned AGENTS.md, role marker, consumer main template, empty catalog/readmes, and CLI-packaged agents-write-conventions plus agents-update-version under their .agents/skills/<name>/ directories. It SHALL require no Git/network or consumer manifest and perform no Git/publication operations. --starter minimal SHALL add editable copies of the two neutral starter conventions.

#### Scenario: A company creates a base from the installed package
- **WHEN** `agents init --base` runs in a fresh directory with Node.js and the installed CLI
- **THEN** the scaffold can be validated and edited without our content repository, Git, npm metadata, or engine scripts in the base
- **AND** packaged agents-write-conventions and agents-update-version are installed, while no repository, remote, commit, tag, lock, consumer ownership record, agents-update-docs, or generated consumer document is created

#### Scenario: Starter content is explicitly requested
- **WHEN** `agents init --base --starter minimal` succeeds
- **THEN** the company receives editable copies of the minimal template and two accepted neutral starter conventions
- **AND** their future content/versioning is independent of npm upgrades and the tool's upstream catalog

### Requirement: Base initialization preserves authored files

Base initialization SHALL validate its full target plan before writes, preserve unrelated files, leave exact existing targets unchanged, and reject conflicting targets before mutation. It SHALL support `--repo-root`, `--dry-run`, and `--json`. Init SHALL NOT accept consumer-selection flags; --starter SHALL require base mode.

#### Scenario: A company has edited a scaffold target
- **WHEN** reinitialization encounters different bytes at a planned target
- **THEN** it reports a conflict and preserves every existing file without partially installing the remaining scaffold

#### Scenario: Initialization is previewed or repeated
- **WHEN** a company previews base initialization or repeats the same successful initialization
- **THEN** preview writes no files and an identical repeated initialization performs no rewrites

### Requirement: Base authors can validate the whole catalog independently

`agents validate --base` SHALL require valid base identity and owned AGENTS.md without a consumer manifest, and validate the scaffold template and every convention family under its source root using the shared source/path contracts. It SHALL accept an empty catalog, reject invalid or orphan sources, report source locations, and require no consumer manifest, Git, or network. It SHALL NOT generate documents or create setup.

#### Scenario: An unselected convention is invalid
- **WHEN** base validation inspects a catalog containing an invalid source that no consumer currently selects
- **THEN** it reports that source as invalid without changing the base

#### Scenario: A company uses its own larger catalog
- **WHEN** the base contains valid custom families with more than two parents and none of our starter filenames
- **THEN** base validation succeeds and consumers can select those families through the standard manifest

### Requirement: npm delivery is independent of instruction-base ownership

The npm artifact SHALL contain the CLI and required schema, integration, reference, and scaffolding assets. Company bases SHALL be consumable as Git-hosted content without an npm package, copied engine, or access to modify our repository. The tool SHALL NOT require our catalog or contact it when a different base is selected.

#### Scenario: Two projects use one company base
- **WHEN** two projects use the installed CLI with the company's tagged content-only base and their own selections
- **THEN** each generates its selected shared instructions and local context without downloading tool code from the base
- **AND** no access to our content repository or publication of the company's rules on npm is required

### Requirement: Validation preview and synchronization share a result model

The CLI SHALL expose `validate`, `sync`, `sync --dry-run`, and `sync --check` using the same validated composition and rendering behavior. Dry run and check SHALL NOT change published documents, authored sources, manifest, or installed integration. Online source-cache activity SHALL be disclosed separately from project changes.

#### Scenario: Generated documents have drifted
- **WHEN** check mode finds expected document changes with valid source inputs and no ownership or target-precondition conflict
- **THEN** it reports their paths and returns exit code 1 without changing them
- **AND** dry run reports the same intended document changes with exit code 0

#### Scenario: Composition is invalid
- **WHEN** a source or destination fails validation
- **THEN** preview and normal synchronization report the same validation error before publishing any document

### Requirement: Command results support humans and automation

Commands SHALL provide help and `--json` output with an envelope containing `schemaVersion`, `command`, `ok`, `changes`, and `diagnostics`. Exit codes SHALL be 0 for success, 1 for check drift, 2 for usage, validation, prerequisite or conflict errors, and 3 for operational failures. JSON stdout SHALL contain one document without raw subprocess output.

#### Scenario: Git is unavailable
- **WHEN** a command that requires Git runs without an available Git executable
- **THEN** it returns exit code 2 with an actionable prerequisite diagnostic
- **AND** normal output has no traceback and JSON mode contains the same diagnostic in its envelope

### Requirement: Validation explains applicable prerequisites

Agents validate SHALL inspect Node, applicable Git prerequisites, root, manifest, source paths, and integration compatibility without repairing or installing anything. Local-only composition SHALL not require Git. Debug output SHALL add technical detail without changing validation acceptance.

#### Scenario: A consumer has an unsupported manifest version
- **WHEN** validate inspects that consumer
- **THEN** it identifies the incompatible version and source location
- **AND** it preserves the manifest and documents

### Requirement: A base release creates one calculated local tag

Agents release --bump patch|minor|major SHALL calculate from reachable stable Git tags, validate the base and committed clean state, and create one non-forcing local tag at HEAD. Dry-run SHALL report the same calculation without writes. No current/next version parameters, consumer manifest, npm metadata, remote, or publication SHALL be required.

#### Scenario: A maintainer previews and applies a release
- **WHEN** the maintainer selects minor with baseline v1.2.3
- **THEN** preview reports v1.3.0 without changes and application creates its local tag
- **AND** neither operation edits consumer pins or publishes externally

### Requirement: The installed package is verified across supported platforms

The project SHALL test its installed artifact and meaningful candidate regression scenarios on Windows and Linux with its declared supported Node.js LTS lines. CI and the local pre-push gate SHALL exercise behavior rather than relying only on configuration-text assertions.

#### Scenario: A candidate CLI is ready for stage acceptance
- **WHEN** the candidate tarball is tested against the accepted neutral/local version-1 fixtures
- **THEN** generated documents match the expected UTF-8/LF content, discovery structure, ordering, and paths except for declared regressions
- **AND** a repeated sync produces no document changes
- **AND** the evidence is presented for user review before starting the next change

#### Scenario: No external consumer exists before launch
- **WHEN** the runtime-stage gate is evaluated
- **THEN** disposable fresh and configured projects supply installation and behavior evidence
- **AND** no real consumer migration, private-version support, or creation of the future public repository is required
