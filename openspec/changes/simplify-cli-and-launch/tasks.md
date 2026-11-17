# Tasks

## 1. Development and unit-only verification boundary

- [ ] 1.1 Rewrite the handwritten root AGENTS.md, necessary own conventions, and OpenSpec context in English without adding a fixed chat-language rule; verify this CLI repository has no active manifest, self-generated instructions, or active project template tree and that bundled scaffolds remain package data.
- [ ] 1.2 Remove versioned integration/process suites under tests/node, historical integration fixtures/snapshots, and the Python oracle; retain or move only useful isolated assertions into tests/unit and verify that every retained test is a lightweight unit.
- [ ] 1.3 Keep npm test, npm run check, and Lefthook pre-push unit-only; update stale runner/format paths and document the policy, verifying that default tests cannot spawn CLI/Git/npm processes, install packages, access a registry, or construct integration environments.
- [ ] 1.4 Author the repository-only agents-write-repository-conventions skill and reference it from handwritten root AGENTS.md; review that it creates/reviews/maintains own English docs/conventions directly, uses no manifest/templates/init/sync, respects review-only scope, and is excluded from package resources and client initialization.
- [ ] 1.5 During implementation, review the five restored docs/guides files and Git context before deletion; use the internal authoring skill to convert only useful current rules into English handwritten conventions, preserve their meaning, record disposition in this change, and verify obsolete material is discarded rather than repackaged as rules.

## 2. Flat templates and deterministic rendering

- [ ] 2.1 Implement the three-field agents-compose.yml reader (language, templates_dir, conventions_dir) and recursive automatic *.tpl.md discovery excluding the root main template; unit-test custom roots, relative output mapping, empty sets, independent names/directories, invalid manifests/paths, and portable collisions without selection lists.
- [ ] 2.2 Validate main/convention UTF-8 and H1/card structure with Markdown-aware example boundaries; unit-test missing/duplicate/empty cards, invalid titles, and marker-like examples without retaining a historical fixture corpus.
- [ ] 2.3 Implement one convention insertion placeholder in the main template, reading language only from the manifest; unit-test placeholder validation, supported manifest languages, ignored example markers, and content preserved before/after insertion.
- [ ] 2.4 Render the entire AGENTS.md and independent convention documents from templates with the stable generated first-line marker and localized source-edit notice; unit-test index links/cards, card removal, LF output, full-body template changes, and replacement of direct output edits.
- [ ] 2.5 Document the three-field manifest, source-based customization, automatic inclusion, path mapping, and placeholder syntax in the README; verify examples against parser/rendering unit data without an integration walkthrough.

## 3. Stateless synchronization and safe file effects

- [ ] 3.1 Replace hash-history/ownership planning with direct expected/current comparisons; unit-test creates, updates, no-ops, absent outputs, and exact first-line marker recognition using small in-memory inventories.
- [ ] 3.2 Implement bounded recursive cleanup of stale marked *.md files inside the currently configured conventions_dir; unit-test removal/rename effects, foreign-file preservation, marker examples, unmarked expected-destination conflicts, and preservation of any previous output root.
- [ ] 3.3 Validate configured roots as nonoverlapping relative project directories, preserving containment, portable collisions, reserved filenames, and unsafe link/hard-link checks; cover boundary decisions with mocked filesystem unit cases.
- [ ] 3.4 Replace the transaction/journal machinery with full preflight and safe individual-file replacement; unit-test write order, temporary cleanup, operational failure reporting, completed/remaining effects, and convergence of a newly computed plan after failure without rollback state.
- [ ] 3.5 Make preview/check use the same validated plan without writes and skip unchanged documents; unit-test dry-run success, check drift exit 1, invalid input exit 2, operational exit 3, and a repeated no-op plan.
- [ ] 3.6 Explain generated-output replacement, bounded cleanup, existing-file conflicts, partial-failure retry, and unsupported concurrent mutation in the README; verify that it promises neither output-edit preservation nor multi-file atomicity.

## 4. Initialization, language resources, and two skills

- [ ] 4.1 Author English default and pt-br main/context templates, using the manifest language for file text without prescribing agent reply language; verify both static resource sets with parser/rendering unit cases and preserve the templates as the actual authoring surface.
- [ ] 4.2 Rewrite agents-write-conventions and agents-update-docs, with both locale variants sourced under .agents/skills; verify they read the reduced manifest, teach source authorship/full regeneration, and introduce no base, family, selection list, cache, or extra approval workflow.
- [ ] 4.3 Implement init planning that always replaces agents-compose.yml with the requested/default language and default roots while preserving valid existing templates and skills; unit-test first setup, zero-write preview, manifest replacement including invalid old content, and preflight conflicts before mutation.
- [ ] 4.4 Use the new manifest language for missing init assets and the current manifest for later sync; unit-test default en, --lang pt-br, repeat-init reset, invalid-language rejection, custom-root sync, preserved authored text without translation, and intentionally removed convention sources.
- [ ] 4.5 Rework scripts/package-assets.mjs into explicit en/pt-br resource mappings, remove the base-versioning skill and stale base/starter assets, and adjust the package allowlist; verify mappings with isolated unit assertions and inspect the generated asset tree during the ordinary build.
- [ ] 4.6 Document manifest-overwriting init, configurable roots, language selection, preserved templates/skills, and manual skill replacement in the README; verify that technical identifiers stay stable and no automatic content translation or skill merge is promised.

## 5. Three-command interface and runtime removal

- [ ] 5.1 Wire init, validate, and sync with only the documented options, explicit/current project root, help/version, JSON envelope, and exit meanings; unit-test option parsing and dispatch with mocked command boundaries instead of spawning the compiled CLI.
- [ ] 5.2 Remove release/base/remote options and the old debug/provenance surface; unit-test actionable rejection of obsolete or misplaced options and review help for the final three-command workflow.
- [ ] 5.3 Remove obsolete roles, Git resolution, lock, ownership, release, transaction engines, and old schemas; reduce manifest parsing to three fields, keep yaml, remove unused ajv, and verify types/units without unrelated dependency upgrades.
- [ ] 5.4 Translate maintained CLI/help/diagnostic text to English and remove internal source-path assumptions; verify unit-level messages/JSON and review runtime asset paths so they resolve relative to the installed package.

## 6. Public identity and complete first-release documentation

- [ ] 6.1 Change maintained metadata/self-references to agents-cli, @devel-solid/agents-cli, devel-solid/agents-cli, and experimental 0.1.0 while retaining the agents executable; add MIT LICENSE and required repository/license/issue links, checking package/lockfile consistency and retained attribution.
- [ ] 6.2 Rewrite the concise English README with purpose, three-field manifest, init/author/validate/sync examples, en default and --lang pt-br, overwrite behavior, generated-output rules, and unit-only developer commands; verify examples and links.
- [ ] 6.3 After completing guide review/conversion in 1.5, delete the five guides and presentation during implementation, remove stale links/package inclusions, and leave only necessary own English conventions in docs; verify essential usage/publication information is in the README and no replacement guides or presentations are added.
- [ ] 6.4 Keep the current lightweight CI unit/type/format workload and Lefthook without adding a platform/version acceptance matrix; verify no integration, installed-package, Git-fixture, or registry test workload is introduced.

## 7. Local readiness and reviewed delivery plan

- [ ] 7.1 Run the focused units as changes land and npm run check as the general gate; record actual results and verify no extra integration/test process is added or invoked.
- [ ] 7.2 Run the ordinary build and npm packaging/file-list inspection for @devel-solid/agents-cli@0.1.0; verify it contains the executable, MIT metadata, en/pt-br templates and exactly two client skills, excluding the repository-only authoring skill, obsolete schemas/base assets, integration tests, checkout-only references, and secrets.
- [ ] 7.3 Review the final requirement map, synchronize approved deltas through the public OpenSpec workflow when requested, update retained capability purposes, and remove retired empty capability files; verify the approved spec set matches this single change and the six previously deleted changes remain absent.
- [ ] 7.4 Present local readiness, exact candidate metadata/integrity, remaining native account/name checks, and a concrete final snapshot/commit/tag/artifact/publication plan; verify all implementation and documentation are reviewable before requesting any still-missing authorization for real Git/GitHub/npm effects.

## 8. Authorized clean handoff and first publication

- [ ] 8.1 After the concrete execution plan is authorized, verify the future repository and npm scope/name permissions using existing native account access without exposing secrets; record any external blocker and leave delivery tasks open if unavailable.
- [ ] 8.2 Preserve access to the current development checkout and export only the approved final-file inventory to the new public working copy, carrying this single pending change; verify the snapshot excludes old .git/refs, deleted changes, caches, obsolete base content, temporary files, and integration fixtures.
- [ ] 8.3 Initialize the independent public Git history and create the approved initial commit/repository state; verify independent parentage and expected files without resetting, deleting, or force-pushing the development repository.
- [ ] 8.4 Build and package against the final public metadata, inspect the final archive and identity, and confirm that any difference from the reviewed artifact is reconciled before publication; record exact source/artifact identities without adding an integration acceptance suite.
- [ ] 8.5 Publish the approved source commit, v0.1.0 tag, and exact public npm artifact through native Git/npm operations within the granted scope; verify existing remote state before retrying ambiguous operations and never overwrite conflicting published identities.
- [ ] 8.6 Verify the actual public repository commit/tag, npm name/version/visibility, dist.integrity, license, and required asset metadata against the approved candidate; report first delivery only after these native delivery checks pass and retain open tasks for any failed/unperformed effect.

## Workflow follow-up

- This proposal authorizes planning only; implementation starts through openspec-apply-change after a new user request.
- Proposal revisions do not execute these tasks or check them off. Keep the restored guides, presentation, source code, templates, skills, root instructions, and main specifications unchanged until implementation is explicitly requested. Committing/pushing planning changes is distinct from implementing or publishing the product.
- All eight groups belong to this one change. Local readiness does not complete the actual first-publication tasks, and no later English change is required.
- After successful first delivery and user review, finalize the public specification set and archive this completed change through openspec-archive-change when requested. Do not restore the old archived or active changes.
