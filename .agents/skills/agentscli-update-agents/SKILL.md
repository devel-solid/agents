---
name: agentscli-update-agents
description: Curate concise AGENTS.md instructions and convention discovery, editing the handwritten file or its client template while preserving the applicable format.
---

# Update AGENTS instructions

## Select the source

Inspect the requested project root and ancestors and read its instructions and context before writing:

- Only `agentscli.yml`: edit the handwritten root `AGENTS.md` directly in English. This manifest identifies the source repository and lists distributed skills; it does not configure document generation.
- Only valid `.agentscli/config.yml`: edit `.agentscli/templates/AGENTS.tpl.md`, using its `language` for authored text. Root `AGENTS.md` is generated and disposable.
- `agentscli-compose.yml`, with or without new configuration: report that explicit migration must finish before authorship; edit no legacy sources. Explain `agentscli init --migrate --dry-run` and `agentscli init --migrate` without running either unless requested.
- Missing, malformed, or conflicting context: explain the problem and ask for direction before editing. Do not infer direct mode from absent client configuration, guess, or initialize a project to resolve it.

A valid client configuration contains exactly `language: en` or `language: pt-br`, with no duplicate/unknown keys, YAML aliases, or layout overrides. Invalid configuration blocks edits. An ancestor containing `agentscli.yml` blocks treating its subtree as a client; diagnose it before editing. Never run client initialization, migration, validation, or synchronization in the internal source repository or its descendants.

## Decide what belongs in AGENTS

Keep the file short enough to serve as the project's entrypoint. Useful content includes the project's purpose, essential repository orientation, actual development commands, applicable skills, and links explaining when to read conventions.

Move detailed domain rules, lengthy procedures, examples, and instructions relevant only to a particular task into a convention. Keep only the short trigger and discovery link in AGENTS. For example, link to a testing convention rather than embedding a catalog of test cases. Prefer improving an existing convention over adding another.

Preserve established decisions outside the request. Check commands, paths, links, duplicated guidance, and contradictions against current project files. Do not invent tools or policies.

When authorized to populate project content, replace the applicable fill-in comment itself with verified content; do not leave the hint beside the completed text. The main default asks only for project purpose and essential repository orientation. Report missing facts rather than inventing them. Any new fill-in guidance must be an HTML comment explicitly asking the author to replace that comment. Fill-in hints are separate from operational markers: preserve the convention-index insertion comment in client templates.

## Preserve the format

In client mode, preserve valid UTF-8, exactly one H1, and exactly one full-line operational insertion comment outside examples:

```markdown
<!-- agentscli:conventions -->
```

The generator replaces that comment with the convention index. Convention sources are below `.agentscli/templates/conventions/`; generated links target `.agentscli/conventions/` relative to root `AGENTS.md`. Titles, sections, and surrounding content are customizable; the default body is not a mandatory schema. Do not insert `<!-- agentscli:generated -->` into the template: the renderer supplies it.

In direct mode, keep ordinary readable Markdown and valid discovery links. A handwritten AGENTS file needs neither the template insertion marker nor a generated marker.

If the request needs convention changes, use `agentscli-write-conventions` in the same context. For client structural checks, use the installed `agentscli validate --repo-root <project>` when available; do not implicitly install or upgrade it. Skills remain English; configuration selects authored document language, not chat language. Do not validate the internal repository as a client.

A review-only request changes no files. Source authorship does not imply generation, commits, or publication. When client generation is also requested, follow `agentscli-build-agents` within that scope. Report the edited source, content moved into conventions, and checks actually performed.
