# Spec Delta

## Purpose

Make a consumer's selected shared instructions reproducible and inspectable across machines, repeated runs, and unavailable networks without coupling content updates to executable CLI updates.

## ADDED Requirements

### Requirement: The content lock identifies immutable inputs

The CLI SHALL maintain a versioned `agents-lock.json` containing the repository, requested reference, resolved commit, remote selection, remote source integrity, renderer contract, and producing CLI version. The producing CLI version SHALL be informational; synchronization MUST NOT install or execute a different engine from the content repository.

#### Scenario: First synchronization establishes a lock
- **WHEN** a valid consumer without a lock runs a successful normal synchronization
- **THEN** the CLI resolves the selected reference to a commit and records the remote inputs used by the generation
- **AND** publishes the lock with the generated documents and ownership state

#### Scenario: The selected base belongs to a company
- **WHEN** a consumer synchronizes a valid independent company-owned base
- **THEN** the lock and source provenance identify that repository and commit rather than our optional starter
- **AND** neither the base nor its instructions need publication on npm

#### Scenario: Public launch initializes independent provenance
- **WHEN** the authorized launch generates state against the new repository's first content tag
- **THEN** the lock records the new resolved commit and repository identity
- **AND** development lockfiles, ownership records, and old commit identities are not copied into that state

#### Scenario: A different installed CLI supports the renderer contract
- **WHEN** the installed CLI differs from the producing version but supports the locked renderer contract
- **THEN** the CLI uses its installed implementation without downloading or executing another engine
- **AND** an unsupported renderer contract fails before changing project state

### Requirement: Ordinary synchronization preserves locked content

With matching configuration, sync SHALL preserve the locked commit and integrity despite moved tags or branches. An explicitly changed repository, ref, source root, or remote selection SHALL be reviewed in sync preview and validated as a candidate before transactional application.

#### Scenario: A remote tag moves after the consumer is locked
- **WHEN** the consumer synchronizes using an existing lock whose remote tag now points elsewhere
- **THEN** the generation still uses the locked commit if its content remains available and verifiable
- **AND** the CLI does not replace the lock with the new tag target

#### Scenario: A user changes agents.ref manually
- **WHEN** `agents.ref` no longer matches the existing lock
- **THEN** synchronization preview shows the candidate identity and normal sync validates it before transactional adoption
- **AND** generated documents and durable metadata remain unchanged

### Requirement: Content updates are explicit and previewable

After explicit manifest selection edits, sync SHALL validate the candidate and apply lock, documents, and ownership together. Dry-run SHALL disclose changed content identity and paths without applying them. An unchanged locked symbolic ref SHALL not be refreshed implicitly; intentional adoption SHALL pin a new commit or version in the manifest.

#### Scenario: Previewing a new content version
- **WHEN** a consumer edits its pinned ref and runs sync --dry-run
- **THEN** the CLI reports the proposed commit and affected files without changing manifest, lock, ownership state, adapter, or documents
- **AND** the preview identifies removals and local conflicts

#### Scenario: A proposed update has an invalid convention
- **WHEN** the selected new content cannot form a valid composition
- **THEN** the update fails before changing project state
- **AND** the previous lock and documents remain usable

#### Scenario: Projects adopt company updates independently
- **WHEN** a company publishes a new Git content version and only one of two consumers explicitly updates
- **THEN** that consumer adopts the new selected content while the other retains its locked commit
- **AND** neither update requires publishing or upgrading the CLI

#### Scenario: A project switches company bases explicitly
- **WHEN** the manifest names a different repository and the user previews an explicit content update
- **THEN** the plan reports the old and candidate repository identities and all affected managed paths
- **AND** an inaccessible or invalid candidate leaves the existing lock, documents, and ownership unchanged without substituting our base

### Requirement: Verified offline synchronization does not use the network

`agents sync --offline` SHALL use only locked, locally available content whose integrity matches the lock and SHALL perform no remote lookup. Missing or invalid required content SHALL produce an actionable error without replacing durable state or publishing documents.

#### Scenario: Repeating a verified offline composition
- **WHEN** all locked remote inputs are cached and pass integrity verification
- **THEN** offline synchronization can regenerate documents after an authorized local source change
- **AND** it produces the same result as online synchronization with those inputs

#### Scenario: Offline cache is missing or altered
- **WHEN** a required cached input is missing or its content differs from the lock
- **THEN** offline synchronization fails with a diagnostic identifying the unavailable verified input
- **AND** no network call or document update occurs

### Requirement: Cache recovery preserves content integrity

The CLI SHALL verify cached remote inputs before use, including their repository identity, resolved commit, containment, and recorded content integrity. Online cache repair SHALL recover the locked content rather than refresh the requested reference. Cache cleanup MUST NOT discard active transaction recovery data.

#### Scenario: A cached template is edited
- **WHEN** an online synchronization finds a changed cached template
- **THEN** it repairs or recreates the cache using the locked commit and verifies its contents before generation
- **AND** it does not accept the edited bytes as a new expected hash

#### Scenario: Recovery data is still needed
- **WHEN** a content cache is repaired while a document transaction is incomplete
- **THEN** cache handling retains the transaction journal and backups
- **AND** ordinary mutation remains blocked until recovery is resolved

#### Scenario: Two bases use the same ref and filenames
- **WHEN** verified content from one company repository is cached and another repository is selected
- **THEN** the cache cannot reuse the first base as the second base's identity or integrity evidence

### Requirement: Strict checks do not initialize durable state

`agents sync --check` and `--dry-run` SHALL leave manifest, lock, adapter, documents, and ownership state unchanged. A check with a missing lock or ownership state SHALL report drift using exit code 1. `--frozen` SHALL reject a missing or mismatched lock instead of initializing or refreshing it. Online previews MAY populate ignored content cache.

#### Scenario: A fresh project is checked before state initialization
- **WHEN** a valid consumer without lock or ownership metadata runs `agents sync --check`
- **THEN** the CLI reports the metadata that a normal synchronization would create and exits with code 1
- **AND** does not create that metadata or alter its documents

#### Scenario: A frozen consumer changes its remote selection
- **WHEN** a consumer runs `agents sync --frozen` with a selection that differs from the lock
- **THEN** the CLI reports a validation failure without changing the lock or applying documents

### Requirement: Provenance is available without generation

Validate --debug SHALL report generated-output provenance: source paths and origin, family, manifest selection, base template, commit, renderer, integrity, and ownership. Unknown targets SHALL be identified as unmanaged. Inspection SHALL not update files or content selection.

#### Scenario: Explaining a generated child convention
- **WHEN** a consumer inspects a published child convention
- **THEN** the CLI reports its parent family, exact source, selected repository commit, and current ownership status
- **AND** does not regenerate the document

#### Scenario: Explaining local context
- **WHEN** a generated document comes from a local convention source
- **THEN** the CLI identifies the local source and recorded local input hash
- **AND** does not claim that its content comes from the remote repository

#### Scenario: A repository-local operational policy is inspected
- **WHEN** a generated policy was selected locally after catalog simplification
- **THEN** provenance identifies its local source and input hash without presenting it as a shared default
- **AND** inspecting or synchronizing a neutral consumer does not import that policy

### Requirement: Operational diagnostics are bounded and actionable

The CLI SHALL use bounded configurable timeouts for Git operations, redact credentials from diagnostics, and distinguish validation, conflict, timeout, and recovery failures through the stage-1 exit codes and JSON envelope. Validate SHALL inspect lock compatibility, cache integrity, output drift, ownership, and pending transactions without repairing them implicitly.

#### Scenario: A Git operation exceeds its timeout
- **WHEN** a content operation does not complete within the configured timeout
- **THEN** the CLI terminates the operation and reports an operational failure with remediation
- **AND** does not include credentials or publish partially computed outputs

#### Scenario: Diagnosing a pending transaction offline
- **WHEN** a consumer runs validate --debug --offline --json after an interrupted update
- **THEN** the CLI reports the pending recovery, verified local evidence, and the required next command using the established JSON envelope
- **AND** performs no network request or project repair

#### Scenario: Access to a private base is denied
- **WHEN** the caller's existing Git access cannot read the selected private base
- **THEN** the CLI reports a redacted actionable access failure without changing project state
- **AND** it neither requests public visibility nor falls back to another instruction base
