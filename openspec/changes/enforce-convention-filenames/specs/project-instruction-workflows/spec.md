# Spec Delta

## ADDED Requirements

### Requirement: Convention filename mismatches block generation

A convention basename SHALL equal its H1 in ASCII lowercase kebab case plus `.tpl.md`. Normalize the parsed title using Unicode NFKD, remove combining marks, and replace non-alphanumeric runs by single hyphens. Reject empty results and mismatches before any writes in init, validate, sync, previews, check, and migration.

#### Scenario: A client submits a mismatched filename
- **WHEN** `componentes.tpl.md` has the H1 “Aplicação web e componentes”
- **THEN** the CLI fails with validation exit code 2 and identifies the source and expected filename `aplicacao-web-e-componentes.tpl.md`
- **AND** it makes no changes to templates, outputs, or managed skills

#### Scenario: A convention has a valid nested path and a formatted heading
- **WHEN** `testing/api-e-validacao.tpl.md` has the H1 “**API** e validação”
- **THEN** the containing directory is preserved and the generated file is `testing/api-e-validacao.md`

#### Scenario: An H1 cannot produce a portable slug
- **WHEN** the parsed H1 has no ASCII letters or digits after normalization
- **THEN** validation fails with a diagnostic identifying the title to correct

#### Scenario: A legacy migration would transfer an invalid convention
- **WHEN** a legacy convention would produce a mismatched basename in the fixed layout
- **THEN** migration and its preview fail before writing and identify the required source correction

## MODIFIED Requirements

### Requirement: Initialization creates usable instructions without resetting authored content

First init SHALL create the fixed configuration, main template, three client skills, and generated instructions. The default convention SHALL be `project-context.tpl.md` in English or `contexto-do-projeto.tpl.md` in Portuguese, with the matching generated path. Repeated init SHALL preserve valid authored setup and SHALL NOT restore removed conventions.

#### Scenario: A new client initializes
- **WHEN** init succeeds in an empty project
- **THEN** the fixed configuration, editable main/context templates, three client skills, and generated instructions exist
- **AND** the context template and output use the canonical filename for the configured language

#### Scenario: Authored setup already exists
- **WHEN** init finds customized valid templates and regular skill files
- **THEN** it preserves their content and the configured language while completing missing setup

#### Scenario: A convention was deliberately removed
- **WHEN** a client removes its context convention template and repeats init
- **THEN** init does not restore that source or add another default convention

#### Scenario: First initialization was interrupted
- **WHEN** init is retried with the same options after a partial initial setup
- **THEN** it finishes the missing default setup without resetting the sources already created

### Requirement: Every convention template participates automatically

Every valid `*.tpl.md` below `.agentscli/templates/conventions/` SHALL participate recursively and map its relative path to `.agentscli/conventions/` with suffix `.md`. The main source SHALL be `.agentscli/templates/AGENTS.tpl.md`. Ordering SHALL use portable normalized paths and equivalent destinations SHALL fail. Directories SHALL create no inheritance.

#### Scenario: Nested and dotted sources are present
- **WHEN** `testing/unit.tpl.md` has the heading “Unit” and `policy.details.tpl.md` has the heading “Policy details”
- **THEN** validation reports `policy-details.tpl.md` as the expected filename before writing
- **AND** after the source is renamed, both sources generate independent root AGENTS entries and the nested source keeps its directory

#### Scenario: Portable destinations collide
- **WHEN** source paths differ only by case or Unicode normalization
- **THEN** every generation mode rejects the collision before writing

#### Scenario: Discovery has no conventions
- **WHEN** the main template is valid and the convention subtree is empty or absent
- **THEN** generation succeeds with an empty convention index

#### Scenario: Templates are outside the convention subtree
- **WHEN** unrelated `*.tpl.md` files exist elsewhere, including directly beside `.agentscli/templates/AGENTS.tpl.md`
- **THEN** they do not become convention sources or generated outputs
