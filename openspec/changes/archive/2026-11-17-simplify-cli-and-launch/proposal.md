# Proposal

## Why

The project has become a distribution and recovery system for shared instructions instead of a small tool for maintaining one project's instructions. Replace that architecture with project-owned templates, independent conventions, a small CLI, and supporting skills, then deliver the complete experimental product in one first public release.

## What Changes

- **BREAKING:** Remove bases, shared/global conventions, subconventions, families, remote composition, content locks, remote caches, ownership databases, and recovery journals. Do not retain private pre-release formats or deleted changes as compatibility requirements.
- Use agentscli for the repository and executable, and @devel-solid/agentscli for the npm package. Release experimental 0.1.0 under MIT with tag agentscli-v0.1.0, preserving the existing v0.1.0 candidate tag. Rename the existing repository to devel-solid/agentscli while preserving its Git history; remove the independent-history export/handoff procedure.
- Keep the client manifest agentscli-compose.yml with exactly language, templates_dir, and conventions_dir. Every successful init overwrites it with the requested language (default en) and default roots. All valid convention templates participate automatically, without per-convention selections.
- Add the internal agentscli.yml with only a skills directory list. It selects package resources and identifies this source repository; it is not a client manifest and does not make this repository consume itself.
- Keep the main AGENTS.tpl.md and convention templates editable in the client. Sync recreates the entire AGENTS.md and all convention documents. Preserve custom main-template headings and sections around one agentscli:conventions insertion marker.
- Expose only init, validate, and sync, with existing useful previews, drift checks, JSON results, and help/version flags. Sync also restores the complete three distributed skill directories from the installed package; previews/checks include their effects.
- Maintain exactly four product skills: shared agentscli-write-conventions and agentscli-update-agents; client-only agentscli-build-agents; repository-only agentscli-release. Use one source per skill and standard English SKILL.md entrypoints, with supporting resources only when useful.
- Shared authoring skills use agentscli.yml for direct repository edits and agentscli-compose.yml for client-template edits. If both or neither exist, report the invalid context before writing. AGENTS authorship distinguishes concise project instructions from material that belongs in conventions.
- Ship en and pt-br templates and generated notices together from the first release. Use lowercase --lang pt-br and default en. Skills stay English while guiding client authorship using its manifest language. Maintained project text is English; no instruction fixes the agent's chat language.
- This source repository keeps handwritten English AGENTS.md and final conventions, with no client manifest or active client template tree. During implementation, review the five restored guides, convert only useful current rules into conventions, then delete the guides and presentation.
- Recognize generated documents through agentscli:generated on the first line, preserve manual documents, reject destination conflicts before writing, and clean only stale marked documents under the current output root. Use preflight and safe individual-file replacement; retry sync after partial failure without transaction/recovery machinery.
- **BREAKING:** Version and execute only lightweight unit tests. Remove integration/process/end-to-end suites, historical fixtures, and the Python oracle. Keep npm test, npm run check, pre-push, and CI unit-only alongside normal type/format checks.
- Package only compiled runtime code, client templates/skills, README, license, and package metadata. Build copies whole listed skill directories. Install/execution requires no compilation or additional resource download. Keep native Node argument parsing, YAML, and Markdown; remove Ajv without adding a CLI framework.
- Keep implementation, readiness, repository rename, and actual first publication in this single change. Real remote rename, commit, tag, push, and npm publication wait for corresponding execution authorization; this proposal does not perform them.

## Capabilities

### New Capabilities

- release-publication: MIT-licensed @devel-solid/agentscli@0.1.0 identity, history-preserving repository rename, internal native release skill, lean package readiness, and verified Git/npm delivery.

### Modified Capabilities

- agents-cli: Installed Node-only command interface, three operations, stable results, English product text, and unit-only test policy. Retain this existing capability path as a specification identifier.
- project-instruction-workflows: Both manifests, automatic template inclusion, full regeneration, manifest-overwriting initialization, three client skills, skill synchronization, language selection, and stateless file effects.
- convention-authoring: One shared convention-authoring skill and one shared AGENTS-authoring skill, selecting direct files or templates by manifest context.
- consumer-artifact-contracts: Retire the capability; retain relevant file/path and direct-CLI guarantees in the project workflow.
- consumer-instruction-composition: Retire composition in favor of project template rendering.
- managed-document-updates: Retire durable ownership and transactional recovery; keep preservation, preview, and safe writes in the project workflow.
- reproducible-synchronization: Retire remote locks, caches, and pins.
- shared-instruction-catalog: Retire the shared catalog and historical stage prerequisites.

## Impact

- Simplify CLI dispatch, manifest parsing, initialization, Markdown validation, discovery/rendering, planning, and diagnostics. Remove role, remote Git, lock/state, base release, transaction, and obsolete schema machinery. Use Node's native argument parser, retain YAML/Markdown parsing, and remove Ajv without unrelated dependency upgrades.
- Rework skill sources, package assets, build resource mapping, metadata, root instructions, and OpenSpec context during implementation. Keep shared skills under the repository's skill directory and client-only skill sources under package-template assets.
- Keep the README concise and the final docs tree limited to necessary conventions. Review/convert useful guide rules before deleting guides and presentation during implementation; preserve all of those files during proposal revision.
- Reconcile all nine delta specs, including retired-capability migration text. Keep permanent specs unchanged until their authorized synchronization and keep the six previously deleted changes deleted.
- This update edits only this change's proposal, design, tasks, and existing delta specs, in English. No runtime, documentation, skills, manifests, permanent specs, repository identity, or publication state is changed. All implementation tasks stay unchecked.
