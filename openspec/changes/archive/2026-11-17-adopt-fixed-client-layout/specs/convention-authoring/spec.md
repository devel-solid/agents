# Spec Delta

## MODIFIED Requirements

### Requirement: Client conventions are authored as independent templates

Authors SHALL create, edit, rename, or remove convention templates below .agentscli/templates/conventions/. Each SHALL have one H1 and one complete nonempty AGENT-CARD outside examples. Valid sources SHALL participate without a selection entry, registration command, parent convention, or remote source. Authored links SHALL target generated documents under .agentscli/conventions/ relative to their rendered context.

#### Scenario: A client authors a convention
- **WHEN** .agentscli/templates/conventions/commits.tpl.md is saved with valid structure
- **THEN** validation recognizes it and sync generates .agentscli/conventions/commits.md and its root AGENTS entry

#### Scenario: Independent topics share a filename prefix
- **WHEN** policy.tpl.md and policy.details.tpl.md both exist in the convention source subtree
- **THEN** neither acquires child discovery or inheritance

#### Scenario: A nested convention links to a repository file
- **WHEN** its author adds a relative link
- **THEN** the skill checks it against the convention's generated location rather than the template directory

### Requirement: Shared authoring skills select targets by manifest context

Both shared authoring skills SHALL use agentscli.yml for direct English final-file authorship and valid .agentscli/config.yml for client templates. Missing, conflicting, malformed, or legacy contexts SHALL produce diagnostics before edits. Absent client configuration SHALL NOT imply direct mode. An internal manifest in an ancestor SHALL prevent treating a source-repository subtree as a client.

#### Scenario: A maintainer authors in the CLI source repository
- **WHEN** only agentscli.yml identifies the project
- **THEN** the skills target handwritten AGENTS.md and final docs/conventions directly

#### Scenario: A client customizes instructions
- **WHEN** only valid .agentscli/config.yml identifies the project
- **THEN** the skills target .agentscli/templates/AGENTS.tpl.md and independent sources under .agentscli/templates/conventions/ using the configured language

#### Scenario: Context is missing or contradictory
- **WHEN** both context identifiers exist, neither exists, or the client configuration is invalid
- **THEN** the skills explain the context problem and edit no files

#### Scenario: A legacy client is encountered
- **WHEN** agentscli-compose.yml exists, with or without new configuration
- **THEN** the skills report that explicit migration must finish before client authorship and do not silently edit legacy sources

#### Scenario: A source subtree resembles a client
- **WHEN** an ancestor contains agentscli.yml and the requested subdirectory contains client-looking files
- **THEN** the skills diagnose the incompatible context instead of initializing, synchronizing, or authoring a nested client

### Requirement: One convention-authoring skill serves both contexts

agentscli-write-conventions SHALL be the single convention-authoring skill for the repository and clients. It SHALL curate applicability, actionable rules, valid small examples, exceptions, duplication, and contradictions, selecting final files or fixed client templates by context. No separate repository or translated variant SHALL be maintained.

#### Scenario: An own convention is requested
- **WHEN** the shared skill operates in direct mode
- **THEN** it edits the final English convention and applicable handwritten discovery references without init or sync

#### Scenario: A client convention is requested
- **WHEN** the same skill operates in client mode
- **THEN** it edits the relevant .agentscli/templates/conventions/ source using the language in .agentscli/config.yml and checks related rule coherence

### Requirement: One shared AGENTS skill curates content and format

agentscli-update-agents SHALL curate handwritten root AGENTS.md in direct mode or .agentscli/templates/AGENTS.tpl.md in client mode. It SHALL keep concise project orientation, actionable entrypoints, and convention discovery in AGENTS and direct detailed/scoped rules into conventions. It SHALL check the applicable format while allowing customized headings and sections.

#### Scenario: A proposed AGENTS rule contains detailed topic-specific guidance
- **WHEN** the skill reviews that material
- **THEN** it directs the detail into a convention and keeps only useful orientation/discovery in AGENTS

#### Scenario: The target is the handwritten root AGENTS
- **WHEN** direct-mode format is reviewed
- **THEN** no generated-output or template-insertion marker is required

#### Scenario: The target is the client main template
- **WHEN** the user changes headings and sections
- **THEN** the skill preserves structural validity and the single insertion marker without forcing the default body or editing generated root AGENTS.md

### Requirement: Distribution separates shared client and internal workflows

agentscli.yml SHALL select both shared skills and client-only agentscli-build-agents. The build skill SHALL guide installed-CLI validate/preview/sync/check using .agentscli/config.yml and the fixed layout. Repository-only agentscli-release SHALL guide native CLI versioning/publication and remain outside client installation. OpenSpec skills SHALL remain development tools.

#### Scenario: Client resources are assembled
- **WHEN** packaging reads the three listed directories
- **THEN** it includes their whole trees and excludes agentscli-release and OpenSpec

#### Scenario: Client build context is inspected
- **WHEN** agentscli-build-agents discovers a valid fixed-layout client
- **THEN** it uses its existing language/configuration and installed CLI for only the requested operation without implicit init, installation, or upgrade

#### Scenario: Client build encounters a legacy context
- **WHEN** agentscli-build-agents finds agentscli-compose.yml
- **THEN** it reports explicit init --migrate preview/application guidance and does not turn ordinary generation authorization into migration

#### Scenario: Client build targets internal instructions
- **WHEN** agentscli-build-agents finds agentscli.yml in the root or an ancestor
- **THEN** it reports direct repository authorship and runs no client operation
