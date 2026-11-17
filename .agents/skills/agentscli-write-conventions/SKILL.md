---
name: agentscli-write-conventions
description: Create, review, and maintain actionable project conventions, selecting handwritten final files or fixed client templates from project context.
---

# Write conventions

Use this skill for rule authorship and semantic review. Structural validation alone does not establish that a rule is useful or correct.

## Choose the editing context

Read project instructions and inspect the requested project root before writing:

| Context present | Authoring target |
| --- | --- |
| Only `agentscli.yml` | Handwritten English files in `docs/conventions/` and their discovery links in the handwritten `AGENTS.md` |
| Only valid `.agentscli/config.yml` | Independent `*.tpl.md` files under `.agentscli/templates/conventions/`, using its `language` for authored text |
| `agentscli-compose.yml`, with or without new configuration | Report that explicit migration must finish before authorship; edit no legacy sources |
| Missing, malformed, or conflicting context | Explain the problem and ask for direction before editing |

Inspect ancestors for `agentscli.yml`: an internal ancestor blocks treating a requested subtree as a client; diagnose it before editing. Read the applicable context; do not infer direct mode from absent client configuration. A valid client configuration contains exactly `language: en` or `language: pt-br`, with no duplicate/unknown keys, YAML aliases, or layout overrides. Invalid configuration blocks edits. The internal `skills` list is a distribution list, not a generation configuration. Never initialize, migrate, validate, or synchronize the source repository or its descendants as clients.

In client mode, `.agentscli/conventions/` contains disposable generated documents. Make changes in `.agentscli/templates/conventions/`, preserving paths relative to that subtree. Only convention sources below that subtree participate automatically; no registration or parent convention is needed. Nested and dotted names are independent.

## Curate the rule

First check whether an existing convention covers the requested subject. Keep the change within the requested scope.

- State when the rule applies and what decision it resolves. Keep project orientation in `AGENTS.md`; place detailed or scoped instructions in a convention.
- Give concrete actions and conditions. Distinguish requirements, recommendations, and examples. Explain the reason when it helps a reader decide.
- Use small, valid examples. Do not turn illustrative names, paths, commands, or versions into mandatory policy.
- Include real exceptions with their conditions and alternatives. Do not invent rules, commands, or hypothetical restrictions that the project has not adopted.
- Check related rules for duplication, contradiction, ambiguity, and stale references. Prefer one normative source with useful links. Surface unresolved policy choices rather than inventing a priority.
- Split topics when they are consulted for different decisions, without adding inheritance or subconventions.

When authorized to populate a convention, replace its applicable fill-in comment itself with verified project content; do not leave the hint beside the completed text. For the project context template, use the actual project context. Report missing facts rather than inventing architecture, commands, or policies. Any new fill-in guidance must be an HTML comment explicitly asking the author to replace that comment. Preserve the convention's title and operational AGENT-CARD when replacing fill-in hints in client templates.

## Check the applicable format

Client templates require valid UTF-8, one H1, and exactly one complete, nonempty card outside code examples:

```markdown
# Commit messages

<!-- AGENT-CARD START -->
Read when creating or reviewing a commit message.
<!-- AGENT-CARD END -->

Describe the concrete change in the commit subject.
```

The card tells readers when to consult the convention; keep the actual rules in the body. The renderer removes the operational card from convention output and inserts its discovery text in root `AGENTS.md`. Links between client documents target generated `.md` paths under `.agentscli/conventions/`, resolved from the generated convention's location rather than its template directory. Card links resolve from root `AGENTS.md`.

Own handwritten conventions need a clear title and useful discovery links; they do not require cards or generated markers. Read `AGENTS.md` to preserve their existing organization.

For client changes, use the installed `agentscli validate --repo-root <project>` when available. Do not install or upgrade the CLI implicitly. Never run client validation or sync against the internal-manifest repository.

A legacy context requires explicitly requested `agentscli init --migrate --dry-run` and `agentscli init --migrate`; authorship does not authorize migration. A review-only request reports findings without edits. Authorship does not itself run generation, commit, tag, or publication. If the user also requests client generation, follow `agentscli-build-agents` using existing configuration. Report changed sources, relevant coherence checks, and validation actually performed.
