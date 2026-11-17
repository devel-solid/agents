## ADDED Requirements

### Requirement: Bundled main templates provide a consistent document entrypoint

Both bundled main templates SHALL start with `# AGENTS.md`. Each SHALL retain its localized working paragraph and convention-index section, with exactly one operational insertion marker. Its sole fill-in hint SHALL be a localized HTML comment requesting only project purpose and essential repository orientation. These defaults SHALL NOT impose fixed titles or sections on customized client templates.

#### Scenario: English defaults are initialized
- **WHEN** a new client initializes with the default language
- **THEN** its main template starts with `# AGENTS.md`, retains the English working paragraph and conventions section, and contains `<!-- Replace this comment with the project's purpose and essential repository orientation. -->` instead of the previous fill-in prose

#### Scenario: Portuguese defaults are initialized
- **WHEN** a new client initializes with `--lang pt-br`
- **THEN** its main template starts with `# AGENTS.md`, retains the Portuguese working paragraph and conventions section, and contains `<!-- Substitua este comentário pelo propósito do projeto e pela orientação essencial sobre o repositório. -->` instead of the previous fill-in prose

#### Scenario: A client customizes its heading and sections
- **WHEN** a structurally valid main template uses a different H1 and customized sections
- **THEN** validation and rendering accept and preserve those choices without requiring the bundled title or body

### Requirement: Bundled context templates separate discovery from fill-in guidance

Each bundled context template SHALL retain its localized title and complete operational AGENT-CARD. Its remaining body SHALL contain only one localized HTML comment requesting replacement with actual project context. The previous fill-in paragraphs and additional generic rules paragraph SHALL be absent.

#### Scenario: English context is initialized
- **WHEN** a new English client receives the context template
- **THEN** its title is `# Project context`, its card reads `Read when starting work or choosing the project's development workflow.`, and its body contains only `<!-- Replace this comment with the project's actual context. -->`

#### Scenario: Portuguese context is initialized
- **WHEN** a new `pt-br` client receives the context template
- **THEN** its title is `# Contexto do projeto`, its card reads `Leia ao iniciar um trabalho ou escolher o fluxo de desenvolvimento do projeto.`, and its body contains only `<!-- Substitua este comentário pelo contexto real do projeto. -->`

### Requirement: Fill-in comments preserve ordinary source rendering and ownership

Bundled fill-in hints SHALL remain ordinary HTML comments when rendered, without becoming visible Markdown prose or receiving special stripping behavior. Rendering SHALL preserve generated notices and the existing operational card/index behavior. Updated package defaults SHALL NOT replace existing valid client templates through init or sync.

#### Scenario: Untouched defaults are rendered
- **WHEN** the bundled main and context templates are rendered in either supported language
- **THEN** fill-in hints remain HTML comments, generated source-edit notices remain, the main insertion marker becomes the convention index, and the operational context card is removed from the convention output

#### Scenario: An existing client uses older or customized templates
- **WHEN** the updated CLI initializes or synchronizes that client
- **THEN** its valid source templates remain unchanged and any regenerated document body continues to follow those sources rather than the updated package defaults
