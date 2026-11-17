# Guide review

Reviewed the five restored guides before removing them. Git context included `3cf177f` (transactional synchronization), `5e1be55` (schema v1), and the maintenance guide at `0ad3951` (base/client separation). These records explain legacy behavior; they are not compatibility requirements for the reduced product.

| Source | Retained useful meaning | Discarded material |
| --- | --- | --- |
| `contratos-de-composicao.md` | Templates as authoring sources, Markdown-aware structure, portable path/collision checks, manual-file preservation, no-op comparisons, preview/check distinction | Schema v1, remote selections, families, bases, locks/provenance, durable ownership, rollback, content release commands, old skill names |
| `dependencias-node-cli.md` | Deliberate dependency changes, lockfile consistency, Node compatibility, truthful verification evidence | Historical version/release inventories, Ajv, platform acceptance matrix, copied fixtures/oracles, rollout/rollback narrative |
| `integracao-em-repositorio-consumidor.md` | Installed CLI without implicit download, source editing versus generation, review-only scope, validate/preview/sync/check flow, no secrets in configuration | Old manifest paths, optional Git base, ownership adoption/conflicts, locks/cache/journals, old role setup and preserved-skill behavior |
| `manutencao-do-repositorio-agents.md` | Own handwritten instructions, canonical skill sources, separate authorization for native delivery, truthful verification, ignored temporary work | Base versioning engine, four-command CLI, remote pins, transactional recovery/mutex/timeouts, old skill packaging, disposable test repositories |
| `validacao-node-cli.md` | Unit-only default gate, types/format alongside units, same lightweight pre-push/CI boundary, explicit evidence limits | Retained off-gate integrations, historical fixture/oracle reports, role/release scenarios, matrix and installed-tarball testing, old recovery metadata |

The useful development rules are maintained in `docs/conventions/development.md`; trust-boundary and secret-handling rules from the old catalog remain as `docs/conventions/instruction-safety.md`. Root `AGENTS.md` links to both and remains handwritten. Essential client/development/release commands belong in the root README and canonical skills, not replacement guides.

The old active template catalog, base/starter assets, duplicate distributed skill copies, five guides, and presentation are removed after this review and conversion. Product document examples now live only under localized package assets. No guide content was converted wholesale, and no subconvention, remote-composition, or recovery mechanism was carried forward.
