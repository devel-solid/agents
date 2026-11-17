# Proposal

## Why

The shared catalog currently mixes the tool's composition contract with this repository's language, workflow, and technology preferences. Establish a neutral base before the runtime port. There are no external consumers: all four stages are developed and validated here, and only the finished first public version is later exported to a new repository with an independent Git history.

## What Changes

- Introduce a prerequisite content stage, `simplify-shared-conventions`, before the three existing modernization stages. Validate and obtain user acceptance for each stage independently.
- Keep exactly two shared convention sources: `seguranca-para-agentes-e-conteudo-nao-confiavel.tpl.md` and `composicao-de-instrucoes-para-repositorios-consumidores.tpl.md`. Shorten the former and merge the essential composition, authorship, manifest, and discovery guidance into the latter.
- Treat that catalog as this tool's optional starter content. The public npm product is the CLI; each company owns its shared instruction base in a separate public or private Git repository, with its own template, conventions, versions, and access controls. The two-source limit does not apply to company bases.
- Reduce `templates/AGENTS.tpl.md` to project-context discovery, applicable instructions, source-versus-output handling, project-defined validation, and clear reporting. Remove mandatory language, gender, technology, commit, and detailed autonomy preferences from the shared template.
- Preserve this repository's active policies in its local source root and manifest, including the preferences extracted from the base template. Preserve the existing local context and authorship/publication rules. Keep the separately approved UUID removal; do not recreate that policy locally.
- Define the initial public catalog without the eight specialized policy families or separate artifact-contract family. Preserve specialized policies locally and move public artifact details to a reference guide. No consumer rollout, old-catalog migration, or compatibility with previous private releases is required.
- Keep the current manifest format, parent/child support, discovery markers, generation notices, Python workflow, and Git pin semantics. Validate the authored candidate in disposable consumers without requiring Node modernization or external publication.
- Record which development-only generated artifacts must stay outside the eventual public snapshot; preserve the current repository and its pending work. Do not edit generated documents manually or create, rename, archive, delete, or migrate a repository in this stage.
- Reconcile the three successor proposals with the no-consumer baseline, local-policy separation, sequential gates, and final-only clean export. Previous implementation fixtures are optional internal regression evidence, not a public compatibility obligation.
- Prepare neutral content for optional packaged starter assets in stage 1; do not introduce the base-initialization command in this content-only stage. A company base does not need a fork, npm package, tool scripts, or this repository's local maintenance profile.

## Capabilities

### New Capabilities

- `shared-instruction-catalog`: A minimal shared instruction base, an exact two-convention catalog, separation of repository-local policies, and initial-public-snapshot validation boundaries.

### Modified Capabilities

None. The existing manifest, family structure, generated-document, bootstrap, and pinned-checkout requirements remain valid. This change establishes which content is shared, rather than changing the rendering or installation contracts.

## Impact

- Affects `templates/AGENTS.tpl.md`, shared and local convention sources, `agents-compose.yml`, reference/integration/maintenance guides, and focused composition/tooling tests. No production engine change or new dependency is needed.
- Existing policy families move to `templates/docs/conventions-local/` with local manifest entries and preserved child discovery. A new local operational-policy source preserves the preferences removed from the shared base.
- Detailed artifact reference material moves to `docs/guides/contratos-de-composicao.md` in the tool repository. Reference its applicable version explicitly; do not assume a company base or consumer checkout contains that guide. Stage 1 packages the matching engine reference for offline use.
- The working tree already contains the authorized UUID source deletion and manifest-entry removal. Include them as existing partial work, not completed evidence for the rest of this change.
- Actual root `AGENTS.md` uses the pinned published base, not the edited working-tree base template. Candidate generation must be demonstrated separately. Final sources and freshly generated outputs are assembled only at the later authorized clean-export/publication handoff; old generated artifacts need not be migrated to a public consumer.

## Sequence and acceptance

```text
simplify-shared-conventions (content stage 0)
  -> candidate generation + local-policy preservation + user acceptance + archive
introduce-node-cli (runtime stage 1)
  -> installed-package validation + user acceptance + archive
harden-instruction-sync (reliability stage 2)
  -> integrity/recovery validation + user acceptance + archive
modernize-release-workflow (publication stage 3)
  -> release rehearsal + user acceptance
  -> first public version ready
  -> separately authorized private backup + reviewed file export + new Git root
  -> new-repository publication and remote verification
  -> publish-english-product-experience (fifth change, after actual first launch)
       -> English product/README -> subsequent authorized npm release + remote checks
```

Stage 0 is accepted on authored content, reproducible disposable-consumer generation, a development/public export boundary, and preserved local policies. It does not depend on publishing a new tag or on implementation of the next three stages. Root publication remains pending while this development checkout uses its old pin. The new real repository is created only after the first public version is ready and a later handoff is authorized. Old Git objects, branches, tags, and consumer-migration obligations are not exported. No commit or publication is authorized by this proposal.

The four stages above are the initial-product sequence. `publish-english-product-experience` is a separate post-launch fifth change, not a fifth prerequisite for the clean-history handoff. Keep Portuguese prose and the local artifact-language policy in this stage; that later change translates maintained product/local-policy text, improves the README, and updates artifact language while preserving pt-BR chat preferences, technical source paths, company ownership, and unrelated local rules.
