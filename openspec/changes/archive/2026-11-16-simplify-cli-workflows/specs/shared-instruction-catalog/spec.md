# Spec Delta

## MODIFIED Requirements

### Requirement: This repository uses owned base instructions

This repository SHALL use the same simple owned base AGENTS.md model, with concise development guidance. It SHALL NOT retain a live consumer manifest or local-only convention source/output trees. Shared consumer-facing sources and accepted historical fixtures SHALL remain preserved; fixtures SHALL NOT configure the live repository.

#### Scenario: The repository's active instructions are read
- **WHEN** the agent begins work in this base
- **THEN** the root AGENTS.md contains its applicable instructions directly, without convention-discovery or generated-file directives

#### Scenario: Consumer regression fixtures are tested
- **WHEN** historical neutral/local profiles are rendered in disposable consumers
- **THEN** their accepted bytes remain valid independently of this repository's owned instructions

### Requirement: Candidate validation does not require publication

Historical accepted profiles SHALL remain regression inputs rendered only in disposable consumers. Live base instructions SHALL NOT be generated from those profiles or a pinned base. Candidate verification SHALL preserve real Git state and distinguish test fixture outputs from the owned root AGENTS.md.

#### Scenario: Historical candidate verification succeeds
- **WHEN** the fixture profiles match their accepted outputs
- **THEN** that result proves consumer compatibility, not live root self-consumption
- **AND** it does not rewrite the real base instructions or publish a tag
