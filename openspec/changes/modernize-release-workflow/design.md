# Design

## Context

See `proposal.md` and `specs/release-publication/spec.md`. Content, runtime, and reliability stages are completed, accepted, and archived before this stage. There are no external consumers. Previous Python implementations and tags are retained as development evidence, not release baselines or consumer compatibility obligations for the new public product.

All four implementations stay in the current repository. This stage renames maintained product/package references locally and builds and rehearses release behavior using disposable Git remotes and registry fixtures. Only after the first public version is ready and a later handoff is authorized do we create the real new repository and export final files. No actual export, live repository/remote rename, Git rewrite, commit, tag, or publication occurs merely by implementing or accepting this change.

The public manifest has one format: required `schemaVersion: 1`, directory-discovered local families, optional pinned Git base, and explicit remote-only entries. The former private explicit-local format and development schema v2 are unsupported; historical fixtures remain provenance and are adapted explicitly in tests rather than accepted by the runtime. JSON envelopes, base-role markers, locks, and ownership records have independent format versions.

## Goals / Non-Goals

**Goals:** a consistent `agents-cli` public product identity, independent public Git lineage, safe initial and subsequent releases, exact installed-artifact verification, owned base instructions, explicit version decisions, and recoverable publication.

**Non-Goals:** migrating nonexistent consumers, supporting private v3/v4 tooling, importing history, automating general repository migration, distributing arbitrary skills, changing the accepted renderer, or treating stage acceptance as launch permission.

## Decisions

### 0. Establish the product identity before artifact readiness

This stage owns the rename, after the reliability gate and before building the release candidate. Update maintained source references in the current development checkout; do not create a separate rename stage or postpone the change until the post-launch English release.

| Surface | Target or preserved contract |
| --- | --- |
| Product name | `agents-cli` |
| Public npm package | `@devel-solid/agents-cli` |
| Future public GitHub repository | `devel-solid/agents-cli` |
| Installed executable and four command roots | Preserve `agents init`, `agents validate`, `agents sync`, and `agents release` |
| Consumer files and runtime paths | Preserve `AGENTS.md`, `agents-compose.yml`, `agents-lock.json`, `.agents/`, and `.cache/agents/` |
| Authored skill names, schema fields/identifiers, renderer contract, diagnostic codes, JSON and exit contracts | Preserve existing technical identities and semantics |
| Historical archives, provenance fixtures and third-party attribution | Preserve exact evidence; distinguish it from maintained product branding |

Audit package.json/package-lock metadata, package-name lookups and self-references, CLI product labels, maintained instructions, templates, authored skills and their distributed copies, README/guides/install examples, the offline HTML presentation, relevant tests, CI/publication configuration, and repository/homepage/issues/npm links. Update source-owned assets through their existing build/packaging pipeline. Installation examples use `npm install -g @devel-solid/agents-cli` followed by the existing `agents` commands. Do not apply a global replacement to the word `agents`, company-base identities, or historical inputs. Record justified remaining old-name occurrences and verify that active product references use the new identity.

Future public URLs are target metadata before handoff, not evidence that a repository or package already exists. Rehearsals use disposable resources and validate URL/identity consistency without requiring the future live target. At the separately authorized launch, verify target availability, permissions, public npm namespace/name/version readiness, and trusted-publisher identity; a conflict stops the plan rather than silently selecting another name. Keep the current repository, origin, workspace directory, and Git history unchanged during implementation.

Pack/install tests must address the renamed package and invoke its installed `agents` executable outside the checkout, covering both base and consumer journeys. Inspect regenerated assets and presentation references, validate the exact renamed tarball, and ensure normal installation no longer depends on `@devel-solid/agents`. The later real export revalidates any commit/URL/provenance transformations against this already established identity and rebuilds the artifact when inputs change. The English stage inherits the first published `agents-cli` identity and does not rename it again.

### 1. Keep readiness, handoff, and publication distinct

```text
current development repository
  -> content gate -> runtime gate -> reliability gate -> release rehearsal
  -> first-public-version readiness + user review
  -> later authorized handoff: private backup + reviewed file inventory
  -> fresh directory / new Git root / new real remote
  -> export validation + frozen initial commit + publication plan review
  -> source publication -> generation metadata -> npm publication
  -> independent-root and remote-install verification
  -> separate publish-english-product-experience change in the public checkout
  -> English product/README + ordinary next-version release and registry/remote test
```

The one-time handoff is a maintainer runbook with fixture coverage. Do not add a generic migration command to the product. Its later concrete plan names backup location, selected development snapshot, approved files and transformations, target URL, any repository rename/name-reuse or visibility steps, initial versions, initial commit message, and validation. No real target is created before readiness, and unlisted account/repository changes are not implied.

This clean-history requirement applies to our tool's first public handoff only. A company adopting the published CLI owns its base repository, access controls, content, and Git history; it is not required to reset history, fork the tool, create an npm package, or use our optional two-source starter. A base created with init --base contains editable instruction sources and the CLI-packaged agents-write-conventions and agents-update-version guidance. Its Git history, publication policy, and additional tooling remain independently owned by the company.

Preserve development history and pending work in a verified private backup before the eventual export. Leave the original repository intact rather than rewriting its branches. A final public snapshot may include approved uncommitted files only when the inventory and hashes explicitly cover them; a HEAD-only export must not silently lose pending work. Internal planning/archives/reports stay private unless individually approved for the public file inventory. Current product specs and required license/attribution files remain subject to that review.

Alternative: reset history on the current remote. Rejected because the agreed handoff uses a new repository. Alternative: create the new repository now and implement there. Rejected because the user chose to finish the first public version here before creating it.

### 2. Export approved product files, not a repository

Build a reviewed positive inventory of final code, schemas, runtime assets, two shared convention sources, owned base AGENTS.md and role identity, relevant tests, product specs, and documentation. Copy files into a fresh directory with no Git metadata, then initialize an independent Git repository. Never use a fork, mirror, shallow clone as a substitute for a new root, copied `.git` directory at any depth, or old branch/tag push.

Exclude caches, dependencies, temporary/build leftovers, private backup/evidence, old release journals, obsolete development-generated documents, and development lock/ownership records. Do not copy obsolete outputs just to delete them later. Generate final documents from accepted sources in isolated candidate verification; regenerate durable state against the new published identity. Verify the already-renamed `agents-cli` product references and record any remaining commit-bound repository URLs, package metadata, examples, workflow identity, and refs as explicit reviewed export transformations. Final checks must not need this checkout's private objects, tags, paths, caches, or old registry versions.

The new initial source commit is one approved snapshot with no parent. Later commits made by the new release workflow, such as generated lock metadata, are new history. The requirement is absence of imported development ancestry, not a promise that the public repository will forever have exactly one commit. Verify parentage and refs again from a fresh clone after publication.

### 3. Separate read-only preparation from authorized execution

Keep exactly four public roots. The agents-update-version skill and internal publication engine prepare, apply, and recover an approved publication plan without new CLI subcommands or manual current/next-version flags. The existing release --bump --dry-run computes local content versions; release --bump creates its local tag. External Git/npm actions belong to the explicitly authorized maintainer workflow, not the local CLI release operation. Plan fields identify independent base/CLI/both streams and initial publication state.

`base` operates on a company-owned content-only Git repository using `validate --base` and the shared source validators. It does not require `package.json`, npm access, a consumer manifest, lock/state, engine source, CI files, or loading a skill to run the CLI directly. Init --base installs agents-write-conventions for curation and agents-update-version for agent-guided releases. It plans an approved content tag and the necessary Git publication only; no consumer generation or metadata commit is invented. If an explicit consumer composition is also in scope, its post-tag stage-2 update is separately shown in the plan. Standard Git publication remains supported without this optional release assistance.

`cli` validates the npm artifact and package metadata without requiring a new content tag or any company-base access. `both` is valid only for a checkout that actually contains both product components and whose plan explicitly includes both streams. Do not infer npm publication because a base uses the tool, or content publication because an npm version changes. Our own starter catalog may remain in the public tool repository as an independently tagged optional Git source.

An ordinary plan records source commit, branch, frozen remote branch identity, previous published tag/commit per selected stream, versions, expected writes/resources, applicable package/artifact identity, any planned commit messages, and canonical plan digest. A content-only plan has no npm artifact or invented metadata commit. The agent or maintainer decides semantic impact; the tool validates objective state and explicit versions. Execution refreshes remotes and revalidates the approved identity before effects. Expected transitions are recorded; unexpected drift requires a renewed plan.

An internal approved publication plan identifies streams with no preceding public release. A company base may retain its existing Git history and observed remote baseline. The separately authorized clean-history handoff requires its reviewed independent root and expected-empty remote. No --initial CLI flag or new public operation is introduced, and actual publication still requires its concrete reviewed authorization.

The initial handoff's reviewed file digest authorizes preparation of the new snapshot. Bind external publication approval to the resulting exact new commit and artifact. Product acceptance alone does not authorize either handoff or publication.

### 4. Use initial versions without importing old baselines

For the first selected public streams, require explicit initial SemVer values; do not increment the development `v4.0.1`, inherit the old private package version, copy old tags, or synthesize a preceding release in the new repository. No exact initial version is approved by these artifacts.

For subsequent releases, find each stream's reachable remotely published tags in the new repository only: `vX.Y.Z` for content and `cli-vX.Y.Z` for CLI. Present the last release-to-candidate range; use `origin/main` for freshness/divergence, not impact. Missing baselines without explicit initial mode fail visibly. Keep content and CLI versions independent; single-stream releases do not bump the other stream.

The initial notes describe the first public product and setup. They do not require a migration from private catalogs. Historical port tests can be development evidence without appearing as public upgrade promises.

### 5. Validate the exact new identity before publishing

Rehearse export and empty-remote launch with synthetic disposable repositories while implementing here. In a later real handoff, validate the exact exported inventory, final repository URLs/defaults, two-source catalog, owned base instructions and neutral consumer before accepting the initial source commit. Historical local profiles remain fixture-only regression inputs. Use the shared planner's isolated maintainer-only candidate-source override only in disposable consumers; never execute content-checkout scripts or bypass ordinary consumer lock rules.

After freezing the new source commit, build, inspect, pack, and install-test its exact tarball outside the source checkout without Python/Make/compiler. Preserve its digest and reuse it for publication. Bind package metadata and CI/trusted-publisher provenance to the new repository/commit. A tarball from the old development identity is not automatically approved for the new identity; rebuild and revalidate after reviewed export transformations.

Content-only updates use a verified compatible installed CLI and do not build an npm artifact. CLI scaffolds carry no implicit remote repository/ref; consumer setup explicitly names the company's chosen base. Packaged starter copies are local assets, so npm delivery does not depend on publishing a starter Git tag. The base never consumes itself. After a content tag is published, separate disposable consumers verify adoption. No runtime resource or source contract may depend on the private development repository.

### 6. Publish independent base and CLI artifacts

The exported base owns a plain AGENTS.md and its role marker, without a consumer manifest, lock, output ownership state or generated local convention documents. A combined CLI/content launch may publish both streams, but does not add a consumer phase to the base.

```text
new root commit + explicit plan + exact tarball preflight
  -> verify expected-empty new remote
  -> publish and verify approved base/source tag
  -> CLI source tag -> public npm artifact when that stream is approved
  -> verify published sources in separate disposable consumers
  -> verify registry installation and fresh-clone lineage
```

Company bases retain their existing history and branches. Consumers adopt published content independently in separate roots. No base publication creates or updates a consumer pin, generated documents, consumer lock or metadata commit. Journals and publication recovery retain their own explicitly scoped identities.

### 7. Resume matching work and preserve public identities

Use an ignored credential-free release journal with plan identity, old-development-to-export inventory digest where relevant, new source commit, versions, tarball integrity, observed remote states, and completed steps. The private handoff record stays outside the public export. Persist progress around external effects.

On resume, verify observed Git/npm state rather than repeat uncertain publication. Reuse matching tags, initial branch creation, metadata commits, and registry versions; stop on mismatch or lost evidence. Verify npm integrity/downloads after an ambiguous response. Never move a published tag, recreate an initial root after partial publication, duplicate the metadata commit, republish an existing version, or delete remote artifacts as compensation.

There is no preceding public version to roll back to on first launch. Before public effects, discard/rebuild only the isolated export under the approved plan. After partial publication, resume verified identities or prepare a new corrective release; the private backup is not a public version.

### 8. Keep public delivery and quality gates explicit

Verify npm namespace/name/version readiness, public access, exact package allowlist, and configured new-repository workflow identity at launch. Prefer trusted publishing/provenance where supported; document first-publication setup and recheck current provider prerequisites during implementation. Missing setup is a diagnostic, not permission to create an organization or request long-lived tokens in chat. An alternate method requires explicit authorization.

Extend the existing operating-system/Node matrix and Lefthook gate with initial and subsequent release fixtures, archive/export exclusion tests, empty/nonempty remote conflicts, source-tag-first generation, and failure injection after every external boundary. PR tests never create real repositories, tags, packages, or account changes. Keep initial setup, ongoing support, normal updates, recovery, and independent version streams documented in pt-BR for this initial release. The later fifth `publish-english-product-experience` change switches maintained artifacts to en-US while preserving pt-BR chat and the release contracts; product language is not a hardcoded permanent release-format field.

Add an installed-package company journey: create an empty base or explicit minimal starter, edit custom families, validate, publish a first base-only tag to a disposable existing-history Git remote without npm configuration, and consume it from two projects. Publish a later content tag independently of npm and update one consumer only. Test CLI-only publication without contacting any instruction base; keep private-base access inherited from Git and redact failures. Documentation distinguishes tool maintainers, company base authors, and project consumers, including the optional starter's ownership and lack of automatic upstream policy updates.

## Risks / Trade-offs

- New Git lineage disconnects development SHAs -> keep the verified private backup/record and bind public evidence to the exported root, never import private ancestry for convenience.
- Pending work or stale generated files enter the wrong snapshot -> approve the exact file inventory and transformations, regenerate final outputs, and revalidate independently.
- Initial release has no tag or remote-main baseline -> require explicit initial mode and expected-empty checks; never silently guess an upgrade range.
- The base never has a consumer lock -> verify published sources using a separate disposable consumer after tag publication.
- Remote/npm success can precede a lost response -> journal identities and verify matching state before resuming without replacement.
- New namespace/provenance setup is external -> keep it in the later handoff/publication readiness plan, not a dependency for local implementation acceptance.

## Migration Plan

The initial-product readiness boundary remains the first four changes. Only after the separately authorized handoff and actual first Git/npm launch does `publish-english-product-experience` begin in the resulting public repository. Retain the approved pending plan at a known location or explicitly include its reviewed files in the handoff inventory; do not copy private planning archives or Git ancestry automatically. Record the first public artifact/content identities so its next-version tests use a genuine public baseline, not private development tags. This fifth change owns the English translation, README overhaul, and actual ordinary-release proof; it is not a second clean-history migration.

1. After all predecessor gates, establish the `agents-cli` product and `@devel-solid/agents-cli` package identity here, preserve technical contracts, and implement/rehearse release behavior with aligned authored workflows, local policies, guides, assets and presentation without migrating a repository.
2. Test initial and subsequent release paths, reviewed export inventories, independent roots, fresh metadata, installed artifacts, interruptions, and unchanged development sources using only fixtures.
3. Present first-public-version readiness for user acceptance. Preserve the new-repository handoff and all real Git/npm effects as follow-up requiring separate authorization.
4. At that later handoff, verify the private backup, approve exact final files/metadata, create the fresh target, freeze the independent initial commit, and approve its concrete publication plan.
5. Publish/verify the new Git and npm identities. Continue future development from the new clone after handoff; avoid reconnecting the old checkout as a source of public refs.

## References

- [npm executable metadata](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/#bin)
- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/)
- [Git repository initialization](https://git-scm.com/docs/git-init)

References support implementation choices and do not authorize handoff or publication.

