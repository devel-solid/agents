---
name: agentscli-update-agents
description: Curate concise AGENTS.md instructions and convention discovery, editing the handwritten file or its client template while preserving the applicable format.
---

# Update AGENTS instructions

## Select the source

Inspect the requested project root and read its instructions and manifest before writing:

- Only `agentscli.yml`: edit the handwritten root `AGENTS.md` directly in English. This manifest identifies the source repository and lists distributed skills; it does not configure document generation.
- Only `agentscli-compose.yml`: edit `<templates_dir>/AGENTS.tpl.md`, using the manifest's `language` for authored text. Root `AGENTS.md` is generated and disposable.
- Both or neither: explain the conflicting or missing context and ask for direction before editing. Do not guess or initialize a project to resolve it.

Never run `init` or `sync` in the internal-manifest source repository.

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

The generator replaces that comment with the convention index. Titles, sections, and surrounding content are customizable; the default body is not a mandatory schema. Do not insert `<!-- agentscli:generated -->` into the template: the renderer supplies it.

In direct mode, keep ordinary readable Markdown and valid discovery links. A handwritten AGENTS file needs neither the template insertion marker nor a generated marker.

If the request needs convention changes, use `agentscli-write-conventions` in the same manifest context. For client structural checks, use the installed `agentscli validate --repo-root <project>` when available; do not implicitly install or upgrade it. Do not validate the internal repository as a client.

A review-only request changes no files. Source authorship does not imply generation, commits, or publication. When client generation is also requested, follow `agentscli-build-agents` within that scope. Report the edited source, content moved into conventions, and checks actually performed.
