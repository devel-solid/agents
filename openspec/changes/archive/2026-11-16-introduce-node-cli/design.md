# Design

## Context

See `proposal.md` for motivation, the content-stage prerequisite, three modernization stages, and the scope map. The initial implementation used separate Python synchronization, bootstrap, and release scripts. The current worktree replaces them with an installed Node CLI and a shared parser/engine; npm scripts and Lefthook run the Node tests. The four-command interface and version-2 local workflow are reconciled with simplify-cli-workflows. The synchronized permanent contracts resolve engines and skills from the CLI package and treat pinned base content as data.

Existing tests cover 55 named methods, including parameterized contract scenarios. Reuse meaningful scenarios as internal port evidence, not a support promise for pre-launch versions. There are no external consumers, so legacy package adoption, a v3/v4 migration guide, and real-consumer rollout are unnecessary.

The accepted `simplify-shared-conventions` stage adds a separate candidate-content baseline: two shared conventions, a minimal base, and explicit repository-local policies. Read its permanent spec and candidate/export-boundary evidence before implementation. That source snapshot can be tested without claiming a new tag was published; the live root uses owned base instructions and no consumer composition. Work here until the first public version is complete; creation/export of the new real repository belongs to the later authorized launch handoff.

## Goals / Non-Goals

**Goals:** deliver a runnable installed engine, preserve supported composition results, isolate rendering from writes, and establish tests at the package boundary before adding synchronization-state guarantees.

**Non-Goals:** public npm publication, real repository creation/migration, legacy-consumer compatibility, automatic consumer updates, source lockfiles, general output ownership/pruning, crash recovery, generic skill distribution, rewriting generated OpenSpec skills, or changing unrelated convention policies. These boundaries prevent stage 1 from becoming the original monolithic change.

## Decisions

### 1. One TypeScript package, one executable

Use the existing repository as one package, proposed as `@devel-solid/agents`, with `bin.agents` targeting compiled ESM JavaScript. Keep source modules in `src/`, publish compiled code, schemas and required integration/scaffolding assets through an explicit package allowlist, and keep TypeScript/testing tools in development dependencies. No install-time script downloads an interpreter or changes a consumer project.

Exclude this repository's local policy source tree from shipped consumer-default assets. Ship the consumer context/integration, base scaffolding, and explicitly selected neutral starter assets. The live root retains concise development guidance in its owned AGENTS.md, not a local convention-discovery tree. The npm package distributes the engine and required assets; companies publish their own instruction content in Git, with no npm package or copied engine. Our two-source catalog is an optional starter, not a required upstream policy service.

Support the currently supported Node.js LTS majors 22, 24, and 26 initially, with explicit engines metadata, runtime validation, and CI. Use a current supported patch for each line during implementation; recheck official support before selecting versions. Git remains the content transport. Python is allowed only as a temporary development oracle while capturing baseline fixtures, and is removed from normal test/setup/runtime workflows after the port is proven.

Alternatives considered: an npm wrapper around Python would preserve both runtime requirements; a workspace or a separate engine repository adds packaging coordination without a second independently useful product at this stage. The selected single-package structure can be split later if a real need appears.

### 2. Keep deterministic mechanics in modules and semantic decisions in skills

```text
CLI arguments / authorized skill
  -> shared manifest loader and schema
  -> source resolver (Git + local roots)
  -> Markdown-aware family validator
  -> renderer -> in-memory change plan
                   |-> preview / check / JSON
                   +-> apply document writes

release helper commands -> shared manifest + Git adapters
```

The source resolver, validator and renderer return data; they do not update integrations or invoke external code from the content checkout. `SyncPlan` contains source identity, intended targets, bytes, action and reason. Stage 2 extends this boundary with ownership, hashes and journaled application rather than replacing the CLI.

Expose only init, validate, sync, and release. The release operation calculates the baseline from reachable stable tags and creates one local tag with --bump; --dry-run validates and reports without writes. The authored agents-update-version skill owns impact classification, plan confirmation, and any separately approved publication. No manual version/SHA parameters or release helper subcommands are public.

### 3. One parser and a shipped schema

Use the maintained `yaml` package for one YAML 1.2 document, rejecting duplicate mapping keys, custom executable tags and excessive aliases; use its document API for field edits so comments and unrelated formatting survive. Validate with a bundled JSON Schema and Ajv, without fetching a schema to execute normal commands. The schema has a versioned identifier and can be referenced by a YAML editor comment; callers are not required to add that comment.

Support both manifest contracts. An omitted schemaVersion means version 1 with a required pinned base and explicit local/remote entries. New init writes explicit version 2 with optional base, discovered local families, and remote-only entries. Ship both schemas, reject unknown fields with locations, and never reinterpret existing v1 projects. Release derives its own version from Git tags and never edits the consumed base pin.

Library choices are implementation recommendations. Pin supported stable releases during implementation and record release age, compatibility, advisories and rollback under this repository's local dependency-update policy; this proposal does not install them or assume `latest` is acceptable. That policy is not a mandatory consumer default.

### 4. Parse structure without reformatting authored Markdown

Use a CommonMark-aware parser such as `remark-parse` to identify actual headings, code blocks and standalone HTML card markers. Use node positions to remove the operative card and assemble discovery sections while preserving the remaining source slices. Do not round-trip entire documents through a Markdown serializer: that would create unrelated changes in whitespace, lists and code examples.

Preserve existing publication transformations, notices, card text, source order and child sorting. Handle both fenced and indented code as examples rather than structure. Reject ambiguous real headings or card blocks with source locations.

### 5. Validate the complete destination set

Resolve configured roots and source paths, check containment after link resolution, and compute every document destination before writing. Include root `AGENTS.md` in collision detection. Use a documented portable comparison key to reject case-equivalent names across platforms, as well as duplicate resolved destinations. Reject traversal, absolute/drive/UNC paths, Windows-reserved names and writes into Git metadata or tool-owned integration/cache paths.

Subdirectories and distinct same-basename files remain supported. The validation fix deliberately rejects configurations that previously depended on aliasing; it does not change valid published relative paths.

### 6. Make commands usable before advanced state exists

| Command | Stage 1 behavior |
| --- | --- |
| `init` | Explicitly create missing setup or adopt an existing manifest; install bundled integration without generating documents |
| `init --base` | Create an editable base and install agents-write-conventions and agents-update-version; optional `--starter minimal` copies the two neutral starter conventions |
| `validate --base` | Validate the base template and every discovered family without requiring a consumer manifest or remote lookup |
| `validate` | Validate the complete selected composition; report all useful diagnostics before publication |
| `sync` | Resolve the configured ref, build a validated plan and apply its document changes |
| `sync --dry-run` | Show intended document changes without editing sources, manifest, documents or integration |
| `sync --check` | Compare expected outputs, make no project changes, return 1 for drift |
| `release --bump minor [--dry-run]` | Discover the version, validate the base, and preview or create one local tag |

All project commands accept --repo-root as an optional override. Parameter-free init prepares a local v2 manifest, main/context templates, and agents-write-conventions plus agents-update-docs without Git access or final generation. Developers create/copy sources in the configured local folder; shared repository/ref and remote selections are explicit manifest edits after setup. Existing valid v1/v2 manifests and authored files remain preserved. Local-only work needs Node without Git or network. There is one optional remote base and no multiple-remote inheritance or mandatory local policy injection.

### 6a. Create and validate a company-owned base

```text
agents init --base [--starter minimal]
  -> company edits template and convention sources
  -> agents validate --base
  -> company commits/publishes a Git repository and content tag
  -> projects select repository + ref + their chosen parent sources
  -> agents init -> agents sync
```

`init --base` uses `--repo-root` as its destination and creates a minimal `templates/AGENTS.tpl.md`, `templates/docs/conventions/README.md` authoring guidance, a root `README.md`, an owned AGENTS.md, the internal .agents/base.json role identity, and the packaged .agents/skills/agents-write-conventions/SKILL.md plus .agents/skills/agents-update-version/SKILL.md with validation, Git publication, pinning, and consumer examples. The default convention catalog is empty; authors add valid `.tpl.md` families. The minimal template preserves the supported discovery markers. Optional `--starter minimal` adds editable copies of the accepted two neutral conventions and explains that they are examples the company owns and may change or remove. No later npm upgrade or sync overwrites those authored files.

This operation needs only the installed CLI and Node.js: no Git repository or network is required to scaffold or validate local base sources. It does not initialize Git, create a hosted repository, set a remote, commit, tag, publish, install agents-update-docs, create `agents-compose.yml`, generate consumer documents, or create lock/ownership state. Standard Git operations publish the content; stage 3 adds optional base-only release assistance. A separate project may subsequently consume this base without the base consuming itself.

Build and validate the whole scaffold plan before writing. Preserve unrelated files; repeated identical initialization is a no-op, and any conflicting scaffold target blocks writes with a precise diagnostic. A partially edited base is never reset by reinitialization. `--starter` requires `--base`; repository/ref/selection are configured only in the manifest, not through init flags. Base initialization supports `--dry-run`, `--json`, and the common exit codes. Multi-file initialization has stage-1 validation/precondition guarantees; stage-2 document recovery is not claimed for scaffold creation.

`validate --base` reads the fixed scaffold template and default convention root, discovers all `.tpl.md` parent/child families, and reuses the structural, containment, portable-name and collision validators. An initialized base marker, owned AGENTS.md and minimal consumer template are required; an empty catalog is valid. Validate the full catalog, including unselected families and orphan children, without fetching, generating documents, or creating setup. Diagnostics identify the authored source and location. This command and consumer `validate` have distinct explicit inputs; a content-only base is not mistaken for a missing consumer manifest. Existing consumers may still configure another `remote.tpl_dir` through their manifest; the work-root role marker is not a consumer manifest mode and is not required in remote input checkouts.

Keep engine-format/schema reference material owned by the CLI documentation, with a version-matched packaged reference for offline use and links to the public tool documentation. A company base may add its own guide but need not copy `docs/guides/contratos-de-composicao.md` or the engine's maintenance documents. Adjust starter reference text to avoid assuming those files exist in an arbitrary company base or consumer.

The JSON envelope is `{schemaVersion: 1, command, ok, changes, diagnostics}`. Changes include action, path and reason; diagnostics include stable code, severity, message and optional field/location/remediation. Human-facing help and diagnostics use pt-BR for this initial stage; the post-launch `publish-english-product-experience` change switches maintained product prose to en-US while preserving codes, fields, exits and first-release inputs. Neither stage imposes a language on consumer instructions. Keep subprocess noise and debug output away from JSON stdout and redact credential-bearing URLs. Exit codes are 0 for success (including preview with changes), 1 for check drift, 2 for usage/validation/prerequisite/conflict, and 3 for operational failures. Debug stack traces require an explicit debug flag.

Online preview/check can populate the ignored source cache, but never manifest, integration, outputs or durable state. Explain this distinction in help. Offline and exact locked revisions arrive in stage 2; do not claim them here. Stage 1 preserves ordinary write-only-if-changed behavior and does not implement general stale-output pruning. Do not port filename-inferred deletion or general pruning; preserve unselected/unowned files. Ownership-based removal arrives in stage 2.

### 7. The integration belongs to the installed tool

Bundle agents-write-conventions, agents-update-docs and agents-update-version instructions with the npm package. Ordinary init installs authorship and manifest-driven update in consumers; init --base installs authorship and versioning in bases with the same preservation, zero-write preview, conflict, and safe-path protections. They retain scope/authorship rules and call the selected installed CLI; they do not become a new generic skill installer. `sync` never refreshes this integration. Explicit `init` creates a missing packaged integration and leaves an exact current integration unchanged. Unknown or edited existing integration files cause a clear conflict and remain untouched. No legacy Python package inventory/hash recognizer is needed. The current repository's authored skills are ported explicitly as implementation sources rather than migrated through consumer bootstrap.

The existing generated OpenSpec skills remain owned by OpenSpec. Update the owned root AGENTS.md and authored skills, the shared composition convention only where its public workflow changes, `docs/guides/contratos-de-composicao.md`, and the integration/maintenance guides to explain the installed integration. Use source edits and the authorized public generation flow; do not restore the retired shared skills or artifact-contract families or edit generated documents by hand. The development repository and old tags remain here; none become ancestors or refs in the future public repository.

### 8. Validate the artifact people install

Use `node:test` on compiled JavaScript plus TypeScript strict checking for the new package, and preserve meaningful scenarios from all four Python modules. Capture the accepted minimal candidate's neutral/local outputs and provenance from stage 0. Use focused comparisons with the Python engine only for intended behavior that remains relevant, and document corrected cases; do not require or distribute a full private-v4 compatibility suite. Classify the known YAML, Markdown, case and reserved-path fixes explicitly instead of encoding incorrect old behavior as parity.

Test local and Git-backed sources, existing/new consumer initialization, family discovery, notices, paths containing spaces and accents, no-op second runs, error exits, JSON, and local release validation and tag creation. Build and `npm pack`, install the resulting tarball outside the checkout, hide Python/Make from PATH, and execute the actual entry point. Use local Git fixtures for repeatability; a public registry account is unnecessary for this gate.

From that installed artifact, scaffold an empty base and an explicit minimal starter, validate them without Git/network, then author custom families with different filenames and more than two parents. Publish the custom fixture to a separate disposable Git remote/tag and consume it from two projects with different selections and local contexts. Verify no access to our base is attempted, neither base needs executable code or npm metadata, no initialization creates Git/network effects, and invalid unselected sources fail base validation. Private-base behavior uses inherited Git credential helpers and actionable redacted permission diagnostics; account creation and credential storage are out of scope.

For the minimal candidate, verify a neutral consumer receives no repository-local policy, the live repository uses owned base instructions without consuming that fixture, and an unknown source fails visibly. Development-only generated outputs and old Git objects stay outside the future public snapshot; no catalog migration is required.

Add baseline CI on Windows/Linux and the supported LTS lines, with platform-sensitive link cases tested where supported and explicit diagnostics where linking is unavailable. Move setup/tests/pre-push to cross-platform npm/Node entry points; retain Lefthook as local tooling and make it run the same meaningful general suite. Formatting and strict type checks support the port; configuration-string assertions alone do not establish acceptance.

## Risks / Trade-offs

- A port can lose useful behavior -> preserve the selected version-1 data contract, document the maintainer transition, and require candidate-based installed-package evidence before removing Python entry points.
- Remote content and engine stop moving together -> keep content references independent and document supported renderer contract 1; stage 2 records it in the lockfile. No automatic tool installation is performed.
- A parser can alter document bytes -> use positional extraction and parity fixtures, not whole-document serialization.
- Case-insensitive validation rejects formerly accepted inputs -> provide both colliding sources in the diagnostic and classify the change as a validation fix.
- Stage 1 still lacks durable ownership and crash recovery -> document this limitation, preserve unowned files, and validate on disposable consumers before stage 2.
- npm scope access is not yet verified -> prepare an installable tarball now and verify publishing prerequisites in stage 3; do not substitute an unapproved public name.

## Migration Plan

The initial-publication plan still contains four implementation stages. A fifth English/README change follows actual launch in the new public checkout and uses that first public package/base as a real compatibility baseline. Keep this stage's Portuguese discovery fixtures and human text as initial-release evidence; do not treat them as permanently mandated prose or build a locale framework here.

1. Verify accepted/archived stage 0, capture its neutral/local candidate fixtures and meaningful internal regressions, package the Node engine, and port behavior and mechanical helpers with focused coverage.
2. Validate packed installation and output parity; update authored integrations and relevant documentation sources. Remove Python from normal setup/tests/runtime only after the behavior gate passes.
3. Exercise fresh and already-configured disposable version-1 projects. Preserve their manifests, authored context, and customized integrations; there is no real existing-consumer gate or rollout.
4. Present the package, regression/CI results and consumer diff for user review. Stop before `harden-instruction-sync` until the stage is accepted and its specs are synchronized and archived through the public OpenSpec workflow.
5. Roll back an unaccepted internal trial using its recorded development source/files. Stage 1 does not publish Git/npm releases, choose a new remote, copy `.git`, or create the future real repository. Final reviewed file export occurs only after first-public-version readiness.

## References

- [npm package executables](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#bin)
- [Supported Node.js release lines](https://nodejs.org/en/about/previous-releases)
- [YAML document API](https://eemeli.org/yaml/)
- [Ajv JSON Schema support](https://ajv.js.org/json-schema.html)
- [CommonMark-aware parsing](https://github.com/remarkjs/remark/tree/main/packages/remark-parse)
- [Rulesync preview and check](https://rulesync.dyoshikawa.com/guide/dry-run.html)

