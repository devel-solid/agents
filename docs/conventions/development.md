# Development

Read when changing CLI contracts, resource packaging, tests, or release preparation.

## Runtime and resources

- Keep the client runtime limited to Node.js and installed package resources. Do not make client generation depend on Git, network access, a compiler, or a source checkout.
- Preserve the template/source boundary: authored content stays in templates; generated documents are replaceable. The source repository's own instructions are handwritten.
- Validate all inputs, paths, collisions, and conflicts before mutation. Reject unsafe symbolic links, junctions, and hard links rather than following them into unrelated files.
- Preserve unmarked manual documents. Bound generated cleanup to the current configured output root and exact first-line generated marker.
- Keep dry-run/check free of writes. Use the same document and managed-skill plan for previews, checks, and application.
- Replace files individually and report completed/remaining effects on operational failure. Retry recomputes the plan; do not add transaction journals, ownership history, or rollback machinery.
- Keep compiled assets derived from their canonical sources. Build copies whole listed skill directories, including useful support files, without a second maintained shared-skill copy.
- Keep existing dependency choices and lockfile pins unless the requested change requires an update. Retain only dependencies serving the reduced product.

## Unit-only verification

- Version and run only lightweight unit tests under `tests/unit/`. Test parser/render/planner behavior and injected filesystem boundaries with small inputs.
- Do not add subprocess, CLI/Git/npm, network, installation, disposable-project, integration, or end-to-end tests, including opt-in suites.
- Run focused units while changing behavior. Run `npm run check` before reporting readiness; keep `npm test`, pre-push, and CI within the same unit/type/format boundary.
- Treat build and package/archive inspection as delivery operations. Report their actual results without claiming installed-package or integration coverage.

## Delivery preparation

Use the internal `agentscli-release` skill for versioning and native Git/npm delivery. Present the concrete source, version, tag, tarball, and integrity before any still-unauthorized external action. Preserve repository history and immutable published identities; source preparation does not imply permission to commit, tag, push, rename, or publish.

Keep temporary work in Git-ignored locations. Do not make versioned files depend on session artifacts, cached checkouts, or local machine paths.
