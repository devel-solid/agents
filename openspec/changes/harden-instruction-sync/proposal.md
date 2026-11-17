# Proposal

## Why

The Node.js CLI introduced by `introduce-node-cli` makes instruction composition installable and testable, but a reference alone does not identify immutable content and successful individual writes do not provide safe recovery. The first public version needs reproducible composition, provenance, and safe future updates. No external consumer exists: verify these guarantees with disposable projects here, without a private-release migration or a real new repository.

## What Changes

- Extend validate --debug with provenance, lock, cache, ownership, output, and pending-recovery diagnostics. Keep exactly init, validate, sync, and release as public roots; integrate explicit manifest-based adoption and safe transaction recovery into sync.

## Capabilities

### New Capabilities

- `reproducible-synchronization`: Immutable content resolution, integrity checks, explicit updates, offline operation, provenance, and operational diagnostics.
- `managed-document-updates`: Ownership-aware planning, conflict handling, safe cleanup, exclusive application, and recoverable document transactions.

### Modified Capabilities

None. This proposal adds operational guarantees to the composition and CLI contracts established by `introduce-node-cli`; it preserves the synchronized four-command interface and composition contracts.

## Impact

- Affects the Node.js resolver, planner, filesystem application layer, validate diagnostics, and sync planning/application; adds lock, ownership, and ignored transaction storage without additional public command roots.

### Sequence and validation gate

Apply this proposal only after content stage 0 `simplify-shared-conventions` and runtime stage 1 `introduce-node-cli` have been implemented, validated by their respective gates, reviewed by the user, synchronized into permanent specifications, and archived. This is reliability stage 2 following the content prerequisite; it must work without publication stage 3. Cross-change sequencing is an explicit workflow prerequisite, not an automatic OpenSpec dependency.

Use accepted neutral/local candidate fixtures, a separately initialized content-only company base consumed by two projects, and synthetic future-update/removal sequences. Verify independent selections, private-access diagnostics, and no fallback to our repository. No v3/v4 consumer adoption, private-catalog transition, or existing-real-project gate is required. Keep ownership and conflict protections for future users; this is product behavior rather than a legacy rollout.

Before advancing, run the installed CLI against fresh and already-generated disposable candidate projects; verify deterministic repeat runs, unchanged local context, moved-reference handling, verified offline use, edited-output protection, safe removal, injected write failures, crash recovery, and simultaneous invocations on Windows and Linux. Present the evidence for user review before starting `modernize-release-workflow`. All work remains in the current development repository. Only after first-public-version readiness and separate authorization will approved files be exported to a new Git root; development lock/ownership data and old refs are not transferred.

The separately planned fifth `publish-english-product-experience` change follows actual first publication. This stage keeps initial Portuguese prose and establishes the ownership/provenance rules that the later language transition must reuse. Do not translate company content or invalidate an existing lock merely because a newer CLI presents English diagnostics or plans different tool-owned generated prose.

