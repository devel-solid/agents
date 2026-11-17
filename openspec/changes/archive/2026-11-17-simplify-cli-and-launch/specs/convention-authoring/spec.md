# Spec Delta

## ADDED Requirements

### Requirement: Client conventions are authored as independent templates

Authors SHALL create, edit, rename, or remove convention templates below the client manifest's templates_dir. Each SHALL have one H1 and one complete nonempty AGENT-CARD outside examples. Valid sources SHALL participate without a selection entry, registration command, parent convention, or remote source.

#### Scenario: A client authors a convention
- **WHEN** commits.tpl.md is saved with valid structure
- **THEN** validation recognizes it and sync generates its independent output and AGENTS entry

#### Scenario: Independent topics share a filename prefix
- **WHEN** policy.tpl.md and policy.details.tpl.md both exist
- **THEN** neither acquires child discovery or inheritance

### Requirement: Shared authoring skills select targets by manifest context

Both shared authoring skills SHALL use agentscli.yml for this repository's direct final-file mode and agentscli-compose.yml for client-template mode. Exactly one SHALL be present. Both or neither SHALL produce a context diagnostic before writes; absent client configuration SHALL NOT imply direct mode.

#### Scenario: A maintainer authors in the CLI source repository
- **WHEN** only agentscli.yml is present
- **THEN** the skills target handwritten AGENTS.md and final docs/conventions directly

#### Scenario: A client customizes instructions
- **WHEN** only agentscli-compose.yml is present
- **THEN** the skills target the configured main and convention templates

#### Scenario: Context is missing or contradictory
- **WHEN** both manifests exist or neither exists
- **THEN** the skills explain the context problem and edit no files

### Requirement: One convention-authoring skill serves both contexts

agentscli-write-conventions SHALL be the single convention-authoring skill for the repository and clients. It SHALL curate applicability, actionable rules, valid small examples, exceptions, duplication, and contradictions, selecting final files or templates by context. No separate repository or translated variant SHALL be maintained.

#### Scenario: An own convention is requested
- **WHEN** the shared skill operates in direct mode
- **THEN** it edits the final English convention and applicable handwritten discovery references without init or sync

#### Scenario: A client convention is requested
- **WHEN** the same skill operates in client mode
- **THEN** it edits the relevant template using the client manifest language and checks related rule coherence

### Requirement: One shared AGENTS skill curates content and format

agentscli-update-agents SHALL curate the handwritten AGENTS.md or client main template according to context. It SHALL keep concise project orientation, actionable entrypoints, and convention discovery in AGENTS and direct detailed/scoped rules into conventions. It SHALL check the applicable format while allowing customized headings and sections.

#### Scenario: A proposed AGENTS rule contains detailed topic-specific guidance
- **WHEN** the skill reviews that material
- **THEN** it directs the detail into a convention and keeps only useful orientation/discovery in AGENTS

#### Scenario: The target is the handwritten root AGENTS
- **WHEN** direct-mode format is reviewed
- **THEN** no generated-output or template-insertion marker is required

#### Scenario: The target is the client main template
- **WHEN** the user changes headings and sections
- **THEN** the skill preserves structural validity and the single insertion marker without forcing the default body

### Requirement: Product skills use one standard English source each

The product SHALL maintain agentscli-write-conventions, agentscli-update-agents, agentscli-build-agents, and agentscli-release as four canonical English skills. Each SHALL use standard SKILL.md with name/description and useful optional support files. No translated or tool-specific copies or fixed chat-language rules SHALL be maintained.

#### Scenario: Product skill sources are reviewed
- **WHEN** the four sources and distribution list are inspected
- **THEN** each skill has one maintained English source and no repository infix or duplicate convention-authoring variant

### Requirement: Authoring respects requested scope

Review-only authoring SHALL report findings without edits. Authorized source changes SHALL target only applicable final files or templates. Authorship SHALL NOT imply generation, package publication, or unrelated changes; generation requested alongside authorship SHALL use the installed CLI in client mode without gratuitous extra approvals.

#### Scenario: Only semantic review is requested
- **WHEN** either shared authoring skill handles the request
- **THEN** it reports concrete scope/coherence/format findings without writing

#### Scenario: Client authorship and generation are both requested
- **WHEN** the user requests the source change and regenerated instructions
- **THEN** source curation and the authorized client CLI workflow complete within that scope

### Requirement: Distribution separates shared client and internal workflows

agentscli.yml SHALL select both shared skills and client-only agentscli-build-agents. The build skill SHALL guide installed-CLI validate/preview/sync/check. Repository-only agentscli-release SHALL guide native CLI versioning/publication and remain outside client installation. OpenSpec skills SHALL remain development tools.

#### Scenario: Client resources are assembled
- **WHEN** packaging reads the three listed directories
- **THEN** it includes their whole trees and excludes agentscli-release and OpenSpec

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
