---
name: agentscli-release
description: Prepare and perform authorized versioning and publication of the agentscli npm package using native Git and npm.
---

# Release agentscli

This skill belongs only to the CLI source repository. Confirm that only `agentscli.yml` exists at its root; do not use this workflow in a client project. It versions the CLI package, not a separate instruction catalog. There is no CLI release subcommand.

## Prepare the concrete candidate

1. Read the request, current package/lockfile metadata, Git status, relevant changes, existing refs, and repository publication policy. Preserve unrelated work and existing history. Confirm which local and external effects the user has authorized.
2. Explain the version change from the actual impact. The initial experimental public release is `agentscli@0.1.0` under MIT with tag `v0.1.0`; private package versions and old content tags do not determine it. For later releases, use semantic versioning. If updating version files with npm, use `npm version <version> --no-git-tag-version` so preparation does not create a commit or tag.
3. Run the focused units as needed and `npm run check`, then `npm run build`. Only lightweight unit tests belong to the default gates; do not add integration suites or installation environments for release preparation.
4. Inspect `npm pack --dry-run --json` and the actual candidate archive. Check compiled runtime, both `en` and `pt-br` document resources, all three complete client skill trees, README, MIT license, executable, and metadata. Exclude internal skills/manifest, OpenSpec, tests, source maps, and checkout paths. Installation must not compile or fetch resources.
5. Identify the exact source commit or pending diff, version, intended tag, candidate tarball, SHA-512 integrity, target repository/remote, and npm destination. A dirty candidate is not yet the final committed release identity. Reconcile and inspect the final candidate again if source or package metadata changes.

## Deliver within authorization

Prepare all local, reviewable work before requesting any still-missing authorization. Reuse authorization already given for the corresponding effect; source preparation alone does not authorize repository rename, commit, tag, push, or npm publication.

Check native Git/npm authentication and account access without displaying credentials. Recheck package-name eligibility and existing package versions at delivery; an earlier registry 404 does not reserve a name or guarantee publication permission. Use existing native authentication; never collect tokens in chat or put them in artifacts.

For the first delivery, rename the existing repository to `devel-solid/agentscli` and update the remote when authorized, preserving all existing history and refs. Do not initialize independent history, purge old commits, reset, or force-push.

With corresponding authorization, create the reviewed source commit and tag, push the exact approved source/ref, and publish the inspected tarball using native npm with public access. Inspect existing tags and versions first; do not overwrite an immutable published identity. Do not create a publication engine, journal, or automatic retry service.

## Verify and report

Verify the public repository commit/tag and npm package name, version, visibility, MIT license, required resources, and `dist.integrity` against the candidate. Resolve an ambiguous push or publish response by reading remote state before retrying. A mismatching tag or registry integrity blocks delivery; correct a published defect through a new version.

Report the actual commit, tag, package/version, artifact integrity, executed checks, and any pending account action. Local readiness alone is not a published release; keep unperformed delivery tasks open.
