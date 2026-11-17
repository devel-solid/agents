# Content-stage validation

## Scope and publication boundary

This report covers only `simplify-shared-conventions`. The user accepted the implementation on 2026-11-16 and explicitly requested specification synchronization and archival. The existing development checkout remains the source of implementation work; no real repository migration, commit, tag, push, or npm publication is part of this gate.

The real manifest still selects `https://github.com/devel-solid/agents.git` at `v4.0.1`. Root `AGENTS.md` and `docs/conventions/` remain unchanged development outputs. Candidate generation uses disposable local Git sources and consumers; successful candidate rendering does not mean the root has published these sources.

The pre-existing UUID source deletion and manifest-entry removal are preserved. The other four proposed changes remain unimplemented.

## Authored result

| Area | Candidate result |
| --- | --- |
| Shared base | Operational context/instruction discovery, source-based authoring, authorized generation, project-defined checks, and clear reporting |
| Shared catalog | Exactly two parent sources: security/content trust and composition; no shared children |
| Local profile | Eight specialized families and their children retain their content and published basenames; existing context/authorship remain local |
| Extracted preferences | All 21 communication, language/gender, skill-interface, and scope/autonomy bullets remain in the explicitly selected local operational policy |
| Artifact reference | Detailed manifest, source/card, literal-classification, and family contracts move to the tool's version-matched composition guide |
| Runtime | Existing Python engine, integrations, dependencies, setup, and hooks remain unchanged |

## Successor reconciliation

The three successor plans already agree with this implemented boundary. Reconciliation requires no edits to their planning artifacts and does not authorize their implementation.

| Plan | Verified prerequisite and content paths | Candidate/export boundary |
| --- | --- | --- |
| `introduce-node-cli` | Proposal sequence gate; design decisions 7–8; tasks 1.1, 2.5, 4.4, and 5.3 require accepted/archived stage 0, local policy sources, and `docs/guides/contratos-de-composicao.md` | Accepted neutral/local fixtures feed the installed-package gate; the company base is content-only; real export/publication remains later |
| `harden-instruction-sync` | Proposal sequence gate; design context and migration plan; task 1.1 require accepted/archived content and runtime stages | Neutral/local candidates and synthetic future updates verify provenance, preservation, and recovery without historical consumer migration; development metadata stays outside the later export |
| `modernize-release-workflow` | Proposal and `release-publication` requirements; tasks 1.1, 3.1–3.3, and 4.1 require all accepted predecessors | Rehearsal remains disposable; real backup, approved file export, fresh Git root, and publication wait for product readiness and separate authorization |

The fifth `publish-english-product-experience` plan remains untouched and starts only after actual first public launch. Portuguese product prose and the existing local artifact-language rules remain effective in this stage.

## Export exclusions

These five existing generated development files remain intact here and are excluded from the later reviewed public snapshot:

- `docs/conventions/contratos-de-artefatos-para-repositorios-consumidores.md`
- `docs/conventions/contratos-de-artefatos-para-repositorios-consumidores.agents-compose.md`
- `docs/conventions/contratos-de-artefatos-para-repositorios-consumidores.arquivos-fonte.md`
- `docs/conventions/contratos-de-artefatos-para-repositorios-consumidores.relacao-pai-filha.md`
- `docs/conventions/uuid-em-novas-implementacoes.md`

This is an inventory for later positive file selection, not a deletion instruction or an ownership migration.

## Verification results

| Check | Actual result |
| --- | --- |
| Candidate catalog, profile, preservation, retirement, custom-family, and idempotence gates | Six tests passed; neutral profile has four outputs and local profile has nineteen |
| Existing composition and tooling checks | Eighteen composition tests and four tooling tests passed |
| `python -B -m unittest discover -s tests -v` | All 61 tests passed outside the sandbox in 24.732 seconds, exit code 0 |
| `openspec validate simplify-shared-conventions --strict` | Passed |
| `git diff --check` | Passed |
| Session preservation | All 40 baseline-protected files, root pin, HEAD, tag object IDs, and remotes unchanged; all five excluded development outputs still present |
| Successor preservation | All 23 files in the other four proposals retain their pre-implementation SHA-256 hashes |
| Independent review | A separate read-only reviewer found no material issues in sources, manifest, guides, tests, fixtures, or scope boundaries |

The first sandboxed full-suite run had twelve failures and one error because Git's `sh.exe` could not create an MSYS object (`NtCreateDirectoryObject`, `0xC0000022`) during disposable local clone/push operations. The approved rerun outside that restriction passed without changing the engine or weakening tests.

Candidate SHA-256: `874db2ba0b7588c16ee5d8d675e7c7ca3718a6f97fc8adba60cf1c082fbb8604`. The deterministic identity covers 22 manifest/template/engine/reference inputs. The fixture records the prior source inventory, 483 source rule/table lines and 28 base rule lines with destinations, and the 21 extracted preference bullets.

## Reviewable evidence

- [Authored diff](authored.diff): sources, manifest, README, guides, and focused test code, including new untracked authored files. Its baseline incorporates the user's pre-existing UUID source/manifest removal, so that removal is not credited to this implementation.
- [Candidate inventory and expected output hashes](../../../../tests/fixtures/shared_instruction_catalog/candidate.json).
- [Policy inventory and export exclusions](../../../../tests/fixtures/shared_instruction_catalog/baseline.json).
- [Neutral generated diff](../../../../tests/fixtures/shared_instruction_catalog/neutral-generated.diff) and [local generated diff](../../../../tests/fixtures/shared_instruction_catalog/local-generated.diff).
- [Neutral candidate instruction](../../../../tests/fixtures/shared_instruction_catalog/neutral-AGENTS.md) and [local candidate instruction](../../../../tests/fixtures/shared_instruction_catalog/local-AGENTS.md).
- [Fixture reproduction](../../../../tests/fixtures/shared_instruction_catalog/README.md) and [actual test results](../../../../tests/fixtures/shared_instruction_catalog/validation-results.json).

The generated diffs compare disposable desired outputs with preserved development documents. Deletions shown there express exclusion from a fresh candidate profile; they did not delete root files or stage anything in the real Git index.

## Limitations and workflow completion

The candidate harness intentionally uses the existing in-process renderer and staged disposable Git directories. Its source identity is the recorded SHA-256 inventory, not a claimed public Git commit/tag. It does not prove that the old root pin contains the new content. Existing bootstrap/release regressions passed separately in the full suite. Cross-platform CI, installed Node-package behavior, immutable source locks, transactional updates, and public launch remain in their respective later stages.

`openspec validate simplify-shared-conventions --strict` passed during implementation. The host provides Python 3.14.4 and Git 2.56.1.windows.1. The Windows `python3` alias is inaccessible and Make is unavailable; use `python -B -m unittest discover -s tests -v`, the same unittest entry point selected by `make tests`. No dependency installation or setup mutation is needed for this content gate.

The implementation is accepted. The approved delta was synchronized into `openspec/specs/shared-instruction-catalog/spec.md`, preserving its Purpose, nine requirements, and thirteen scenarios, and passed strict spec validation. The change was archived at `openspec/changes/archive/2026-11-16-simplify-shared-conventions/` with all twelve tasks complete. Root materialization/publication remains pending. No successor implementation, commit, or external publication was performed by this follow-up.
