# Spec Delta

## ADDED Requirements

### Requirement: Convention authors use the canonical filename

The shared convention authoring skill SHALL use the CLI's H1-to-filename rule for client template names and for handwritten convention filenames in direct mode. When an authorized rename changes a path, the skill SHALL preserve the heading and update affected authored references.

#### Scenario: A Portuguese client authors a convention
- **WHEN** the author creates a convention with the H1 “Contexto do projeto”
- **THEN** the template is named `contexto-do-projeto.tpl.md` in its chosen convention directory

#### Scenario: A handwritten convention is renamed
- **WHEN** direct-mode authorship changes a convention's title and filename
- **THEN** the applicable handwritten discovery links point to the renamed file

## MODIFIED Requirements

### Requirement: Client conventions are authored as independent templates

Authors SHALL create, edit, rename, or remove convention templates below .agentscli/templates/conventions/. Each SHALL have one H1, a matching canonical filename, and one complete nonempty AGENT-CARD outside examples. Valid sources SHALL participate without registration or inheritance. Authored links SHALL resolve from their generated context.

#### Scenario: A client authors a convention
- **WHEN** .agentscli/templates/conventions/commits.tpl.md is saved with the H1 “Commits” and valid structure
- **THEN** validation recognizes it and sync generates .agentscli/conventions/commits.md and its root AGENTS entry

#### Scenario: Independent topics share a filename prefix
- **WHEN** policy.tpl.md and policy-details.tpl.md exist with their matching H1 headings
- **THEN** neither acquires child discovery or inheritance

#### Scenario: A nested convention links to a repository file
- **WHEN** its author adds a relative link
- **THEN** the skill checks it against the convention's generated location rather than the template directory
