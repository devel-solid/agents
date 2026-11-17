# Tasks

## 1. Accepted predecessor and launch boundary

- [ ] 1.1 Confirm accepted/archived `simplify-shared-conventions`, `introduce-node-cli`, and `harden-instruction-sync`; reconcile permanent specs and verify all work remains in this development repository with no existing-consumer migration prerequisite. Verify the sole public manifest contract requires schemaVersion 1 with local discovery, optional base, and remote-only entries; do not restore private explicit-local selection or schema v2.
- [ ] 1.2 Map accepted release helpers, planner, lock, ownership, and JSON/exit contracts into initial/subsequent release paths; verify installed-package regressions still pass before adding publication behavior and document which old private assumptions are excluded.

## 2. Initial and subsequent release plans

- [ ] 2.1 Implement read-only the agents-update-version read-only publication planner with explicit streams/versions, commit/artifact identity, expected resources, exact commit messages and plan digest; verify fixture preparation performs no fetch, file write, real repository operation, commit, or publication.
- [ ] 2.2 Implement an explicit initial-state field in the maintainer publication plan for absent previous stream tags; verify our independent-root/expected-empty handoff path without `origin/main`, an existing-history company's first base tag with its observed remote baseline, explicit versions, missing baseline rejection in ordinary mode, and conflicts on unexpected state without history resets.
- [ ] 2.3 Implement later-release baseline selection using only each public stream's reachable published tags, preserving semantic judgment outside code; verify already-pushed changes remain in the range and private development versions are not imported or incremented as launch baselines.
- [ ] 2.4 Bind execution to authorized plan identity and remote expectations; verify changed commit, files, artifact, versions, target, or unexpected state stops safely, and document initial-versus-ordinary plan examples in pt-BR.
- [ ] 2.5 Implement the internal plan target base for content-only company repositories using `validate --base` with no package/npm/consumer-state requirement; verify tag-only publication and resumption, separate disposable-consumer verification, CLI-only independence from content remotes, and rejection of `both` where both components are not present.

## 3. Reviewed export runbook and fixture boundary

- [ ] 3.1 Document the one-time future handoff procedure with readiness/user gate, verified private backup including pending work, approved final-file inventory, explicit target/name/visibility operations, initial commit and later publication approval; verify the runbook never instructs creating or migrating the real repository during implementation acceptance.
- [ ] 3.2 Rehearse positive file selection and export transformations with disposable fixtures; verify Git metadata/old refs, caches, private evidence, obsolete outputs, and development lock/ownership records stay excluded, approved uncommitted files are not lost, and relevant specs/attribution and intended local policies follow the reviewed inventory.
- [ ] 3.3 Rehearse fresh-directory Git initialization and independent-root verification using fixtures only; verify no old ancestry/refs are imported and a clean fixture clone needs no development object/cache, documenting that subsequent release metadata commits are new history rather than copied history.

## 4. Candidate and exported-identity preflight

- [ ] 4.0 Before candidate packing, inventory and rename maintained product references to agents-cli and package references to @devel-solid/agents-cli, targeting the future devel-solid/agents-cli repository; cover package/lockfile metadata, runtime self-references and labels, instructions, README/guides/install examples, authored skills/templates and regenerated assets, offline HTML presentation, tests and publication configuration. Preserve the agents executable, command roots, file/state/cache paths, schema/skill identifiers and historical provenance; review residual old-name matches and verify renamed tarball installation plus base/consumer workflows without creating or renaming a live repository, changing origin/workspace history, or publishing anything.
- [ ] 4.1 Validate the exact two-source catalog, minimal neutral consumer, local-maintenance profile, final URL/ref metadata and reference-guide links through isolated candidate generation; verify no old private dependency or content-checkout script execution is required and invalid inputs block publication.
- [ ] 4.2 Build, inspect, pack and install-test the exact frozen new-identity fixture candidate outside its checkout, retaining artifact integrity; verify runtime resources, no Python/Make/compiler requirement, and revalidation after export metadata changes rather than reuse of an old-identity tarball without proof.
- [ ] 4.3 Cover initial combined, later combined, CLI-only and content-only preflight cases; verify content availability only for explicitly declared compositions, independent version decisions, no implicit CLI content-remote defaults or mandatory starter tag, and correct failure guidance before remote effects.

## 5. Ordered execution and recoverable first launch

- [ ] 5.1 Implement our initial combined handoff's expected-empty verification, root/main and content-tag publication, followed by separate disposable-consumer verification without base metadata generation; verify independent base instructions, no consumer state in the base or copied old lock, and rejection of unexpected refs while content-only company releases preserve existing history and skip consumer generation.
- [ ] 5.2 Retain later source-tag-first ordering and, only for explicitly included consumer compositions, approved metadata-commit/main publication; verify content-only release completion without consumer state, exact allowed paths, shared transaction protections, applicable local test gate, and exclusions for unrelated files without directory sweeps.
- [ ] 5.3 Implement credential-free journaling and the maintainer publication recovery workflow for initial and ordinary states; verify matching initial-root creation, tags, commits and registry identity are reused while changed identities, missing evidence or stale authorization stop safely.
- [ ] 5.4 Inject failures after initial source push, content tag, generation, metadata commit/main push, and npm acceptance; verify no root recreation, tag move, duplicate commit or republish, and document first-launch recovery separately from later-version rollback.

## 6. Public delivery, CI and product documentation

- [ ] 6.1 Implement public npm readiness/publication and registry integrity/fresh-install verification for @devel-solid/agents-cli, bound to the approved future devel-solid/agents-cli repository/commit and exact artifact; verify fixture namespace/name/version errors, lost responses, and mismatched existing integrity without real publication, leaving actual name availability and publisher permissions for the authorized launch preflight.
- [ ] 6.2 Extend platform CI and preserve Lefthook with initial/subsequent/export/interruption checks; add the approved-identity publication workflow and trusted-publisher/provenance setup guidance, verifying PR fixtures cannot create real repositories or invoke account/migration/publication effects.
- [ ] 6.3 Adapt authored `agents-update-version`, applicable local policy and retained composition/reference guidance for explicit initial and later release decisions; verify scope/confirmation rules survive and no consumer migration from private tooling is introduced.
- [ ] 6.4 Complete initial-public-product notes, ongoing stream changelog/support/setup/update/recovery docs, and the final handoff runbook in pt-BR for the initial release; verify installed examples/links and explicit target/version inputs, no private-tag baseline or previous-public-version rollback claim, and explain that the fifth post-launch change owns English artifacts/README and ordinary real-release validation.
- [ ] 6.5 Document tool maintainer, company-base author, and project-consumer journeys with `init --base`, optional `--starter minimal`, `validate --base`, Git content publication, explicit project selections, and independent updates; verify a base needs no fork, npm package, upstream write access, or reset history and that CLI upgrades never overwrite authored company rules.

## 7. First-public-version readiness gate

- [ ] 7.1 Rehearse the complete initial and later release paths against disposable Git/registry fixtures, including fresh root, export exclusions, independent identity, initial metadata bootstrap and every interruption boundary; verify exact artifact integrity, repeatable generation and preserved development files/refs without performing a real handoff.
- [ ] 7.2 Present package/platform, export-boundary, independent-root and release-rehearsal evidence plus remaining external setup for user review; verify the report distinguishes ready first-public-version code from actual repository creation/export, initial commit, Git/npm publication, and remote verification.
- [ ] 7.3 Rehearse the installed CLI/company-base/two-consumer journey with custom families and an existing-history private-access fixture; verify first/later base-only Git releases without npm, separate CLI-only publication without a content remote, independent consumer adoption, redacted access errors, and no real repository or publication effects.

## Workflow follow-up

- The fifth `publish-english-product-experience` change starts only after this stage's acceptance/archive and the actual separately authorized first public Git/npm launch with remote verification. It continues in the new public checkout, translates maintained content and improves the README, then uses the existing ordinary-release workflow for the next real package version.
- This stage implements the maintained product/package rename before its readiness gate. The later handoff creates the new repository as devel-solid/agents-cli; it does not rename or migrate the current development repository. The fifth change retains the published name and technical contracts.
- At the future reviewed handoff, retain the approved fifth-change plan at a known location without importing private archives/history automatically. After actual first launch, record exact public package/tag/commit identities for its compatibility and next-release baseline. Do not move translation before that launch or treat this planning edit as commit/publication authorization.

- After user acceptance, synchronize this capability spec and archive through the public OpenSpec workflow when requested. Keep this implementation and all previous stage history in the current development repository.
- Only after first-public-version readiness and later concrete authorization: verify the private backup, approve final files/transformations and target/name handling, create the new repository and independent initial snapshot, and validate the exact new identity. This is not an implementation checkbox or an automatic result of stage acceptance.
- Approve the concrete new-commit/artifact publication plan before real Git/npm effects; verify a fresh clone's parentage/refs and the actual remote content/registry install before reporting launch success.
- Do not migrate now, rewrite the current repository, import its `.git`/branches/tags, or force an existing remote into the initial-release path. No real commit or publication is authorized by updating these plans.
