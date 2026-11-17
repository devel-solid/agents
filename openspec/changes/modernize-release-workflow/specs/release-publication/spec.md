# Spec Delta

## Purpose

Provide reviewable first and subsequent public releases, with a readiness-gated independent Git origin, explicit version identities, recoverable publication, and verified installed artifacts.

## ADDED Requirements

### Requirement: Release implementation follows accepted predecessor stages

This capability SHALL start only after the content, runtime, and reliability predecessors are validated, user-accepted, synchronized, and archived. Release implementation and rehearsal SHALL remain in the current development repository. No external existing consumer SHALL be required for acceptance.

#### Scenario: The preceding stage is not accepted
- **WHEN** release implementation is requested before its predecessor gates pass
- **THEN** the unmet gate is reported and implementation does not begin

### Requirement: Real repository creation waits for public-version readiness

Our real new tool repository SHALL be created only after all four stages establish first-public-version readiness and a later handoff is authorized. Planning, implementation, testing, or accepting a stage SHALL NOT create, rename, archive, migrate, or rewrite a real repository automatically. Company-base adoption SHALL NOT require this clean-history handoff.

#### Scenario: Release rehearsals pass
- **WHEN** the user accepts local first-public-version readiness
- **THEN** the current repository remains intact
- **AND** actual backup/export/new-repository operations remain pending separate authorization

### Requirement: Handoff preserves private development state

Before the authorized export, the workflow SHALL verify a private backup covering development history and required pending work. The handoff SHALL identify approved final files, transformations, target repository, initial commit, and explicit external operations. It SHALL preserve the original repository rather than rewrite its history.

#### Scenario: Approved files include pending work
- **WHEN** the final file inventory includes content not present in development HEAD
- **THEN** backup and snapshot verification cover that exact content
- **AND** a HEAD-only export cannot silently omit it

### Requirement: Public history starts from an independent reviewed snapshot

Our tool handoff's initial public source commit SHALL have no parent and contain only the approved final-file snapshot. Old Git metadata, objects, branches, tags, and private ancestry SHALL NOT be imported by copy, fork, mirror, or history-preserving clone. Later release metadata commits SHALL be new history only. This requirement SHALL NOT reset company-base history.

#### Scenario: The initial public repository is verified
- **WHEN** a fresh clone is inspected after authorized publication
- **THEN** its root is the approved independent snapshot
- **AND** its refs and ancestry contain no imported development history

### Requirement: Exported files have an explicit product boundary

The public snapshot SHALL exclude caches, private backup/evidence, journals, obsolete generated outputs, and development lock/ownership state. Internal planning/archive files SHALL require explicit inventory approval. Final references and generated state SHALL resolve against the new repository without private commits or local artifacts.

#### Scenario: A development lock names an old commit
- **WHEN** the handoff inventory is assembled
- **THEN** that lock is excluded and new state is generated after the new source tag is available
- **AND** obsolete development documents are not copied merely to be retired later

### Requirement: Release preparation produces a bounded read-only plan

the agents-update-version read-only publication planner SHALL describe explicit streams/versions, source identity, applicable previous releases, remote-state expectation, writes, resources, artifact identity, and commit messages without modifying files or external resources. The plan SHALL have an identity verified by execution.

#### Scenario: A maintainer prepares a combined release
- **WHEN** explicit content and CLI versions are supplied
- **THEN** the command reports their approved source/resource sequence and plan identity
- **AND** it does not fetch, create a repository, commit, tag, or publish

### Requirement: Initial publication is explicit and has no previous baseline

Initial preparation SHALL require explicit initial mode and versions with no preceding tag for the selected stream. It SHALL preserve existing company-base history and record the applicable remote expectation. Our clean-history handoff SHALL require an independent root and expected-empty remote, verified before pushing. Private tool tags SHALL NOT become initial baselines.

#### Scenario: The new target is empty
- **WHEN** the reviewed independent root has an approved initial-state publication plan and explicit stream versions
- **THEN** missing predecessor tags and remote main do not block that initial plan
- **AND** no version is inferred by incrementing a private tag

#### Scenario: The expected-empty remote contains unexpected refs
- **WHEN** authorized initial execution checks that remote
- **THEN** it stops with a conflict before overwriting or importing those refs

#### Scenario: A company publishes its first content tag in an existing repository
- **WHEN** explicit initial base-only preparation observes existing company commits and remote main but no preceding content tag
- **THEN** it records that baseline without requiring a new repository or independent root
- **AND** authorized execution preserves that history and stops on unexpected remote drift

### Requirement: Later releases use only their public stream baselines

Subsequent content and CLI assessments SHALL use their own preceding reachable remotely published tags in the selected target repository. Our tool SHALL use only its new public history after handoff. The maintainer or agent SHALL decide semantic impact; the tool SHALL NOT infer a patch from an empty remote-ahead range. Missing baselines without explicit initial mode SHALL fail visibly.

#### Scenario: Source changes are already pushed
- **WHEN** the candidate equals remote main but differs from the preceding public stream tag
- **THEN** those unreleased changes remain visible in the release assessment

### Requirement: Publication requires authorization for the exact plan

Execution SHALL require authorization bound to the exported commit, versions, scope, artifact, and applicable remote-state expectation. Unexpected changes SHALL invalidate the plan. Accepting product readiness SHALL NOT authorize a real initial commit, repository operation, push, npm publication, or visibility change.

#### Scenario: The exported candidate changes after approval
- **WHEN** publication observes an unapproved source or artifact identity
- **THEN** it stops and requires a revised concrete plan before new effects

### Requirement: Candidate artifacts are verified under the new identity

Publication SHALL validate the selected target's sources and artifacts: all families for a base, the installed npm artifact for CLI, and our optional two-source starter where shipped. Export transformations SHALL trigger fresh validation. Our public package/provenance identity SHALL refer to the new repository and frozen commit rather than the development checkout.

#### Scenario: A development artifact still names the old repository
- **WHEN** launch preflight checks the exported candidate
- **THEN** publication is blocked until approved metadata and rebuilt/tested artifacts match the new identity

### Requirement: Initial publication preserves an independent base root

The initial base root SHALL own its AGENTS.md and role identity without a consumer manifest, lock or generated consumer metadata. Combined CLI/content publication MAY publish both independent streams but SHALL NOT synchronize the base as a consumer. Published content SHALL be verified using separate disposable consumers.

#### Scenario: Initial content is published
- **WHEN** the new remote content tag is verified at the approved root
- **THEN** separate consumers can select it for verification
- **AND** the base retains its owned instructions without a metadata-generation commit

### Requirement: Content publication and consumer adoption are separate

Content releases SHALL publish and verify their source tag without changing consumer pins or generating documents. Consumer adoption SHALL happen in separate roots through the applicable manifest-driven workflow, outside base publication.

#### Scenario: A base version becomes available
- **WHEN** its source tag is published and verified
- **THEN** consumers may choose when to adopt it independently
- **AND** base publication leaves all consumer projects unchanged

### Requirement: CLI and content versions remain independent

Public content `vX.Y.Z` identities and CLI package/`cli-vX.Y.Z` identities SHALL be independent. Initial versions SHALL be explicitly selected; no exact version is approved by this specification. A later single-stream release SHALL NOT bump the other stream.

#### Scenario: Only CLI code changes after launch
- **WHEN** an approved CLI-only release executes
- **THEN** content tags and the content reference remain unchanged

### Requirement: Interrupted launches resume without recreating identity

Resumption SHALL reconcile the approved plan with Git/npm observations and reuse matching initial-root publication, tags, commits, and registry artifacts. Mismatched or insufficient evidence SHALL stop execution. It SHALL NOT recreate a different initial root, move a tag, duplicate a metadata commit, or republish a used npm version.

#### Scenario: A response is lost after initial source publication
- **WHEN** resumption finds the planned root and tag already published
- **THEN** it verifies and reuses them before continuing generation
- **AND** it does not start another independent history

#### Scenario: npm accepted a package before a network error
- **WHEN** the planned version and integrity match registry/download evidence
- **THEN** resumption proceeds to installation verification without republishing

### Requirement: Public artifacts are independently verified

An authorized CLI publication SHALL verify npm readiness, publish the approved public artifact, and test its exact registry installation. Base publication SHALL verify the selected Git tag in a fresh consumer, covering lock, local context, repeat sync, and cache recovery. Verification SHALL require no private development objects or unrelated publication stream.

#### Scenario: Actual launch is verified
- **WHEN** new Git and npm publication steps finish
- **THEN** verification identifies the new root, content commit, and exact installed package
- **AND** failure of lineage or artifact checks leaves launch reported as incomplete

### Requirement: Company instruction bases publish independently of npm

The maintainer publication plan SHALL select base, CLI, or both as explicit internal scope. Base-only publication SHALL use local release and Git without npm or consumer configuration. CLI-only publication SHALL not require an instruction base. Combined publication SHALL require both components and explicit authorization. These plan scopes SHALL not add public CLI roots or flags.

#### Scenario: A company releases a content-only base
- **WHEN** a valid company Git base without `package.json`, engine code, or consumer manifest is selected for base-only release
- **THEN** preparation, authorized execution, and resumption use only its content version and Git publication resources
- **AND** no npm package or registry operation is planned

#### Scenario: A CLI release has no associated content release
- **WHEN** the selected target is CLI only
- **THEN** preflight and publication validate the npm artifact without looking up a content repository or requiring a starter content tag
- **AND** company instructions and their versions remain unchanged

### Requirement: Installed delivery supports an independent company-base journey

Release verification SHALL exercise installed base initialization/validation, company-authored content, Git publication, and two consuming projects with independent selections and updates. Our catalog SHALL be optional starter material. No company SHALL need tool-repository write access, an engine fork, npm publication of rules, or a history reset.

#### Scenario: Only one project adopts a new company policy version
- **WHEN** the installed tool publishes fixture company content through Git and one of two consumers explicitly updates
- **THEN** that project receives its selected new instructions while the other stays pinned
- **AND** no CLI/npm release or tool-owned content service is required

### Requirement: Rehearsal cannot perform a real handoff

Implementation tests SHALL use disposable local Git remotes and registry fixtures for initial/subsequent releases, export boundaries, and interruption cases. CI SHALL preserve the accepted platform/Lefthook gates. External publishing SHALL require the approved target identity and its applicable Git credentials or npm publisher; our tool launch SHALL use its approved new repository.

#### Scenario: A pull request exercises initial release
- **WHEN** its rehearsal runs
- **THEN** it creates only disposable fixtures and no real repository, package, account change, or migration

#### Scenario: Publisher setup is missing
- **WHEN** an authorized launch lacks its required identity configuration
- **THEN** it stops with setup guidance and no silent credential fallback

### Requirement: Initial and ongoing support documentation are distinct

Product documentation SHALL distinguish tool maintainers, company-base authors, and project consumers, including base initialization/validation, optional starters, Git publication, private access, and independent updates. Our handoff runbook SHALL describe backup, export, independent root, and initial publication. Launch notes SHALL NOT require private-catalog migration. Prose SHALL follow the artifact-language policy applicable to the product version.

#### Scenario: The first public release notes are prepared
- **WHEN** launch documentation is reviewed
- **THEN** it describes the initial public product and setup without a private-v4 upgrade prerequisite
- **AND** first-launch recovery does not promise a nonexistent previous public version
