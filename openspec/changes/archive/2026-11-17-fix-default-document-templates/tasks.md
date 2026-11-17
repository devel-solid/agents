# Tasks

## 1. Correct document defaults and their public example

- [x] 1.1 Update both localized main templates to the exact bodies in design.md; verify `# AGENTS.md`, the retained working paragraphs, one replacement comment limited to purpose/orientation, and one insertion marker in each.
- [x] 1.2 Update both context templates to the exact bodies in design.md; verify localized titles/cards, one replacement comment, and no previous fill-in or additional generic-rule paragraphs.
- [x] 1.3 Add focused unit coverage reading all four canonical assets and parsing/rendering them in memory; verify localized content, HTML-comment classification before/after rendering, generated notices, convention discovery, and operational marker transformations. Keep custom-heading acceptance covered; run the relevant unit test file after compilation.
- [x] 1.4 Add or extend in-memory planner unit coverage with the actual assets; verify initial setup uses the defaults and repeated init/sync preserve older/customized valid template sources without creating temporary client projects or invoking CLI subprocesses.
- [x] 1.5 Align the README example with the English main default and explain comment replacement and deliberate adoption by existing clients; verify its example and explanation against the assets and preservation contract.

## 2. Align shared authorship guidance

- [x] 2.1 Update the canonical agentscli-update-agents and agentscli-write-conventions skills to replace applicable fill-in comments with verified content during authorized authorship; review that missing facts are reported, new fill-in hints explicitly request their own replacement inside HTML comments, and technical markers remain protected.
- [x] 2.2 Review both skills against the convention-authoring scenarios; verify manifest-selected targets, English skill sources, localized client authorship, review-only behavior, custom headings, direct handwritten mode, and no fixed chat-language instructions or duplicate skill sources.

## 3. Verify the complete correction

- [x] 3.1 Run `npm run check` and record actual results; verify the automated gate contains only unit tests, with no integration/network/client-project test additions.
- [x] 3.2 Run `npm run build` and inspect assembled client resources; verify all four document assets and both shared skills match their canonical sources. Treat this as a delivery check, not an integration-test gate; do not initialize or synchronize this source repository.
- [x] 3.3 Run `openspec validate fix-default-document-templates --strict --json` and review the final diff; verify coherent artifacts, no runtime/interface/dependency changes, no unrelated cleanup or handwritten root-document changes, and no versioning/publication operations.

## Verification results

- Node.js v24.15.0: focused engine units passed 23/23, including four new locale-specific tests.
- `npm run check` passed type checking, formatting, and all 36 unit tests. Gates remain unit-only.
- Both changed skills passed the skill-creator frontmatter validator and manual scenario review.
- `npm run build` passed. File inventories and bytes matched for both document locale directories and both shared skill directories: six files total.
- Strict OpenSpec validation passed without issues; `git diff --check` passed. The reviewed diff is limited to the four templates, README, two shared skills, unit tests, and this change's artifacts. No runtime, dependency, handwritten root-document, or release changes were made.
