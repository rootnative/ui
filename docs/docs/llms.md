---
sidebar_label: For AI Agents
description: LLM-optimized documentation for RootNative UI — llms.txt files hosted on this site and shipped inside every npm package.
---

# For AI agents & LLMs

RootNative UI ships documentation in the [llms.txt](https://llmstxt.org/) format, so AI coding agents (Claude Code, Cursor, Copilot, and friends) can look up component props and theme APIs without scraping the docs site.

## Hosted on this site

Always reflects the **latest release**:

| URL | Contents |
| --- | --- |
| [https://rootnative.github.io/ui/llms.txt](https://rootnative.github.io/ui/llms.txt) | Quick overview — install, setup, package list, links |
| [https://rootnative.github.io/ui/llms-full.txt](https://rootnative.github.io/ui/llms-full.txt) | Complete API reference — every component prop, core type, and CLI command in a single file |

## Inside `node_modules`

Every published package ships its own `llms.txt`, matching the **exact installed version** and readable offline:

| Path | Contents |
| --- | --- |
| `node_modules/@rootnative/components/llms.txt` | All component props |
| `node_modules/@rootnative/core/llms.txt` | Theme system API and types |
| `node_modules/@rootnative/icons/llms.txt` | Icon-library adapters (Lucide, Phosphor, vector-icons) |
| `node_modules/@rootnative/cli/llms.txt` | CLI commands |

Prefer these over the hosted files when suggesting code — they can't drift from the version your project actually uses.

## Point your agent at the docs

Projects scaffolded with `npx rootnative create` already include a `CLAUDE.md` with this pointer, and `npx rootnative init` offers to add it to existing projects. To set it up by hand, drop this into your `CLAUDE.md`, `AGENTS.md`, or `.cursorrules`:

```markdown
## RootNative UI docs for AI agents

This project uses RootNative UI (`@rootnative/*`). LLM-optimized docs:

- `node_modules/@rootnative/components/llms.txt` — all component props for the exact installed version (works offline)
- `node_modules/@rootnative/core/llms.txt` — theme system API (`ThemeProvider`, `useTheme`, `defineTheme`)
- https://rootnative.github.io/ui/llms.txt — hosted overview (latest release)
- https://rootnative.github.io/ui/llms-full.txt — hosted complete API reference (latest release)

Prefer the `node_modules` copies — they match the installed version exactly.
```
