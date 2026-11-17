# Tasks

## 1. Simplified contracts and runtime

- [x] 1.1 Implement agentscli-compose.yml with exactly language, templates_dir, and conventions_dir; unit-test supported lowercase languages, default en, invalid YAML/fields, custom roots, unsafe/overlapping paths, and rejection of legacy composition without conversion.
- [x] 1.2 Implement recursive automatic *.tpl.md discovery and independent relative output mapping; unit-test empty sets, nested/dotted names, portable case/Unicode collisions, and exclusion of the root AGENTS.tpl.md without convention selections or family semantics.
- [x] 1.3 Validate Markdown-aware H1/card boundaries and the single agentscli:conventions placeholder while allowing custom main headings/sections; unit-test malformed cards/placeholders, examples containing markers, and content before/after insertion.
- [x] 1.4 Render complete AGENTS/convention outputs with the agentscli:generated first-line marker and localized source-edit notice; unit-test index links/cards, card removal, LF output, full-body template changes, and replacement of direct output edits.
- [x] 1.5 Implement init planning that always replaces the client manifest with selected/default language and default roots, creates missing setup/initial outputs, and preserves valid templates, regular skill content, and existing outputs; unit-test invalid old manifests, repeated init, intentionally removed conventions, first setup, and zero-write preview.
- [x] 1.6 Implement output comparisons and bounded stale marked-document cleanup; unit-test missing/changed/unchanged outputs, unmarked destination conflicts, unrelated manual-file preservation, marker examples, and preservation of previous output roots.
- [x] 1.7 Replace transactions with full preflight, containment/alias checks, and safe individual-file writes; unit-test unsafe links/hard links, temporary cleanup, partial failures, completed/remaining effects, and convergence after retry using mocked boundaries.
- [x] 1.8 Wire agentscli init/validate/sync and existing common flags, JSON envelope, and exit meanings using Node native argument parsing; unit-test dispatch, removed/misplaced options, preview/check drift, and English diagnostics without spawning the CLI.
- [x] 1.9 Remove roles, remote Git resolution, locks, ownership, base release, transaction engines, old schemas, and Ajv while retaining YAML/Markdown; verify types and focused units and review that no CLI framework or unrelated dependency update was added.
- [x] 1.10 Document the reduced client contracts, overwrite behavior, structural flexibility, and failure/retry limits in the concise English README; verify commands/examples against the unit cases and make no chat-language or atomic multi-file promise.

## 2. Canonical skills and package resources

- [x] 2.1 Add internal agentscli.yml with only the three distributed skill-directory paths; implement build-time validation of contained paths, standard entrypoints/names, and unique destinations, with isolated units for valid mixed source roots and malformed/duplicate/unsafe entries.
- [x] 2.2 Maintain shared agentscli-write-conventions and agentscli-update-agents under .agents/skills; verify a single English source per skill, direct own-file versus client-template destinations, both/neither-manifest diagnostics, review-only behavior, and minimal standard SKILL.md metadata.
- [x] 2.3 Give agentscli-update-agents explicit scope guidance separating concise AGENTS orientation from convention detail and checking the applicable format; review own handwritten AGENTS and customizable client-template examples without imposing generated markers on own files.
- [x] 2.4 Maintain client-only agentscli-build-agents under assets/templates/skills and repository-only agentscli-release under .agents/skills; review installed-CLI generation guidance, native version/publication guidance, requested-scope behavior, and exclusion of internal release/OpenSpec skills from client resources.
- [x] 2.5 Remove the old product skill sources/copies and any separate repository convention-authoring variant; verify exactly four product skill sources, three distributed skills, no repository infix, no translated/tool-specific variants, and no fixed chat-language instruction.
- [x] 2.6 Package complete listed skill directories and en/pt-br document templates under dist/assets; unit-test resource mapping and support-file preservation, verify both template locales structurally, and inspect the ordinary build resources without keeping duplicate maintained shared skill sources.
- [x] 2.7 Extend sync to create/replace the complete three managed client skill trees and remove extra files inside them; unit-test unchanged inventories, missing/edited/support/stale files, preservation of other skill directories, and unsafe managed destinations.
- [x] 2.8 Include managed-skill effects in dry-run/check/JSON and partial-failure convergence; unit-test skill-only drift exit 1, zero-write previews, retry after interrupted skill replacement, and missing-skill support for direct CLI use.
- [x] 2.9 Reject client CLI operations against an internal-manifest root; unit-test no-write rejection and verify shared authoring mode detection never initializes this repository as a client.
- [x] 2.10 Document both manifest purposes, canonical skill sources, English skill prose, whole-directory sync overwrite, and file-language selection in the README; verify examples reflect three client skills and no manual-upgrade or merge promise.

## 3. Handwritten repository instructions and documentation

- [x] 3.1 Rewrite the handwritten root AGENTS.md and OpenSpec context in English, referring to the shared authoring skills and internal release skill; verify there is no client manifest, generated own instruction tree, or fixed chat-language policy.
- [x] 3.2 Review all five restored guides and relevant Git context before deletion; use shared authoring in direct mode to convert only useful current rules into English own conventions, preserve meaning, and record retained/discarded material in this change.
- [x] 3.3 After review/conversion, delete the five guides and presentation, remove stale links/inclusions, and leave only necessary handwritten conventions in docs; verify essential use/development/publication information survives in the README without replacement guides or presentations.
- [x] 3.4 Review maintained project prose, links, CLI examples, and technical product markers for the agentscli identity and English text; verify en/pt-br remain document resources only and historical removed-requirement identifiers are not accidentally renamed.
- [x] 3.5 Reconcile the approved delta specifications, retain necessary path/security contracts, and remove retired empty capability files only through the requested OpenSpec synchronization workflow; verify the six previously deleted changes remain absent and no legacy prerequisite is restored.

## 4. Unit-only test and default-gate boundary

- [x] 4.1 Remove versioned integration/end-to-end/process suites, obsolete helpers, historical fixtures/snapshots, disposable Git cases, and the Python oracle; retain only useful isolated assertions and small data under the unit test home, verifying no opt-in integration suite remains.
- [x] 4.2 Consolidate the focused units added with each implementation area and review meaningful coverage of manifests, contexts, rendering, resource mapping, skill replacement, paths, and failures; verify no test spawns CLI/Git/npm, installs a package, accesses a registry, or constructs an integration environment.
- [x] 4.3 Keep npm test unit-only, npm run check unit/type/format, and Lefthook pre-push/current lightweight CI aligned; update stale paths and verify no platform/version acceptance matrix or hidden installed-package/release test gate is introduced.
- [x] 4.4 Run the general npm run check gate and record actual results after focused checks; verify test evidence describes only executed units and that build/package inspection remains a separate delivery action.

## 5. Public identity and local release readiness

- [x] 5.1 Set product/executable/repository to agentscli / devel-solid/agentscli and npm package/lockfile identity to @devel-solid/agentscli with experimental 0.1.0; add MIT LICENSE and retain required attribution, verifying bin and public metadata consistency.
- [x] 5.2 Restrict the npm allowlist to compiled runtime/client resources plus README/license/package metadata; inspect npm pack --dry-run and the actual candidate archive to verify three complete English client skills, both document locales, and exclusion of internal skills/manifest, OpenSpec, tests, and obsolete assets.
- [x] 5.3 Keep prepack building runtime resources and installed-package asset lookup independent of the source checkout; inspect scripts/file references to verify installation/execution requires no compiler, resource download, prepare/postinstall build, or checkout path.
- [x] 5.4 Review the final requirement map and README against the implementation, passing unit gate, build, and package contents; record exact candidate commit/version/tag/tarball/integrity and do not claim unperformed installation or integration tests.
- [x] 5.5 Present the concrete history-preserving repository rename, remote update, source commit/tag/push, and npm artifact publication plan; verify every effect is reviewable and obtain only any corresponding execution authorization still missing before performing it.

## 6. Authorized repository rename and first publication

- [x] 6.1 Recheck target repository access, @devel-solid/agentscli npm name restrictions/account permission, and available native authentication without exposing secrets; record blockers and verify a prior registry 404 is not treated as a reservation or publication guarantee.
- [x] 6.2 When authorized, rename the existing repository to devel-solid/agentscli and update the checkout remote/public references; verify repository identity and preserved history/refs without an independent-history export, history purge, reset, or force-push.
- [x] 6.3 Reconcile final public metadata with the reviewed build/archive, then create only the authorized scoped-package source commit and agentscli-v0.1.0 tag, preserving the prior public v0.1.0 candidate tag; verify parent history, final file inventory, and exact artifact identity before delivery.
- [x] 6.4 Push the approved source/tag and publish the exact @devel-solid/agentscli@0.1.0 artifact through native Git/npm within granted scope; inspect remote state before ambiguous retries and stop on conflicting tags/versions without replacing immutable published identities.
- [x] 6.5 Verify the actual public repository commit/tag, registry name/version/visibility, dist.integrity, license, and required resources against the candidate; report first delivery only after native delivery checks pass and leave failed/unperformed tasks open.

## Workflow follow-up

- Updating this change edits only proposal.md, design.md, tasks.md, and the nine existing delta specs; it creates no implementation files and checks off no implementation tasks.
- Keep restored guides/presentation, source, templates, skills, root instructions, manifests, and permanent specs unchanged during proposal revision. Do not rename the repository, commit, push, tag, or publish as part of that revision.
- Implementation starts only after an explicit request through openspec-apply-change. All groups belong to this single change; local readiness alone does not complete first delivery.
- After successful authorized delivery and review, finalize specifications and archive through the public OpenSpec workflow when requested. Keep the previously deleted changes deleted.
