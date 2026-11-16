# consumer-instruction-composition Specification

## Purpose

Keep editable instruction sources distinct from generated documents and synchronize them through the repository's public workflow.

## Requirements

### Requirement: Instruction changes target their sources

Consumers SHALL maintain convention content in source `.tpl.md` files and composition in `agents-compose.yml`. `AGENTS.md` and published convention documents MUST be treated as generated artifacts rather than editable sources.

#### Scenario: A user requests a change to a published document
- **WHEN** a user requests a change to `AGENTS.md` or a published convention
- **THEN** the agent updates the applicable source and manifest
- **AND** uses the authorized public synchronization workflow to generate the resulting documents

### Requirement: Synchronization uses the pinned checkout

The `update-docs` workflow SHALL ensure the checkout identified by `agents.repository/ref` before publishing documents. It SHALL update its local `.agents/skills/update-docs/` package from that checkout, execute the updated implementation, and generate conventions and `AGENTS.md` from the declared sources.

#### Scenario: The base repository synchronizes itself
- **WHEN** synchronization runs in the base repository
- **THEN** remote sources and the base instruction template still come from the pinned checkout
- **AND** uncommitted local remote-source edits are not implicitly published

#### Scenario: A convention is maintained locally by a consumer
- **WHEN** an entry has `origin: local`
- **THEN** the source is resolved under the consumer's configured `local.tpl_dir`

### Requirement: Every published document identifies its generated status

Synchronization SHALL prefix `AGENTS.md` and all published parent and child conventions with a visible notice that they are generated and must be changed through their sources and manifest.

#### Scenario: A nested child convention is published
- **WHEN** synchronization publishes a child document in a nested directory
- **THEN** it receives the same generated-file notice as its parent and `AGENTS.md`

### Requirement: Completed OpenSpec changes preserve their specifications

The OpenSpec workflows SHALL synchronize approved delta specifications into `openspec/specs/` and preserve completed changes in `openspec/changes/archive/` through `openspec-archive-change`.

#### Scenario: A completed change is archived
- **WHEN** a user requests archiving a completed change with specification deltas
- **THEN** the workflow assesses and completes the required specification synchronization before moving the change into the archive
