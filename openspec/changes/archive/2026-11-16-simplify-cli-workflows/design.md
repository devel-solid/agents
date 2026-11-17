# Design

## Context

See proposal.md for motivation. Reuse the Node engine's source validation, safe paths, family resolution, plan/apply pipeline, and rendering. The implemented CLI groups setup, diagnostics, generation, and local versioning behind four public commands. Examples describe the current implementation; platform evidence is tracked separately.

## Goals / Non-Goals

**Goals:** four public command roots, visible file/tag effects, useful local-only setup, directory-driven authoring, merged diagnostics, separate authoring, synchronization, and release skills, and version calculation without manually supplied version numbers.

**Non-Goals:** runtime installation, convention/configuration CRUD, automatic commits, remote tag publication, npm publishing, changing package versions, release journals/resumption, independent-history handoff, multiple bases.

## Decisions

### 1. Four commands own distinct effects

| Command | Inputs and checks | Creates or changes |
|---|---|---|
| `agents init` | Current project, optional existing manifest | Missing initial manifest, local main/context sources, packaged agents-write-conventions and agents-update-docs integrations |
| `agents init --base` | Current base directory, optional starter | Owned AGENTS.md, role identity, consumer main template, catalog README, root README and packaged agents-write-conventions plus agents-update-version; starter sources only when requested |
| `agents validate` | Node, applicable Git prerequisites, manifest, integration, templates, paths | No project files or Git refs |
| `agents validate --base` | Main template and catalog; no consumer manifest required | No files or Git refs |
| `agents sync` | Manifest, discovered/selected sources, safe output plan | AGENTS.md and convention documents under out_dir |
| `agents release --bump minor` | Valid base, clean committed Git state, reachable tags | One local tag at HEAD |

Node.js is supplied by the environment. Git is unnecessary for local-only setup, validation, and generation. It is required for configured Git content and release. Normal Bash examples execute inside the intended project; `--repo-root` remains an optional advanced override. Help, version, JSON, and debug are flags rather than command roots.

Retire public `doctor`, `release next-version`, `release set-compose-ref`, `release validate-state`, and `release validate-release-paths`. Do not ship `new`, convention-management commands, or base-configuration commands. Existing automation callers must migrate explicitly; do not pretend removed commands still work. Reuse safety logic internally when applicable, rather than deleting its checks.

### 2. Show an effect before applying it

| Invocation | Reported result | Write boundary |
|---|---|---|
| `agents init --dry-run` | Relative paths to create, preserve, or reject | No files, directories, integration, cache, or Git changes |
| `agents sync --dry-run` | Main template, inputs, and document creates/updates/no-ops | No source, manifest, integration, document, or Git-ref changes; Git-backed resolution can populate the existing cache |
| `agents sync --check` | Whether expected documents match | Same write boundary as sync preview; exit 0 current or 1 divergent |
| `agents release --bump minor --dry-run` | Baseline, selected bump, next tag, current HEAD, validation findings | No files, directories, Git refs, cache, commits, or network operations |

`validate` is inherently non-applying, so it needs no dry-run flag. Git-backed validation can resolve/cache its pinned inputs, using the same documented cache boundary. Preserve success 0, freshness divergence 1, usage/validation/conflict 2, and operational failure 3. Preserve the existing JSON envelope and report concrete changes or diagnostics. A release preview reports the intended tag as a planned change, not as a created tag.

### 3. Author sources directly in the configured directory

`init` creates `agents-compose.yml`, `templates/AGENTS.tpl.md`, `templates/docs/conventions-local/contexto-do-projeto.tpl.md`, `.agents/skills/agents-update-docs/SKILL.md`, and `.agents/skills/agents-write-conventions/SKILL.md` in a new ordinary project. It preserves valid existing manifests and authored files, rejects conflicting integration before partial setup, and never generates AGENTS.md or convention outputs.

After initialization, a developer creates a source with an editor or copies an existing valid template:

```bash
agents init --dry-run
agents init
cp ../shared-rules/commits.tpl.md templates/docs/conventions-local/
agents validate
agents sync --dry-run
agents sync
agents sync --check
```

```text
manifest: local.tpl_dir
  |
  +-> create or copy commits.tpl.md here
        |
        +-> validate checks the source and prerequisites
              |
              +-> sync --dry-run lists expected document changes
                    |
                    +-> sync writes AGENTS.md and out_dir/commits.md
```

The rule is authored by the developer. A complete source needs one H1, a nonempty AGENT-CARD read condition, and the rule body. Manual creation/copying does not modify outputs. Version-2 local discovery needs no manifest edit; version-1 inclusion still requires explicit entries. There is no registry, authoring command, or special inclusion history.

### 4. Keep versioned inclusion and main-template authority

New initialization writes this complete local-only configuration:

```yaml
schemaVersion: 2
outputs:
  AGENTS.md:
    include:
      conventions:
        out_dir: docs/conventions
        local:
          tpl_dir: templates/docs/conventions-local
        remote:
          tpl_dir: templates/docs/conventions
        entries: []
```

Version 2 discovers all parent/child families recursively under local.tpl_dir, orders parents by normalized portable relative path, retains children with parents, and appends explicit remote parents in manifest order. Ignore ordinary non-template files. Reject malformed/orphan families, escaping aliases, and destination collisions before writes. Local entries are invalid in version 2; entries select only remote parents.

Without agents.repository/ref, use the local main template without Git. When a pinned base is configured, use its main template and declared remote entries; preserve the local fallback. Changing which base version a consumer uses is a manifest edit followed by sync preview/apply, not a release command. The consumed base ref and the current repository's release version are distinct identities.

An omitted schemaVersion remains version 1 with its required pinned base and explicit local/remote inclusion. Repeat initialization must not upgrade or reinterpret it. Package both schemas and normalize into the same engine. Source membership changes expected composition, but old output deletion remains governed by the separately planned ownership policy.

### 5. Validate inputs and diagnose the environment together

Run applicable environment and configuration checks through validate. Check Node, selected paths, manifest, integration compatibility, family structure, and destinations. Require Git only for Git-backed inputs or release. Report actionable file/field locations and remediation; debug adds technical detail without changing acceptance rules. A missing required prerequisite stops dependent checks with an explanatory diagnostic rather than a stack of secondary failures.

The base mode validates the main template and the entire standard shared catalog without requiring a consumer manifest or installing an integration. Base and consumer roles are exclusive; base validation requires initialized identity and no consumer manifest. Validate does not generate documents, repair integration, rewrite configuration, or create tags. Document freshness belongs to sync --check.

### 6. Calculate and create one local base tag

```bash
agents release --bump minor --dry-run
# Example: current v1.2.3, next v1.3.0. No tag created.
agents release --bump minor
# Example: local tag v1.3.0 created at the current HEAD.
```

Require --bump with patch, minor, or major. Read stable tags exactly matching vMAJOR.MINOR.PATCH whose target commits are ancestors of HEAD. Choose the numerically highest reachable version, not the newest timestamp or lexicographic name; ignore unrelated-branch and non-version tags. With no matching reachable tag, calculate from numerical v0.0.0 without creating a baseline tag. Standard SemVer arithmetic resets lower components.

Validate the base and require an existing commit and clean worktree, including untracked files. No consumer manifest, package.json, npm credentials, remote, or origin/main is required. Reject an already existing target tag anywhere in the repository, invalid bump, invalid source, missing Git, or unsafe state before writes. Do not derive this release version from agents.ref or the CLI package version.

Preview performs the same checks and returns the calculation without modifying anything. Applying independently recalculates from current state, rechecks HEAD/worktree and tag availability immediately before creating the tag, and uses Git's non-forcing tag creation so a concurrent conflicting tag cannot be overwritten. The preview does not reserve a version or promise its result remains current after the repository changes.

Application creates only the calculated local tag at the current HEAD. It does not commit files, edit manifests, regenerate outputs, change package versions, push, fetch, or publish to npm. Remote publication is a separate authorized operation. The pending publication change must reconcile its proposed multi-command orchestration with this approved public surface before implementation; its recovery/handoff features are not silently folded into this local tag operation.

### 7. Separate curation from manifest-driven generation

All authored skills live under .agents/skills/<name>/SKILL.md and are copied into assets/integration/<name>/SKILL.md by the packaging script. Ordinary init installs agents-write-conventions and agents-update-docs; base init installs agents-write-conventions and agents-update-version. Minimal consumer init creates five files; minimal base init creates seven. Both integrations are inspected and all target paths planned before any setup write. Missing copies are installed, exact copies retain bytes/timestamps, and customized content, extra files or unsafe aliases fail without partial setup. Cross-role initialization is rejected before any writes. Dry-run performs zero writes. Sync does not refresh skills from content pins.

The authoring skill identifies local versus shared ownership and the real source root. It guides actionable rules, applicability, normative versus illustrative text, valid examples, justified exceptions, related-rule conflict/duplication review, and parent/child discovery. It never assumes format validation proves semantic quality. It edits only requested sources and necessary authoring selection, uses validate or validate --base where available, and does not implicitly generate, commit, version, or publish. Review-only requests do not edit files. A base needs no consumer manifest for this work.

The update-docs skill reads the existing manifest and sources, validates, previews, generates authorized outputs, and checks freshness with truthful changed/no-op reporting. It does not author content, edit configuration or pins, initialize setup, or run release. Source changes requested together with generation use the authoring skill first, then this skill within the authorized scope. Preview-only ends before generation. Both remain guidance around the installed deterministic engine, not alternate renderers; direct CLI usage does not require loading skills. No missing capability is silently downloaded, emulated or migrated.

### 8. Use the maintainer's agents-update-version skill for reviewed releases

The authored `.agents/skills/agents-update-version/SKILL.md` is a base-maintainer workflow. The asset-packaging script bundles it under assets/integration/agents-update-version, and init --base installs it at .agents/skills/agents-update-version/SKILL.md in the base. Preview includes that path with zero writes. Identical files remain untouched; customized content, extra files, and unsafe aliases fail before any setup writes. The other role's existing skill is preserved. The skill follows the base's local branch policy. It is not installed into consumers by ordinary init and is not another CLI command. It interprets release impact, justifies the bump, obtains the CLI's version preview, presents the exact planned effects, and preserves the existing required confirmation before mutating release actions.

Its updated instructions use release --bump with --dry-run for the calculation and release --bump after confirmation for the local tag; the CLI obtains version numbers. Evaluate changes relative to the reported released baseline and HEAD, rather than treating the consumed base pin as the repository's release identity. Preserve any stricter repository branch/publication policies without imposing them on the generic content-only release command.

Show the user the proposed version, bump reason, source commit, local tag effect, and any separately authorized file or remote effects. Recheck the current preview and repository state before application; if the approved scope, commit, or version changes, present a revised plan for confirmation. Stop if the installed CLI lacks the required supported operation. Never silently emulate the new interface with retired helpers or claim unsupported publication automation exists.

Creating a local base tag and publishing it remotely are distinct authorized base actions. Consumer adoption is a separate operation in a separate consumer project and is not coordinated by agents-update-version. The base never generates consumer metadata or its own instructions through sync. Detailed recoverable publication/handoff implementation remains in the pending publication scope.

The product guide includes four commands, all their options, and exactly the three project-owned skills agents-write-conventions, agents-update-docs and agents-update-version. The internal replacement map is validation for diagnostics, release for local calculation/checks/tag creation, and explicit manifest editing for consumer-pin changes. Repository-development planning tools do not belong in the product guide. All three instruction sources are updated and validated. The guide shows writing in both roles, manifest-driven generation only in the consumer, and release only in the base, with automatic installation and concrete file effects.

The maintained presentation lives at `docs/presentations/agents-cli-apresentacao.html` and is version-controlled alongside the documentation. Its HTML, CSS, JavaScript, highlighting and diagrams are contained in that single file. Opening it directly requires no server, build command, companion assets, CDN or network. Temporary authoring/verification helpers are not delivery dependencies. Preserve equal slide heights, viewport fit, navigation and offline usability when updating the guide, and reconcile its content with the CLI, skills and current proposal.

## Risks / Trade-offs

- Directory discovery includes unfinished structurally valid templates. Keep drafts outside the configured root and review validate/preview results.
- A local tag preview can become stale. Recalculate on apply, display the actual result, and reject collisions without force.
- Retiring helper commands breaks automation callers. Update authored callers and show actionable rejection errors; do not add permanent public aliases that defeat the four-command boundary.
- Tags unavailable locally are not discovered. Remote fetching remains an explicit maintainer action; this local release contract does not claim remote uniqueness or publication.
- Version-1 behavior and stale-output preservation differ from the new local workflow. Keep explicit schema opt-in and existing output ownership boundaries.

## Migration Plan

1. Implement version-2 parsing/local discovery while retaining version-1 fixtures and package/runtime protections.
2. Implement minimal init and init preview; remove the discarded source-scaffolding command from the implementation plan.
3. Merge applicable doctor diagnostics into validate and migrate its callers/help. Keep sync's existing plan/apply and cache boundaries.
   Retain the revised agents-update-docs source and packaged copy; verify installation, scope routing, and compatibility handling against the implemented CLI.
4. Implement the single local release operation, move reusable checks behind it, and migrate callers of retired helpers without performing real releases.
5. Verify packed installations and disposable local Git fixtures on supported platforms/Node versions. Reconcile pending plans without accepting or implementing their publication/recovery scopes.
6. Publish or archive only after an explicit later request and implementation acceptance. Implementation and acceptance progress must reflect actual evidence; unsupported platform gates stay open.

## Independent base identity and owned instructions

The work-root marker .agents/base.json has exactly schemaVersion 1 and kind base. Base init creates it automatically without new flags. Invalid/unsafe markers fail with PROJECT_ROLE_INVALID or the applicable path error. Consumer roots cannot acquire base setup, and base roots cannot use consumer init/validate/sync. Root discovery resolves the physical path before walking ancestors, including directory symlinks and junctions, and stops at base identity before falling through to an ancestor consumer. Base validation/release require initialization and reject consumer manifests. Remote input contracts remain marker-independent.

The owned AGENTS.md is a regular nonempty UTF-8 file copied from the base asset only when missing. Valid custom bytes and timestamps are preserved by init; invalid instructions and unsafe links block the whole plan. It has no generated notice, convention card or discovery section. The separate templates/AGENTS.tpl.md and catalog are solely consumer-facing sources. The tool repository uses the same owned model with concise development guidance and removes its consumer manifest and local-only convention trees. Its three authored skill sources are product assets, not proof of a consumer role.
