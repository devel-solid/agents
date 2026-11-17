# Release evidence

Date: 2026-11-17. Change: simplify-cli-and-launch.

## State and authorization

The user authorized the complete delivery, then selected npm package @devel-solid/agentscli, experimental version 0.1.0, and new tag agentscli-v0.1.0 after the registry rejected the original unscoped name. Repository and executable remain agentscli.

First delivery is verified. The existing repository was renamed to devel-solid/agentscli without changing repository id 1247610370, history, or existing refs. Origin is https://github.com/devel-solid/agentscli.git. Scoped source commit ea214171d583b1f09c7aa37398642633a9efb546 and annotated tag agentscli-v0.1.0 (tag object ee1acced822e6580666af854710067d441c8a4ee) are public. Native npm publish accepted the scoped archive; after processing, an unauthenticated registry GET returned HTTP 200 for @devel-solid/agentscli@0.1.0. Registry integrity and the downloaded public tarball match the reviewed candidate exactly. No duplicate scoped publish was attempted.

## Requirement map

| Capability | Implementation and evidence |
| --- | --- |
| agents-cli (8 requirements) | Native argument parsing and guarded entrypoint; stable JSON/exits; 7 isolated CLI units; installed resource lookup and unit-only gates |
| project-instruction-workflows (18 requirements) | Reduced manifests, automatic templates, complete rendering, safe stateless file/skill plan; 19 engine units and 6 package units; two document locales; handwritten repository instructions |
| convention-authoring (7 requirements) | Four canonical English skills with context/content curation; 3 client skills; internal release excluded; skill format and locale Markdown checks passed |
| release-publication (10 requirements) | Scoped package/MIT metadata, internal native release workflow, preserved-history rename/source/tag, successful native public publication, registry metadata and downloaded-archive verification |

The runtime was reduced from 18 to 8 TypeScript modules. Removed: remote resolution, roles, locks, ownership, transactions, base release, Ajv, obsolete schemas/catalog/assets, integrations/fixtures, Python oracle, and redundant Makefile wrappers. Guide review/conversion is recorded in guide-review.md; own instructions remain handwritten and English.

## Executed checks

- Latest scoped-candidate `npm run check`: types, formatting, and **32 passing lightweight units** (7 CLI, 19 engine, 6 package).
- Units cover manifests/languages/custom roots, Markdown examples and structural errors, nested/dotted discovery, portable collisions, manual conflicts, direct-source context including subdirectories, skill-only drift/full replacement, unsafe aliases/hard links, temporary cleanup, changed write preconditions, partial sync retry, and interrupted init retry at every file boundary.
- Ordinary `npm pack` prepack: clean TypeScript build and whole-directory resource assembly passed.
- Post-build `npm pack --dry-run --ignore-scripts --json` matched the scoped candidate. Actual archive inventory and package metadata were inspected using tar.
- Strict OpenSpec validation and `git diff --check` passed.
- Authorized scoped main/tag push ran the actual Lefthook type/format/32-unit gate successfully. GitHub CI for ea21417 passed: https://github.com/devel-solid/agentscli/actions/runs/44091235610.
- No installation, integration, subprocess-based test suite, disposable Git project, or registry test was run. Native Git/npm access/publication reads are delivery operations.

## Scoped candidate

- Package: `@devel-solid/agentscli@0.1.0`; executable/repository: `agentscli`; MIT.
- Public tag: `agentscli-v0.1.0`; source commit: `ea214171d583b1f09c7aa37398642633a9efb546`; tag object: `ee1acced822e6580666af854710067d441c8a4ee`.
- Archive: `.tmp/devel-solid-agentscli-0.1.0.tgz` (ignored, derived build artifact).
- Size: 17380 bytes packed; 55382 unpacked; 18 files.
- SHA-1: `2bf5125888848ab6e5afa4ebbd533aa0570ee1d0`.
- Integrity: `sha512-0QX+M4yEMYcQKiWcPOEXRebj5FIA3EwHBNt1TBr0fUqNhEKfZtQYtCy8QSlLCssgFWr4hyUZ+xxw11gSEUVAzw==`.
- Includes 8 compiled modules, 3 complete English client skill trees, 4 en/pt-br templates, README, LICENSE, and package.json.
- Excludes internal manifest/release skill, OpenSpec, source/tests/maps, obsolete assets, and checkout paths. No prepare/postinstall build or resource fetch exists.

Delivery bookkeeping is excluded from the package. Any package-content change invalidates this candidate and requires fresh review.

## Native prerequisite results and earlier candidate

- Native npm login confirmed account `devel-solid`; the user enabled 2FA for authorization/publishing and completed the scoped publish challenge with a security key. Credentials/recovery material were never recorded.
- The original unscoped package returned registry 404 but publication was then refused with HTTP 403: `Package name too similar to existing package agents-cli`. A 404 is not a name reservation or publishability guarantee.
- The user selected the scoped name recommended by npm. A lookup for @devel-solid/agentscli returned 404 before scoped delivery; immutable version/name conflicts must still stop delivery.
- The old unscoped archive was not published. Public tag `v0.1.0` remains unchanged: tag object `9a458c34cd2add0e29abd94c2c608bd0b1640c9c`, source `e59bf3b15ba21cc0867d47b6c00e167c302adca0`.
- That failed candidate's integrity was `sha512-FNJua+FNn5b3adk36IqcAjiBp8pk75H4xJVSi9xP4mkDDGyGNMlBC5b+9PlCLzJqyjLRJQvfODuk79pYljxp5g==`. Do not reuse/move/delete its public tag for the scoped release.
- Browser owner access completed the repository rename and English description update when the native GitHub credential lacked admin permission. Native API/Git checks verified unchanged repository id/history and valid push access.

## Verified public delivery

- Package: https://www.npmjs.com/package/@devel-solid/agentscli/v/0.1.0.
- Repository: https://github.com/devel-solid/agentscli.
- Source: https://github.com/devel-solid/agentscli/commit/ea214171d583b1f09c7aa37398642633a9efb546.
- Tag: https://github.com/devel-solid/agentscli/releases/tag/agentscli-v0.1.0; resolves to that source. Earlier v0.1.0 remains unchanged.
- Unauthenticated registry metadata confirms @devel-solid/agentscli, 0.1.0, MIT, agentscli -> dist/cli.js, and the correct repository URL.
- Public archive: https://registry.npmjs.org/@devel-solid/agentscli/-/agentscli-0.1.0.tgz. Independent downloaded SHA-512 equals the candidate integrity above.
- Actual public archive inventory confirms all 18 expected files: runtime, complete three client skills, both document locales, README, LICENSE, and metadata. No installation or integration test was claimed or run.
- Final task/evidence bookkeeping is committed and pushed independently of the immutable release source/tag. The change remains active; archive only when requested.

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
