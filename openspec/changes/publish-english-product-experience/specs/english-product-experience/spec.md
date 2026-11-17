# Spec Delta

## Purpose

Make the maintained product understandable in English, guide new company-base authors and project consumers through executable examples, and verify the next public package without breaking the established composition contracts.

## ADDED Requirements

### Requirement: English delivery follows the first verified public launch

This change SHALL start only after the four predecessor changes are accepted, synchronized, and archived and the first real public Git/npm release is remotely verified. It SHALL operate in the resulting public repository and exercise a subsequent release, without recreating its root or importing development history.

#### Scenario: Only initial-release rehearsal has passed
- **WHEN** English-stage implementation is requested without a verified first public package and Git identity
- **THEN** the unmet launch prerequisite is reported and the stage does not start

#### Scenario: The initial public launch is verified
- **WHEN** implementation starts from its approved public repository and released baseline
- **THEN** the next version uses ordinary release baselines rather than initial mode or private development tags

### Requirement: Maintained first-party product content is English

Maintained first-party natural-language content SHALL use en-US across CLI text, generated system prose, shipped assets, README/guides, metadata descriptions, instruction sources, comments, docstrings, and explanatory test text. Generated documents SHALL be regenerated from sources. Immutable history, technical literals, third-party/legal material, and deliberate language-test samples SHALL have documented exceptions.

#### Scenario: A user installs and explores the English package
- **WHEN** the installed executable shows help, validation diagnostics, validation/synchronization/release guidance, or new scaffold documentation
- **THEN** tool-owned prose is English and matches the corresponding packaged documentation
- **AND** stable command names, fields, diagnostic codes, JSON structure, and exit codes remain unchanged

#### Scenario: Translation coverage is reviewed
- **WHEN** the maintained file inventory and shipped artifact are checked
- **THEN** remaining Portuguese text is limited to explicit justified exceptions rather than untranslated public explanations
- **AND** comments or fixture descriptions are not excluded merely because users do not normally see them

### Requirement: Artifact language does not change policy ownership

The repository's authored policy SHALL select en-US for maintained artifacts and preserve pt-BR chat preferences and unrelated operational rules. The CLI SHALL preserve company-authored instruction language and content from the selected commit. English product defaults SHALL NOT impose an English policy on consumers or overwrite existing base sources.

#### Scenario: A company maintains Portuguese instructions
- **WHEN** the English CLI synchronizes that company's pinned base and local context
- **THEN** it preserves their authored language and semantics while tool-owned diagnostics and generated labels use English
- **AND** it does not translate, replace, or upload company content

### Requirement: English discovery remains compatible with published sources

The parser SHALL recognize the supported English discovery structure and the first public release's Portuguese structure outside code examples. Rendering SHALL retain source order, family discovery, UTF-8, and stable technical markers. Existing public source paths, pins, locks, and ownership protections SHALL remain valid; ambiguous structure SHALL fail before writes.

#### Scenario: The first public manifest remains valid
- **WHEN** translation verifies the released compatibility baseline
- **THEN** required schemaVersion 1, automatic local discovery, optional base and remote-only entries retain their meaning
- **AND** private development formats and schema v2 are not revived

#### Scenario: The first public base is consumed with the new CLI
- **WHEN** a project uses its original valid manifest, pinned content and ownership records with the English CLI
- **THEN** the composition remains resolvable without replacing its remote selection or public source filenames
- **AND** intended generated-prose changes appear through the ordinary plan and a second successful sync is unchanged

#### Scenario: A source contains English headings inside a code example
- **WHEN** the source is validated and rendered
- **THEN** example headings do not become operative discovery sections or invalidate an otherwise valid source

#### Scenario: Generated output was independently edited
- **WHEN** an English-prose update would replace a modified owned document
- **THEN** the established conflict rules preserve the edit and block the operation

### Requirement: The README teaches both author and consumer workflows

The English root README SHALL explain the problem, the CLI/base/project responsibilities, supported prerequisites, and executable quick starts for creating a base and consuming an existing one. It SHALL include a compact flow diagram, file tree, full manifest/source example, generated-result example, explicit update/version behavior, limitations, and links to detailed reference material.

#### Scenario: A developer has never seen the project
- **WHEN** the developer follows the root README with the installed package
- **THEN** the developer can create and validate a company base and generate a project's selected shared/local instructions without reading engine source
- **AND** the guide explains optional starters, private Git access, one remote base plus local sources, and the absence of general skill distribution

### Requirement: Published examples match the installable artifact

Documented quick starts and their referenced assets SHALL work from the packed and published package outside the source checkout. Repository/version placeholders SHALL be explicit, commands SHALL cover supported shell differences where necessary, and documentation links SHALL resolve in GitHub and npm contexts. Verification SHALL exercise behavior rather than only matching documentation strings.

#### Scenario: Both README workflows run in disposable projects
- **WHEN** the packed CLI creates a separate content base and two projects follow the documented consumption/update examples through fixture Git remotes
- **THEN** documented outputs and independent selections are observed without Python, Make, compiler, or checkout-only assets
- **AND** repeated sync and check succeed and existing authored sources remain unchanged

### Requirement: The English version uses the established release workflow

The subsequent English CLI version SHALL use the existing reviewed maintainer publication workflow, exact artifact identity, and public stream baselines. Content versions SHALL be assessed separately when Git-hosted starter/base sources change. The concrete commit, versions, target streams, and artifact SHALL be authorized before external effects; planning SHALL NOT publish anything.

#### Scenario: English work is locally ready but publication is not authorized
- **WHEN** tests and artifact preflight pass
- **THEN** readiness is reported with the concrete proposed ordinary-release plan
- **AND** publication and registry-verification tasks remain pending

#### Scenario: Both packaged starter and Git content were translated
- **WHEN** the release plan is reviewed
- **THEN** it assesses CLI and content stream changes independently and states supported adoption order and selected versions
- **AND** it does not silently move an old content tag or bump an unrelated company base

### Requirement: Completion includes the actual next registry and remote test

After authorized publication, verification SHALL install the exact new version from npm, verify its identity/integrity, and run the documented workflows against verified Git content. It SHALL test both fresh English scaffolds and the first public version's supported inputs, explicit updates, and no-change repetition. A local tarball or fake registry alone SHALL NOT satisfy this release gate.

#### Scenario: The subsequent public package is verified
- **WHEN** the exact new npm version is installed in a fresh directory with its planned remote content available
- **THEN** base initialization/validation, consumer initialization, preview, sync, check, and explicit content update work as documented
- **AND** verification records package/content identities, confirms no-change repetition, and preserves independently pinned consumers

#### Scenario: Registry installation or remote synchronization fails
- **WHEN** publication has occurred but a required verification does not pass
- **THEN** the stage remains incomplete with the failed step recorded for the established resume/corrective-release workflow
- **AND** the published version is not overwritten, republished, or hidden by claiming rehearsal success
