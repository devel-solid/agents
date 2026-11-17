# Tasks

## Accepted validation scope

The user explicitly replaced integration, installed-package, real process-failure, and platform-matrix acceptance with unit tests only, and authorized synchronization and archival. Runtime requirements are unchanged. Implementation tasks below are verified by the delivered code, documentation, retained unit contracts and the independent review completed in this chat. Checked tasks do not certify a completed final integration or cross-platform run. See validation.md for exact evidence and limitations.

## 1. Prerequisite and durable contracts

- [x] 1.1 Confirm accepted, synchronized and archived content/runtime prerequisites; preserve the sole schemaVersion 1 manifest, local discovery, optional base, remote-only entries and historical fixtures.
- [x] 1.2 Deliver versioned lock/ownership schemas, canonical paths, utf8-lf SHA-256 and deterministic generation identity; verify retained unit contracts reject invalid lock and ownership states.
- [x] 1.3 Document lock, ownership and ignored recovery data separately, including regeneration of provenance after an independent public export; review the consumer/reference guides.

## 2. Locked resolution and explicit content updates

- [x] 2.1 Implement initial resolution and reuse of locked commits without changing the installed engine; review renderer compatibility and immutable commit selection in the resolver.
- [x] 2.2 Bind locks to repository/ref/remote selection while allowing local authoring; review manifest matching and explicit family origins.
- [x] 2.3 Preserve candidate identity, removals and conflicts in preview and apply valid adoption transactionally; review the shared CLI/plan/application boundary.
- [x] 2.4 Verify cache origin, detached commit, inventory, containment and normalized integrity; review locked-commit repair and isolated publication without deleting recovery data.
- [x] 2.5 Deliver offline/frozen modes; review early lock checks and absence of remote operations on the offline resolution path.
- [x] 2.6 Update help and consumer examples for lock initialization, explicit adoption, offline/frozen and ignored cache population; review documentation against supported options.
- [x] 2.7 Preserve independent company repository identities and inherited Git access without starter fallback; review repository/commit cache keys, sanitized provenance and access diagnostics.

## 3. Ownership-aware planning and safe cleanup

- [x] 3.1 Deliver one plan for ownership, provenance, adoption, removals, conflicts and metadata; review check/drift exit codes and conflict-preserving previews.
- [x] 3.2 Require exact normalized expected content for initial adoption; review absent, matching, edited and unmanaged target branches without private-version import.
- [x] 3.3 Protect generated outputs and source/manifest/metadata preconditions; review early snapshots, raw hashes, inventories and physical path identities.
- [x] 3.4 Remove only unchanged owned deselected outputs, including destination moves; review containment, reserved destinations, links and preservation of unrelated files.
- [x] 3.5 Document source-level reconciliation, ownership initialization and conservative stale-output removal; review the retained shared source and reference/consumer guides without restoring retired policies.

## 4. Transaction application and recovery

- [x] 4.1 Deliver exclusive mutation ownership and isolated cache staging; review canonical-root contention and complete-entry publication.
- [x] 4.2 Stage desired files and durable raw preimages with journaled replacements and ownership last; review rollback and completed-generation boundaries.
- [x] 4.3 Expose pending rollback in sync preview and recover safely before stopping; review the recovery-first CLI flow and preservation of independent edits.
- [x] 4.4 Verify host/process-start/token ownership beyond PID and preserve ambiguous or missing evidence; review stale-lock handling and recovery physical identities.
- [x] 4.5 Separate recovery storage from disposable content entries and support interrupted cleanup/recovery; review completion markers and resumable rollback.
- [x] 4.6 Document recovery commands, contention, backup retention and per-file visibility limits; review help and the maintenance guide against the implemented APIs.

## 5. Provenance and operational diagnostics

- [x] 5.1 Report local/remote source, family, commit, renderer, hash and ownership provenance without writes; review validate debug output in human and JSON rendering.
- [x] 5.2 Diagnose lock/cache/ownership/output/recovery without implicit repair; review pending-recovery exit-code priority and output drift/conflict reporting.
- [x] 5.3 Deliver bounded configurable Git operations, process-tree termination, cancellation and redacted diagnostics; review supervisor/error paths and verify credential-redaction unit contracts.
- [x] 5.4 Preserve one schemaVersion 1 JSON envelope and documented exit codes; review structured adoption/conflict/recovery results and captured subprocess output.
- [x] 5.5 Document provenance, timeout configuration, diagnostic codes and remediation in pt-BR; review stable technical fields and preserve later English-product scope.

## 6. Revised acceptance gate

- [x] 6.1 Remove newly authored non-unit suites and temporary validation scripts/cache while preserving historical fixtures and pre-existing tests; verify default discovery excludes tests/node/.
- [x] 6.2 Restrict npm test and npm run check to tests/unit/, remove the CI matrix, retain Lefthook configuration without invoking it, and verify the configured commands directly.
- [x] 6.3 Record actual unit/static/spec results, independent review and platform limitations in validation.md; do not represent removed or interrupted verification as passed.
- [x] 6.4 Document company-base/consumer separation, independently adopted locks and clean-export provenance; review the delivered guide/runtime and preserve the decision not to create new installed fixtures.

## Workflow follow-up

- Synchronize both delta specs and archive this change as explicitly requested by the user.
- Keep modernize-release-workflow, product renaming, new repositories, commits, tags, publication and the later English experience outside this operation.
