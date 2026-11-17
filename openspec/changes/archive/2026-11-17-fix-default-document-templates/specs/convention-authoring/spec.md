## ADDED Requirements

### Requirement: Shared authoring replaces fill-in comments with verified content

During authorized authorship, both shared skills SHALL replace applicable fill-in comments with verified project content instead of retaining the hints alongside that content. Any fill-in guidance they author SHALL be an HTML comment explicitly asking for its own replacement. They SHALL NOT invent facts, tools, commands, architecture, or policies to fill a template. Technical operational comments SHALL remain governed by their existing format contracts.

#### Scenario: Project entrypoint authorship is requested
- **WHEN** `agentscli-update-agents` is authorized to populate the client main template and verified project purpose and essential orientation are available
- **THEN** it replaces the applicable fill-in comment with that content, preserves the insertion marker, and directs detailed or scoped guidance into conventions

#### Scenario: Project context authorship is requested
- **WHEN** `agentscli-write-conventions` is authorized to populate the context template and actual project context is available
- **THEN** it replaces the fill-in comment with useful verified content and preserves the convention title and operational card

#### Scenario: Required project facts are unavailable
- **WHEN** either shared skill lacks evidence for the requested project content
- **THEN** it reports the missing information rather than inventing content or presenting fill-in guidance as actual project instructions

#### Scenario: Only review is requested
- **WHEN** either shared skill encounters fill-in comments during a review-only request
- **THEN** it reports the unfinished content without replacing the comments or generating documents

#### Scenario: Shared skills operate in the source repository
- **WHEN** authorized authorship selects direct mode through `agentscli.yml`
- **THEN** the skills edit only the applicable handwritten final files, preserving their format without introducing client generation markers or creating client templates
