---
sidebar_position: 4
---

# CLI

The RootNative CLI lets you add components directly into your project as source files — no npm package for components, full ownership of the code. Inspired by [shadcn/ui](https://ui.shadcn.com).

```bash
npx rootnative init
npx rootnative add button card
```

## Why use the CLI?

With the standard `@rootnative/components` package, components live in `node_modules` and you import them as-is. The CLI takes a different approach:

- **Full ownership** — component source files live in your project, not `node_modules`
- **Customizable** — modify styles, adjust behavior, or remove what you don't need
- **No version lock-in** — you decide when to pull updates
- **Tree-shake friendly** — only the components you use exist in your codebase

The theme system (`@rootnative/core`) stays as an npm dependency so theme updates propagate automatically.

## Prerequisites

- Node.js >= 18
- React Native >= 0.72 or Expo SDK >= 49
- TypeScript project with path aliases configured (e.g. `@/*` → `src/*`)

## Quick start

### 1. Initialize

Run `init` in your React Native or Expo project:

```bash
npx rootnative init
```

The CLI will:

1. Detect your project type (Expo or bare React Native)
2. Detect your package manager (npm, yarn, pnpm, bun)
3. Read path aliases from your `tsconfig.json`
4. Ask where to place components and utility files
5. Install `@rootnative/core`
6. Create an `rootnative.json` config file

### 2. Add components

```bash
npx rootnative add button
```

This copies the Button source files into your project and installs any required dependencies.

### 3. Use them

```tsx
import { ThemeProvider } from '@rootnative/core'
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <ThemeProvider>
      <Button variant="filled" onPress={() => {}}>
        Press me
      </Button>
    </ThemeProvider>
  )
}
```

## Commands

### `create`

Create a new project with RootNative UI pre-configured. See [Quick Start](./quick-start) for a full walkthrough.

```bash
npx rootnative create
npx rootnative create my-app
```

The CLI prompts for project name, display name, and package manager, then scaffolds a ready-to-run Expo project with `ThemeProvider` and example components.

**Options:**

| Flag | Description |
|------|-------------|
| `-y`, `--yes` | Skip prompts and use defaults |

### `init`

Initialize your project for RootNative UI.

```bash
npx rootnative init
```

If `rootnative.json` already exists, you'll be asked whether to overwrite it.

### `add`

Add one or more components to your project.

```bash
npx rootnative add button
npx rootnative add card chip text-field
npx rootnative add appbar
```

**Automatic dependency resolution** — if a component depends on other components, they are added automatically. For example, `appbar` depends on `icon-button` and `typography`, so all three are added together.

**Options:**

| Flag | Description |
|------|-------------|
| `--force`, `-f` | Overwrite existing component files |
| `--dry-run`, `-d` | Preview what would be installed without writing any files |

**What happens when you run `add`:**

1. The CLI fetches the component registry and validates the requested names
2. It resolves the full dependency graph
3. It shows a summary of what will be installed — components, utilities, and npm packages
4. After confirmation, it fetches the source files from the registry
5. Import paths are rewritten to match your project's alias configuration
6. Utility files are copied to your `lib/` directory
7. A barrel file (`rootnative-utils.ts`) is generated that re-exports only the utilities your installed components need
8. Any required npm packages are installed via your package manager

### `update`

Update installed components to the latest version from the registry.

```bash
npx rootnative update button
npx rootnative update --all
```

**Options:**

| Flag | Description |
|------|-------------|
| `-a`, `--all` | Update all installed components |
| `-d`, `--dry-run` | Show diff without applying changes |

### `upgrade`

Upgrade `@rootnative/core` to the latest version and install any new peer dependencies.

```bash
npx rootnative upgrade
```

**Options:**

| Flag | Description |
|------|-------------|
| `-y`, `--yes` | Skip confirmation prompt |
| `-a`, `--all` | Also update all installed component files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

### `list`

Show all available components with their install status.

```bash
npx rootnative list
```

Output:

```
Available components (v0.1.1-alpha.1):

  Name                        Status          Description
  ----------------------------------------------------------------------
  button                      installed       MD3 button with 5 variants...
  card                        -               Surface container with 3...
  ...
```

### `doctor`

Diagnose common issues in your project.

```bash
npx rootnative doctor
```

Checks performed:

| Check | Description |
|-------|-------------|
| Config | `rootnative.json` exists and is valid |
| Core package | `@rootnative/core` is installed |
| React Native | Version meets minimum requirement (>= 0.72) |
| TypeScript | `tsconfig.json` present |
| Component integrity | All installed component files exist on disk |
| Utility barrel | `rootnative-utils.ts` exists |
| Peer dependencies | `react-native-safe-area-context` and `@expo/vector-icons` status |

## Configuration

`rootnative init` creates an `rootnative.json` file in your project root:

```json
{
  "$schema": "https://rootnative.github.io/ui/schema.json",
  "aliases": {
    "components": "@/components/ui",
    "lib": "@/lib"
  },
  "registryUrl": "https://raw.githubusercontent.com/rootnative/ui",
  "registryVersion": "main"
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `aliases.components` | `@/components/ui` | Directory where component folders are created |
| `aliases.lib` | `@/lib` | Directory where utility files are placed |
| `registryUrl` | GitHub raw URL | Base URL for fetching source files |
| `registryVersion` | `main` | Git ref to fetch from (branch name, tag, or commit hash) |

### Path aliases

The CLI uses your `tsconfig.json` path aliases to generate clean import paths. If your project has:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Then `aliases.components` of `@/components/ui` maps to `src/components/ui/` on disk, and generated imports use `@/components/ui/button` instead of relative paths.

> **Note:** If you use `~/*` instead of `@/*`, the CLI detects that and adjusts the default aliases accordingly.

## Project structure

After running `npx rootnative add button appbar`, your project looks like this:

```
src/
├── components/
│   └── ui/
│       ├── button/
│       │   ├── Button.tsx
│       │   ├── types.ts
│       │   ├── styles.ts
│       │   └── index.ts
│       ├── icon-button/        ← auto-added (appbar dependency)
│       │   ├── IconButton.tsx
│       │   ├── types.ts
│       │   ├── styles.ts
│       │   └── index.ts
│       ├── typography/         ← auto-added (appbar dependency)
│       │   ├── Typography.tsx
│       │   ├── types.ts
│       │   └── index.ts
│       └── appbar/
│           ├── AppBar.tsx
│           ├── types.ts
│           ├── styles.ts
│           └── index.ts
└── lib/
    ├── color.ts                ← color utilities (alphaColor, blendColor)
    ├── elevation.ts            ← shadow/elevation helpers
    ├── icon.ts                 ← icon resolver
    ├── rtl.ts                  ← RTL layout helpers
    └── rootnative-utils.ts     ← generated barrel (re-exports used utilities)
```

### What gets copied

**Component files** — each component is a self-contained directory with the same structure as the library source: the component file, types, styles, and an index barrel.

**Utility files** — small helper functions that components depend on. These are copied from `@rootnative/utils` (which is not published to npm). Only the utilities needed by your installed components are copied.

**Barrel file** — `rootnative-utils.ts` is auto-generated and re-exports only the functions your components use:

```ts
// Auto-generated by rootnative CLI. Do not edit.
export { alphaColor, blendColor } from './color'
export { elevationStyle } from './elevation'
export { getMaterialCommunityIcons } from './icon'
```

### Import rewriting

The CLI rewrites imports in copied component files so they work in your project:

| Original (library source) | Rewritten to |
|---------------------------|-------------|
| `from '@rootnative/core'` | Unchanged — npm package |
| `from '@rootnative/utils'` | `from '@/lib/rootnative-utils'` |
| `from '../icon-button'` | `from '@/components/ui/icon-button'` |
| `from './styles'` | Unchanged — same directory |

## Available components

| Component | Dependencies | Description |
|-----------|-------------|-------------|
| `typography` | — | Text with 15 MD3 type scale variants |
| `button` | — | 5 variants (filled, elevated, outlined, text, tonal), icon support |
| `icon-button` | — | 4 variants (filled, tonal, outlined, standard), toggle support |
| `appbar` | icon-button, typography | Top app bar, 4 layout variants, SafeAreaView |
| `card` | — | 3 variants (elevated, filled, outlined), optional press handler |
| `chip` | — | 4 variants (assist, filter, input, suggestion), icon/avatar support |
| `checkbox` | — | Binary selection control |
| `radio` | — | Single-choice selection control |
| `switch` | — | Toggle control with optional icons |
| `text-field` | — | Animated floating label, 2 variants (filled, outlined) |
| `layout` | — | Box, Row, Column, Grid, and SafeAreaView wrapper |
| `list` | — | List container with interactive items and dividers |
| `avatar` | — | Image, icon, or initials avatar with 5 sizes |
| `keyboard-avoiding-wrapper` | — | Zero-config keyboard-aware wrapper for forms |

## Comparison with npm packages

| | CLI (`npx rootnative add`) | npm (`@rootnative/components`) |
|---|---|---|
| Component code lives in | Your project (`src/`) | `node_modules/` |
| Customization | Edit source directly | Override via props/theme only |
| Updates | Re-run `add --force` when you choose | `npm update` |
| Bundle size | Only what you add | Tree-shaking at build time |
| Setup | `npx rootnative init` | `pnpm add @rootnative/components` |

Both approaches use `@rootnative/core` for theming — they are fully compatible and you can even mix them in the same project.
