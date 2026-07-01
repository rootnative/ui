# rootnative

CLI for adding [RootNative UI](https://github.com/rootnative/ui) components directly into your React Native or Expo project. Inspired by [shadcn/ui](https://ui.shadcn.com) — you own the code.

## Quick start

Start a new project:

```bash
npx rootnative create my-app
```

Or add components to an existing project:

```bash
npx rootnative init
npx rootnative add button card
```

## How it works

Instead of installing components as an npm package, the CLI copies the source files into your project. You get full ownership — customize styles, adjust behavior, or remove what you don't need.

The theme system (`@rootnative/core`) stays as an npm dependency so theme updates propagate automatically.

## Requirements

- Node.js >= 18
- React Native >= 0.72 or Expo SDK >= 49
- TypeScript project (recommended)

## Commands

### `rootnative create [name]`

Scaffold a new Expo project with RootNative UI pre-configured (`ThemeProvider` wired up, example components included).

```bash
npx rootnative create my-app
```

It prompts for project name, display name, template, and package manager.

Options:

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip prompts and use defaults |
| `-t, --template <name>` | Template to use (`blank`, `with-router`) |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

Non-interactive mode for CI/automation:

```bash
npx rootnative create my-app -y --template with-router --package-manager pnpm
```

### `rootnative init`

Initialize your project for RootNative UI.

```bash
npx rootnative init
```

This will:

1. Detect your project type (Expo or bare React Native)
2. Detect your package manager (npm, yarn, pnpm, bun)
3. Detect path aliases from your `tsconfig.json`
4. Prompt for component and utility output directories
5. Install `@rootnative/core`
6. Create an `rootnative.json` config file

Options:

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip all prompts and use detected defaults |
| `--components-alias <alias>` | Components install path (default: `@/components/ui`) |
| `--lib-alias <alias>` | Utility files path (default: `@/lib`) |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

Non-interactive mode for CI/automation:

```bash
# Accept all defaults
npx rootnative init -y

# With custom paths
npx rootnative init -y --components-alias "~/ui" --lib-alias "~/utils"
```

### `rootnative add <components...>`

Add one or more components to your project.

```bash
npx rootnative add button
npx rootnative add card chip text-field
npx rootnative add appbar  # auto-adds icon-button + typography dependencies
```

Options:

| Flag | Description |
|------|-------------|
| `-f, --force` | Overwrite existing components |
| `-d, --dry-run` | Preview what would be installed without writing files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

The `add` command:

1. Resolves the full dependency graph (e.g. `appbar` requires `icon-button` and `typography`)
2. Shows a plan of components, utilities, and npm packages to install
3. Copies component files with import paths rewritten to match your project
4. Generates a utility barrel file (`rootnative-utils.ts`)
5. Installs required npm dependencies

### `rootnative update [components...]`

Update installed components to the latest version from the registry.

```bash
npx rootnative update button        # update specific components
npx rootnative update --all         # update everything installed
npx rootnative update --all --dry-run  # preview the diff first
```

Options:

| Flag | Description |
|------|-------------|
| `-a, --all` | Update all installed components |
| `-d, --dry-run` | Show diff without applying changes |

Local modifications are detected by diffing against the registry source — review the diff with `--dry-run` before applying if you've customized component files.

### `rootnative upgrade`

Upgrade `@rootnative/core` to the latest published version and install any new peer dependencies.

```bash
npx rootnative upgrade
```

Options:

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip confirmation prompt |
| `-a, --all` | Also update all installed component files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

The `upgrade` command:

1. Detects the installed `@rootnative/core` version from `node_modules`
2. Fetches the latest version from the npm registry
3. Compares peer dependencies between the installed and latest versions
4. Shows a plan with the version bump, new required peer deps, changed ranges, and removed deps
5. Upgrades `@rootnative/core` and installs any new required peer dependencies
6. Reports optional peer deps that aren't installed (does not auto-install them)
7. Lists peer deps that are no longer required so you can remove them manually

Non-interactive mode for CI/automation:

```bash
npx rootnative upgrade -y
```

### `rootnative list`

Show all available components with their install status.

```bash
npx rootnative list
```

### `rootnative doctor`

Check your project for common issues.

```bash
npx rootnative doctor
```

Checks include:

- `rootnative.json` exists and is valid
- `@rootnative/core` is installed
- React Native version compatibility
- Installed component file integrity
- Peer dependencies (`react-native-safe-area-context`, `@expo/vector-icons`)

## Configuration

`rootnative init` creates an `rootnative.json` in your project root:

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

| Field | Description |
|-------|-------------|
| `aliases.components` | Where component directories are created |
| `aliases.lib` | Where utility files are placed |
| `registryUrl` | Base URL for fetching component source files |
| `registryVersion` | Git ref to fetch from (branch, tag, or commit) |

## Output structure

After running `npx rootnative add button appbar`:

```
src/
  components/
    ui/
      button/
        Button.tsx
        types.ts
        styles.ts
        index.ts
      icon-button/          # auto-added (appbar dependency)
        IconButton.tsx
        types.ts
        styles.ts
        index.ts
      typography/           # auto-added (appbar dependency)
        Typography.tsx
        types.ts
        index.ts
      appbar/
        AppBar.tsx
        types.ts
        styles.ts
        index.ts
  lib/
    color.ts
    elevation.ts
    icon.ts
    rtl.ts
    rootnative-utils.ts    # generated barrel
```

## Available components

| Component | Description |
|-----------|-------------|
| `typography` | Text component with 15 MD3 type scale variants |
| `button` | 5 variants (filled, elevated, outlined, text, tonal) with icon support |
| `button-group` | Standard and connected button groups with single or multi-select toggle behavior |
| `icon-button` | 4 variants (filled, tonal, outlined, standard) with toggle support |
| `fab` | Floating action button with 4 color variants, 3 sizes, and optional extended label |
| `appbar` | Top app bar with 4 variants and SafeAreaView support |
| `avatar` | Circular avatar with image, icon, or text initials and 5 sizes |
| `card` | 3 variants (elevated, filled, outlined) with optional press handler |
| `chip` | 4 variants (assist, filter, input, suggestion) with icon/avatar support |
| `checkbox` | Binary selection control |
| `radio` | Single-choice selection control |
| `switch` | Toggle control with optional icons |
| `slider` | Single-thumb or range slider with continuous and discrete modes |
| `progress` | Linear and circular progress indicators (determinate and indeterminate) |
| `text-field` | Text input with animated floating label, 2 variants (filled, outlined) |
| `layout` | Layout primitives: Box, Row, Column, Grid, and SafeAreaView wrapper |
| `list` | List container with interactive items and dividers |
| `portal` | Render children into a host elsewhere in the tree (overlays, dialogs, sheets) |
| `keyboard-avoiding-wrapper` | Zero-config keyboard-aware wrapper for form layouts |

## Import rewriting

The CLI rewrites imports so copied files work in your project:

| Original (library source) | Rewritten to |
|---------------------------|-------------|
| `@rootnative/core` | Unchanged (npm package) |
| `@rootnative/utils` | `@/lib/rootnative-utils` (local barrel) |
| `../icon-button` | `@/components/ui/icon-button` (alias path) |
| `./styles` | Unchanged (same directory) |

## Usage after adding components

```tsx
import { ThemeProvider } from '@rootnative/core'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function App() {
  return (
    <ThemeProvider>
      <Card>
        <Button variant="filled" onPress={() => {}}>
          Press me
        </Button>
      </Card>
    </ThemeProvider>
  )
}
```

## Docs

Full docs: https://rootnative.github.io/ui/cli

LLM-optimized reference: https://rootnative.github.io/ui/llms-full.txt — or read `node_modules/@rootnative/cli/llms.txt` for the exact installed version.

## License

MIT
