# Spec Delta

## MODIFIED Requirements

### Requirement: Consumers declare a pinned instruction source

Version 1 SHALL continue requiring `agents.repository/ref`. Version 2 SHALL allow `agents` to be absent for local-only generation. When present, repository and reference MUST both be nonempty and remote content SHALL resolve from that pinned base. The manifest SHALL remain the sole configuration source, without `agents.root`, `agents.source`, multiple remotes, or a separate CLI registry.

#### Scenario: A consumer declares the shared source
- **WHEN** a consumer configures its instruction source
- **THEN** the manifest supplies nonempty `agents.repository` and `agents.ref` values
- **AND** remote convention sources are resolved from that pinned checkout

#### Scenario: A new project starts locally
- **WHEN** a version-2 manifest omits `agents` and has no remote entries
- **THEN** it is valid without a placeholder base and local families are discovered under the declared source root

#### Scenario: Remote entries have no base
- **WHEN** a version-2 manifest declares remote entries without repository/reference
- **THEN** validation rejects the configuration before generating documents

#### Scenario: A version-1 source is missing
- **WHEN** a version-1 manifest omits its required base configuration
- **THEN** it remains invalid rather than receiving version-2 semantics

#### Scenario: A company provides its own instruction base
- **WHEN** a valid manifest selects a company-owned repository and its custom families
- **THEN** the CLI uses that base's template and selected families without requiring our two starter conventions or upstream write access
- **AND** a private repository uses the caller's existing Git access without embedding credentials in the manifest

### Requirement: Convention publication paths are configurable

The manifest SHALL declare `out_dir`, `local.tpl_dir`, `remote.tpl_dir`, and `entries` under `outputs.AGENTS.md.include.conventions`. Version 1 SHALL retain explicit local/remote parent entries. Version 2 SHALL discover local parents from `local.tpl_dir` and use `entries` only for remote parents. Publication MUST preserve source subdirectories and replace `.tpl.md` with `.md` under `out_dir`.

#### Scenario: A nested source is published
- **WHEN** a version-1 entry, version-2 discovered local parent, or remote entry refers to `policies/example.tpl.md`
- **THEN** its output is `policies/example.md` under the configured publication directory

#### Scenario: Two entries target the same output
- **WHEN** declared or discovered families produce the same final publication path
- **THEN** synchronization fails before overwriting published documents

#### Scenario: A version-2 local entry duplicates filesystem configuration
- **WHEN** a version-2 manifest contains an `origin: local` entry
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

Each convention source SHALL have one H1 and one nonempty AGENT-CARD outside code examples. Children SHALL use the parent's filename root and directory with one extra filename component. Explicit version-1/remote selections MUST name the parent; version-2 local parents SHALL be discovered by directory. Publication MUST preserve authored Markdown bytes except for established transformations.

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
- **THEN** the consumer has the CLI-packaged agents-write-conventions and agents-update-docs skills
- **AND** bootstrap leaves an existing `AGENTS.md` unchanged

#### Scenario: Integration files have been customized
- **WHEN** initialization encounters an incompatible integration
- **THEN** it reports a conflict and preserves existing files without partially creating remaining setup

#### Scenario: The installed skill guides the four-command workflow
- **WHEN** ordinary init installs its packaged agents-update-docs instructions
- **THEN** those instructions describe existing-manifest validation, preview, generation, freshness checking and truthful reporting; agents-write-conventions handles content curation
- **AND** they do not execute code or replace the generation engine from the pinned base

#### Scenario: The current integration is already installed
- **WHEN** initialization finds the exact current CLI-bundled integration
- **THEN** it leaves that integration unchanged without regenerating documents

#### Scenario: An existing integration is unknown or customized
- **WHEN** initialization finds integration bytes that differ from its own current integration
- **THEN** it reports a conflict and preserves those files rather than attempting private-version migration

## ADDED Requirements

### Requirement: Every command uses one manifest contract

All manifest consumers SHALL use one validated YAML contract. An omitted schemaVersion SHALL mean version 1; explicit version 2 SHALL permit an optional base and directory-discovered locals. Unknown fields and unsupported versions SHALL fail with source locations. Packaged schemas SHALL describe both contracts for editor use. Release SHALL not interpret a consumer pin as its own version.

#### Scenario: A reference contains an inline comment
- **WHEN** the manifest declares `ref: v1.2.3 # pinned version`
- **THEN** bootstrap, validation, synchronization, all interpret the ref as `v1.2.3`

#### Scenario: Version-1 configuration omits its optional schema version
- **WHEN** a valid initial public manifest has no `schemaVersion`
- **THEN** it is interpreted as version 1 without rewriting the file

#### Scenario: A removed field is present
- **WHEN** a manifest declares `agents.root`, `agents.source`, `agents.bootstrap`, or `outputs.skills`
- **THEN** validation identifies the unsupported field and points to the initial public schema
- **AND** it does not silently accept the field


