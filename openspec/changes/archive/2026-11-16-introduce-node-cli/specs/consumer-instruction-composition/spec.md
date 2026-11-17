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
