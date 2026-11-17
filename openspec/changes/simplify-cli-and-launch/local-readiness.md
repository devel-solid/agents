# Local readiness

Date: 2026-11-17. Change: simplify-cli-and-launch.

## State

Local implementation passed its 32-task readiness checkpoint. The user subsequently authorized the complete delivery. The existing remote repository was renamed to devel-solid/agentscli and origin was updated; native verification confirms the same repository id and preserved main/tag refs. Actual npm delivery is pending.

Reviewed release source: `e59bf3b15ba21cc0867d47b6c00e167c302adca0`, with existing commit `3a5fc3fdcd4de163765cf25da2789acd1b13cb8b` verified as an ancestor. Implementation is committed and the annotated local tag `v0.1.0` exists. The tag object is `9a458c34cd2add0e29abd94c2c608bd0b1640c9c` and resolves to that release source. Rename and complete delivery authorization are recorded; npm publication and its final public verification remain pending.

## Requirement map

| Capability | Implementation and evidence |
| --- | --- |
| agents-cli (8 requirements) | Native argument parsing and guarded entrypoint in src/cli.ts; stable results in src/runtime.ts; 7 isolated CLI units; installed resource lookup and unit-only gates |
| project-instruction-workflows (18 requirements) | Reduced manifests, template discovery/validation/rendering, stateless file plan, safe writer, complete managed-skill inventory; 19 engine units and 6 package units; two document locales and direct repository instructions |
| convention-authoring (7 requirements) | Four standard canonical English SKILL.md sources; shared manifest context and content curation; 3 client skills, internal release excluded; all four skill validators and locale Markdown structure checks passed |
| release-publication (10 requirements) | agentscli@0.1.0/MIT metadata, internal native release workflow, preserved-history rename, exact source/tag and inspected candidate below; npm publication and final public verification remain pending |

The legacy runtime was reduced from 18 to 8 TypeScript modules. Remote resolution, roles, locks, ownership, transactional recovery, base release, Ajv, obsolete JSON schemas, old catalog/assets, integration suites/fixtures, Python oracle, and redundant Makefile wrappers are removed. Useful guide content was reviewed before deletion; see guide-review.md. Own instructions remain handwritten and English.

## Executed checks

- `npm run check`: type checking, formatting, and **32 passing lightweight unit tests** (7 CLI, 19 engine, 6 package).
- Engine units cover custom roots, lowercase language contracts, malformed sources/markers, Markdown examples, nested/dotted discovery, portable collisions, source-context rejection including subdirectories, manual conflicts, skill-only drift, whole skill replacement, unsafe links/hard links, individual-file failure cleanup, changed destination preconditions, partial sync retry, and interrupted init retry at every file boundary.
- Ordinary `npm pack` prepack: clean build, TypeScript compilation, and whole-directory asset assembly passed.
- `npm pack --dry-run --ignore-scripts --json` after that build matched the actual candidate file inventory and integrity. `tar -tzf` and archive package metadata were inspected; independent SHA-512 matched npm.
- `openspec validate --specs --strict --json` and `openspec validate simplify-cli-and-launch --strict --json` passed; `git diff --check` passed.
- No installation, integration, subprocess-based test suite, disposable Git project, or registry test was run. Native registry/Git reads below are delivery prerequisite checks, not automated test suites.

## Candidate artifact

- Package/executable/repository identity: `agentscli`.
- Version: `0.1.0`; source commit: `e59bf3b15ba21cc0867d47b6c00e167c302adca0`; annotated tag: `v0.1.0`; license: MIT.
- Candidate archive: `.tmp/agentscli-0.1.0.tgz` (ignored local build artifact, reproducible from maintained sources).
- Size: 17358 bytes packed; 55289 bytes unpacked; 18 files.
- SHA-1: `b174fc8502545c2b42aff45a0f476d70da4ed20c`.
- Integrity: `sha512-FNJua+FNn5b3adk36IqcAjiBp8pk75H4xJVSi9xP4mkDDGyGNMlBC5b+9PlCLzJqyjLRJQvfODuk79pYljxp5g==`.
- Contents: 8 compiled runtime modules, 3 complete English client skill trees, 4 templates across en/pt-br, README, LICENSE, and package.json.
- Excluded: internal manifest/release skill, OpenSpec, source/test trees, source maps, obsolete assets, and development checkout paths. No prepare/postinstall build or resource fetch exists.

The archive matches the reviewed committed runtime/client sources and metadata. Subsequent delivery bookkeeping changes only this change's evidence/tasks and is excluded from the package. The artifact is not yet published; any change affecting package contents requires a fresh candidate review.

## Native access checks and blockers

- Renamed public repository: `devel-solid/agentscli`, unchanged GitHub repository id `1247610370`, default branch `main`; origin is `https://github.com/devel-solid/agentscli.git`.
- Before source delivery, remote main matched the existing parent commit. All existing remote branches/tags were inspected and preserved; `v0.1.0` was absent before non-forcing local creation.
- The native GitHub credential reports push access but `admin: false` and `maintain: false`. The existing browser session had repository-owner access and completed the authorized rename and English description update. Native API and Git reads verified the resulting identity/history; no credential value was exposed.
- `npm whoami` initially reported `ENEEDAUTH`. Native web login has been opened for the user; account/package permission and actual publication remain pending that authentication.
- The public registry lookup for `agentscli` returned HTTP 404 on 2026-11-17. This does not reserve the name or guarantee publishability. Name/account restrictions remain to be checked after authentication.

## Concrete remaining delivery plan

1. Resolve GitHub rename permission and npm authentication, and obtain any still-missing authorization for rename, commit, tag, push, and public npm delivery.
2. Rename the existing repository id to `devel-solid/agentscli` and update origin to `https://github.com/devel-solid/agentscli.git`. Preserve the existing repository/history/refs; do not export, reset, purge, or force-push.
3. Reconcile the reviewed worktree and artifact. Create the authorized source commit (proposed subject: `feat: launch simplified agentscli 0.1.0`) with the existing main as parent, then the non-forcing `v0.1.0` tag. Record their exact identities and confirm the final candidate archive.
4. Push only the approved source/tag and publish the inspected archive using native npm with public access. Inspect remote/registry state before retrying an ambiguous response; do not replace a conflicting immutable tag/version.
5. Verify public repository commit/tag, registry package/version/visibility, MIT license, required resources, and dist.integrity. Mark actual delivery tasks complete only after that evidence exists. Archive only when requested.

## Specification reconciliation

The approved nine deltas were synchronized through openspec-sync-specs. The three retained capability Purposes were updated to describe the reduced model, and release-publication was added. The following fully retired specs and their old Purposes were removed with `retire_capabilities: true`:

| Retired spec | Removed Purpose |
| --- | --- |
| openspec/specs/consumer-artifact-contracts/spec.md | Define the manifest and source-file contracts that consumers use to generate shared agent instructions. |
| openspec/specs/consumer-instruction-composition/spec.md | Keep editable instruction sources distinct from generated documents and synchronize them through the repository's public workflow. |
| openspec/specs/managed-document-updates/spec.md | Make generated instruction updates auditable and recoverable while preserving user-maintained files, detecting local edits, and removing only outputs demonstrably owned by the tool. |
| openspec/specs/reproducible-synchronization/spec.md | Make a consumer's selected shared instructions reproducible and inspectable across machines, repeated runs, and unavailable networks without coupling content updates to executable CLI updates. |
| openspec/specs/shared-instruction-catalog/spec.md | Provide a small reusable instruction catalog while keeping each consumer's language, tooling, and operational policies explicit and independently owned. |

If explicitly reverting these retirements in this checkout, restore the old specs with:

```sh
git checkout 3a5fc3fdcd4de163765cf25da2789acd1b13cb8b -- openspec/specs/consumer-artifact-contracts/spec.md openspec/specs/consumer-instruction-composition/spec.md openspec/specs/managed-document-updates/spec.md openspec/specs/reproducible-synchronization/spec.md openspec/specs/shared-instruction-catalog/spec.md
```

No previously deleted change was restored. The current change remains active.
