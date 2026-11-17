# Implementation and alignment audit

## Contract coverage

| Requirement | Current implementation | Evidence |
| --- | --- | --- |
| Four public roots | init, validate, sync, release; no compatibility aliases | cli.test.mjs rejects retired operations/flags without writes; contracts.test.mjs checks exact roots/options. |
| Minimal setup | Four local setup files; no required arguments, Git, network, or generated documents | local-workflow and installed integration tests check exact creates, preview, preservation and conflicts. |
| Manual authoring | Version-2 directory discovery; explicit v1 behavior preserved | Local workflow, nested families, orphan/invalid sources, schema agreement and 23 frozen output hashes. |
| Validation | Shared parser/source/path/environment checks; base mode independent | Engine, Git, CLI and installed tests cover structured diagnostics and restricted PATH. |
| Generation | One plan with concrete create/update/no-op outputs, preview/check/apply | Installed/local tests verify byte/timestamp preservation, drift 0/1 and no writes on errors. |
| Versioning | Reachable stable tags ordered numerically; selected bump; local tag only | Release tests cover initial/subsequent versions, stale previews, clean/tracked sources, collision and race preservation. |
| Documentation skill | agents-update-docs source packaged by the asset script; role-specific skills installed | Frontmatter/source-asset identity, installed integration and direct CLI without skill tests. |
| Maintainer skill | agents-update-version uses CLI preview/application; baseline independent from consumer pin | Instruction review confirms impact classification, exact plan, explicit confirmation, reapproval on changed state, and scoped remote operations. |
| Presentation | Sixteen slides, four roots, ten options, both skills and no development-framework tooling | Eighty render checks; equal 664px minimum canvas height; no scroll/overflow/browser errors; syntax highlighting/navigation/copy/index pass. |
| Examples | Complete v1/v2 manifests and valid Markdown template; Bash terminal snippets | Runtime parser/source-validator checks plus Bash syntax checks for 14 presentation and 15 guide/skill blocks. |
| Planning | Implemented contracts synchronized; future scopes reconciled | All 11 current specs/changes pass strict validation. Publication/recovery/English-product work remains separate. |

## Skill scope review

The instruction review checks behavior the agent must choose, separately from the deterministic CLI tests:

| Request | agents-update-docs route |
| --- | --- |
| Source edit only | Edit the manifest-resolved template and stop before generated writes. |
| Validation only | Run validate; document freshness is a separate sync --check operation. |
| Preview only | Run sync --dry-run and report planned effects without application. |
| Authorized generation | Validate/preview as applicable, synchronize, check, and report actual changed versus no-op paths. |
| Base versioning | Require explicit scope and applicable repository release checkpoints; CLI computes numbers. |
| Unsupported installed capability | Report incompatibility; no install, invented support, schema migration, or retired-helper fallback. |

The maintainer skill compares changes from the CLI-reported released baseline through HEAD, justifies patch/minor/major, and presents commit/version/effects before confirmation. A changed plan requires renewed confirmation. Local tag creation, remote publication, consumer-pin editing, document generation, commits and npm publication are distinct effects. Only the approved effects may execute. No actual release was performed to review these instructions; disposable CLI tests exercise mechanical tag behavior.

## Repository state

The two authored source directories use the agents- prefix; the old directories do not exist. The packaged integration matches its authored source. This repository explicitly uses a local-only version-2 manifest and regenerates its active instructions through validate and sync. Root sync --check reports no document changes. Source-only/catalog edits do not become a Git/npm release implicitly.

Historical archives and frozen v1 fixture evidence retain their provenance. They are not executable compatibility aliases or pending skill migrations. Files outside the selected composition retain the documented preservation boundary; this change does not implement ownership-based cleanup.

## Platform gate

Windows full gates passed 58/58 without skips on Node22.14.0, Node24.15.0, and Node26.13.1. The final Node24 Lefthook pre-push run passed 58/58 in 97.091 seconds of tests (100.72 seconds total); no push occurred. Linux full gates passed 58/58 without skips on Node22.23.5 (133.594 seconds) and Node24.22.3 (89.626 seconds). Linux26.13.1 passed 58/58 without skips in 77.925 seconds. The final Windows26 installed-artifact rerun passed 12/12 without skips in 46.831 seconds, using the final packaged text assets.

The Linux cold-registry attempt failed before installed scenarios because package metadata did not resolve the lockfile's yaml2.9.1. The successful rerun uses an isolated cache populated only with public registry entries for dependencies in the unchanged lockfile, copied from the already validated Windows cache. npm still verifies package integrity. Official portable runtimes were checked against their nodejs.org SHASUMS256 manifests; global Node installations were unchanged.

The user explicitly excluded macOS testing: "Não vamos testar no Mac." The required matrix is Windows/Linux with Node22/24/26, and the CI/planning contracts reflect that decision. No macOS run or acceptance is claimed.

`npm view yaml@2.9.1 version --prefer-online` also returned `2.9.1` using a fresh temporary Windows cache, confirming current public registry availability without changing the lockfile.


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

## Version-controlled presentation destination — 2026-11-16

Moved the reviewed presentation to docs/presentations/agents-cli-apresentacao.html with identical SHA-256 before and after the move. It is the single maintained HTML deliverable, with inline styles, scripts, highlighting and diagrams; there are no companion assets or dependencies on temporary authoring helpers. The former temporary HTML copy was removed by the move. The documentation path is not ignored by Git; no commit or staging was performed.

Opened the canonical documentation file with browser networking disabled. All 17 slides and 85 viewport checks passed, including equal 664-pixel natural heights, zero overflow, navigation, index and copy. The DOM has zero external resource dependencies. Strict validation passed for all 11 specs/changes; this artifact-only move did not change the CLI or skills.

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

Reviewed the four-command CLI, all current/future proposals, permanent contracts, the three authored/packaged skills and every slide of the 17-slide guide. The independent-base contract above supersedes earlier validation entries that allowed coincident base/consumer roots or post-release consumer adoption within the version skill; those entries are historical evidence, not an active workflow.

Found and reproduced a real role-discovery bypass: an external directory symlink/junction to a base subdirectory was checked through lexical ancestors. The new regression failed against the previous implementation before any fixture writes. Discovery now resolves physical ancestors first, retains Git boundaries, and rejects consumer init/validate/sync and nested base init through that alias. The regression also checks direct engine calls, a ready apply plan and unchanged base contents.

Clarified agents-write-conventions so its prohibition on editing generated AGENTS.md explicitly applies to consumer documents, not the base-owned instructions. Agents-update-docs remains consumer-only and changes neither sources nor manifest. Agents-update-version remains base-only, with reviewed local tagging and separately authorized publication; it never edits consumer pins or generates their documents. All packaged skill copies exactly match their authored sources.

Verified that this repository's AGENTS.md starts with the complete, byte-identical assets/base/AGENTS.md model, followed only by CLI-specific development instructions. The root has valid base identity, no consumer manifest, no local-only convention sources and no generated convention tree. The two shared catalog sources and historical test fixtures remain. Actual root validate --base succeeds; sync --check rejects it with PROJECT_ROLE_CONFLICT, without generation.

| Fresh gate | Result |
| --- | --- |
| Windows, Node 24.15.0, npm run check | 75/75, zero failures/skips; 148.944 s test duration |
| Linux (WSL Ubuntu), Node 24.22.3, npm run check | 75/75, zero failures/skips; 119.874 s test duration |
| Focused role tests on Windows | 10/10, zero skips, including the new alias regression |
| Three skill format validators | All passed with UTF-8 |
| Strict OpenSpec validation | 11/11 specs/changes |
| Canonical HTML, offline browser layout | 17 slides, 85 viewport checks, equal 664-pixel natural heights, zero overflow/dependencies; navigation/index/copy passed |
| Presentation examples | 12 Bash syntax checks and 16 installed-package execution groups passed in disposable base/consumer/local-bare-Git fixtures |
| Cross-artifact audit and git diff --check | Passed |

Every slide was read and inspected: purpose and example (1–4), local source/output mapping and cards (5–6), separated shared cycle (7), seven-file base and owned/template AGENTS distinction (8), writer/version skill locations and roles (9–10), local release and separate remote handoff (11), five-file consumer setup (12), complete manifest (13), validation/generation/freshness (14–15), consumer documentation skill (16), and all supported options (17). No presentation content change was necessary during this final pass.

The six supported Windows/Linux Node-line full runs in the preceding section remain prior evidence; this narrow correction was rerun fully on Node 24 on both systems. macOS remains excluded by the user. No live commit, tag, push, publication or archival was performed. Skill semantics were reviewed manually, without autonomous delegation.
