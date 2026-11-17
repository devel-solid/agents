# Tasks

## 1. Package and candidate behavior baseline

- [x] 1.1 Verify accepted/archived `simplify-shared-conventions`; capture accepted neutral/local candidate fixtures and map meaningful Python scenarios to Node tests, verifying provenance and corrected parser/path/deletion cases without a private-version compatibility matrix, real consumer, or content publication.
- [x] 1.2 Convert the root tooling into the proposed `@devel-solid/agents` package with compiled ESM, executable `agents`, explicit asset allowlist and supported Node LTS metadata; verify the intended executable is exposed and development/cache content and repository-local policy sources are excluded from shipped consumer-default assets.
- [x] 1.3 Configure strict TypeScript, Node-based tests, formatting and shared cross-platform setup/test scripts; verify a clean install builds and type-checks without Make and document the stage's Node/Git prerequisites.

## 2. Manifest and source contracts

- [x] 2.1 Implement the shared YAML document loader and packaged version-1 JSON Schema with omitted-version v1 compatibility and explicit version 2; verify inline comments, quoting, duplicate keys, unknown fields and unsupported-version scenarios across all command consumers.
- [x] 2.2 Keep consumer pins as explicit manifest edits, preserve authored YAML during validation/generation, and ensure release never changes the pin; verify comments/quotes, schema/editor examples, and unchanged pin bytes, leaving English translation to the post-launch fifth change.
- [x] 2.3 Implement Markdown-aware H1/card identification with positional source extraction; verify fenced and indented examples, real duplicate headings/cards and published-byte parity.
- [x] 2.4 Implement complete destination validation including root `AGENTS.md`, portable case equivalence, resolved aliases, root containment and reserved paths; verify regressions on Windows and the portable rejection contract on Linux.
- [x] 2.5 Document the supported manifest/source contract and validation fixes through the retained shared composition source and `docs/guides/contratos-de-composicao.md`; verify valid version-1 manifests and pre-existing files remain preserved, retired shared contract files are not restored, and generated documents are never edited by hand.

## 3. Engine and command behavior

- [x] 3.1 Port source resolution, family discovery and rendering into explicit resolve/validate/render/plan/apply modules; verify fixture parity, preserved local context, notices, ordering and nested output paths.
- [x] 3.2 Implement `sync`, `--dry-run` and `--check` from one in-memory plan; verify preview/check preserve project files, drift returns 1, normal no-op runs preserve output timestamps, and invalid inputs produce no partial validation writes.
- [x] 3.3 Omit filename-inferred deletion and preserve unselected/unowned files; verify focused regressions protect unrelated files and document that ownership-based stale removal arrives in stage 2.
- [x] 3.4 Implement help, version, `--repo-root`, JSON envelope and error codes 0/1/2/3; verify installed-command output, missing Git, invalid manifest and operational-failure diagnostics without raw subprocess stdout or leaked URL credentials.
- [x] 3.5 Integrate runtime, applicable Git, root, manifest, source, and integration diagnostics into validate; verify read-only findings, direct CLI use, and local-only operation without Git.

## 4. Integration and internal maintainer port

- [x] 4.1 Implement parameter-free consumer init with local v2 manifest, main/context sources, and packaged agents-update-docs; verify zero-write preview, preservation of valid v1/v2 projects, conflicts before writes, optional Git configuration through the manifest, and repeat no-ops.
- [x] 4.2 Bundle the three authored agents-write-conventions, agents-update-docs and agents-update-version integrations for their respective roles in the installed engine; verify fresh installation, repeated no-op initialization, preservation/conflict for unknown or customized integrations, and no content-pin code copying/execution without implementing legacy Python package recognition.
- [x] 4.3 Implement the single release --bump operation and zero-write preview, selecting reachable stable tags numerically and creating only a local tag; verify first/subsequent versions, clean state, tracked sources, invalid content, collisions, and unchanged consumer pins without real publication.
- [x] 4.4 Adapt authored skills, owned root AGENTS.md, the retained public composition source/reference guide, README and integration/maintenance guides to the CLI while retaining local scope rules and release confirmations; verify local-tarball commands, no retired local policy tree resurrection, and unchanged generated OpenSpec skills.
- [x] 4.5 Retire the Python entry points and normal Python test/setup requirements only after their Node scenario counterparts pass; verify consumer, local-release and pre-push flows work with Python absent from PATH.
- [x] 4.6 Implement `agents init --base` with owned AGENTS.md, internal role identity, empty catalog, consumer template, authoring README files and two skills, totaling seven files; verify Node-only/no-network scaffolding, dry-run/JSON, conflict-before-write behavior, custom instructions preservation and rejection of consumer setup. Optional starter adds only the two neutral sources.
- [x] 4.7 Implement `agents validate --base` with initialized identity, owned instructions, shared structural/path validators and packaged version-matched reference docs; verify empty/arbitrary catalogs, invalid/orphan sources, portable collisions, precise diagnostics, missing identity and consumer manifests are rejected without writes, Git or network.

## 5. Installed artifact and stage acceptance

- [x] 5.1 Add baseline CI for Windows/Linux and supported Node LTS lines, keep local Lefthook as the general pre-push gate, and verify it invokes the same behavioral suite through the cross-platform npm scripts.
- [x] 5.2 Build and pack once, install that tarball in fresh consumers outside the source checkout, and verify init/validate/sync/preview/check/JSON and calculated local releases with no Python, Make or compiler available.
- [x] 5.3 Validate accepted neutral/local candidate profiles and configured disposable version-1 projects with Git-backed fixtures, review intended outputs, repeat sync unchanged, and present behavioral/platform evidence plus internal rollback; verify local policies do not leak to neutral consumers and no real repository creation/migration or legacy-consumer rollout occurred.
- [x] 5.4 Use the installed tarball to create a separate company base, author more than two custom families, validate and publish it only to a disposable Git remote/tag, and initialize two consumers with distinct selections/local context; verify no engine scripts, npm metadata, mandatory starter filenames, or requests to our content repository, then document the complete author-to-consumer flow and private Git access diagnostics in pt-BR.

## Workflow follow-up

- `publish-english-product-experience` owns the later translation of CLI/scaffold/reference/integration text and README overhaul after the actual first public launch. Preserve the first release's stable paths, markers, fields and fixture evidence for that transition; do not expand this port into translation or selectable locales.

- Stop after presenting stage 1 results. User acceptance is required before advancing to `harden-instruction-sync`; proposal completion or implementation alone does not start the next stage.
- After acceptance, use the public OpenSpec synchronization/archive workflow so later proposals build on the resulting permanent specs. Do not mark archive-dependent work as an implementation checkbox.
- Public npm/Git release execution is deferred to `modernize-release-workflow` and a separately authorized publication plan. Develop in the current repository; only after all four readiness gates and separate authorization, export approved final files into a new real repository without old Git history or tags.
