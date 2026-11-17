# Design

## Context

See `proposal.md` and `specs/english-product-experience/spec.md`. The user confirmed this is the fifth change, after the first actual public release; the next package version becomes the English delivery. All four earlier implementation gates and the separately authorized clean-history handoff remain prerequisites. Implement here only if this is then the approved public checkout; otherwise continue in the new public repository with the approved pending plan, without importing private history.

The implemented Node CLI, owned base AGENTS.md, Portuguese guides, three authored skills and consumer renderer provide the maintained language surfaces. Historical Python and neutral/local fixtures remain provenance and compatibility evidence, not active base instructions. Inspect the actual first public artifact and freeze its source identities before this later translation stage. Do not restore retired Python entry points or root self-composition.

The first public version is a real compatibility baseline, unlike private development v3/v4. The absence of consumers during today's planning cannot justify overwriting published tags, ignoring locks, or assuming nobody has adopted that first version.

The public manifest has one format: required `schemaVersion: 1`, directory-discovered local families, optional pinned Git base, and explicit remote-only entries. The former private explicit-local format and development schema v2 are unsupported; historical fixtures remain provenance and are adapted explicitly in tests rather than accepted by the runtime. JSON envelopes, base-role markers, locks, and ownership records have independent format versions.

## Goals / Non-Goals

**Goals:** complete English maintained prose, a self-contained visual introduction with working examples, preserved public technical contracts and company ownership, and evidence from the actual subsequent registry artifact and Git content.

**Non-Goals:** general internationalization infrastructure, selectable UI locales, external translation services, translating consumer files, renaming published technical paths, changing local scope/approval rules, new CLI features unrelated to English rendering, generic skill distribution, or repeating repository migration.

## Decisions

### 1. Translate maintained prose with a reviewable inventory

Use one English product language, en-US. Inventory first-party maintained files and package assets before translation, including hidden authored integrations, owned base instructions and the standalone HTML presentation. Distinguish authored text from consumer-generated output and record the source that produces each generated surface.

| Surface | Treatment |
| --- | --- |
| CLI help, progress, human/JSON diagnostic messages, release guidance | English text; stable codes, fields and exits |
| README, maintained guides, metadata/schema descriptions, packaged reference | English; consistent terminology and version-matched links |
| Base/context scaffolds and optional two-source starter | English editable copies; no mandatory company-language policy |
| First-party skill descriptions/instructions and owned base AGENTS.md | English text; preserve workflow and operational meaning |
| Renderer notices, discovery prose and labels | English defaults; source-compatible structural recognition |
| Comments, docstrings, test descriptions and explanatory fixtures | English; preserve deliberate multilingual test input |
| Consumer-generated AGENTS.md and convention documents | Regenerate in separate consumers from approved sources; no manual translation |
| Existing contractual paths, fields, commands, card markers, external identities | Preserve exact bytes and references |
| Previous releases/archives, third-party/legal text, deliberate compatibility/Unicode samples | Preserve; document specific reasons and provenance |

Use targeted English/Portuguese searches, including unaccented terms, and manual review of the inventory and packed artifact. A lack of accents is not evidence that prose is English. Any automated residual-language check uses narrow documented exceptions, not blanket exclusions for tests, hidden directories, or local rules. Do not expand into dependency trees, private backups, caches, or immutable history.

Alternative: translate only the README. Rejected because the installed experience and generated assets would remain Portuguese. Alternative: rename every Portuguese path during translation. Rejected because those paths are public technical identifiers and source selections; keeping them avoids a separate migration. All new noncontractual explanatory text uses English.

### 2. Update source policy without changing the conversation or company rules

Update the language instructions in the owned root AGENTS.md so maintained artifacts use en-US while agent chat remains pt-BR. Preserve UTF-8, existing scope and publication authorization. Do not recreate the removed local convention tree or translate historical fixtures except for explicitly reviewed explanatory text.

Edit the owned base AGENTS.md directly and update its packaged default source where applicable. Use the installed CLI only for generated-document verification in separate disposable consumers; do not run sync in the base. Generated OpenSpec skills belong to their provider: refresh only through their supported mechanism if needed; do not hand-edit third-party material.

Company-authored templates and instructions remain at their selected Git commits and local paths, in any supported UTF-8 language. A package update does not edit them. Likewise, translated packaged agents-write-conventions, agents-update-docs and agents-update-version instructions are available to new initialization; existing project integrations retain the established no-implicit-refresh and customized-file conflict rules. Translating our own authored integration does not authorize overwriting another project's copy.

### 3. Translate discovery without weakening compatibility

Retain the machine-readable `AGENT-CARD` markers and manifest/JSON/schema names. Extend the Markdown-aware structural recognition to accept the English discovery headings (`When to read conventions` and `When to read subconventions`) and the first release's Portuguese headings outside code examples. Exactly one operative discovery section is allowed per role; mixed duplicate or ambiguous sections receive the existing validation diagnostic model before writes.

New English scaffolds and English starter sources use the English headings. An existing pinned Portuguese template is still read as authored; renderer-owned discovery bodies, file labels, notices, and diagnostics use the new English defaults. Preserve supported source slices and do not translate arbitrary Markdown. Existing locks continue selecting their recorded repository/commit; no implicit content update occurs. Language-only generated-byte changes are visible through the shared plan, with ownership checks and no-change second runs. Do not manufacture new hashes to legitimize edited outputs.

Capture regressions from the actual first public package/base, including local context, parent/child discovery, fenced/indented examples, UTF-8 paths and content, existing lock/state, and customized integration. Keep the stable data formats and renderer contract where the supported structural contract remains backward compatible. Document that new English starter content requires the new CLI; do not promise that old executables understand newly added headings. Assess CLI and content SemVer separately, including any actual compatibility impact, without assuming a patch release or assigning versions during planning.

Alternative: global string replacement across sources and generated files. Rejected because headings are structural and consumer content is independently owned. Alternative: remove Portuguese recognition immediately. Rejected because the first public base may already be pinned by consumers. A full locale framework is unnecessary for one new default and bounded compatibility recognition.

### 4. Organize the README around the first successful use

The root README is the common GitHub/npm introduction, with deeper guides linked after the quick starts. Keep it approachable and avoid copying the full reference manual into the opening page.

```text
npm CLI + selected company Git base + project-local sources
                         |
                         v
                validated composition plan
                         |
                         v
              AGENTS.md + convention documents
```

Recommended reading order:

1. A short problem/benefit statement and the diagram above, followed by a role table: tool maintainer, base author, project consumer.
2. Supported Node/Git prerequisites and exact install/execution examples using the real published package identity. OpenSpec and tool-source build tooling are not consumer prerequisites.
3. A quick start for consuming an existing company base, with explicit repository/ref/parent selections, local context, sync, and check.
4. A quick start for creating a base with `init --base`, an explicit optional `--starter minimal` branch, authoring a custom family, `validate --base`, and separately performed Git publication/tagging.
5. A small file tree, a full valid `agents-compose.yml`, one valid source/card, and a compact expected generated result. Explain what users edit and what the CLI generates.
6. Separate npm tool updates from Git content updates, show preview and explicit `update --ref`, and explain pins, locks, owned-output conflicts, private Git access, and independent project adoption.
7. Honest limits and deeper links: one remote plus local sources, optional starter, the three specialized agents-write-conventions, agents-update-docs and agents-update-version integrations only, no arbitrary skill sharing, no company-content translation.

Use concise ASCII flows/trees, tables, and fenced executable examples. Do not add screenshots, badges, or hosted visual dependencies merely for decoration. Explain every placeholder and use clearly fictional repository names; verification substitutes fixture remotes explicitly. Make shell-specific commands explicit only where PowerShell and POSIX differ. Resolve guide links in both repository and npm rendering; relative repository links may require stable public URLs for the npm page.

Validate the examples by executing the documented sequence through the installed tarball in disposable directories with no checkout-only imports. The exercise creates a separate content base and two consumers, then a content update; it never creates a real hosted company repository or publishes their fixture rules. Check actual resulting documents and links rather than only searching for command strings.

### 5. Use the ordinary release to prove delivery

```text
verified first public CLI/content baseline
  -> English sources + README + compatibility regressions
  -> pack/install + documented examples + platform/pre-push gates
  -> freeze commit + exact artifact + ordinary release plan
  -> review/authorize selected streams and concrete versions
  -> approved maintainer publication/recovery workflow
  -> exact npm registry install + verified Git content
  -> fresh and previously configured consumers + explicit update + repeat check
```

Use stage 3's release commands and journal as a client, not a second publication implementation. The version follows actual semantic impact; no literal version, package rename, or registry operation is approved here. If maintained Git starter/base sources change, include their separately assessed content stream in the reviewed plan. Publish and verify source tags; test adoption only in separate disposable consumers, without metadata generation in the base. Consumers upgrade the CLI before explicitly adopting English content that requires it; nothing follows a new tag automatically.

Inspect the exact tarball, including README and packaged English reference/scaffolds, install-test it outside the checkout, retain its integrity, and publish that artifact only after the concrete plan is authorized. On the actual new registry version, verify integrity/version and execute init/base validation/consumer sync/preview/check/update against verified remote content, including the first public base compatibility case. Record sanitized repository/tag/commit and package identities, outcomes, and unchanged repetition. No long-lived credential or private company fixture is needed in logs.

Local readiness and live success are separate task states. Without authorization, stop with an exact reviewable plan and publication tasks unchecked. After a partial publication or failed remote check, use established resume/forward correction; never overwrite a version, move a published tag, recreate the root, or hide the failure behind a passing tarball rehearsal. Archive only after the agreed actual-release gate passes.

## Risks / Trade-offs

- Incomplete translation hidden in generated assets -> inventory source/output ownership, scan the packed artifact, and manually review every maintained surface.
- Existing first-version consumers rely on Portuguese structure or paths -> retain bounded structural recognition and stable paths; test their real released fixtures.
- README looks good but commands need the source checkout -> execute both journeys using the tarball and exact registry install outside it.
- Translation changes policy or overwrites company instructions -> preserve normative meaning and ownership, with explicit language-policy scope and unchanged third-party inputs.
- English Git content appears before a compatible registry package -> document CLI-first adoption and use explicit pinned content updates; do not auto-advance consumers.
- A successful publish is followed by a failed remote test -> retain exact release identities and pending task state for resume or a corrective release.

## Migration Plan

1. Verify predecessor archives and the first actual public launch; record the package, Git source, and pending-plan location in the approved public checkout.
2. Freeze first-release compatibility fixtures, inventory maintained text/exceptions, translate authored policy and product surfaces, and extend discovery recognition while preserving public technical identifiers.
3. Rebuild the README and linked guides, then execute their examples against the packed package and repeat generation/ownership/UTF-8 tests on the existing supported platform matrix.
4. Present English-source/generated candidate evidence and the exact ordinary-release plan. Keep live publication pending until its concrete commit, artifact, versions, and streams are authorized.
5. Execute/resume through the existing release workflow, preserve the base's owned instructions, install the exact new npm version, and verify remote synchronization and first-release compatibility in separate disposable consumers.
6. Before public effects, discard only unaccepted candidate work through the normal reviewed Git workflow. After publication, preserve immutable identities and use resume or a new corrective release. Present final evidence before OpenSpec synchronization/archive.
