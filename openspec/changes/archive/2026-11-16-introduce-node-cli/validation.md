# Current runtime and interface evidence

## Implemented boundary

The Node runtime and simplify-cli-workflows implementation expose init, validate, sync, and release. Both project skills use the agents- prefix and current workflow. The package ships both skills: ordinary init installs agents-update-docs in consumers; init --base installs agents-update-version in bases.

```text
installed CLI -> shared v1/v2 parser -> local/remote source resolution
  -> source/path validation -> render -> document plan
    -> validate / preview / check
    -> changed-document writes

clean committed base -> reachable stable tags -> calculated version
  -> preview: no writes
  -> application: one non-forcing local tag at HEAD
```

This repository explicitly opts into local version-2 composition. Its generated instructions were refreshed through the public CLI. No real commit, tag, push, npm publication, or archival was performed. Test tags and Git repositories are disposable.

## Behavioral evidence

- Version-1 fixture inputs and all 23 accepted output hashes remain unchanged.
- Installed-package scenarios cover company bases, two consumers, pinned content as data, integration preservation, and restricted runtime PATHs.
- Local scenarios cover parameter-free setup, manual editor/copy authoring, whole-family discovery, preview/apply/check, repeat no-ops, custom roots, invalid sources, and CLI use without a skill.
- Release tests cover first/subsequent versions, numeric ordering, annotated/lightweight baselines, unrelated branches, invalid/dirty/ignored untracked sources, collisions, stale previews, and concurrent changes.
- Reference manifests/templates use the runtime validators. Help is checked for four roots and ten options. Skill names and packaged/source identity are checked.
- The temporary HTML contains 16 slides. All 80 slide/viewport checks passed: no overflow/browser exceptions; equal minimum canvas height 664px; navigation, copy, index and highlighting work. Four roots, ten options and both skills are present; development-framework tooling is absent.
- All 11 specs/changes passed strict validation after semantic synchronization of implemented contracts. Future reliability/publication/English-product scopes remain separate and use the four-command boundary.

## Execution records

The current 58-test suite passed without skips in the required matrix:

| System | Node | Tests | Test duration |
| --- | --- | --- | --- |
| Windows | 22.14.0 | 58/58 | 113.222 s |
| Windows | 24.15.0 | 58/58 | 97.091 s (actual Lefthook gate) |
| Windows | 26.13.1 | 58/58 | 89.506 s |
| Linux (Ubuntu WSL) | 22.23.5 | 58/58 | 133.594 s |
| Linux (Ubuntu WSL) | 24.22.3 | 58/58 | 89.626 s |
| Linux (Ubuntu WSL) | 26.13.1 | 58/58 | 77.925 s |

The final Windows24 Lefthook gate took 100.72 seconds overall and did not run git push. Portable Node runtimes were checked against official SHASUMS256 manifests. The cold Linux installed-package attempt failed on unavailable yaml2.9.1 registry metadata; the successful runs used a separate cache containing only public entries for unchanged lockfile dependencies from the validated Windows cache. npm integrity verification remained enabled.

Historical validation-results.json records the earlier port and is preserved as provenance. The user explicitly excluded macOS testing ("Não vamos testar no Mac."); CI, tasks and specs now require Windows/Linux. No macOS execution is claimed. All required platform lines have fresh behavioral evidence.


## Automatic base skill installation — 2026-11-16

This revision supersedes the earlier distribution boundary. The CLI package now contains both authored skills. Ordinary init installs only agents-update-docs in the consumer; init --base installs only agents-update-version in the base. No skill-copy command or manual installation is required.

Fresh base initialization reports exactly these four files:

```text
.agents/skills/agents-update-version/SKILL.md
README.md
templates/AGENTS.tpl.md
templates/docs/conventions/README.md
```

The installed-artifact tests verify the exact paths, packaged/source identity, Node-only setup, zero-write preview, adding a missing skill to an existing scaffold, repeat preservation, customized/extra-file conflicts before any write, and absence of the consumer skill. Focused CLI tests cover reserved aliases and rejection of a version-skill alias pointing at the consumer skill. A separate review smoke test verifies both role orders and preserves a customized existing skill in each case. Versioning guidance follows the base's local branch policy.

| Current execution | Coverage | Result | Test duration |
| --- | --- | --- | --- |
| Windows / Node24.15.0 | Full npm run check | 61/61, no skips | 105.700 s |
| Linux / Node22.23.5 | Full npm run check | 61/61, no skips | 121.515 s |
| Linux / Node24.22.3 | Full npm run check | 61/61, no skips | 82.997 s |
| Linux / Node26.13.1 | Full npm run check | 61/61, no skips | 81.351 s |
| Windows / Node22.14.0 | CLI, public contracts and installed tarball | 25/25, no skips | 75.543 s |
| Windows / Node26.13.1 | CLI, public contracts and installed tarball | 25/25, no skips | 61.380 s |

The final review also checks both skill formats, 12 Bash presentation snippets and 15 Bash guide/skill snippets. All 11 current specs/changes pass strict validation. All 80 slide/viewport checks pass: each canvas is 664px minimum, there is no overflow/scrolling, and navigation, copy, index and highlighting work. The product guide shows automatic installation in the base and consumer, with their separate terminal contexts and skill entry stages. The source-copy instruction was removed from the guide and its index. Root sync --check reports no document changes. macOS stays outside the test scope at the user's explicit request.

No real commit, release tag, remote publication or npm publication was performed. Historical 58-test records above are prior evidence; the table in this section describes the current revision.

## Separate convention authoring skill — 2026-11-16

Added agents-write-conventions for semantic authorship/maintenance in both roles. Consumer init installs it with agents-update-docs; base init installs it with agents-update-version. Each minimal setup creates five files. Update-docs now only validates, previews, generates and checks existing manifest inputs; it does not edit sources, configuration or pins.

| Platform | Node | Passed / total | Skipped | Test duration |
| --- | --- | --- | --- | --- |
| Windows | 24.15.0 | 65 / 65 | 0 | 105.750 s |
| Linux (WSL Ubuntu) | 22.23.5 | 65 / 65 | 0 | 127.209 s |
| Linux (WSL Ubuntu) | 24.22.3 | 65 / 65 | 0 | 90.139 s |
| Linux (WSL Ubuntu) | 26.13.1 | 65 / 65 | 0 | 84.102 s |

These gates ran npm run check, including types, formatting, build and behavioral tests. Added cases cover both installed-package skill copies, exact inventories, zero-write previews, missing-copy repair, unchanged-copy timestamps, customized/extra-file conflicts before setup writes, unsafe aliases and dual-role preservation. The final packed artifact also passed 29 focused Windows tests with no failures or skips after a wording correction explaining automatic child discovery; no runtime code changed after the full gates.

All three authored skills passed the bundled skill format validator in UTF-8. Manual semantic review covered base authoring without a consumer manifest, configured consumer roots, review-only/source-only scope, remote-cache protection and generation/release separation. This review is not an autonomous agent-behavior test. The full example in the new skill passes the actual Markdown validator; child discovery instructions were checked against renderFamily to avoid duplicating generated discovery sections.

The 17-slide HTML guide was checked slide by slide against CLI/contracts/skills, including the new authorship slide, both five-file trees and manifest-only update-docs. All 85 viewport checks passed, with identical 664-pixel natural canvases, no scrolling/overflow and working navigation/index/copy. All 17 terminal blocks have syntax highlighting. Twelve Bash blocks passed shell syntax checks; 16 installed-package execution groups completed using disposable base/consumer/local-bare-Git fixtures. No real repository commit, tag, push, npm publication or archive was performed. macOS remains intentionally excluded by the user.

Strict validation passed for all 11 current specs/changes. Authorized generated policy outputs were refreshed through the public CLI and sync --check reports no differences. Git diff --check passed.

## Full role and sequence review — 2026-11-16

Reviewed init/validate/sync/release implementations and their source/output/cache/tag boundaries, all three authored skills and packaged copies, current contracts and related pending proposals, public guides, and every rendered slide.

Corrections:
- Replaced leftover two-skill inventory wording and ambiguous consumer-skill exclusions with exact shared and role-specific identities.
- Limited automatic source inclusion to version 2 in help, authoring scenarios and contracts; preserved explicit version-1 local selection.
- Made optional approved post-release consumer adoption name its consumer root, exact pin edit and authorized generation. Generation runs there through agents-update-docs; missing setup is reported rather than initialized or copied implicitly. Base and consumer roots may coincide only when both roles are selected explicitly.
- Identified the AI authoring example as an alternative to the source-copy step before the commit, rather than an extra creation after the base was committed.
- Clarified that the pending reliability workflow retains manifest-only generation guidance and separate content-curation/versioning roles; no future reliability/publication features were implemented.

Fresh verification: Windows Node 24.15.0 npm run check passed 65/65 tests, zero skips, in 108.968 seconds of test execution. All three skill format checks passed in UTF-8. Strict validation passed for 11 specs/changes. All 17 slides were inspected visually and their 85 viewport/layout checks passed with equal 664-pixel natural heights and no overflow. Twelve Bash snippets passed syntax checks; 16 installed-package execution groups completed in disposable base/consumer/local-Git fixtures. Root sync --check and git diff --check passed. No live commit, tag, push, publication or archival occurred. Linux matrix results above are prior evidence and were not rerun for these wording/workflow corrections; macOS remains excluded by the user. Skill semantics were reviewed manually, not by an autonomous forward-testing agent.

## Independent base and owned AGENTS.md — 2026-11-16

Implemented the approved exclusive-role model. Base init creates seven files, including its owned editable AGENTS.md and internal .agents/base.json identity. Consumer setup remains five files. Base initialization preserves valid customized instructions and repairs missing instructions only when explicitly requested. Wrong roles, manually inserted consumer manifests, invalid markers, subdirectory fall-through, aliases and unsafe instruction files are rejected before writes. The base's own instructions are distinct from its consumer-facing main template and catalog.

The real repository now uses the base model plus concise CLI development guidance. Its consumer manifest, local-only convention source tree and generated convention output tree were removed as authorized. The two shared sources and immutable historical consumer fixtures remain preserved. The base validates successfully with two families; consumer sync/check rejects this root with PROJECT_ROLE_CONFLICT and exit 2 without modifying files.

All three skills and their packaged copies, public guides, current/permanent specs and related future plans were reconciled. Base versioning no longer edits consumer pins or generates consumer documents. Later publication may still deliver independent CLI/content streams, but no longer includes a self-consuming base metadata phase. No later reliability/publication feature was implemented.

| Platform | Node | Passed / total | Skipped | Test duration |
| --- | --- | --- | --- | --- |
| Windows | 22.23.5 | 74 / 74 | 0 | 168.375 s |
| Windows | 24.15.0 | 74 / 74 | 0 | 138.685 s |
| Windows | 26.13.1 | 74 / 74 | 0 | 120.775 s |
| Linux (WSL Ubuntu) | 22.23.5 | 74 / 74 | 0 | 159.589 s |
| Linux (WSL Ubuntu) | 24.22.3 | 74 / 74 | 0 | 107.761 s |
| Linux (WSL Ubuntu) | 26.13.1 | 74 / 74 | 0 | 113.199 s |

Every configuration ran npm run check, including type checks, formatting, clean build, package installation, consumer compatibility, independent base setup and release fixtures. Nine new role/instruction tests replace the permitted-hybrid behavior with observable rejection and preservation checks. An earlier focused package/role gate passed 28/28 with zero skips. The cached official Windows Node 22 executable was SHA-256 verified; no global runtime or dependency versions were changed. macOS remains excluded by the user.

All three skill format checks passed in UTF-8. Their semantics were reviewed manually, not by an autonomous forward-testing agent. The 17-slide standalone HTML was inspected slide by slide and passed 85 offline viewport checks, equal 664-pixel natural heights, zero external dependencies and working navigation/index/copy. It now shows the seven-file base tree, owned AGENTS.md versus consumer template and generation only in consumers. Twelve Bash blocks passed syntax checks and 16 execution groups completed using the installed package and disposable base/consumer/local-bare-Git repositories.

Strict validation passed for all 11 specs/changes and git diff --check passed. No live commit, tag, push, publication or archival was performed; all release operations were confined to disposable fixtures.


## Final exclusive-role review — 2026-11-16

The subsequent review fixed physical-root discovery through directory aliases and clarified the authoring skill’s consumer-output restriction. Full Node 24 checks passed 75/75 without skips on Windows and Linux. The owned AGENTS.md model, exclusive roles, all three skill boundaries, proposals and all 17 slides were checked again. See [the detailed review evidence](../2026-11-16-simplify-cli-workflows/validation.md#final-exclusive-role-review--2026-11-16) for exact gates, layout/example results and prior-matrix limits. No live publication or archival occurred.
