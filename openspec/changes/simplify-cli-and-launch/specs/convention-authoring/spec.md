# Spec Delta

## ADDED Requirements

### Requirement: Project conventions are authored as independent templates

Authors SHALL create, copy, edit, rename, or remove convention templates below the manifest templates_dir. Each independent template SHALL contain exactly one H1 and one complete nonempty AGENT-CARD outside code examples. The next validation or generation SHALL discover it without a per-convention manifest entry, registration command, parent file, or remote source.

#### Scenario: An author creates a complete rule
- **WHEN** a valid commits.tpl.md is saved in the convention template directory
- **THEN** validate recognizes it and the next sync generates its document and discovery entry
- **AND** saving the source alone does not invoke generation

#### Scenario: A template teaches Markdown syntax
- **WHEN** its fenced example contains headings and example card markers
- **THEN** those examples do not count as operational H1 or card markers and remain intact in its generated body

#### Scenario: Independent topics share a filename prefix
- **WHEN** policy.tpl.md and policy.details.tpl.md both exist
- **THEN** they are separate conventions with direct index entries and neither acquires child discovery

### Requirement: The authoring skill curates project templates

Agents-write-conventions SHALL guide applicability, actionable rules, small valid examples, real exceptions, and related-rule coherence. It SHALL edit the requested templates and distinguish structural validity from semantic quality. Review-only requests SHALL not edit sources. Authorship alone SHALL not publish packages; generation SHALL follow the scope requested through the installed CLI.

#### Scenario: A project requests a convention
- **WHEN** the skill handles source authorship
- **THEN** it edits the relevant project template, reviews related rules, and reports the checks actually performed
- **AND** it introduces no base, family, remote content source, or repository-independent policy

#### Scenario: Only a semantic review is requested
- **WHEN** the author requests findings without edits
- **THEN** the skill reports concrete issues without changing sources

#### Scenario: Authoring and generation are requested together
- **WHEN** the user asks to update a convention and its generated instructions
- **THEN** the skills complete source curation and authorized CLI generation without inventing an additional approval step

### Requirement: The CLI repository has its own direct authoring skill

The source repository SHALL maintain agents-write-repository-conventions for creating, reviewing, and maintaining handwritten docs/conventions and discovery references in its own AGENTS.md. The skill SHALL write English artifacts and require no manifest, template, init, or sync. It SHALL remain repository-only and SHALL NOT be packaged or installed into client projects.

#### Scenario: A maintainer creates an own convention
- **WHEN** the repository-only skill handles an authoring request
- **THEN** it edits the relevant handwritten English convention and discovery reference directly
- **AND** it does not invoke client initialization or generation

#### Scenario: A maintainer requests review only
- **WHEN** the repository-only skill receives a review-only request
- **THEN** it reports findings without changing conventions or instructions

#### Scenario: Client skills are packaged
- **WHEN** the package scaffold resources are assembled
- **THEN** they contain agents-write-conventions and agents-update-docs but exclude agents-write-repository-conventions

## REMOVED Requirements

### Requirement: Templates are authored with ordinary file operations

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Release calculates the next stable version automatically

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Release checks the base and local Git state

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Release preview never applies changes

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Application creates only the local tag

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: A maintainer skill guides reviewed versioning

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Base initialization installs the versioning skill

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Both roles install the authoring skill

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.

### Requirement: Curation is separate from generation and release

**Reason**: The previous shared-base, staged, or composition-era contract is superseded by the explicit simplified project contract.
**Migration**: Use the replacement requirements in this capability together with the new project workflow and unit-only gates. Do not restore remote/base behavior, integration fixtures, or deleted change prerequisites.
