# Proposal

## Why

The CLI exposes setup, diagnostics, and release helpers as separate decisions that users must coordinate. Developers need four clear operations with visible effects: prepare a project, validate its inputs, generate documents, and version a shared base. The manifest already defines the directories; ordinary filesystem operations are sufficient for authoring templates.

## What Changes

- Limit the public command roots to `init`, `validate`, `sync`, and `release`. Keep help/version and common output flags; do not introduce authoring or configuration command groups.
- Make ordinary `agents init` parameter-free. It creates a version-2 manifest, local main/context templates, and the packaged integration. It does not generate final documents. Preserve `init --base`, the optional starter, and zero-write setup preview.
- Add the separate `agents-write-conventions` skill for convention/subconvention authorship and semantic curation in both bases and consumers. Restrict `agents-update-docs` to validation, preview, generation, and freshness checks from the existing manifest and sources; it does not author sources, edit configuration, or version a base. Confirm installed capabilities when support is unknown.
- Retain the repository-maintainer `agents-update-version` skill and update it to release preview/application. Preserve its review and confirmation checkpoints. The CLI package supplies all three skills: init --base installs agents-write-conventions plus agents-update-version in the base, while ordinary init installs agents-write-conventions plus agents-update-docs in consumers. No manual skill copying is required.
- Create or copy templates directly into the directory declared by `local.tpl_dir`. Discover valid local families automatically; discard the previously proposed `new` command and its directory override.
- **BREAKING:** retire `doctor` as a public command and incorporate applicable environment/configuration diagnostics into `validate`. Detailed diagnostics use `validate --debug`; `validate --base` checks an independently owned shared base.
- Keep `sync`, `sync --dry-run`, and `sync --check` as generation, preview, and freshness checks. Plans identify concrete created/updated documents before writing.
- **BREAKING:** replace the four public release helper subcommands with `agents release --bump patch|minor|major [--dry-run]`. Discover the current version from reachable stable Git tags; a missing baseline means numerical `v0.0.0`. Preview reports the next version without writes; application validates and creates only its local tag at HEAD.
- Keep safety checks inside release. Eliminate manually supplied current/next versions and SHAs from the public contract. Changing a consumer's pinned base remains an explicit manifest edit followed by synchronization.
- **BREAKING:** remove ordinary init's remote-selection flags. New projects use schema version 2 with an optional pinned base, discovered locals, and remote-only `entries`. Preserve version-1 parsing and explicit selection; never reinterpret or migrate it silently.
- Make base and consumer roles exclusive. Base init creates seven files, including internal identity and a simple owned AGENTS.md; consumer operations reject base roots before writes. Remove this repository's live self-composition and local-only policy trees while preserving shared sources and historical fixtures.
- Keep Node.js installed in the environment, npm distribution, Bash examples, stable JSON/exit meanings, and existing path protections. Git is required only for Git-backed composition and release.
- Maintain the product presentation as version-controlled documentation at `docs/presentations/agents-cli-apresentacao.html`. Deliver one self-contained HTML file with inline styles, scripts and diagrams, usable offline without build tools, sibling assets or temporary authoring files.

## Capabilities

### New Capabilities

- `project-instruction-workflows`: Four-command public interface, minimal setup, merged validation/diagnostics, and explicit effect/preview contracts.
- `convention-authoring`: Filesystem-based source authoring and automatically calculated local Git versions for a shared base.

### Modified Capabilities

- `consumer-artifact-contracts`: Version-2 local discovery, optional pinned base, version-1 compatibility, and CLI-packaged integration.
- `shared-instruction-catalog`: Owned live base instructions instead of local self-composition; historical fixtures retained.
- `consumer-instruction-composition`: One engine for discovered locals and selected remotes, with concrete preview/apply/check effects.

## Impact

- Implementation covers command dispatch/help, init assets, validation/diagnostics, release orchestration, schemas, discovery, packaged integration, and installed-package tests. Retain useful helper functions internally while removing their public command surfaces.
- The version-controlled presentation at `docs/presentations/agents-cli-apresentacao.html` covers all three project-owned skills, all four commands and every supported option. Keep it aligned with the CLI and these contracts, with the base/consumer cycle, installation paths, examples, concrete effects and dry-run boundaries. Repository-development tooling is outside that product guide. All three skills use the implemented interface; retired operations are neither examples nor compatibility aliases.
- Reconcile this contract with the pending Node, reliability, and release-publication plans before implementing those stages. The separate publication plan must not reintroduce public prepare/execute/resume commands without a separately approved interface decision. Its remote publication, recovery, fresh-repository handoff, and independent CLI/content streams are not delivered here.
- The authorized implementation updates code, schemas, all three authored skills, packaged consumer guidance, guides, the standalone HTML presentation under docs, and related planning contracts. The presentation is a maintained deliverable, not a generated dependency on temporary build files. This repository uses the owned base AGENTS.md model and no consumer composition. Tests create tags only in disposable repositories. No real release, commit, push, npm publication, or archival is performed. Platform acceptance is recorded separately from implementation progress.
