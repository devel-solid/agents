# convention-authoring Specification

## Purpose

Let teams author complete convention templates with ordinary file operations and create calculated local Git versions of a validated shared base.

## Requirements

### Requirement: Templates are authored with ordinary file operations

Developers SHALL be able to create or copy sources directly into the configured template root without a CLI authoring command. A valid source SHALL contain one H1, one nonempty complete AGENT-CARD, and its authored body. The sole public v1 manifest SHALL discover local families without registration or manifest edits; explicit entries SHALL select remote parents only.

#### Scenario: A developer creates a complete commit rule
- **WHEN** an editor saves a valid commits.tpl.md under local.tpl_dir in a version-1 consumer
- **THEN** the next validation/synchronization discovers it
- **AND** creating that source alone leaves the manifest and generated documents unchanged

#### Scenario: An author selects a remote family
- **WHEN** an author adds a remote parent to entries with origin remote and a valid pinned base
- **THEN** its complete family participates alongside discovered local families
- **AND** authoring alone does not regenerate documents

#### Scenario: An existing rule is copied into a base
- **WHEN** a valid rule is copied into templates/docs/conventions in a shared base
- **THEN** validate --base checks it without any new/add/register command

### Requirement: Release calculates the next stable version automatically

Release SHALL require --bump patch|minor|major and derive the baseline from the numerically highest stable vMAJOR.MINOR.PATCH tag reachable from HEAD. Without such a tag it SHALL calculate from numerical v0.0.0. Manual current/next-version or SHA inputs SHALL NOT be required or accepted.

#### Scenario: A minor version follows a stable tag
- **WHEN** HEAD's highest reachable stable tag is v1.2.3 and release --bump minor runs
- **THEN** the calculated next tag is v1.3.0
- **AND** neither agents.ref nor the CLI package version determines the baseline

#### Scenario: The base has no stable version yet
- **WHEN** release --bump patch runs with no reachable stable version tag
- **THEN** the calculated tag is v0.0.1 without creating a v0.0.0 tag

#### Scenario: Tag names or dates would give a different order
- **WHEN** reachable stable tags include v1.9.0 and v1.10.0 and unrelated/non-version tags also exist
- **THEN** selection uses v1.10.0 regardless of tag timestamps, lexical ordering, or unrelated-branch tags
- **AND** annotated and lightweight stable tags are resolved to their target commits

### Requirement: Release checks the base and local Git state

Release SHALL validate the shared base and require initialized base identity, no consumer manifest, Git, an existing HEAD commit, a clean worktree including untracked files, and an absent target tag. It SHALL reject a consumer manifest and require no package.json, origin/main, remote, or npm credentials. Failed checks SHALL preserve files and refs.

#### Scenario: A content-only base is ready
- **WHEN** a valid committed clean base has no consumer manifest, package.json, or remote
- **THEN** release can calculate and create its local version tag

#### Scenario: Changes have not been committed
- **WHEN** release finds modified or untracked files
- **THEN** it reports the failed prerequisite and creates no tag

#### Scenario: The target tag already exists on another branch
- **WHEN** the calculated tag name exists anywhere in the repository
- **THEN** release reports conflict exit 2 without overwriting it

### Requirement: Release preview never applies changes

Release --dry-run SHALL perform the same prerequisites and calculation as application and report baseline, bump, next tag, HEAD, and diagnostics. It SHALL NOT create files, directories, tags, commits, cache entries, or network activity. The preview SHALL NOT reserve its proposed version.

#### Scenario: A maintainer previews a minor release
- **WHEN** agents release --bump minor --dry-run runs on a valid base with baseline v1.2.3
- **THEN** it reports next tag v1.3.0 as planned rather than created
- **AND** all filesystem contents and Git refs remain unchanged

### Requirement: Application creates only the local tag

Release without --dry-run SHALL recalculate from current state, recheck HEAD/worktree and target availability, and create one non-forcing local tag at HEAD. It SHALL NOT edit sources/manifests/package versions, regenerate documents, commit, fetch, push, or publish npm content.

#### Scenario: The release succeeds
- **WHEN** agents release --bump minor completes all checks with baseline v1.2.3
- **THEN** local tag v1.3.0 identifies the validated current HEAD
- **AND** sources, configuration, generated documents, package metadata, and remotes are unchanged

#### Scenario: State changed after preview
- **WHEN** a subsequent application sees another reachable version or changed HEAD
- **THEN** it recalculates and validates the current state rather than forcing the earlier preview result

#### Scenario: A conflicting tag is created concurrently
- **WHEN** the target tag appears before non-forcing tag creation completes
- **THEN** the existing tag is preserved and the command fails without a replacement

### Requirement: A maintainer skill guides reviewed versioning

The authored agents-update-version skill SHALL interpret impact, justify the bump, obtain release --dry-run results, and present the proposed version, source commit, and scoped effects before its required confirmation. It SHALL use the repository's released baseline rather than agents.ref and SHALL stop if the installed CLI lacks the supported operation. It SHALL NOT be installed into consumers by ordinary init.

#### Scenario: A maintainer asks to prepare a release
- **WHEN** the skill prepares a version plan without confirmation to apply
- **THEN** it explains the bump and computed version and leaves files, tags, and remotes unchanged

#### Scenario: The plan has changed before application
- **WHEN** a new preview or repository inspection differs from the approved commit, version, or effects
- **THEN** the skill requests confirmation of a revised plan before executing the mutating release operation

#### Scenario: Only local tag creation is approved
- **WHEN** the skill applies that approved local release plan
- **THEN** it invokes the supported release operation without implicitly publishing tags, changing a consumer pin, regenerating documents, or publishing npm content


### Requirement: Base initialization installs the versioning skill

Init --base SHALL install agents-update-version from the CLI package into the base's .agents/skills/agents-update-version/. Ordinary init SHALL install agents-write-conventions and agents-update-docs. Base init SHALL also install agents-write-conventions. Base preview SHALL report the skill path without writes. Identical existing files SHALL be preserved; custom content, extra files or unsafe aliases SHALL fail before any setup writes. No manual copying, Git or network SHALL be required.

#### Scenario: An author initializes a base
- **WHEN** init --base runs in an empty directory
- **THEN** the base receives packaged agents-update-version/SKILL.md and agents-write-conventions/SKILL.md along with its source scaffold
- **AND** agents-update-docs and consumer configuration are not installed

#### Scenario: Installation is previewed or repeated
- **WHEN** an author previews base initialization or repeats an identical setup
- **THEN** preview makes no filesystem changes and repeat setup preserves skill bytes and timestamps

#### Scenario: The skill contains authored changes
- **WHEN** the base version skill differs from the packaged source or contains extra files
- **THEN** init --base reports conflict before creating any other setup file and preserves all existing content

#### Scenario: Consumer initialization targets a base
- **WHEN** a base already has its marker and consumer init is requested
- **THEN** the request fails with PROJECT_ROLE_CONFLICT before any setup writes

### Requirement: Both roles install the authoring skill

Both init modes SHALL install CLI-packaged agents-write-conventions under .agents/skills/agents-write-conventions/. They SHALL preserve exact copies and repair missing copies without Git/network. Preview SHALL make no writes. Custom content, extra files or unsafe aliases SHALL block all setup writes. Cross-role initialization SHALL be rejected; sync SHALL NOT refresh skills from content pins.

#### Scenario: The shared authoring skill conflicts
- **WHEN** either init mode finds customized content, extra files or unsafe aliases in agents-write-conventions
- **THEN** preview and application fail before writing any other setup file and preserve existing content

#### Scenario: Base initialization targets a consumer
- **WHEN** a root has a consumer manifest and base init is requested
- **THEN** the request fails before installing base metadata, instructions or skills

### Requirement: Curation is separate from generation and release

Agents-write-conventions SHALL guide applicability, actionable rules, valid examples, justified exceptions, parent/child structure and related-rule ambiguity, conflict and duplication review. It SHALL locate consumer sources through the manifest and base sources through the base catalog, without allowing a consumer manifest in the base. It SHALL distinguish semantic quality from structural validation and SHALL NOT edit remote cache or generated documents.

#### Scenario: A base author requests a convention
- **WHEN** the author invokes agents-write-conventions in an initialized base without a consumer manifest
- **THEN** the agent authors the requested valid source in the base catalog, reviews its meaning and related rules, and uses validate --base where supported
- **AND** it does not generate consumer outputs, commit, tag or publish implicitly

#### Scenario: A consumer requests local policy maintenance
- **WHEN** agents-write-conventions receives that request in a consumer
- **THEN** it edits the requested source under the configured local root and necessary selection only, respecting the sole public v1 contract
- **AND** it does not shadow a pinned remote convention with a conflicting local copy or implicitly synchronize outputs

#### Scenario: Only a semantic review is requested
- **WHEN** the user asks to review a convention without requesting edits
- **THEN** the skill reports concrete findings without modifying sources
