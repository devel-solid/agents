---
name: agentscli-write-conventions
description: Create, review, and maintain actionable project conventions, selecting final files or templates from the project manifest.
---

# Write conventions

Use this skill for rule authorship and semantic review. Structural validation alone does not establish that a rule is useful or correct.

## Choose the editing context

Read project instructions and inspect the requested project root before writing:

| Manifest present | Authoring target |
| --- | --- |
| Only `agentscli.yml` | Handwritten English files in `docs/conventions/` and their discovery links in the handwritten `AGENTS.md` |
| Only `agentscli-compose.yml` | Independent `*.tpl.md` files under its `templates_dir`, using its `language` for authored text |
| Both or neither | Explain the conflicting or missing context and ask for direction before editing |

Read the applicable manifest; do not infer direct mode from absent client configuration. The internal `skills` list is a distribution list, not a generation configuration. Never initialize or synchronize the source repository as a client.

In client mode, `conventions_dir` contains disposable generated documents. Make changes in their templates, preserving relative paths. Every convention template participates automatically; no registration or parent convention is needed. Nested and dotted names are independent.

## Curate the rule

First check whether an existing convention covers the requested subject. Keep the change within the requested scope.

- State when the rule applies and what decision it resolves. Keep project orientation in `AGENTS.md`; place detailed or scoped instructions in a convention.
- Give concrete actions and conditions. Distinguish requirements, recommendations, and examples. Explain the reason when it helps a reader decide.
- Use small, valid examples. Do not turn illustrative names, paths, commands, or versions into mandatory policy.
- Include real exceptions with their conditions and alternatives. Do not invent rules, commands, or hypothetical restrictions that the project has not adopted.
- Check related rules for duplication, contradiction, ambiguity, and stale references. Prefer one normative source with useful links. Surface unresolved policy choices rather than inventing a priority.
- Split topics when they are consulted for different decisions, without adding inheritance or subconventions.

## Check the applicable format

Client templates require valid UTF-8, one H1, and exactly one complete, nonempty card outside code examples:

```markdown
# Commit messages

<!-- AGENT-CARD START -->
Read when creating or reviewing a commit message.
<!-- AGENT-CARD END -->

Describe the concrete change in the commit subject.
```

The card tells readers when to consult the convention; keep the actual rules in the body. The renderer removes the operational card from convention output and inserts its discovery text in `AGENTS.md`. Reference generated `.md` paths under `conventions_dir` when linking between client documents.

Own handwritten conventions need a clear title and useful discovery links; they do not require cards or generated markers. Read `AGENTS.md` to preserve their existing organization.

For client changes, use the installed `agentscli validate --repo-root <project>` when available. Do not install or upgrade the CLI implicitly. Never run client validation or sync against the internal-manifest repository.

A review-only request reports findings without edits. Authorship does not itself run generation, commit, tag, or publication. If the user also requests client generation, follow `agentscli-build-agents` using the existing manifest. Report changed sources, relevant coherence checks, and validation actually performed.
