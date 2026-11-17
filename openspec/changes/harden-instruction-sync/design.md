# Design

## Context

See `proposal.md` for motivation and the two delta specifications for observable guarantees. The prerequisite `introduce-node-cli` replaces the Python normal workflow with an installed Node.js/TypeScript engine, establishes `rendererContract: 1`, and supplies the shared manifest reader and plan/apply boundary. This stage extends that boundary rather than building another renderer or command framework.

The current Node implementation resolves configured Git inputs, plans complete output bytes, preserves unselected outputs, and applies document writes sequentially. This future reliability stage strengthens that existing boundary with immutable input locks, managed ownership, and recovery; it does not restore retired commands or a second generator.

Content stage 0 `simplify-shared-conventions` precedes the runtime stage. Preserve its two-source shared catalog and historical repository-local fixtures. Use accepted candidate neutral/local fixtures; there is no historical consumer to migrate and no real existing-consumer validation prerequisite. Read the permanent catalog spec and final-export boundary alongside runtime contracts. The current repository remains the development home until first-public-version readiness and later handoff authorization.

The public manifest has one format: required `schemaVersion: 1`, directory-discovered local families, optional pinned Git base, and explicit remote-only entries. The former private explicit-local format and development schema v2 are unsupported; historical fixtures remain provenance and are adapted explicitly in tests rather than accepted by the runtime. JSON envelopes, base-role markers, locks, and ownership records have independent format versions.

## Goals / Non-Goals

**Goals:**
- Give every applied composition a stable content identity and an inspectable source-to-output mapping.
- Make updates, removals, and interrupted operations understandable without silently replacing local work.
- Reuse the installed-package test and CI entry points introduced in stage 1.

**Non-Goals:**
- No generic skill installation, package registry, new agent adapters, or changes to official OpenSpec-generated skills.
- No npm publication or semantic release automation; stage 3 owns those workflows.
- No product/package rename: `modernize-release-workflow` later establishes `agents-cli`, `@devel-solid/agents-cli`, and the future `devel-solid/agents-cli` public repository before release-candidate packing. Reliability is implemented and accepted under the current development identity; the `agents` executable and manifest/lock/ownership/cache/skill identifiers remain unchanged by that later branding change.
- No automatic CLI upgrade, daemon, shared service, database, or instantaneous filesystem-wide atomicity.

## Decisions

### 1. Separate three kinds of state

| Artifact | Contents | Lifetime and Git policy |
|---|---|---|
| `agents-lock.json` | Format version, sanitized repository identity, requested ref, resolved commit, remote root/selection, selected source digests, `rendererContract`, informational `engineVersion` | Durable; commit with the consumer |
| `.agents/agents-state.json` | Format version, deterministic generation identity, managed document paths, normalized generated hashes, source provenance | Durable; commit with generated documents |
| `.cache/agents/` runtime records | Verified content checkout, exclusive lock ownership, transaction journal, staged bytes and raw preimages | Ignored runtime data; never a required checked-in fixture or documentation dependency |

The lock fixes remote inputs; ownership proves which outputs may be changed. Combining them would make a local documentation edit look like a dependency update. Journals must not enter either durable file because machine identity, interrupted steps, and backups are transient.

At the eventual clean public export, do not copy this checkout's lock, ownership state, cache, or journals into the new Git root. Generate metadata against the newly published content identity during the authorized launch. Copying a development commit into public provenance would undermine the independent history boundary.

Use SHA-256 with an explicit `utf8-lf` text-normalization identifier for convention/template content and generated document comparisons. Preserve exact technical literals; reject invalid UTF-8. Transaction precondition and backup checks additionally retain raw-byte hashes so rollback cannot overwrite a concurrent edit. Generate the committed generation identity from canonical inputs and intended outputs; do not rewrite timestamps on unchanged runs.

The lock's remote selection covers `agents.repository`, `agents.ref`, `remote.tpl_dir`, remote parent entries, their discovered children, and the base template. Local source bytes and output locations belong to the generation/ownership state. Local authoring therefore does not require a dependency refresh; a changed remote selection does.

Alternative: store only a tag. Rejected because tags and branches can move. Alternative: use the cache itself as ownership history. Rejected because deleting a cache must not authorize arbitrary output replacement.

### 2. Keep composition, manifest selection, and tool installation distinct

The remote is the company's selected public or private content base, not necessarily our optional starter catalog. A CLI upgrade is an npm operation; a company base update is a Git-content operation; a project-local edit is an authored-source operation. The company needs no upstream tool-repository permissions. Base initialization/validation stay stage-1 authoring commands and do not create consumer lock or ownership state in a content-only base.

- agents sync: reuse the locked commit when configuration matches; initialize a missing remote lock or plan an explicitly changed manifest selection as part of the normal validated transaction.
- agents sync --frozen: require an existing matching lock; do not initialize or replace it.
- A manifest edit is the explicit content-update interface. Review with sync --dry-run, then apply with sync. To adopt a moved symbolic ref intentionally, pin its new immutable commit or a new version in the manifest.
- agents sync --offline: use only a compatible lock and verified local cache; reject unresolved new remote selections without network access.
- A pending transaction is reported by validate --debug and sync --dry-run. When its recorded rollback is safe, sync restores that state and stops; another invocation performs normal generation. Independent edits remain conflicts.

Retain one optional remote base. A manually changed repository/ref/remote selection is reviewed through sync preview and applied transactionally by sync; the plan shows sanitized previous and candidate identities. Failure preserves prior durable state and outputs without fallback to another base. Local-only v1 projects need no remote lock; their local sources/main template remain represented in ownership/provenance. Discovered local families are generation inputs, not remote lock selections.

The agents-update-docs skill stays the interface for validation/preview/generation/freshness from the existing manifest, without authoring sources or changing configuration. Agents-write-conventions retains content curation in both roles, and agents-update-version retains reviewed base releases. All three invoke the installed CLI only for their authorized mechanical stages. `sync` does not replace its adapter. An explicit `init` adapter refresh retains the stage-1 adoption and conflict rules; no new adapter-distribution system is introduced here.

Preserve the stage-1 JSON envelope `{schemaVersion: 1, command, ok, changes, diagnostics}` and exit codes: 0 success; 1 check/drift; 2 usage, validation, prerequisite, or conflict; 3 operational/recovery failure. A dry run with proposed changes succeeds with 0 unless it encounters a conflict or invalid input.

Alternative: refresh content and upgrade the executable on every sync. Rejected because it defeats reviewed dependency selection and mixes executable changes with documentation authoring.

### 3. Build one plan with verified provenance

```text
manifest + lock + local sources + verified remote content
                         |
                         v
              validate and render complete result
                         |
                         v
      compare outputs and prior ownership / exact expected content
                         |
                         v
    plan: create / update / remove / adopt / conflict / metadata
                 |                         |
                 v                         v
          preview / check            exclusive apply
```

Plans carry canonical paths, input identities, normalized desired hashes, and raw target preconditions. Reuse the stage-1 protections for case-insensitive collisions, symlink/junction containment, and reserved destinations; also protect the lock, ownership file, transaction storage, and installed integration from convention targets.

Preview and check never create or rewrite manifest, lock, ownership, adapter, or documents. Online content resolution may write only ignored verified cache; this distinction is documented in help and guides. An entirely absent lock or ownership file is reported as drift by `--check`; frozen mode reports a prerequisite failure for an absent lock. A pending journal is a blocking recovery diagnostic rather than ordinary drift.

Validate --debug reports output/source provenance, family, content commit, renderer, and ownership, including unmanaged files, without generating or repairing documents. Its offline mode performs no fetch. No standalone inspection command is added.

### 4. Establish ownership and clean conservatively

On first ownership initialization, render the currently selected composition with the installed engine. An existing target can be adopted only if its normalized contents match that result exactly. An absent target can be created. A differing target without trustworthy prior ownership is a conflict, even if it has the generated-file banner. This protects pre-existing files regardless of when a user first enables the tool; it does not imply a private-version migration feature.

Use synthetic future updates to test selection changes after ownership exists and unknown files before ownership. Remove only unchanged owned deselected outputs. No private artifact-contract/UUID migration or import of this repository's local profile is required. A missing selected source remains an explicit validation error.

After adoption, compare the current normalized content against the last generated hash before update or removal. Manifest deletion, child removal, or an output-directory move can remove only an unchanged owned target. Files outside the ownership set are retained; no broad directory sweep or implicit destructive `--force` behavior is added.

If a previously owned target is already missing, record the removal or recreate the desired target as appropriate; an unknown new file at that path must pass the existing conflict check. Preserve unrelated source files and Markdown under the same output root.

Alternative: trust the banner or delete every file in the output directory. Rejected because neither proves the tool owns the current bytes.

### 5. Apply with exclusive access and recoverable journaling

Acquire one atomic exclusive mutation lock for the canonical repository root before the final precondition check. Store owner identity, host, process start identity, and transaction identity so PID reuse is not sufficient to reclaim it. A competing writer fails with actionable contention diagnostics. Preview/check do not acquire a project mutation lock or repair stale ownership implicitly.

```text
acquire exclusive mutation access
  -> recheck sources, ownership and raw target preconditions
  -> persist staged desired files + raw preimages + journal
  -> atomically replace each file where supported
  -> commit manifest/lock/ownership as one completed generation
  -> mark transaction complete, then discard backups and release lock

failure before completion
  -> rollback known target states using recorded preimages
  -> if rollback cannot safely finish, retain journal/backups
  -> block normal mutation and report the recorded rollback through sync --dry-run
```

Use filesystem operations with argument-safe paths, same-filesystem replacement, supported synchronization/flush primitives, and explicit platform tests. Revalidate containment immediately before mutation. The ownership commit acts as the completed-generation marker; multi-file replacement still has an observable intermediate window, so do not promise database-style atomic visibility.

When recovery is pending, sync --dry-run reports the recorded rollback without writes. Sync obtains exclusive access, verifies each target still matches a recorded state, restores the pre-operation state, and stops before normal generation. Unexpected independent edits preserve evidence and produce a conflict. A separate subsequent sync can generate again. No recovery command root is added.

Cache repair must keep transaction storage separate from disposable content entries and must never recursively remove an active journal. If a user independently deletes required recovery data, the tool can diagnose the missing evidence but cannot guarantee automatic recovery.

Alternative: only write each file through a temporary sibling. Rejected as the complete solution because per-file atomic replacement does not recover a generation interrupted between files.

### 6. Bound Git operations and verify cache before use

Retain a project-local content cache, keyed by canonical repository and resolved commit rather than mutable ref text. Check repository identity, detached commit, allowed source containment, selected file inventory, and canonical digests before using cached sources. Online repair fetches the locked commit and verifies it; offline mode reports any missing or invalid evidence.

Use argument-array subprocesses, bounded configurable timeout and process termination, inherited Git credential helpers, and redacted stderr diagnostics. Do not put credentials in the durable lock, provenance output, or debug JSON. A transient network failure never triggers fallback to unverified content or a different commit.

Private company bases use those existing Git credentials and permissions; the CLI does not manage accounts or require public visibility. Permission failures name the inaccessible sanitized source and explain the Git access prerequisite. Cache entries for distinct company repositories remain distinct even when their tags and source filenames match. Provenance and offline verification never substitute a cached copy from another base.

An online read-only command may populate content cache, but it must not create a project journal or mutate a running transaction. Cache population needs its own isolated staging and collision handling so concurrent readers cannot consume a partially populated entry.

## Risks / Trade-offs

The post-launch fifth `publish-english-product-experience` change uses the first public package and pinned sources as compatibility fixtures. Its default-language transition must preserve our lock/ownership formats and independently authored company content, expose intended generated-byte changes through this shared plan, and retain edited-output conflicts and no-change repetition. This stage does not implement translation or require that future English work before the first launch; initial human prose remains Portuguese.

- More metadata to commit -> Keep lock and ownership formats small, deterministic, versioned, and explained separately in the guides.
- A pre-existing target differs before ownership initialization -> Report the exact target/source conflict and require source-level reconciliation; preserve all local bytes.
- Crash or filesystem failure during multiple replacements -> Use durable preimages/journal and explicit recovery, with failure injection on every transaction boundary.
- Windows replacement, read-only packs, junctions, and antivirus interference -> Exercise the installed package on Windows and retain the current cache-recovery regressions in portable form.
- Lock drift or a remote commit no longer available -> Fail with an explicit update/restore diagnosis; verified cached content remains usable offline.
- Machine-specific stale-lock uncertainty -> Verify owner identity and transaction state; preserve ambiguous cases for manual reconciliation.

## Migration Plan

1. Confirm accepted and archived content stage 0 and runtime stage 1, including their separate source-candidate and installed-package gates, before starting this change.
2. Add lock/ownership schemas and deterministic planning without changing existing convention content or generating new generic skill packages.
3. Exercise accepted neutral/local candidate profiles and configured disposable projects, then initialize metadata only after ownership checks. Test later selection changes and removal against owned and unowned files without depending on a historical catalog or a real external project.
4. Enable explicit update, verified offline operation, journaled mutation and recovery, then validate fresh and already-generated disposable projects using the installed tarball.
   Include a stage-1-initialized custom company base and two consumers with distinct selections/local contexts; publish fixture content updates without an npm release, change one consumer explicitly, and verify the other remains pinned. Cover same-ref distinct repositories, base-switch failure, access denial, and absence of requests to the optional tool catalog.
5. Keep a reviewed baseline of manifest, lock, ownership, and generated files together. Roll back code with a matching previously reviewed metadata/document set; recover any pending transaction before changing tool versions. Never delete evidence to make a failed recovery appear clean.
6. Present gate evidence to the user; synchronize the new specs and archive this change through the public workflow before starting `modernize-release-workflow`. Actual repository creation/export and npm publication remain later authorized launch operations, only after the first public version is ready.

No unresolved product decision blocks this stage. Exact stable dependency versions and platform timeout defaults are implementation details to select and record under the repository's dependency policy; they must not change the contracts above.
