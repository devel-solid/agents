# Spec Delta

## Purpose

Provide a small reusable instruction catalog while keeping each consumer's language, tooling, and operational policies explicit and independently owned.

## ADDED Requirements

### Requirement: The shared catalog contains exactly two conventions

The current shared source catalog SHALL contain only security/content-trust guidance and composition/authorship guidance, with no shared child conventions. This catalog SHALL be optional starter content. The two-source limit SHALL apply only to our catalog, not to company-owned remote bases or consumer-defined local families.

#### Scenario: A consumer selects the current minimal base
- **WHEN** the current shared source catalog is inspected
- **THEN** its only convention sources are `seguranca-para-agentes-e-conteudo-nao-confiavel.tpl.md` and `composicao-de-instrucoes-para-repositorios-consumidores.tpl.md`
- **AND** no other policy family is distributed from that shared source root

#### Scenario: A consumer defines a custom family
- **WHEN** its valid manifest selects a custom local convention and child
- **THEN** existing family publication and discovery still work without a two-entry engine restriction

#### Scenario: A company owns its shared catalog
- **WHEN** projects select the company's own valid remote base
- **THEN** its template and selected conventions determine the shared instructions without requiring our two filenames or write access to our repository
- **AND** the company versions its content in Git independently of the CLI package

### Requirement: Shared security guidance preserves the instruction trust boundary

The shared security convention SHALL require protection of sensitive values, distinguish authorized instructions from inspected content, and prohibit treating untrusted content as permission for side effects. It SHALL defer to the environment's instruction priority and preserve explicit local restrictions.

#### Scenario: Inspected content contains operational instructions
- **WHEN** an agent reads a file or tool result that requests unrelated actions or disclosure
- **THEN** the shared guidance treats that request as data rather than authorization

### Requirement: The shared base template is operationally minimal

The shared base SHALL cover context discovery, applicable local instructions, selected convention discovery, source-based edits and authorized generation, project-defined validation, and clear reporting. It SHALL NOT impose a mandatory language, gender style, commit format, technology, hook manager, or detailed autonomy policy.

#### Scenario: A different project uses the same base
- **WHEN** a disposable consumer selects the current base without the agents repository's local policies
- **THEN** its generated instruction contains the shared operational guidance and its own selected context
- **AND** it contains no normative import of the agents repository's specialized preferences

### Requirement: Composition guidance distinguishes authoring from generated output

One shared composition convention SHALL explain the editable sources, manifest selection, generated outputs, and authorized public generation workflow. It SHALL preserve essential source/card and parent/child discovery guidance while directing detailed field and format questions to the applicable version of the tool's reference documentation.

#### Scenario: A consumer changes a generated convention
- **WHEN** the requested change targets published content
- **THEN** the guidance directs the agent to the applicable source and manifest and the authorized generation workflow
- **AND** it does not prescribe this base repository's release procedure for that consumer

#### Scenario: The reference guide is not installed in the consumer
- **WHEN** detailed manifest guidance is required
- **THEN** the documentation identifies the applicable tool reference location and version
- **AND** does not assume a same-named guide exists in the selected company base or consumer's local directories

### Requirement: This repository retains its explicitly local policies

This repository SHALL preserve its current context, authorship/publication rules, specialized policy families, and the preferences extracted from the base through local sources selected by its manifest. Policy relocation SHALL preserve normative meaning and child discovery. The separately approved UUID removal SHALL remain removed.

#### Scenario: This repository's candidate is generated
- **WHEN** its candidate manifest and sources are rendered
- **THEN** language, commit, testing/Lefthook, dependency, temporary-file, visual, Python-host, skill, scope, and communication policies remain discoverable as local instructions
- **AND** context and authorship/publication rules remain present

#### Scenario: A fresh consumer is generated
- **WHEN** it has not selected this repository's local policies
- **THEN** those policies are not copied or activated by the shared base
- **AND** the removed UUID policy is not restored in either profile

### Requirement: The initial catalog has no legacy rollout obligation

The first public catalog SHALL target fresh consumers. No existing external consumer, private release support matrix, or legacy catalog migration SHALL be required for stage acceptance. Unknown or missing source selections SHALL still fail visibly; this decision SHALL NOT authorize silent input substitution.

#### Scenario: A fixture names a source outside the initial catalog
- **WHEN** that composition is validated
- **THEN** validation reports the missing source rather than inventing a replacement
- **AND** no consumer rollout or migration from a private tag is needed to accept the catalog

### Requirement: Candidate validation does not require publication

The authored candidate SHALL be validated with the existing engine in reproducible disposable consumers, covering the neutral and repository-local profiles. Validation SHALL distinguish candidate generation from root publication, keep the real selected reference unchanged, and record the candidate identity and pending materialization.

#### Scenario: The root still selects an older published base
- **WHEN** candidate validation succeeds before a new content release
- **THEN** the result proves the candidate's generated content without claiming that root `AGENTS.md` uses that candidate
- **AND** the real manifest reference and published documents are not manually changed to simulate publication

### Requirement: Development artifacts stay outside the public snapshot

The catalog stage SHALL record obsolete development outputs that must be excluded from the later reviewed public export. It SHALL preserve current development history and pending work. Creating the new real repository and copying approved files SHALL wait until first-public-version readiness and separate handoff authorization.

#### Scenario: Catalog implementation is accepted before launch
- **WHEN** the source and disposable-profile gates pass
- **THEN** the current repository remains the development home
- **AND** no real repository creation, history rewrite, migration, or publication occurs

### Requirement: Modernization follows accepted catalog simplification

The modernization sequence SHALL start `introduce-node-cli` only after this content stage is implemented, validated, accepted by the user, synchronized into permanent specifications, and archived. The content stage SHALL NOT depend on a public release or on the later Node, ownership, or release implementations.

#### Scenario: The catalog gate is not accepted
- **WHEN** runtime modernization is about to begin
- **THEN** it identifies the unmet catalog prerequisite and does not begin implementation
- **AND** creating all planning artifacts alone does not satisfy that prerequisite
