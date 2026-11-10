---
sidebar_label: For AI Agents
description: LLM-optimized documentation for Root Native UI — llms.txt files hosted on this site and shipped inside every npm package.
---

# For AI agents & LLMs

Root Native UI ships its documentation in the [llms.txt](https://llmstxt.org/) format. An AI coding agent (Claude Code, Cursor, Copilot, and others) can read component props and theme APIs from these files, without a scrape of the docs site.

## Hosted on this site

These files always match the **latest release**:

| URL | Contents |
| --- | --- |
| [https://rootnative.github.io/ui/llms.txt](https://rootnative.github.io/ui/llms.txt) | A short overview: install, setup, the package list, and links |
| [https://rootnative.github.io/ui/llms-full.txt](https://rootnative.github.io/ui/llms-full.txt) | The complete API reference: every component prop, core type, and CLI command in one file |

## Inside `node_modules`

Every published package ships its own `llms.txt`. It matches the **exact installed version**, and you can read it offline:

| Path | Contents |
| --- | --- |
| `node_modules/@rootnative/components/llms.txt` | All component props |
| `node_modules/@rootnative/core/llms.txt` | The theme system API and types |
| `node_modules/@rootnative/icons/llms.txt` | The icon-library adapters (Lucide, Phosphor, react-native-vector-icons) |
| `node_modules/@rootnative/seo/llms.txt` | The SEO checklist and the head, schema, react, expo-router and node APIs |
| `node_modules/@rootnative/cli/llms.txt` | The CLI commands |

Prefer these files over the hosted files when you suggest code. They can't drift from the version your project uses.

## Point your agent at the docs

A project from `npx rootnative create` already has a `CLAUDE.md` with this pointer, and `npx rootnative init` offers to add it to an existing project. To set it up by hand, put this into your `CLAUDE.md`, `AGENTS.md`, or `.cursorrules`:

```markdown
## Root Native UI docs for AI agents

This project uses Root Native UI (`@rootnative/*`). LLM-optimized docs:

- `node_modules/@rootnative/components/llms.txt` — all component props for the exact installed version (works offline)
- `node_modules/@rootnative/core/llms.txt` — theme system API (`ThemeProvider`, `useTheme`, `defineTheme`)
- https://rootnative.github.io/ui/llms.txt — hosted overview (latest release)
- https://rootnative.github.io/ui/llms-full.txt — hosted complete API reference (latest release)

Prefer the `node_modules` copies — they match the installed version exactly.
```
