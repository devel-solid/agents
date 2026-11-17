# Spec Delta

## Purpose

Deliver the complete experimental CLI as a small, MIT-licensed public npm package and an independently initialized public source repository using ordinary maintainer operations.

## ADDED Requirements

### Requirement: The first public artifact has one explicit identity

The maintained product SHALL be agents-cli, the package @devel-solid/agents-cli, and the public repository devel-solid/agents-cli. The executable SHALL remain agents. The initial version SHALL be 0.1.0 under MIT, with license text and repository/package metadata included. Private version 3.0.2 and old content tags SHALL NOT determine the initial version.

#### Scenario: The initial release candidate is prepared
- **WHEN** the candidate metadata and archive are inspected
- **THEN** product, package, repository links, version, executable, and MIT license agree on the approved public identity

### Requirement: The first release includes the complete language experience

The first public artifact SHALL include English product text/documentation and complete en and pt-br project scaffolds and skills. The concise README SHALL describe the final manifest/template workflow and native publication. Before delivery, guides SHALL be reviewed for useful rules and then removed with the presentation; docs SHALL contain only necessary own conventions. English SHALL ship in the first release.

#### Scenario: Initial publication readiness is reviewed
- **WHEN** the 0.1.0 release candidate is presented
- **THEN** its documented default is English and init --lang pt-br is available in the same candidate
- **AND** no base/consumer, shared-catalog, or subconvention journey remains in maintained product instructions

### Requirement: Release readiness uses unit-only tests and ordinary artifact inspection

Readiness SHALL require passing lightweight unit-only default gates, build, and inspection of the npm package file list and metadata. It SHALL NOT require an integration suite, disposable Git repositories, fake registries, package-installation tests, Python oracle, or resource-heavy acceptance matrix. Build and native packaging SHALL remain delivery operations rather than hidden integration-test gates.

#### Scenario: The candidate is ready for delivery review
- **WHEN** unit gates and build pass and the package contents are inspected
- **THEN** readiness evidence identifies the exact candidate and its required assets without claiming unperformed installation or integration tests

### Requirement: Public source begins with reviewed independent history

The first public source repository SHALL be created from an explicitly reviewed final-file snapshot with independent Git history. It SHALL exclude the private .git history, deleted changes, caches, temporary artifacts, obsolete base content, and integration-test fixtures. The current development checkout and its history SHALL remain available until the handoff is verified.

#### Scenario: A clean public source handoff is authorized
- **WHEN** the reviewed inventory is exported and the new repository initialized
- **THEN** its root history is independent and its source matches the approved snapshot
- **AND** the current checkout is not reset, force-pushed, or deleted

### Requirement: Publication uses a concrete native maintainer procedure

The maintainer SHALL use ordinary Git and npm operations for the reviewed source commit, v0.1.0 tag, and exact package artifact. The procedure SHALL NOT add public release commands, publication-plan engines, multiple content streams, or recovery journals. Repository creation, commits, tags, pushes, and npm publication SHALL wait for their concrete later authorization.

#### Scenario: Planning or implementation readiness completes
- **WHEN** all local artifacts or code are ready but external execution is not yet authorized
- **THEN** no repository creation, commit, tag, push, or npm publication occurs
- **AND** the actual delivery tasks remain incomplete in this same change

### Requirement: Actual delivery is verified without republishing immutable versions

After authorized publication, the maintainer SHALL verify the public repository commit/tag and registry name, version, visibility, and artifact integrity against the candidate. An ambiguous publication response SHALL be resolved by inspecting those native systems. A conflicting existing version or tag SHALL stop delivery without replacing published identities.

#### Scenario: The npm publication response is lost
- **WHEN** registry metadata for @devel-solid/agents-cli@0.1.0 is inspected
- **THEN** matching artifact integrity is treated as successful delivery and mismatched content stops the procedure
- **AND** the version is not blindly republished or replaced

#### Scenario: Delivery has not occurred
- **WHEN** only unit results and local package inspection exist
- **THEN** the change reports local readiness and leaves actual publication and remote verification pending

### Requirement: Account prerequisites are checked without collecting secrets

The later release procedure SHALL verify repository availability, npm scope permissions, and an available native publishing authentication method. Credentials SHALL NOT be embedded in commands, logs, plans, or artifacts. Missing permissions SHALL remain explicit external delivery blockers without changing the product architecture.

#### Scenario: The publisher lacks the required npm permission
- **WHEN** publication preflight detects the missing permission
- **THEN** it reports the required account action without requesting a token in chat or adding a publication service to the CLI

### Requirement: This change owns implementation through first delivery

This single change SHALL cover simplification, source/specification cleanup, languages, skills, unit tests, documentation, package readiness, clean public handoff, and the actual first release. Completion SHALL require actual authorized delivery verification; a later English change or a local rehearsal SHALL NOT substitute for that delivery.

#### Scenario: The package is ready but not published
- **WHEN** the change status is reviewed
- **THEN** delivery checkboxes remain open and the change is not represented as fully delivered
