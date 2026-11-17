## Why

Both localized default AGENTS templates use an unexpected document title, and all four document templates expose fill-in instructions as ordinary prose in generated output. The defaults should provide useful operational guidance while keeping replaceable authoring hints clearly separate from actual project instructions.

## What Changes

- Start both bundled main templates with `# AGENTS.md`, keeping their localized working paragraph and convention-index section.
- Replace main-template fill-in prose with one localized HTML comment requesting only the project's purpose and essential repository orientation.
- Keep each context template's title and operational card, replace its fill-in prose with one localized HTML comment, and remove its additional generic rules paragraph.
- Align the README example and both shared authoring skills with the replaceable-comment contract. Skills replace those comments with verified project content only within authorized authorship.
- Add lightweight unit coverage using the four real document assets and in-memory rendering/planning, rather than relying exclusively on synthetic templates.
- Preserve custom client titles/sections, literal HTML comments, generated notices, and existing-template preservation. No runtime feature or migration is needed.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-instruction-workflows`: define the editorial contract for bundled localized document defaults without restricting custom client templates.
- `convention-authoring`: define how shared authoring skills replace fill-in comments with verified project content.

## Impact

Implementation affects the four localized document assets, the README, the two canonical shared authoring skills, and focused unit tests. The renderer, validator, CLI interface, manifests, dependencies, and package identity remain unchanged. Existing client templates remain preserved; upgrading the package alone does not replace them.

This change's preparation writes only its OpenSpec artifacts in English, preserving exact localized product strings. Apply, repository cleanup, versioning, commit, push, tags, and publication are separate actions. The source repository's handwritten AGENTS.md and conventions are not regenerated.
