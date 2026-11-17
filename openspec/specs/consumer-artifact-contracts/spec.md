# consumer-artifact-contracts Specification

## Purpose

Define the manifest and source-file contracts that consumers use to generate shared agent instructions.

## Requirements

### Requirement: Consumers declare a pinned instruction source

The sole public manifest format SHALL require `schemaVersion: 1` and allow `agents` to be absent for local-only generation. When present, repository and reference MUST both be nonempty and remote content SHALL resolve from that pinned base. The manifest SHALL remain the sole configuration source, without `agents.root`, `agents.source`, multiple remotes, or a separate CLI registry.

#### Scenario: A consumer declares the shared source
- **WHEN** a consumer configures its instruction source
- **THEN** the manifest supplies nonempty `agents.repository` and `agents.ref` values
- **AND** remote convention sources are resolved from that pinned checkout

#### Scenario: A new project starts locally
- **WHEN** a version-1 manifest omits `agents` and has no remote entries
- **THEN** it is valid without a placeholder base and local families are discovered under the declared source root

#### Scenario: Remote entries have no base
- **WHEN** a version-1 manifest declares remote entries without repository/reference
- **THEN** validation rejects the configuration before generating documents

#### Scenario: A configured base is incomplete
- **WHEN** an `agents` block omits repository or reference
- **THEN** validation rejects the incomplete source configuration

#### Scenario: A company provides its own instruction base
- **WHEN** a valid manifest selects a company-owned repository and its custom families
- **THEN** the CLI uses that base's template and selected families without requiring our two starter conventions or upstream write access
- **AND** a private repository uses the caller's existing Git access without embedding credentials in the manifest

### Requirement: Convention publication paths are configurable

The manifest SHALL declare `out_dir`, `local.tpl_dir`, `remote.tpl_dir`, and `entries` under `outputs.AGENTS.md.include.conventions`. Local parents SHALL be discovered from `local.tpl_dir`; `entries` SHALL select only remote parents with `origin: remote`. Publication MUST preserve source subdirectories and replace `.tpl.md` with `.md` under `out_dir`.

#### Scenario: A nested source is published
- **WHEN** a discovered local parent or explicit remote entry refers to `policies/example.tpl.md`
- **THEN** its output is `policies/example.md` under the configured publication directory

#### Scenario: Two entries target the same output
- **WHEN** declared or discovered families produce the same final publication path
- **THEN** synchronization fails before overwriting published documents

#### Scenario: A version-1 local entry duplicates filesystem configuration
- **WHEN** a version-1 manifest contains an `origin: local` entry
- **THEN** validation reports that local inclusion is determined by `local.tpl_dir`
- **AND** it does not silently ignore or double-include the entry

#### Scenario: Output names differ only by case
- **WHEN** two entries would publish paths that are equivalent on the supported case-insensitive filesystem contract
- **THEN** validation reports their collision on every supported platform before publishing any document

#### Scenario: A convention targets the root instruction file
- **WHEN** an entry would publish a convention as the root `AGENTS.md`
- **THEN** validation rejects the reserved-destination collision before publishing any document

#### Scenario: A link aliases another destination or escapes a root
- **WHEN** a source or output resolves outside its allowed root or two outputs resolve to the same destination
- **THEN** validation fails before publication and identifies the involved paths

### Requirement: Convention families have explicit source structure

Each convention source SHALL have one H1 and one nonempty AGENT-CARD outside code examples. Children SHALL use the parent's filename root and directory with one extra filename component. Explicit remote selections MUST name the parent; local parents SHALL be discovered by directory. Publication MUST preserve authored Markdown bytes except for established transformations.

#### Scenario: A parent has child conventions
- **WHEN** `policy.tpl.md` and `policy.details.tpl.md` form a source family
- **THEN** declaring the parent publishes both documents and exposes child discovery through the parent

#### Scenario: A document teaches Markdown using a fenced example
- **WHEN** a valid source contains `# Example` and example card markers inside a fenced code block
- **THEN** those example lines do not count as the document's H1 or operational card markers
- **AND** the code example remains intact in the published document

### Requirement: Bootstrap installs consumer authorship and update skills

`agents init` SHALL install `.agents/skills/agents-update-docs/` and `.agents/skills/agents-write-conventions/` from the installed CLI package, preserve valid manifests, sources, and documents, and reject customized integration conflicts. The manifest SHALL NOT publish other skills through `outputs.skills`. `init --base` SHALL NOT install agents-update-docs; its authoring skill is shared by both roles.

#### Scenario: Initial consumer bootstrap
- **WHEN** bootstrap succeeds for a consumer
- **THEN** the consumer has both CLI-packaged agents-write-conventions and agents-update-docs skills, without agents-update-version
- **AND** bootstrap leaves an existing `AGENTS.md` unchanged

#### Scenario: Integration files have been customized
- **WHEN** initialization encounters an incompatible integration
- **THEN** it reports a conflict and preserves existing files without partially creating remaining setup

#### Scenario: The installed skill guides the four-command workflow
- **WHEN** ordinary init installs its packaged agents-update-docs instructions
- **THEN** those instructions describe only existing-manifest validation, preview, generation and freshness checking, scope boundaries, and actual outcome reporting; content curation belongs to the separately installed agents-write-conventions
- **AND** they do not execute code or replace the generation engine from the pinned base

#### Scenario: The current integration is already installed
- **WHEN** initialization finds the exact current CLI-bundled integration
- **THEN** it leaves that integration unchanged without regenerating documents

#### Scenario: An existing integration is unknown or customized
- **WHEN** initialization finds integration bytes that differ from its own current integration
- **THEN** it reports a conflict and preserves those files rather than attempting private-version migration

### Requirement: Every command uses one manifest contract

The CLI and editors SHALL use only `schemas/agents-compose.v1.schema.json`: required `schemaVersion: 1`, optional pinned base, automatic local discovery, and remote-only entries. Missing/unsupported versions, explicit local entries, and unknown fields SHALL fail with source locations without conversion. Release SHALL keep consumer pins separate from base versions.

#### Scenario: A reference contains an inline comment
- **WHEN** the manifest declares `ref: v1.2.3 # pinned version`
- **THEN** bootstrap, validation, synchronization, all interpret the ref as `v1.2.3`

#### Scenario: The schema version is missing or unsupported
- **WHEN** a manifest omits `schemaVersion` or declares a value other than integer 1
- **THEN** validation rejects it without rewriting the file

#### Scenario: A removed field is present
- **WHEN** a manifest declares `agents.root`, `agents.source`, `agents.bootstrap`, or `outputs.skills`
- **THEN** validation identifies the unsupported field and points to the initial public schema
- **AND** it does not silently accept the field

### Requirement: The base configuration determines main-template authority

Version-1 local-only generation SHALL use the consumer's `templates/AGENTS.tpl.md`. A configured pinned base SHALL supply its own main template. Preview SHALL identify that effective template and its document consequences. The local fallback SHALL be preserved, and editing the manifest alone SHALL not regenerate documents.

#### Scenario: A local project generates its main document
- **WHEN** a valid local-only version-1 project synchronizes
- **THEN** it uses its local main template and discovered local families without remote resolution

#### Scenario: A project later declares a shared base
- **WHEN** the manifest is edited to configure a valid base and synchronization is previewed
- **THEN** the plan identifies the pinned main template and current inputs
- **AND** local sources and existing documents remain unchanged until real synchronization

### Requirement: One public schema defines local discovery and remote selection

The shipped v1 schema and CLI SHALL agree on required version, optional pinned base, automatic local discovery, and explicit remote-only selections. No private-format compatibility branch or fallback schema SHALL exist. JSON result and base-role marker versions SHALL remain independent contracts.

#### Scenario: A new configuration is validated
- **WHEN** a manifest declares `schemaVersion: 1`
- **THEN** editor and CLI validation agree on local discovery and remote-only entries

#### Scenario: A local template is added
- **WHEN** a valid parent is created under the configured local root
- **THEN** it participates without a manifest entry

### Requirement: Consumer pins and base release versions stay distinct

Agents.ref SHALL identify a consumed base version in a separate consumer project. Base release SHALL use its own reachable tags without a consumer manifest. Consumer adoption SHALL be an explicit manifest edit and authorized generation in that consumer, outside the base-versioning skill.

#### Scenario: A consumer adopts a published tag
- **WHEN** its manifest is edited and synchronization is authorized
- **THEN** only that consumer's selected documents are generated
- **AND** the base's owned instructions and release state remain unchanged

### Requirement: The CLI can be used without loading the skill

The CLI SHALL support direct developer invocation without loading agents-update-docs. Missing skill guidance alone SHALL NOT prevent otherwise valid validation or synchronization. Ordinary init SHALL still install the integration for agent use, and sync SHALL preserve it instead of updating it from remote instruction content.

#### Scenario: A developer runs the CLI directly
- **WHEN** a valid initialized project's developer invokes validate and sync from a terminal without loading a skill
- **THEN** the CLI validates and generates documents through its normal engine

#### Scenario: The integration is absent from an otherwise valid project
- **WHEN** the developer runs sync with valid configuration and sources but no agents-update-docs integration
- **THEN** document generation remains available without an agent skill dependency
