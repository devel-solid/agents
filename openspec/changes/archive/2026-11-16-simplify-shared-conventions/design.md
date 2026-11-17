# Design

## Context

See `proposal.md` for the content boundary and sequence. The current root manifest selects local context/authorship rules and shared policies. The Python generator resolves the base template from the published checkout identified by `agents.repository/ref`, even in this repository; editing its working-tree copy cannot change the live root instruction. General stale-output ownership is not available yet.

The separate UUID source and manifest entry have already been removed in the working tree. This change incorporates that decision without restoring UUID as a local default. All other currently active local behavior must survive the catalog reduction.

There are no external consumers. This checkout remains the development home through all four gates. The new real repository is created only when the first public version is ready and a later handoff is authorized; development validation does not require public migration, a new repository, or imported history.

## Goals / Non-Goals

**Goals:** two compact shared sources, a neutral base, preserved local rules, a reviewed export boundary, and an independently testable content baseline for the Node port.

**Non-Goals:** runtime migration, new manifest fields, multilingual rendering, changed local autonomy or approval rules, revised local commit/testing/dependency policies, logging fixes, license selection, generic skill sharing, legacy consumer rollout, repository migration, or real publication. The earlier diagnostic did not authorize implementing every finding in this content stage.

## Decisions

### 1. Keep two shared entry points without limiting the engine

Retain the existing security and composition filenames to minimize changed references. No shared child source remains. The two-source catalog is an authoring/distribution boundary for our optional starter only; company-owned remote bases may contain arbitrary valid conventions and families. Configurable source roots, arbitrary selected local conventions, nested paths, and parent/child composition remain supported.

The npm product is the reusable CLI and its required assets. A company keeps shared instructions in its own public or private Git repository, versions that content independently, and grants its developers access there. It does not need write access to our repository, a fork of our engine, or its own npm package. This stage prepares the minimal template and two neutral starter conventions; stage 1 adds `agents init --base`, an empty default base scaffold, optional `--starter minimal` copies, and base validation. No command implementation belongs here.

The security document covers secrets and instruction trust without duplicating a particular host's full policy hierarchy. The composition document unifies editable-source/generated-output roles, manifest selection, one H1/card per source, family naming/discovery, and the authorized synchronization entry point. It does not describe this repository's release sequence.

Move the detailed manifest tables, source-format explanations, and family examples from the retired artifact-contract family into the tool repository's `docs/guides/contratos-de-composicao.md`. Identify the applicable tool documentation/version explicitly; neither a company base nor its consumers must copy this guide. In this stage our own base can link its matching source checkout; stage 1 packages the version-matched reference and adjusts starter links for independent bases. Retain exact technical contracts and existing renderer compatibility. Guide prose follows this repository's local language policy.

Alternative: keep all policies as optional shared files. Rejected for this first version because it retains the same catalog and maintenance burden. Alternative: delete the artifact reference with its convention files. Rejected because consumers still need the unchanged public contracts.

### 2. Extract preferences before reducing the base

Add `templates/docs/conventions-local/politica-operacional-do-repositorio.tpl.md` for the communication, language/gender, public-skill use, and scope/autonomy rules currently in the base. Its discovery card applies before work in this repository. Keep the current local context first in discovery and select the new policy explicitly near the beginning of the manifest.

The shared base contains only context/applicable-instruction discovery, selected convention discovery, edits through sources and public generation, project-defined validation with reported limitations, and clear communication. Keep the existing discovery heading and generator-compatible structure; changing localization markers is a separate engine concern. Writing the shared documents in pt-BR does not make pt-BR a mandatory consumer language policy.

Alternative: remove preferences from every project immediately. Rejected because the user explicitly requires preserving this repository's rules. Alternative: retain preferences in the shared template but omit their explanatory conventions. Rejected because the default behavior would remain coupled.

### 3. Move the existing specialized families into the local profile

Use the existing local source root and `origin: local`; no new profile/configuration mechanism is introduced. Move these families, including their existing children, with preserved basenames and normative meaning:

| Family | Local policy preserved |
| --- | --- |
| `python-no-host-para-artefatos-estruturados` | Host tooling preferences |
| `padrao-de-mensagem-de-commit` | Commit text, grouping, and approval |
| `idiomas-pt-br-e-en-us-e-buscas-textuais` and four children | pt-BR/en-US, OpenSpec, UTF-8, and searches |
| `apresentacao-visual-de-artefatos-tecnicos` | Technical-document presentation |
| `testes-minimos-e-lefthook` | Focused tests and local pre-push gate |
| `atualizacao-segura-e-auditavel-de-dependencias-e-plataformas` | Supported versions, maturity, and evidence |
| `arquivos-temporarios` | Existing temporary-file policy |
| `convencoes-para-skills` and its child | Paths, checkpoints, and semantic decisions |

Keep `contexto-do-projeto` and `autoria-e-publicacao-de-conventions` local. Preserve `openspec/config.yaml`, authored skill workflows, generated OpenSpec skills, package tooling and hooks. Adjust only necessary location/discovery/reference text; do not use relocation to apply previously suggested local-policy changes. The root may select more than two local conventions; only its two remote catalog entries are globally reusable defaults.

UUID is the explicit exception: its approved deletion remains final, with no hidden local copy. Local relocation preserves published basenames for the other policy families, reducing stale-path changes. Starter-consumer examples explicitly select our two sources and the consumer's own context, never this repository's policy set. Company-base examples select that company's sources; the engine does not assume our filenames exist in every base.

### 4. Separate development artifacts from the first public snapshot

There are no consumers to migrate and no supported public v3/v4 catalog. Keep the current manifest/source model because it is useful, not as a historical compatibility promise. Unknown or missing sources still fail visibly as normal validation; do not add old-source aliases, migration commands, or a historical consumer rollout.

The old artifact-contract parent and three children plus UUID are five known obsolete generated paths in the current development layout. Record them as exclusions for the later reviewed export. Preserve the current checkout and independent edits; do not depend on ownership adoption of these files or copy them into the new repository merely to delete them later. Keep the detailed artifact reference in its new guide.

The future handoff uses an approved file inventory and generates final documents from accepted sources. It initializes a fresh Git repository rather than copying `.git`, pushing a mirror, or importing branches/tags. Private development history and pending work stay in a verified private backup. This stage only prepares the source boundary; it performs none of those handoff operations.

### 5. Validate the authored candidate without a release dependency

Use the existing Python test harness with disposable local Git sources and consumer directories. Capture the candidate source identity and deterministic file inventory from the authored content, and generate through the existing composition implementation in the test fixture. This is test staging, not a new production root mode, a fake public tag, an edit to the real cache, or a dependency on stage 3 preflight.

Validate two profiles:

```text
candidate shared base + consumer-owned local context
  -> two shared conventions + neutral AGENTS.md
  -> no agents-specific policy import

same candidate + agents repository local profile
  -> two shared conventions + explicitly selected local policies
  -> policy-preservation mapping + complete discovery
```

Also validate one arbitrary local parent/child family, repeated no-change generation, missing retired-source diagnostics, and preservation of unrelated files. Update the existing tooling test that assumes Lefthook's policy lives in the remote root; preserve its meaningful setup/hook checks. Keep a durable fixture/report with source provenance and actual validation results, not a dependency on ignored `.tmp` reports.

The stage gate covers authored sources and disposable rendered results. Root `AGENTS.md`, published documents, and `agents.ref` may still describe the prior development pin; state that explicitly. No commit, tag, push, engine change, or public release is necessary for this gate. Final public documents come from the later approved export and fresh generation, not migration of obsolete development outputs. Source tests do not complete that pending launch work.

### 6. Rebase successor plans without merging their scopes

| Successor | Required reconciliation |
| --- | --- |
| `introduce-node-cli` | Require accepted stage 0; port meaningful behavior using candidate fixtures; omit legacy integration migration; use local policies/reference paths and neutral initialization. |
| `harden-instruction-sync` | Exercise neutral/local disposable profiles and future update/removal scenarios; preserve provenance and unknown files without requiring a real existing consumer. |
| `modernize-release-workflow` | Finish and rehearse here; only after readiness and separate authorization, back up development state, export approved files, create a new Git root, and publish initial versions without old tags/history. |

The initial CLI's help and this project's documentation remain pt-BR under the policy effective through first publication. `publish-english-product-experience` then owns translation, English discovery compatibility, and the authored artifact-language policy update as a separate fifth change; it starts only after the actual first public launch. This does not prescribe consumer content language or change pt-BR chat preferences. Existing JSON, platform, lock, recovery, release-confirmation, and publication contracts remain in their original stages.

## Risks / Trade-offs

- Local preservation retains a larger policy set in this repository -> report global and local inventories separately; do not claim its root instruction contains only two entries.
- Obsolete development artifacts could enter the public snapshot -> use a reviewed file inventory and fresh generation rather than exporting the old repository.
- Root documents still use an old pin -> distinguish staged candidate proof from published root state and carry the materialization boundary into successor release work.
- Relocation can hide a policy or break child discovery -> compare normative-policy coverage and render both profiles with structural discovery checks.
- The new Git root has no preceding release -> keep private validation evidence separate and make initial publication independent of this checkout's tags or ancestors.

## Migration Plan

1. Inventory active policy sources and the pending UUID deletion; record the mapping to shared, local, reference-only, and excluded development artifacts.
2. Move local families and extract base preferences, then simplify the two shared documents and base source. Update only relevant manifest entries, guides, and focused tests.
3. Generate disposable neutral/local profiles, record candidate identity and policy-preservation and export-exclusion results, and present the source and staged-output diff for user acceptance. Stop without committing or publishing.
4. After acceptance, synchronize the capability spec and archive through the public OpenSpec workflow before stage 1. Carry the candidate snapshot and export boundary into later fixtures without treating private releases as a public support matrix.
5. Only after first-public-version readiness, a later authorized handoff backs up development state, exports approved final files without Git metadata, creates a new repository and root commit, and publishes initial versions. No repository is created or migrated now. An unaccepted source change is rolled back in the current development checkout.
