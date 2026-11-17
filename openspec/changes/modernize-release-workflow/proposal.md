# Proposal

## Why

The first public version must start in a new repository without this development repository's Git history. There are no external consumers to migrate. Complete and validate the product here, then perform a separately authorized reviewed-file export only when the first public version is ready.

## What Changes

- Add bounded approved publication plans and recoverable execution behind the maintainer agents-update-version workflow. Preserve the public init/validate/sync/release surface; release --bump remains a local base-tag operation, with dry-run for calculation. Publication target/initial-state fields belong to the approved internal plan rather than new public command flags.

## Capabilities

### New Capabilities

- `release-publication`: Reviewable initial and subsequent release plans, readiness-gated clean repository handoff, independent stream identities, recoverable publishing, and verified public artifacts.

### Modified Capabilities

None. Reuse the accepted manifest, engine, ownership, lock, and recovery contracts instead of adding a second renderer or weakening file protection.

## Impact

- Extends internal TypeScript release planning, authored `agents-update-version`, package/release CI, and relevant public/local documentation. A one-time export is a reviewed maintainer procedure, not a new generic repository-migration CLI.
- All implementation, predecessor validation, archival, and release rehearsals happen in this repository. Actual creation/export is follow-up work after first-public-version readiness and separate authorization; applying this proposal does not perform that handoff.
- The public Git lineage is independent. Internal source provenance and validation evidence stay in the private backup and handoff record; the new package, lock, generated documents, and public references must resolve without private commits or old tags.
- The initial-version decision is explicit for both streams. Examples are not approved versions, and old private version numbers are not mandatory baselines.
- Completion gate: local first/subsequent-release rehearsals, export-boundary and artifact checks pass; the user reviews the ready product. A later authorized handoff must verify the independent Git root, actual published content, and exact public npm install before claiming launch success.
- Verify an installed CLI can scaffold and validate an independent company base, publish its content only through disposable Git release fixtures, and serve two consumers. Keep tool npm publication, optional starter Git releases, and company base releases independently scoped.
- Preserve the verified first public package/content identities as the next change's baseline. During the eventual reviewed handoff, retain access to its approved pending plan without silently exporting private archives/history. Ordinary live release validation belongs to that fifth change; this proposal's implementation gate remains fixture-based readiness followed by separately authorized first launch.

