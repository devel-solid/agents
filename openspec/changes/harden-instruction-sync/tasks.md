# Tasks

## 1. Prerequisite and durable contracts

- [ ] 1.1 Verify `simplify-shared-conventions` and `introduce-node-cli` are implemented, their candidate-content and installed-package gates are recorded and user-reviewed, and their specifications are synchronized and archived; read the accepted two-source/local-policy fixtures and final-export boundary, and stop if any prerequisite is missing.
- [ ] 1.2 Define versioned lock and ownership schemas with canonical paths, `utf8-lf` SHA-256 hashes, renderer compatibility, and deterministic generation identity; verify malformed, unknown-version, incompatible-renderer, and non-deterministic fixtures are rejected by focused contract tests.
- [ ] 1.3 Document the distinction between `agents-lock.json`, `.agents/agents-state.json`, and ignored runtime recovery data in the consumer guide; verify examples validate, do not require machine-local session artifacts, and show that clean launch regenerates metadata rather than copying old repository commit identities.

## 2. Locked resolution and explicit content updates

- [ ] 2.1 Implement initial lock planning and existing-lock resolution without changing the installed engine; verify repeated sync and a moved tag/branch retain the recorded commit, while an unsupported renderer contract fails before project writes.
- [ ] 2.2 Bind locks to configured repository/ref/remote families; verify an explicit manifest edit produces a previewable transactional sync adoption while local source edits remain renderable.
- [ ] 2.3 Plan and apply content adoption through sync after explicit manifest selection changes; verify invalid remote content preserves durable state and dry-run reports the candidate commit without applying it.
- [ ] 2.4 Verify cached repository identity, commit, selected inventory, containment, and normalized digests, and repair online entries at the locked commit; cover dirty files, extra/missing children, wrong-origin cache, and Windows read-only pack regressions with focused tests.
- [ ] 2.5 Add verified offline synchronization and frozen-lock behavior; verify no network calls occur offline, missing/altered cache fails safely, and missing/mismatched locks are not refreshed under `--frozen`.
- [ ] 2.6 Update command help and consumer examples for lock initialization, explicit update, frozen checks, and offline use; verify installed-CLI examples and explain that online previews may populate ignored cache.
- [ ] 2.7 Exercise independently owned company bases, including two repositories with identical refs/filenames and simulated private-access denial; verify cache/provenance isolation, inherited Git access, credential redaction, explicit transactional base switching, and no fallback or lookup to our optional starter repository.

## 3. Ownership-aware planning and safe cleanup

- [ ] 3.1 Extend the stage-1 plan with ownership, source provenance, metadata changes, adoption, and conflicts; verify preview/check/apply share the same intended result and `--check` reports missing durable metadata with exit code 1 without creating it.
- [ ] 3.2 Implement initial ownership by exact expected normalized-content comparison; verify candidate neutral/local projects and matching pre-existing targets initialize correctly, while edited/ambiguous targets stay untouched without any private-version adoption mechanism.
- [ ] 3.3 Protect owned targets using recorded generated hashes and raw plan preconditions; verify direct output edits and a modification made after planning block the entire operation without losing the independent edit.
- [ ] 3.4 Plan removals only for unchanged owned outputs after future parent/child selection changes or output-directory movement; verify unowned/edited files remain preserved and all stage-1 destination protections pass without a historical-catalog migration requirement.
- [ ] 3.5 Document source-level reconciliation and safe stale-output removal in the retained shared composition source/reference guide and consumer guide, using local policies only where applicable; verify authorized generation, no retired shared-policy resurrection, and explicit source selection and initial-ownership behavior without changing the selection model.

## 4. Transaction application and recovery

- [ ] 4.1 Add exclusive mutation ownership for the canonical project root and isolated cache-population staging; verify competing writers cannot apply together and concurrent readers cannot consume an incomplete cache entry.
- [ ] 4.2 Stage desired documents and manifest/lock/ownership changes with durable raw preimages and journaled application; verify per-file replacement and rollback using injected failures before and after each application/commit boundary.
- [ ] 4.3 Detect pending journals; show recorded rollback in sync --dry-run and apply only verified rollback through sync before stopping; verify subsequent normal sync and preservation of independent edits.
- [ ] 4.4 Preserve edits made after interruption and verify stale-lock owner identity beyond PID alone; cover PID reuse/ambiguous owner, missing recovery data, and independent file edits with focused tests that retain recovery evidence on conflict.
- [ ] 4.5 Keep active transaction journals/backups outside disposable content-cache entries; verify cache repair cannot remove active recovery data and a completed transaction can safely finish cleanup after interruption.
- [ ] 4.6 Document recovery, contention, backup retention, and multi-file visibility limits in help and the maintenance guide; verify every documented recovery command against an installed-package failure fixture.

## 5. Provenance and complete operational diagnostics

- [ ] 5.1 Include source/family/commit/renderer/ownership provenance for each generated output in validate --debug; verify local and unmanaged targets are identified without regeneration.
- [ ] 5.2 Extend validate diagnostics for lock/cache/ownership/output/recovery, including future offline mode; verify no implicit repair or offline network requests.
- [ ] 5.3 Add bounded configurable Git timeouts, cancellation/termination handling, and credential-redacted diagnostics; verify timed-out subprocesses are stopped, errors use exit code 3, and secret-shaped fixture values do not appear in human or JSON output.
- [ ] 5.4 Extend the stage-1 JSON envelope and exit-code tests across selection adoption, validation/provenance, recovery, drift, and conflicts; verify stdout contains one valid structured result and external Git diagnostics do not corrupt it.
- [ ] 5.5 Document provenance, timeout configuration, diagnostic codes, and remediation examples; verify examples agree with installed-CLI behavior and keep normal prose/help in pt-BR for the initial release, with stable codes/fields preserved for the fifth post-launch English change.

## 6. Stage validation gate

- [ ] 6.1 Run the installed CLI through accepted neutral/local candidate fixtures, fresh and already-generated disposable projects, initial ownership, synthetic future updates, nested families, idempotence, offline, conflicts, and removal; verify expected generation and preserved unrelated files without a real consumer, private-version migration, new real repository, or npm publication.
- [ ] 6.2 Run the existing Windows/Linux CI matrix for supported Node.js LTS lines with the new integrity, timeout, concurrency, and failure-recovery tests; verify the local Lefthook gate remains active and no new path depends on Python or Make.
- [ ] 6.3 Record the gate's actual command results and limitations in a durable implementation validation artifact, present them to the user, and stop before starting stage 3; verify no task is claimed complete solely because a proposal or test fixture exists.
- [ ] 6.4 Create a content-only company fixture through installed `init --base`, author custom families, and consume it from two projects; publish a fixture content version without npm, explicitly update one project, and verify the other remains locked, local contexts remain distinct, and offline/recovery behavior does not require our catalog or create consumer state in the base itself.

## Workflow follow-up

- The fifth `publish-english-product-experience` change starts after real first publication and reuses these transaction/provenance guarantees for English generated text and old-public-input compatibility. Preserve its testable lock/ownership boundaries; do not silently translate company sources or fold English implementation into this reliability stage.

- After the gate is accepted by the user, synchronize the two delta specifications and archive this change through `openspec-archive-change`.
- Start `modernize-release-workflow` only after that prerequisite is met and the user requests the next implementation stage. Planning the content stage and three modernization stages does not authorize applying them together or migrating the repository. All implementation stays here; the clean new repository is a later authorized handoff after first-public-version readiness.
