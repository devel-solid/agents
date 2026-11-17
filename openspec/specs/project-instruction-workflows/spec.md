# project-instruction-workflows Specification

## Purpose

Provide four clear public operations for preparing, validating, generating, and versioning instructions, with explicit file effects and previews.

## Requirements

### Requirement: The public interface has four command roots

The CLI SHALL expose only init, validate, sync, and release as public command roots. Help/version and supported common options SHALL remain flags. The public interface SHALL NOT expose new, doctor, convention-management, base-configuration, or release helper subcommands.

#### Scenario: A developer requests help
- **WHEN** agents --help runs
- **THEN** it documents the four commands and their file/tag effects with Bash examples
- **AND** it does not teach the retired helpers as separate user steps

#### Scenario: A caller uses a retired interface
- **WHEN** a caller invokes doctor or one of the four former release helper subcommands
- **THEN** it receives usage exit 2 with guidance to validate, release, or edit the consumer manifest as applicable
- **AND** the invocation makes no changes

### Requirement: Node is supplied by the environment

The CLI SHALL use the supported Node.js versions declared by its npm package and SHALL NOT install or bundle Node.js. Local-only init, validation, and generation SHALL require neither Git nor network. Git-backed composition and release SHALL require Git.

#### Scenario: A Node-only environment generates local instructions
- **WHEN** the installed CLI runs init, validate, and sync without a configured base
- **THEN** those operations work without Git, Python, Make, a compiler, or network

### Requirement: Initialization creates a usable local project

Ordinary init SHALL require no repository, reference, or convention arguments. New setup SHALL create a version-2 manifest, local main/context templates, and packaged agents-write-conventions and agents-update-docs integrations. It SHALL NOT fetch content, register local entries, initialize Git, or generate final documents.

#### Scenario: A new ordinary project initializes
- **WHEN** agents init runs inside a new project
- **THEN** it creates agents-compose.yml, templates/AGENTS.tpl.md, templates/docs/conventions-local/contexto-do-projeto.tpl.md, and both .agents/skills/agents-update-docs/SKILL.md and .agents/skills/agents-write-conventions/SKILL.md
- **AND** its context participates through directory discovery without a placeholder base
- **AND** AGENTS.md and docs/conventions outputs are not generated

#### Scenario: Existing authored content is encountered
- **WHEN** init finds a valid version-1 or version-2 project
- **THEN** it preserves the manifest, authored sources, and generated documents
- **AND** it installs only compatible missing setup or reports conflicts before partial writes

### Requirement: Initialization preview is zero-write

Init SHALL accept --dry-run in ordinary and base modes and report concrete create/preserve/conflict paths. Preview SHALL perform no file, directory, integration, cache, or Git writes.

#### Scenario: A developer previews setup
- **WHEN** agents init --dry-run runs in an empty directory
- **THEN** it reports the paths ordinary init would create
- **AND** the directory remains byte-for-byte unchanged

### Requirement: Local files determine inclusion

Version 2 SHALL discover every valid local parent family under local.tpl_dir. Manual creation and copying SHALL have identical inclusion semantics. No separate registration command, registry, CLI-created-file history, or local inclusion list SHALL exist.

#### Scenario: A developer copies a rule
- **WHEN** a valid commits.tpl.md is placed under the configured local root and sync runs
- **THEN** its family is included without another CLI operation or manifest entry
- **AND** its document is generated under out_dir

### Requirement: Configuration remains in the manifest

Repository/reference, source/output directories, and remote parent selections SHALL be configured in agents-compose.yml. Changing a consumer's pinned base SHALL be a manifest edit followed by sync; release SHALL NOT change that pin or automatically select all remote rules.

#### Scenario: A consumer adopts another base version
- **WHEN** agents.ref is edited to another valid available tag and sync preview runs
- **THEN** the plan shows document consequences of consuming that version
- **AND** no set-compose-ref or convention-add invocation is needed

### Requirement: Base modes preserve independent authoring

Init --base and validate --base SHALL support offline shared-base authoring with initialized base identity, without a consumer manifest or agents-update-docs. Init --base SHALL install CLI-packaged agents-write-conventions and agents-update-version, create its owned AGENTS.md, internal identity, consumer main template and empty catalog, with extra convention sources only for an explicitly requested starter. Ordinary init SHALL reject obsolete remote-selection flags.

#### Scenario: An author creates a base
- **WHEN** agents init --base runs
- **THEN** it creates README.md, templates/AGENTS.tpl.md, templates/docs/conventions/README.md, AGENTS.md, .agents/base.json, and both .agents/skills/agents-update-version/SKILL.md and .agents/skills/agents-write-conventions/SKILL.md
- **AND** it creates no consumer manifest, agents-update-docs integration, Git repository, or final documents

#### Scenario: Old combined setup is requested
- **WHEN** ordinary init receives repository/reference/convention flags
- **THEN** it returns usage exit 2 with manifest guidance and preserves project files

### Requirement: Validation includes applicable environment diagnostics

Validate SHALL check applicable Node/Git prerequisites, configuration, integration, templates, and paths without applying project or Git changes. --debug SHALL add detail without changing acceptance. --base SHALL validate the main template/catalog without a consumer manifest. Git-backed input resolution MAY populate the documented cache.

#### Scenario: Local files are valid without Git
- **WHEN** agents validate runs on a local-only version-2 project with Node and valid sources
- **THEN** absent Git does not cause failure and the command writes no project files or refs

#### Scenario: A convention lacks its discovery card
- **WHEN** validate inspects that source
- **THEN** it reports the source path and missing AGENT-CARD with exit 2 before generation
- **AND** --debug preserves the same outcome while providing technical detail

#### Scenario: The base is independently owned
- **WHEN** validate --base runs in a valid base without agents-compose.yml
- **THEN** it validates its main template and entire catalog without creating consumer setup

### Requirement: Results preserve automation contracts

The four commands SHALL retain deterministic noninteractive behavior, common JSON envelope fields, optional explicit project root, and existing exit meanings: success 0, sync check divergence 1, usage/validation/conflict 2, and operational failure 3. Results SHALL distinguish planned changes from completed writes.

#### Scenario: A script requests a preview
- **WHEN** a supported mutating command runs with --dry-run --json
- **THEN** the result identifies intended paths or tag and applicable diagnostics without claiming those changes were applied

### Requirement: Manifest-driven update is separate from authoring

The agents-update-docs skill SHALL only validate, preview, generate and check documents from the existing manifest and sources. It SHALL NOT author conventions, edit templates or configuration, change pins, initialize setup, or release a base. The CLI SHALL own mechanical validation, planning and generation. Authoring requests SHALL use agents-write-conventions; release requests SHALL use agents-update-version, with their respective scope boundaries.

#### Scenario: The user requests authoring only
- **WHEN** the agent uses agents-write-conventions to change only a source rule
- **THEN** it edits the requested source and reports generation as pending without writing outputs or creating tags

#### Scenario: The user requests a preview only
- **WHEN** the agent uses agents-update-docs to preview synchronization
- **THEN** it reports the sync --dry-run plan and stops without applying it

#### Scenario: Existing inputs produce an invalid composition
- **WHEN** agents-update-docs finds an invalid source or manifest
- **THEN** it reports the blocking input without changing its content or bypassing the generator

#### Scenario: Generation follows authorized body-only authoring
- **WHEN** agents-write-conventions changes only a rule body and agents-update-docs performs separately authorized generation
- **THEN** it reports the actual changed convention output and unchanged AGENTS.md where the effective discovery and template inputs remain identical
- **AND** it does not invoke init or release

### Requirement: Skill guidance checks installed capabilities

When support is not already known, the skill SHALL check the installed CLI's supported operations, flags, and manifest contract before using the proposed workflow. An unsupported requirement SHALL stop the affected operation with an incompatibility report, without CLI installation/update, silent legacy-helper fallback, invented results, or implicit schema migration.

#### Scenario: The installed release interface is older
- **WHEN** a requested version preview needs release --bump --dry-run but the installed CLI exposes only legacy helpers
- **THEN** the agent reports that the required preview is unavailable and creates no tag
- **AND** it neither claims a preview succeeded nor installs a replacement CLI

### Requirement: Base and consumer roles are exclusive

Base initialization SHALL create .agents/base.json with schemaVersion 1 and kind base. A base SHALL NOT contain a consumer manifest or run consumer init, validation or synchronization. Base validation and release SHALL require initialized identity. Role conflicts SHALL fail with PROJECT_ROLE_CONFLICT and exit 2 before writes; invalid identity SHALL report PROJECT_ROLE_INVALID. Role checks SHALL protect subdirectory execution without requiring markers in remote content checkouts.

#### Scenario: Initialization crosses roles
- **WHEN** consumer init targets a base or base init targets a consumer manifest
- **THEN** preview and application reject the request before writing any file

#### Scenario: A manifest is inserted manually into a base
- **WHEN** validation, release or any sync mode encounters that mixed root
- **THEN** the operation fails before changing instructions, cache, setup or tags

#### Scenario: The caller is inside a base subdirectory
- **WHEN** a consumer command is run there with or without an explicit root
- **THEN** the operation cannot fall through to an ancestor consumer manifest or overwrite the base AGENTS.md

#### Scenario: A directory alias targets a base subdirectory
- **WHEN** a consumer command targets a symlink or junction outside the base that resolves into its subdirectories
- **THEN** role discovery follows the physical ancestors and rejects the operation before writes
- **AND** explicit base initialization cannot initialize that subdirectory as another base

#### Scenario: A remote content checkout predates role markers
- **WHEN** a valid version-1 or version-2 consumer selects that base as an input
- **THEN** its sources remain consumable without installing metadata, skills or consumer setup into the checkout

### Requirement: A base owns its simple AGENTS.md

Init --base SHALL create a simple self-contained AGENTS.md from the CLI asset, separate from templates/AGENTS.tpl.md. Its instructions SHALL cover base authorship, skills, validation and reviewed versioning without convention discovery or consumer synchronization. Valid existing regular nonempty UTF-8 instructions SHALL be preserved without rewriting; invalid instructions or unsafe links SHALL block setup before writes.

#### Scenario: A new base is created
- **WHEN** init --base initializes an empty directory
- **THEN** seven files are created: role identity, owned AGENTS.md, root/catalog READMEs, consumer main template and two role-specific skills
- **AND** no consumer manifest or generated convention outputs are created

#### Scenario: The owner edits base instructions
- **WHEN** initialization is repeated with valid customized AGENTS.md
- **THEN** its bytes and timestamp remain unchanged

#### Scenario: Instructions are missing
- **WHEN** base validation detects missing AGENTS.md
- **THEN** it reports BASE_INSTRUCTIONS_MISSING without writing it
- **AND** an explicitly requested base init can preview and create the missing default
