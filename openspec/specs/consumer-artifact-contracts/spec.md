# consumer-artifact-contracts Specification

## Purpose

Define the manifest and source-file contracts that consumers use to generate shared agent instructions.

## Requirements

### Requirement: Consumers declare a pinned instruction source

The manifest SHALL identify the shared repository using `agents.repository` and its pinned reference using `agents.ref`. The same contract SHALL apply to the base repository and its consumers, without an `agents.root` mode or an `agents.source` block.

#### Scenario: A consumer declares the shared source
- **WHEN** a consumer configures its instruction source
- **THEN** the manifest supplies nonempty `agents.repository` and `agents.ref` values
- **AND** remote convention sources are resolved from that pinned checkout

### Requirement: Convention publication paths are configurable

The manifest SHALL declare `outputs.AGENTS.md.include.conventions.out_dir`, `local.tpl_dir`, `remote.tpl_dir`, and `entries`. Each entry SHALL identify its `local` or `remote` origin and a parent `.tpl.md` source relative to the corresponding source root. Publication MUST preserve subdirectories and replace only the `.tpl.md` suffix with `.md`.

#### Scenario: A nested source is published
- **WHEN** an entry refers to `policies/example.tpl.md`
- **THEN** its output is `policies/example.md` under the configured publication directory

#### Scenario: Two entries target the same output
- **WHEN** two convention entries produce the same final publication path
- **THEN** synchronization fails before overwriting published documents

### Requirement: Convention families have explicit source structure

Each convention source SHALL have exactly one H1 and one nonempty `AGENT-CARD` block. A child source SHALL share the parent's filename root and directory, using one additional filename component. The manifest MUST declare the parent rather than individual children.

#### Scenario: A parent has child conventions
- **WHEN** `policy.tpl.md` and `policy.details.tpl.md` form a source family
- **THEN** declaring the parent publishes both documents and exposes child discovery through the parent

### Requirement: Bootstrap installs only update-docs

Bootstrap SHALL install `.agents/skills/update-docs/` from the pinned source. The manifest SHALL NOT provide declarative publication of other skill packages through `outputs.skills`.

#### Scenario: Initial consumer bootstrap
- **WHEN** bootstrap succeeds for a consumer
- **THEN** the consumer has the pinned `update-docs` skill
- **AND** bootstrap leaves `AGENTS.md` unchanged
