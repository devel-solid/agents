# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
