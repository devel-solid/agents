# Proposal

## Why

The initial public CLI will establish working installation, company-owned bases, and verified publication, but its Portuguese product text and brief README limit accessibility for new users. Deliver English content and a practical introduction as a fifth, separately validated change after that first publication, using a subsequent real npm release to exercise the ordinary update workflow.

## What Changes

- Add `publish-english-product-experience` after the four accepted predecessor changes and the actual first public Git/npm launch. The user explicitly chose a Portuguese initial release followed by an English version; this change does not delay that initial launch or authorize publishing now.
- Translate all maintained first-party natural-language content to en-US: CLI help, diagnostics and progress, generated notices/discovery text, bundled integrations, base/context/starter scaffolds, README and guides, package/schema descriptions, owned base AGENTS.md, comments, docstrings, and explanatory test/fixture text. Regenerate published documents from translated sources through the existing workflow.
- Update the repository's authored language policy to en-US for maintained artifacts while retaining pt-BR chat preferences and the meaning of unrelated local rules. Keep consumer-owned instructions in their authors' chosen language.
- Preserve commands, flags, manifest/JSON keys, stable diagnostic codes, technical markers, public filenames/paths, and published Git/npm identities. Inventory deliberate non-English compatibility/Unicode samples and third-party/legal text; do not rewrite historical releases or archives.
- Support English discovery headings and generated prose without losing the first public version's Portuguese source compatibility. Preserve pinned content, ownership protection, UTF-8 support, and explicit updates; do not install a translation service or silently translate company content.
- Rebuild the root README as the npm/GitHub introduction: problem and purpose, a small architecture diagram, company-base versus project responsibilities, prerequisites, executable quick starts, a complete manifest/source example, before/after generated output, version/update behavior, limitations, and links to deeper guidance.
- Reuse the approved agents-update-version publication workflow for a subsequent CLI version, with separate content-stream versioning only when the optional Git starter/base changes. Validate the exact registry artifact and remote company-base synchronization after authorized publication; rehearsal alone does not complete this gate.

## Capabilities

### New Capabilities

- `english-product-experience`: English first-party product surfaces, practical and executable onboarding documentation, compatibility-preserving language transition, and verification of the subsequent published English artifact.

### Modified Capabilities

None. This adds language and onboarding guarantees to the accepted CLI, catalog, synchronization, and release contracts; it preserves their field names, ownership model, publication authorization, and independent streams. Predecessor planning artifacts are reconciled to identify their initial Portuguese scope and the later English stage.

## Impact

- Affects the Node CLI's maintained text and renderer labels, packaged schema/reference/integration/scaffold assets, root README, guides, first-party instruction assets and owned AGENTS.md, tests and fixture descriptions, and package/release metadata descriptions. Historical Python fixtures are provenance evidence; the implemented Node runtime supplies the current commands before this change starts.
- Current discovery headings and generated notices are Portuguese literals, so translation requires parser/rendering regression tests, not only Markdown edits. Preserve technical source paths rather than bundling a public path migration into translation.
- Four initial stages remain developed here. After the separately authorized clean-history handoff and first real publication, implement this change in the new public repository, preserving its new history. Carry forward the approved pending plan without importing private development history.
- No generic skill distribution, multi-remote composition, automatic company-content translation, multilingual UI framework, new repository migration, package rename, or release-engine redesign is included.
- Planning creates no product translation, commit, tag, push, repository migration, or npm publication. A later apply request starts implementation; concrete commit and publication plans remain reviewable under the accepted workflow.

## Sequence and acceptance

```text
simplify-shared-conventions
  -> introduce-node-cli
  -> harden-instruction-sync
  -> modernize-release-workflow
  -> accepted readiness + separately authorized clean-history handoff
  -> actual first public Git/npm release + remote verification
  -> publish-english-product-experience
       -> English surfaces + README + compatibility/installed-example checks
       -> approved ordinary-release plan + next public npm version
       -> exact registry install + remote sync + unchanged repeat run
```

The first four readiness gates and first launch are prerequisites, not tasks reimplemented here. Acceptance distinguishes local implementation readiness from completed live publication. Stop before external effects until the concrete later commit/artifact/version plan is authorized; leave publication and remote-verification tasks pending until they actually pass.

