# Proposal

## Why

The repository already solves instruction sharing in real projects, but installation and operation expose Python script paths and depend on inconsistent parsers. A packaged Node.js/TypeScript CLI will preserve the useful composition model and provide a supported entry point for fresh consumers. There are no current external consumers; implementation remains here, and only the completed first public version is later exported to a new repository without old Git history.

## What Changes

- Deliver runtime stage 1 with four public command roots: init, validate, sync, and release. Include setup/generation/release preview, freshness checks, merged environment diagnostics, help/version, and JSON output.
- Port bootstrap, generation, and existing release helper behavior to TypeScript; operations require the supported Node.js environment, with Git only for Git-backed composition and release; Python and Make are not required.
- Prepare a public npm package, proposed as `@devel-solid/agents`, with executable `agents`. Validate its packed tarball locally; actual registry publication belongs to the third change.
- Publish the CLI and required schema/integration/scaffolding assets on npm. Company-owned instruction bases remain independently versioned public or private Git repositories; using the tool does not require our catalog, a tool fork, write access to our repository, or a company npm package.
- Add `agents init --base` to scaffold an independently owned base with its packaged agents-write-conventions and agents-update-version skills and `agents validate --base` to validate its template and all convention families without a consumer manifest. The default base has no convention policy; `--starter minimal` explicitly copies our neutral template and two starter conventions as editable company-owned content.
- Use parameter-free consumer init and a complete local-only manifest v2. Authors create/copy local templates; repository/ref and remote parent selections belong in the manifest. Preserve explicit v1 selection semantics.
- Replace script-path invocation and remote Python skill self-replacement with the installed CLI and bundled integrations: agents-write-conventions in both roles, agents-update-docs for manifest-driven consumer generation, and agents-update-version for base releases. Define the initial public manifest/source contract from the useful existing composition model; do not add private-v3/v4 compatibility, old integration recognition, or consumer rollout requirements.
- Centralize YAML parsing and validation, ship a versioned JSON Schema, ship schemas 1 and 2, interpret an omitted schemaVersion as version 1, and provide actionable errors for unsupported legacy fields.
- Correct case-equivalent/resolved output collisions, reserved `AGENTS.md` destinations, and Markdown headings inside code examples.
- Preserve unrelated and unowned files rather than deleting names inferred from an earlier implementation; stage 2 adds ownership-based cleanup for future updates.
- Establish a reusable resolve/validate/render/plan/apply boundary for preview and check. Do not introduce lockfiles, general output ownership, or transaction recovery in this stage.
- Port the existing meaningful test scenarios and add installed-package integration tests, baseline CI on Windows/Linux, and setup and maintainer-port documentation for this stage.
- Preserve the accepted two-source catalog as optional starter content and the minimal template. Consumer initialization selects the user's chosen families without assuming our filenames or importing the agents repository's local policies; valid version-1 selections and pre-existing user files remain preserved. Private tags are internal development history, not a public compatibility matrix.

## Capabilities

### New Capabilities

- `agents-cli`: installation, independent company-base scaffolding/validation, consumer initialization, public command behavior, runtime requirements, machine-readable diagnostics, and installed-package verification.

### Modified Capabilities

- `consumer-artifact-contracts`: shared manifest validation and schema versioning, Markdown-aware source structure, complete destination validation, and CLI-bundled bootstrap integration.
- `consumer-instruction-composition`: pinned remote content is consumed as data by the installed engine instead of replacing and executing remote tool code.

## Impact

- Implementation areas: `src/` and `scripts/`, replacement of the retired Python entry points, the three authored skills, `package.json`, package lock, build/test configuration, the accepted composition reference guide, owned base instructions, and maintenance/integration guides. Generated OpenSpec skills remain tool-owned; the live root uses simple owned base instructions and historical local profiles remain only in fixtures; retired shared policy files are not recreated.
- Proposed structure: one npm package in this repository, compiled JavaScript under `dist/`, TypeScript modules under `src/`, a packaged manifest schema, and bundled integration assets. Exact dependency versions are selected and recorded during implementation under the repository's dependency policy.
- Add packaged base scaffolds and explicit optional starter assets; include end-to-end fixtures that create a separate content-only Git base and consume its custom families from two projects. Base initialization installs packaged authorship and versioning skills; direct CLI use still needs no package.json, consumer manifest, engine scripts, or loaded skill. No real company repository is created during implementation.
- No external consumers exist. Use disposable fresh/configured projects for validation; prior Python behavior is only an internal regression oracle. Do not create a real new repository, change remotes, rewrite history, or migrate any project in this stage.
- Public npm visibility is decided. Scope ownership, final package-name availability, and publishing credentials are verified before publication in stage 3, not requested during planning.

### Sequence and Validation Boundaries

```text
simplify-shared-conventions
  -> candidate-content/local-policy validation + user acceptance + archive
introduce-node-cli
  -> installed-package parity + user review
  -> harden-instruction-sync
       -> recovery/integrity + disposable-consumer validation + user review
       -> modernize-release-workflow
            -> release rehearsal + first-public-version readiness
            -> later authorized file export + independent Git root + publication smoke
```

| Diagnostic area | First validated delivery | Subsequent extension |
| --- | --- | --- |
| Minimal shared catalog and preserved local policy profile | Content stage 0 | Accepted-candidate fixtures and historical local-profile fixture checks in later stages |
| Installable CLI and engine/content separation | Stage 1 | Public registry publication in stage 3 |
| YAML/schema, Markdown, destination safety | Stage 1 | Durable state safety in stage 2 |
| Preview/check, JSON, baseline validation diagnostics | Stage 1 | Provenance/explain and operational diagnostics in stage 2 |
| Exact revisions and integrity | Stage 2 | Release evidence in stage 3 |
| Ownership, safe cleanup, interruption/concurrency | Stage 2 | Release resumption in stage 3 |
| Verified cache, offline, timeout | Stage 2 | Published-artifact smoke in stage 3 |
| Test parity, cross-platform setup/CI | Stage 1 | Failure injection in stage 2; publishing CI in stage 3 |
| Release baseline, preflight, resumption | Stage 3 | No additional proposal required |
| Support, setup, release documentation | Minimum documentation in each stage | Consolidated policy/changelog in stage 3 |

Start only after `simplify-shared-conventions` is implemented, validated, user-accepted, synchronized into permanent specifications, and archived. Its candidate-content gate is sufficient; do not require a new published content tag or the later release implementation. Cross-change order is an explicit workflow prerequisite.

Stage 1 is complete only after installing the tarball in fresh consumers without Python/Make, verifying the accepted stage-0 neutral/local candidate and meaningful internal regression scenarios, passing the new regression scenarios on supported platforms, repeating synchronization without changes, and presenting the evidence for user review. No existing-consumer migration or private-version support gate is required. Any comparison with the Python implementation is internal evidence of the selected behavior. The next change starts only after this result is accepted and these deltas are synchronized and archived through the OpenSpec workflow. Planning all four changes does not authorize their implementation or publication.

Generic skill sharing, `outputs.skills`, new provider formats, and changes to unrelated conventions are excluded. The new real repository is created only after all four stages are ready for first publication and a concrete handoff is authorized.

### Post-launch English delivery

The four stages prepare the first public version, whose product prose remains Portuguese. After actual Git/npm publication and remote verification, the separate fifth `publish-english-product-experience` change translates maintained text/assets, adds English discovery while preserving the first release's source compatibility, rebuilds the README, and exercises an ordinary subsequent package release. Do not pull that translation or a multilingual UI framework into this runtime port. Keep stable codes/fields separate from message prose and package reference/scaffold assets explicitly so the later change can translate them without changing their ownership or public paths.


