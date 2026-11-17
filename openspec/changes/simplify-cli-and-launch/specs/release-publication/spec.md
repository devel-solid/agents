# Spec Delta

## Purpose

Deliver the complete experimental agentscli product as a small MIT-licensed npm package, preserving the existing source history and using ordinary native Git/npm maintainer operations.

## ADDED Requirements

### Requirement: The first public artifact has one explicit identity

The product, repository name, unscoped npm package, and executable SHALL be agentscli. Public repository links SHALL use devel-solid/agentscli. The initial version SHALL be 0.1.0 under MIT with consistent package/lockfile metadata and license text. Private 3.0.2 and old content tags SHALL NOT determine the initial version.

#### Scenario: Initial release metadata is inspected
- **WHEN** the candidate archive and maintained metadata are reviewed
- **THEN** package, executable, repository links, version, and license agree on agentscli@0.1.0 under MIT

### Requirement: The first release includes both document languages and English skills

The first artifact SHALL include English product text, en and pt-br project document templates/notices, and the three English client skills. The concise English README SHALL explain the final workflow and publication. No later English change or release SHALL be required.

#### Scenario: Language readiness is reviewed
- **WHEN** the 0.1.0 candidate is presented
- **THEN** en is the default, --lang pt-br is available, all three client skills are English, and no chat-language policy is added

### Requirement: The published package contains only delivery resources

The npm package SHALL contain compiled runtime code, client templates and complete distributed skill trees, README, license, and package metadata. Internal skills/manifest, OpenSpec, tests, obsolete assets, and development-checkout references SHALL be excluded. Installation SHALL require no compilation or extra setup-resource downloads.

#### Scenario: Package contents are inspected
- **WHEN** npm pack --dry-run and the candidate archive are reviewed
- **THEN** the required runtime/client resources and metadata are present and repository-only material is absent

### Requirement: Readiness uses unit-only gates and ordinary artifact inspection

Readiness SHALL require passing lightweight unit/type/format gates, build, and package file/metadata inspection. It SHALL NOT require integration, installed-package, subprocess, Git/registry test suites, disposable environments, or a resource-heavy matrix. Native build/packaging SHALL remain delivery operations.

#### Scenario: The candidate is ready for delivery review
- **WHEN** unit gates, build, and package inspection pass
- **THEN** evidence identifies the candidate without claiming unperformed installation or integration tests

### Requirement: Repository rename preserves existing history

The existing source repository SHALL be renamed to devel-solid/agentscli with remote URLs and public references updated. Existing Git history and refs SHALL be preserved. The rename SHALL NOT export an independent-history snapshot, initialize a replacement repository, purge history, reset the checkout, or force-push.

#### Scenario: The authorized rename completes
- **WHEN** the existing repository is renamed and its remote is updated
- **THEN** the new identity exposes the preserved commit history and refs without an independent public-history handoff

### Requirement: An internal skill guides native CLI versioning and publication

Repository-only agentscli-release SHALL guide CLI version changes, unit gates, build/package inspection, concrete commit/tag/artifact review, authorized Git/npm delivery, and verification. It SHALL NOT be installed in clients or add a release command, publication engine, content-release stream, or recovery journal.

#### Scenario: A maintainer prepares a release
- **WHEN** the internal release skill handles the request
- **THEN** it uses native Git/npm within the requested authorization and presents concrete source/artifact identities before external delivery

### Requirement: Delivery effects wait for corresponding authorization

Repository rename, commit, tag, push, and npm publication SHALL wait for their corresponding execution authorization. Planning and local readiness SHALL perform none of those effects. The delivery procedure SHALL identify the reviewed source commit, v0.1.0 tag, exact artifact, and expected public effects.

#### Scenario: Local readiness is complete without publication authorization
- **WHEN** the candidate is ready but external effects are not authorized
- **THEN** those effects do not occur and actual delivery tasks remain pending

### Requirement: Delivery verification respects immutable identities

After authorized publication, the maintainer SHALL verify public commit/tag and registry name/version/visibility/integrity against the candidate. Ambiguous responses SHALL be resolved by inspecting native remote state. Conflicting existing tags or versions SHALL stop delivery without replacement.

#### Scenario: The publication response is lost
- **WHEN** registry metadata for agentscli@0.1.0 is inspected
- **THEN** matching integrity confirms delivery, mismatching content blocks it, and no blind republish occurs

#### Scenario: Only local package evidence exists
- **WHEN** change completion is reviewed
- **THEN** it reports local readiness and leaves actual publication/remote verification open

### Requirement: Account and name prerequisites are checked without collecting secrets

Release preparation SHALL verify repository access, npm package-name eligibility/account permission, and native authentication. A previous public-registry 404 SHALL NOT count as reservation or guaranteed publishability. Credentials SHALL NOT appear in chat, commands, logs, plans, or artifacts. Missing permission SHALL remain an explicit delivery blocker.

#### Scenario: A name lookup returned no package but publication is restricted
- **WHEN** the actual release checks detect a restriction
- **THEN** delivery stops with the required account action rather than claiming the name was reserved or adding a publication service

### Requirement: This change owns implementation through first delivery

This single change SHALL cover simplification, four canonical skills, both manifests, both document locales, unit tests, lean documentation, package readiness, history-preserving rename, and actual first release. Completion SHALL require verified authorized delivery rather than local readiness alone.

#### Scenario: The artifact is ready but unpublished
- **WHEN** change progress is reviewed
- **THEN** publication tasks remain open and the change is not represented as fully delivered
