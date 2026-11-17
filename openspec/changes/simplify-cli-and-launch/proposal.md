# Proposal

## Why

The project has become a distribution and recovery system for shared instructions instead of a small tool for maintaining one project's instructions. Replace that architecture with project-owned templates, flat conventions, a small CLI, and supporting skills, then deliver the complete experimental product in one first public release.

## What Changes

- **BREAKING:** Remove the base/consumer roles, shared or global conventions, subconventions, families, remote composition, content locks, remote caches, ownership records, and recovery journals. Replace the old composition manifest with a three-field project manifest. Do not carry private pre-release formats or deleted changes forward as compatibility requirements.
- Keep `agents-compose.yml` with only `language`, `templates_dir`, and `conventions_dir`. Every successful `init` overwrites it with the requested language (default `en`) and default directory roots. There are no per-convention selections or format-version fields.
- Keep `<templates_dir>/AGENTS.tpl.md` and every other valid `*.tpl.md` below the configured template root as editable sources. `sync` regenerates the entire root `AGENTS.md` and all convention outputs, preserving relative paths below `conventions_dir`. Directories and dotted names do not create convention relationships.
- Expose three command roots: `init`, `validate`, and `sync`. Initialization creates the default templates, ready-to-use generated instructions, and the two supporting skills. Keep useful preview/check and machine-readable results without adding authoring or release subcommands.
- Add `init --lang pt-br`, using lowercase language identifiers, with `en` as the default. The manifest stores the language; remove the language marker from the main template. Ship complete English and Brazilian Portuguese scaffolds and skills in the first release. The manifest selects the language of created file text only; project instructions and skills do not fix the agent reply language. Maintained product text is English.
- This CLI source repository does not consume itself: its own `AGENTS.md` and `docs/conventions/` are handwritten in English. Keep no active project manifest or generated instruction/template tree here; bundled scaffolds are package assets only. During implementation, review the five restored guides, using Git as needed, and convert only still-relevant rules into own conventions before deleting the guides and presentation.
- Keep `agents-write-conventions` and `agents-update-docs`, rewritten for the single-project template workflow. Remove the base-versioning skill from the product and its maintained sources; use a short native maintainer release procedure instead. OpenSpec skills remain development tools.
- Add repository-only `agents-write-repository-conventions` to create, review, and maintain this CLI repository's handwritten English conventions directly under `docs/conventions/`. It requires no manifest, template, or generation step, and is excluded from the npm scaffold and client installation. The client-facing authoring skill continues to edit templates.
- Replace persistent ownership with an explicit generated-file marker, bounded output cleanup, full preflight, and safe individual-file replacement. A repeated `sync` converges without journals, hashes of historical output, or rollback machinery.
- **BREAKING:** Version only lightweight unit tests. Remove integration/end-to-end/process-spawning test suites, historical integration fixtures, and the Python oracle. `npm test`, `npm run check`, Lefthook pre-push, and CI run unit tests only, alongside the normal type/format checks. Do not add installed-package test suites, fake registries, disposable Git test repositories, or expensive default gates.
- Publish `agents-cli`, npm package `@devel-solid/agents-cli`, and repository `devel-solid/agents-cli` as experimental version `0.1.0` under MIT. Include the reviewed clean-history repository handoff, ordinary Git/npm publication, and actual delivery verification in this same change. Do not stage a Portuguese release followed by a separate English release.

## Capabilities

### New Capabilities

- `release-publication`: MIT-licensed `0.1.0` package identity, English-first documentation, lightweight release readiness, reviewed independent public history, and verified native Git/npm delivery.

### Modified Capabilities

- `agents-cli`: Installed Node-only command interface, three operations, deterministic results, and a unit-only test policy.
- `project-instruction-workflows`: Three-field manifest, automatic inclusion below configurable roots, complete regeneration, manifest-overwriting initialization, language selection, two skills, and stateless safe file effects.
- `convention-authoring`: Template authorship for client projects and a separate repository-only skill for direct curation of this CLI repository's handwritten conventions.
- `consumer-artifact-contracts`: Retire the complete capability; retain relevant file/path and direct-CLI guarantees in the new project workflow.
- `consumer-instruction-composition`: Retire the complete capability; replace composition with project template rendering.
- `managed-document-updates`: Retire durable ownership and transactional recovery; relocate necessary preservation, preview, and safe-write behavior to the project workflow.
- `reproducible-synchronization`: Retire the complete remote lock/cache/pin capability.
- `shared-instruction-catalog`: Retire the complete shared catalog and historical stage prerequisites.

## Impact

- Simplify `src/cli.ts`, the manifest reader, initialization, Markdown validation, template discovery/rendering, planning, and diagnostics. Remove roles, remote Git resolution, lock/state, base release, transaction engines, and obsolete schemas. Retain the YAML parser for the three-field manifest and remove unused `ajv`.
- Rework authored skills, default and localized assets, `scripts/package-assets.mjs`, package metadata, the root development instructions, and OpenSpec context. Preserve templates as product assets, not as a shared policy base.
- Keep documentation lean: the README explains project use and native maintainer publication; the final `docs/` contains only necessary handwritten conventions. Preserve the guides and presentation during planning. During implementation, first assess/convert useful rules, discard obsolete material, and then delete the original guides and presentation without replacements.
- Replace obsolete specs through this change's deltas and remove empty retired capability files when synchronizing the approved specification set. The six changes already deleted at the user's request remain deleted.
- All development and readiness work stays in this checkout. Repository creation/export, commits, tags, pushes, and npm publication require their concrete later execution authorization; planning performs none of them. The single change remains incomplete until its authorized first-publication tasks and delivery checks are actually complete.
