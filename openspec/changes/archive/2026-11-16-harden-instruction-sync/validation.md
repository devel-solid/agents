# Implementation acceptance

## Final authorized scope

The user required unit tests only, removed the new non-unit suites and temporary validation data, and explicitly requested specification synchronization and archival. This decision supersedes the original installed-package and Windows/Linux matrix gate; it does not weaken the runtime requirements. The revised tasks distinguish delivered implementation and review from platform certification.

## Delivered implementation

- Immutable remote locks, normalized SHA-256 integrity, verified cache, explicit selection adoption, offline and frozen modes.
- Deterministic ownership/provenance, exact initial adoption, edited-output conflicts and removal of only unchanged owned outputs.
- Exclusive journaled transactions, raw preimages, physical target identities, resumable recovery/cleanup and preservation of independent edits.
- Bounded Git supervision, process-tree termination, cancellation, credential redaction and structured diagnostics.
- Portuguese help/guides, aligned standalone presentation and unchanged four-command/schemaVersion 1 manifest contracts.
- A runner restricted to tests/unit/; npm test compiles TypeScript and runs those units. npm run check adds types and formatting. CI uses one Ubuntu/Node.js 24 job without a matrix. Existing Lefthook configuration remains; the final gate did not invoke it.

## Actual final verification

| Command or review | Actual result |
| --- | --- |
| npm run check, Windows / Node.js 24.15.0 | Exit 0; typecheck, formatting, compilation and all 5 unit tests passed; unit duration 417.3954 ms |
| Independent implementation review | Completed in this chat; no material findings remained after the reported corrections |
| openspec validate --specs --strict | Exit 0; all 8 permanent specs passed, including both synchronized capabilities |
| openspec validate harden-instruction-sync --strict | Passed |
| Synchronized-main-spec comparison | Both new main specs exactly preserve their delta Purpose and requirement/scenario bodies, with canonical main-spec headings |
| Apply progress and git diff --check | all_done, 30/30 revised tasks; diff check passed |

Retained unit coverage includes canonical JSON and undefined handling, normalized/raw hashes and invalid UTF-8, malformed/incompatible locks, deterministic ownership serialization and credential redaction. These are unit contracts, not full CLI or operating-system certification.

The independent review reproduced and verified corrections for retargeted recovery junctions, stale manifest inputs, explicit local origins, ignored runtime storage, recovery diagnostic precedence, source-inventory containment, conflict-preserving preview and offline guide distribution. The review's temporary reproductions were removed at the user's request.

## Historical evidence and limitations

Earlier exploratory focused runs exercised actual Git resolution, installed-package journeys and transaction failures. A preliminary full run had 101/107 passing tests and six failures before the final corrections. Later full/platform runs were interrupted, and the newly authored non-unit tests, matrix scripts, downloaded matrix runtimes, temporary projects and logs were deleted as requested. None of those interrupted runs is a passing final gate. No final Windows/Linux matrix or installed-package certification is claimed.

Windows uses flushed files and per-file rename without directory fsync; there is no power-loss or instantaneous multi-file visibility guarantee. Unknown process ownership and independently removed recovery evidence remain conservative recovery errors.

Historical accepted fixtures and pre-existing tests remain preserved outside the default runner. The current root stays a content base, with no consumer sync or manifest. This operation performs no commit, tag, push, publication, repository export, product rename or successor implementation.
