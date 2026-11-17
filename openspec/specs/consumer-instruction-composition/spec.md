# consumer-instruction-composition Specification

## Purpose

Keep editable instruction sources distinct from generated documents and synchronize them through the repository's public workflow.

## Requirements

### Requirement: Instruction changes target their sources

Consumers SHALL maintain convention content in source `.tpl.md` files and composition in `agents-compose.yml`. `AGENTS.md` and published convention documents MUST be treated as generated artifacts rather than editable sources.

#### Scenario: A user requests a change to a published document
- **WHEN** a user requests a change to `AGENTS.md` or a published convention
- **THEN** the agent updates the applicable source and manifest
- **AND** uses the authorized public synchronization workflow to generate the resulting documents

### Requirement: Synchronization uses the pinned checkout

With a base, synchronization SHALL resolve its main template and remote sources from `agents.repository/ref`. Version-2 local-only composition SHALL use the local main template without Git access. Both modes SHALL use the installed CLI engine, respect version-specific local inclusion, and preserve the installed integration during generation.

#### Scenario: A base is targeted by synchronization
- **WHEN** synchronization targets an identified base root
- **THEN** it rejects the consumer operation before resolving inputs or writing documents
- **AND** the base AGENTS.md is preserved

#### Scenario: A convention is maintained locally by a consumer
- **WHEN** a version-1 entry has `origin: local`, or a version-2 parent is discovered in the configured local root
- **THEN** its source resolves under the consumer's `local.tpl_dir`

#### Scenario: A developer creates or copies a local rule
- **WHEN** a version-2 project puts a valid parent under its local source root and synchronizes
- **THEN** the family participates without separate registration
- **AND** its document and discovery entry are generated through the normal engine

#### Scenario: Shared configuration changes
- **WHEN** the manifest declares a different valid base or remote selection and synchronization is previewed
- **THEN** its effects are shown without modifying documents or sources

#### Scenario: A content checkout contains executable files
- **WHEN** the CLI synchronizes a valid selected content reference that also contains scripts
- **THEN** it reads the selected templates and conventions as data using the installed engine
- **AND** it does not copy or execute those scripts

#### Scenario: The content reference changes
- **WHEN** a configured project without a content lock explicitly changes its content reference and synchronizes
- **THEN** that reference selects the document sources
- **AND** the installed CLI and integration remain unchanged

#### Scenario: A content-only company base is selected
- **WHEN** the chosen Git checkout has a valid base template and selected custom convention families but no engine, npm package, or tool integration
- **THEN** the installed CLI composes those sources with the project's selected local instructions
- **AND** synchronization does not require our starter catalog or additional files from our repository

### Requirement: Every published document identifies its generated status

Synchronization SHALL prefix `AGENTS.md` and all published parent and child conventions with a visible notice that they are generated and must be changed through their sources and manifest.

#### Scenario: A nested child convention is published
- **WHEN** synchronization publishes a child document in a nested directory
- **THEN** it receives the same generated-file notice as its parent and `AGENTS.md`

### Requirement: Completed OpenSpec changes preserve their specifications

The OpenSpec workflows SHALL synchronize approved delta specifications into `openspec/specs/` and preserve completed changes in `openspec/changes/archive/` through `openspec-archive-change`.

#### Scenario: A completed change is archived
- **WHEN** a user requests archiving a completed change with specification deltas
- **THEN** the workflow assesses and completes the required specification synchronization before moving the change into the archive

### Requirement: The installed engine preserves supported composition behavior

For valid version-1 sources, the installed engine SHALL preserve manifest order, parent/child discovery cards, configured relative output paths, generated-file notices, UTF-8 text, LF line endings, and write-only-if-changed behavior. Expected behavior SHALL be verified against accepted candidate fixtures. Private pre-release formats and tooling SHALL NOT create a public backward-compatibility obligation.

#### Scenario: A valid composition is generated with the new engine
- **WHEN** the CLI renders the accepted version-1 candidate inputs
- **THEN** its published document bytes match the recorded expected results
- **AND** a second CLI synchronization reports no document changes

#### Scenario: A confirmed invalid destination used to pass validation
- **WHEN** a fixture relies on a reserved-destination or case-equivalent collision
- **THEN** the CLI rejects it with a diagnostic rather than preserving the unsafe legacy behavior

#### Scenario: The selected content is the simplified base
- **WHEN** the CLI renders the accepted two-source catalog with a neutral consumer's local context
- **THEN** it matches that candidate's expected composition without injecting the agents repository's local policies
- **AND** a separately selected repository-local policy profile retains its own instructions and provenance

#### Scenario: A destination directory contains unselected files
- **WHEN** the CLI generates its selected outputs before ownership-based cleanup exists
- **THEN** unrelated or unselected files remain unchanged instead of being deleted by name inference

### Requirement: Company authors control shared instruction content

The base's editable template and conventions SHALL define its shared policy content. Projects SHALL select remote families and maintain project-specific local sources. The CLI SHALL enforce the structural composition contract without inserting tool-maintainer policies or silently replacing company-authored content from packaged starters.

#### Scenario: A company changes a starter convention
- **WHEN** a consumer selects the company's published modified starter source
- **THEN** generation reflects the selected company commit rather than the CLI package's starter copy
- **AND** changing the installed CLI alone does not replace that authored policy

### Requirement: Discovery is deterministic and validates whole families

Version-2 local discovery SHALL recursively classify source families using existing parent/child naming rules. It SHALL order parents by portable normalized relative path and keep each child with its parent. Non-template files SHALL be ignored; malformed templates, orphan children, unsafe paths, and duplicate destinations SHALL be rejected before publication.

#### Scenario: The same files were created by different methods
- **WHEN** two projects have identical manifests and source contents, one created with an editor and the other copied from an existing valid template
- **THEN** they produce the same plan and generated content

#### Scenario: A source folder contains an orphan or invalid template
- **WHEN** validation, preview, check, or generation scans that folder
- **THEN** it reports the invalid family before writing any document

#### Scenario: A parent is moved out of the source directory
- **WHEN** discovery runs after the move
- **THEN** that parent is absent from the expected composition
- **AND** existing generated-file removal remains subject to the applicable ownership/cleanup policy rather than an implicit unsafe deletion

### Requirement: Local and remote modes share generation guarantees

Both modes SHALL share source validation, discovery rendering, generated notices, path protection, planning, and preview/check semantics. Valid version-1 fixtures SHALL retain their content and repeat-run behavior. Directory discovery SHALL not create a second generator or modify the manifest while scanning.

#### Scenario: Generation is repeated unchanged
- **WHEN** a valid version-1 or version-2 project repeats synchronization without source/configuration changes
- **THEN** no document rewrite is planned
- **AND** generated status notices and parent/child discovery remain consistent

### Requirement: Preview apply and check expose concrete document effects

Sync SHALL report concrete create/update/no-op document paths from the common plan. --dry-run and --check SHALL preserve sources, manifest, integration, documents, and Git refs, while permitting the documented Git-backed cache resolution. Application SHALL write only planned safe document changes; check SHALL return 0 if current or 1 if divergent.

#### Scenario: A copied rule has no generated document yet
- **WHEN** sync --dry-run finds a valid newly added commits.tpl.md
- **THEN** it lists AGENTS.md and the convention output as intended creates/updates without writing them
- **AND** applying sync writes those planned documents

#### Scenario: An unchanged project is checked
- **WHEN** sync --check finds every expected document current
- **THEN** it returns 0 without rewriting documents

#### Scenario: A generated document is outdated
- **WHEN** sync --check detects a difference from the expected plan
- **THEN** it returns 1 and identifies the differing document without applying the change
