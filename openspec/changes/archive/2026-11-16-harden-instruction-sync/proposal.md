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

- The public manifest has one format: required `schemaVersion: 1`, directory-discovered local families, optional pinned Git base, and explicit remote-only entries. The former private explicit-local format and development schema v2 are unsupported; historical fixtures remain provenance and are adapted explicitly in tests rather than accepted by the runtime. JSON envelopes, base-role markers, locks, and ownership records have independent format versions.

- Affects the Node.js resolver, planner, filesystem application layer, validate diagnostics, and sync planning/application; adds lock, ownership, and ignored transaction storage without additional public command roots.

### Sequence and validation gate

The subsequent `modernize-release-workflow` stage owns the maintained product rename to `agents-cli`, npm package `@devel-solid/agents-cli`, and future public repository `devel-solid/agents-cli` before candidate packing. This reliability stage uses the current development identity and does not implement or depend on that rename. Its `agents` commands, manifest, lock, ownership, cache and skill identifiers remain technical contracts through the later rename.

Apply this proposal only after content stage 0 `simplify-shared-conventions` and runtime stage 1 `introduce-node-cli` have been implemented, validated by their respective gates, reviewed by the user, synchronized into permanent specifications, and archived. This is reliability stage 2 following the content prerequisite; it must work without publication stage 3. Cross-change sequencing is an explicit workflow prerequisite, not an automatic OpenSpec dependency.

Preserve the accepted neutral/local historical fixtures. Independent company bases, selections, private-access diagnostics, and absence of fallback remain product contracts. The user's final validation decision requires unit tests only: newly added installed-package, integration, process-failure, and matrix tests were removed. Historical tests remain outside the default gate. No real consumer, new repository, or publication is required.

Acceptance uses independent implementation review, retained unit contracts, `npm run check`, and strict OpenSpec validation. `npm test` and `npm run check` discover only `tests/unit/`; CI uses one Ubuntu/Node.js 24 job without a matrix. Do not invoke pre-push to run this gate. Record actual results and the absence of a completed final integration/platform gate in `validation.md`; earlier exploratory runs are historical evidence, not current certification. The user authorized specification synchronization and archival under this revised scope. Starting `modernize-release-workflow`, exporting files to a new Git root, and publishing remain separate actions; development lock/ownership data and old refs are not transferred.

The separately planned fifth `publish-english-product-experience` change follows actual first publication. This stage keeps initial Portuguese prose and establishes the ownership/provenance rules that the later language transition must reuse. Do not translate company content or invalidate an existing lock merely because a newer CLI presents English diagnostics or plans different tool-owned generated prose.

