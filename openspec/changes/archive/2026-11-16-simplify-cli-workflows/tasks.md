# Tasks

## 1. Versioned manifest and source discovery

- [x] 1.1 Package/parse version 2 with optional base, discovered locals, and remote-only entries; verify version-1 fixtures, schema/editor agreement, and invalid local entries.
- [x] 1.2 Scan configured local families deterministically; verify nested/copied files, ignored ordinary files, orphan/malformed sources, escaping aliases, and destination collisions before writes.
- [x] 1.3 Document complete manifests, main-template authority, manual creation/copying, and pinned consumer-version changes; validate examples against schemas and source validators.

## 2. Minimal initialization and manual authoring

- [x] 2.1 Implement parameter-free init with local main/context templates, manifest, and packaged integration; verify exact new paths, no remote calls/final documents, repeat preservation, and preflight conflicts.
- [x] 2.2 Implement init --dry-run for ordinary/base modes with concrete create/preserve/conflict plans and zero filesystem/cache/Git writes.
- [x] 2.3 Retain init --base, optional starter, and validate --base; reject obsolete ordinary-init selection flags and do not add new, doctor, convention-management, or base-configuration command groups.
- [x] 2.4 Document editor/copy-based source authoring with complete valid source headers; verify version-2 local discovery needs no registration or manifest rewrite and version-1 explicit selection remains intact.

## 3. Unified validation and generation

- [x] 3.1 Merge applicable doctor diagnostics into validate/validate --base, with debug detail and actionable failures; verify Node-only local mode and Git prerequisites only when needed.
- [x] 3.2 Route discovered locals and declared remotes through the same engine; preserve version-1 outputs, safe paths, rendering, generated notices, and integration preservation.
- [x] 3.3 Report concrete sync create/update/no-op results; verify dry-run/check preserve documents and configuration, permitted remote-cache effects, repeat-run no-ops, and freshness exit 0/1.
- [x] 3.4 Migrate public help and authored doctor callers; preserve JSON/error semantics, explicit root override, and current stale-output ownership boundary.

## 4. One local base release operation

- [x] 4.1 Add release --bump patch|minor|major with numeric selection of stable reachable Git tags and an implicit v0.0.0 initial baseline; verify annotated/lightweight tags, unrelated branches, non-version tags, and numeric ordering.
- [x] 4.2 Validate the base and clean committed Git state; verify missing Git/HEAD, malformed templates, untracked changes, existing-target tags, and no manifest/package/remote requirement.
- [x] 4.3 Add release --dry-run with the same checks and zero filesystem/cache/ref/network writes; verify baseline/bump/next/HEAD reporting and planned rather than applied JSON results.
- [x] 4.4 Create only the calculated local tag at HEAD after immediate state rechecks; verify race/collision preservation, stale-preview recalculation, and unchanged files, package versions, refs unrelated to the new tag, and remotes.
- [x] 4.5 Retire the four public release helper subcommands and migrate authored callers; retain reusable safety checks internally and reject manual current/next version or SHA flags with migration guidance.

## 5. Integrated acceptance and planning coherence

- [x] 5.1 Exercise init -> editor/copy -> validate -> sync --dry-run -> sync -> sync --check from packed installs on supported Windows/Linux and Node lines; verify exact outputs and repeat preservation.
- [x] 5.2 Exercise init --base -> author/copy -> validate --base -> commit -> release preview -> local release in disposable Git fixtures, including first/subsequent versions and failure preservation; do not perform real publication.
- [x] 5.3 Run focused implementation tests, then npm run check and package checks; record missing platform evidence instead of claiming acceptance from configuration alone.
- [x] 5.4 Reconcile superseded onboarding/release interfaces in pending Node/reliability/publication plans before downstream implementation; retain the four-command boundary without accepting or delivering other stages.
- [x] 5.5 Keep the HTML presentation and documentation consistent with the approved command/effect matrix; verify Bash snippets, complete templates, exact path examples, dry-run boundaries, and accurate implementation-status labeling.
- [x] 5.6 Verify the retained agents-update-docs integration is packaged/installed from its authored source and routes existing-manifest generation correctly; exercise manifest-driven preview-only and authorized generation, unavailable CLI capabilities, and direct CLI usage without loading a skill; authoring and versioning belong to separate skills. Preserve actual no-op versus changed-output reporting.
- [x] 5.7 Migrate the maintainer's agents-update-version instructions to the supported release preview/application contract, retaining confirmation, repository-specific publication boundaries, baseline-versus-consumer-pin separation, and changed-plan reapproval. Verify the guide covers all three skills, every supported option, and the effects formerly split across helpers without including development-framework tooling or retaining obsolete migration instructions.

## 6. Base-installed version skill

- [x] 6.1 Package the role-specific skills and install agents-update-version plus the shared agents-write-conventions through init --base; verify exact paths, empty-base setup, zero-write previews, repeat preservation, customized/extra-file conflicts, reserved aliases, and independence from Git/network.
- [x] 6.2 Align skill distribution, public help, guides, current/future proposals, permanent contracts and the HTML cycle; verify automatic installation in each role and remove manual skill-copy guidance.
- [x] 6.3 Review the final installed-package workflow again, run focused tests and the full Windows/Linux gates, and inspect every affected slide for scope, sequencing, highlighted snippets, equal height and zero overflow.

## 7. Separate convention authorship and curation

- [x] 7.1 Create agents-write-conventions for base/consumer curation and narrow agents-update-docs to existing-manifest generation; verify valid examples, scope routing and no implicit generation/versioning.
- [x] 7.2 Package/install the authoring skill in both init modes; verify five-file consumer and seven-file base inventories, offline zero-write previews, repair, exact-copy timestamps, customized/extra-file conflicts before writes, safe aliases and cross-role rejection.
- [x] 7.3 Align current contracts, related proposals, guides and the HTML presentation with all three skills and concrete installation, authoring, generation and release effects; execute installed-package workflows and inspect affected slides.

## 8. Cross-artifact role review

- [x] 8.1 Review all four commands, all three skill workflows, current/future proposals and every slide; reconcile version-1 selection, exact role-specific installation and separate consumer adoption outside base versioning, then verify package/examples and visual layout.

## 9. Retain the presentation as versioned documentation

- [x] 9.1 Move the reviewed guide to docs/presentations/agents-cli-apresentacao.html as a single self-contained HTML file; verify offline loading, navigation, equal slide heights and no external/temporary dependencies, and update the proposal/design to define its maintained destination.

## 10. Independent base with owned instructions

- [x] 10.1 Implement explicit base identity and mutually exclusive roles across init, validation, generation and release; verify root/subdirectory checks, marker errors, aliases and rejection before writes while preserving remote-source contracts.
- [x] 10.2 Package the owned base AGENTS.md, create seven-file base setup and preserve valid custom instructions; verify dry-run, repair, idempotence and installed package behavior.
- [x] 10.3 Replace this repository's generated instructions with the base model plus concise development guidance; remove its consumer manifest and local-only convention sources/outputs while preserving shared sources and historical fixtures.
- [x] 10.4 Align all three skills, public guides, current/future proposals and permanent contracts; remove hybrid/self-consumption and consumer adoption from the version skill without implementing later publication features.
- [x] 10.5 Update and inspect every slide in the standalone versioned HTML, including both AGENTS files and the seven-file base tree; verify offline layout, examples and command coverage.
- [x] 10.6 Run focused and full Windows/Linux supported-Node checks, skill/spec validation and final cross-artifact review; record actual evidence with no live release or archival.

## 11. Independent-base review

- [x] 11.1 Recheck physical-root aliases, CLI role rejection, current/future contracts, all three skills and every slide; preserve the owned AGENTS.md model and correct any remaining ambiguity, with regression tests and final package/layout verification.

## Revision status

The user authorized implementation, skill renaming, cross-artifact alignment, and tests. The implemented four-command interface and all three skills are tracked above. This repository uses owned base instructions and has no live consumer composition. Platform evidence and acceptance remain separate. No real commit, tag, push, npm publication, or archival is performed.
