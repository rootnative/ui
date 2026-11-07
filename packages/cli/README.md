<!-- Absolute URL: npm does not resolve repository-relative image paths. -->
<img src="https://raw.githubusercontent.com/rootnative/ui/main/assets/brand/rootnative-mark.png" alt="" width="88" height="88" />

# rootnative

The CLI that adds [Root Native UI](https://github.com/rootnative/ui) components to your React Native or Expo project as source files. The model comes from [shadcn/ui](https://ui.shadcn.com): you own the code.

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

The CLI doesn't install the components as an npm package. It copies the source files into your project. You own the code: change the styles, change the behavior, or remove what you don't need.

The theme system (`@rootnative/core`) stays an npm dependency, so a theme update reaches you through npm.

## Requirements

- Node.js >= 18
- Expo SDK 58: React Native `>=0.88.0 <0.89.0` and React `>=19.3.0 <20.0.0`, the band that the published packages declare
- A TypeScript project (recommended)

## Commands

### `rootnative create [name]`

Makes a new Expo project with Root Native UI set up (`ThemeProvider` in place, example components included).

```bash
npx rootnative create my-app
```

It asks for the project name, the display name, the template, and the package manager.

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

Sets up your project for Root Native UI.

```bash
npx rootnative init
```

The command does this:

1. Detects your project type (Expo or bare React Native).
2. Detects your package manager (npm, yarn, pnpm, bun).
3. Detects the path aliases in your `tsconfig.json`.
4. Asks for the component and utility output directories.
5. Creates a `rootnative.json` config file.
6. Offers to add the LLM-docs pointer to the `CLAUDE.md` of your project.
7. Offers to install `@rootnative/core`.

Steps 6 and 7 are confirmation prompts. `-y` accepts both.

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

Adds one or more components to your project.

```bash
npx rootnative add button
npx rootnative add card chip text-field
npx rootnative add appbar  # auto-adds button + icon-button + typography dependencies
```

Options:

| Flag | Description |
|------|-------------|
| `-f, --force` | Overwrite existing components |
| `-d, --dry-run` | Preview what would be installed without writing files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

The `add` command does this:

1. Resolves the full dependency graph (for example, `appbar` requires `button`, `icon-button` and `typography`).
2. Shows a plan of the components, the utilities, and the npm packages to install.
3. Copies the component files, with the import paths rewritten to match your project.
4. Generates a utility barrel file (`rootnative-utils.ts`).
5. Installs the required npm dependencies.

### `rootnative update [components...]`

Updates the installed components to the latest version from the registry.

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

The command finds your local changes with a diff against the registry source. If you changed component files, review the diff with `--dry-run` before you apply the update.

### `rootnative upgrade`

Upgrades `@rootnative/core` to the latest published version and installs each new peer dependency.

```bash
npx rootnative upgrade
```

Options:

| Flag | Description |
|------|-------------|
| `-y, --yes` | Skip confirmation prompt |
| `-a, --all` | Also update all installed component files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

The `upgrade` command does this:

1. Detects the installed `@rootnative/core` version from `node_modules`.
2. Fetches the latest version from the npm registry.
3. Compares the peer dependencies of the installed and the latest version.
4. Shows a plan with the version bump, the new required peer deps, the changed ranges, and the removed deps.
5. Upgrades `@rootnative/core` and installs each new required peer dependency.
6. Reports the optional peer deps that aren't installed (it doesn't install them).
7. Lists the peer deps that are no longer required, so you can remove them by hand.
8. Moves `registryVersion` in `rootnative.json` forward to the new release tag, so later `add` and `update` calls fetch matching sources.
9. With `-a, --all`, also updates the installed component files.

Non-interactive mode for CI/automation:

```bash
npx rootnative upgrade -y
```

### `rootnative list`

Shows all available components with their install status.

```bash
npx rootnative list
```

### `rootnative doctor`

Checks your project for common problems.

```bash
npx rootnative doctor
```

The checks include:

- `rootnative.json` exists and is valid
- `@rootnative/core` is installed
- The React Native version is compatible
- The installed component files are complete
- `@rootnative/inertia` is installed (a hard failure when it is missing, because every animated component needs it)
- The optional peer dependencies (`react-native-safe-area-context`, and `@react-native-vector-icons/material-design-icons` for `mdiResolver`), reported as warnings

## Configuration

`rootnative init` creates a `rootnative.json` in your project root:

```json
{
  "$schema": "https://rootnative.github.io/ui/schema.json",
  "aliases": {
    "components": "@/components/ui",
    "lib": "@/lib"
  },
  "registryUrl": "https://raw.githubusercontent.com/rootnative/ui",
  "registryVersion": "v0.0.0-alpha.4"
}
```

| Field | Description |
|-------|-------------|
| `aliases.components` | The directory where the CLI creates the component folders |
| `aliases.lib` | The directory where the CLI puts the utility files |
| `registryUrl` | The base URL for the component source files |
| `registryVersion` | The Git ref to fetch from (a branch, a tag, or a commit). `init` pins it to the `v<version>` tag of the latest published release. It falls back to `main` only when npm is unreachable, or when nobody pushed the tag yet. `upgrade` moves the pin forward |

## Output structure

After `npx rootnative add button appbar`:

```
src/
  components/
    ui/
      button/
        Button.tsx
        types.ts
        styles.ts
        index.ts
        elevationShadow.ts  # shared internal, flattened per component
        usePressMorph.ts
        useStateLayer.ts
      icon-button/          # auto-added (appbar dependency)
        IconButton.tsx
        types.ts
        styles.ts
        index.ts
        useBooleanProgress.ts
        usePressMorph.ts
        useStateLayer.ts
      typography/           # auto-added (appbar dependency)
        Typography.tsx
        types.ts
        styles.ts
        index.ts
      appbar/
        AppBar.tsx
        types.ts
        styles.ts
        index.ts
        safe-area.tsx
  lib/
    color.ts
    elevation.ts
    pressable.ts
    render-icon.tsx
    rtl.ts
    rootnative-utils.ts    # generated barrel
```

The CLI copies the shared internal hooks (`useStateLayer`, `usePressMorph`, …)
into *each* component directory that uses them, not into a shared folder, so
each installed component stays self-contained.

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
| `layout` | Layout primitives: Box, Row, Column, Grid with responsive columns and spanning cells, and SafeAreaView wrapper |
| `list` | List container with interactive items and dividers |
| `divider` | Horizontal or vertical 1dp rule with optional leading/trailing insets and thickness/color overrides. |
| `loading-indicator` | MD3 Expressive shape-morphing loading spinner (contained + uncontained, determinate + indeterminate) |
| `portal` | Render children into a host elsewhere in the tree (overlays, dialogs, sheets) |
| `dialog` | Basic and full-screen modal dialogs with Icon / Title / Content / Actions slots, scrim, and Android back handling. |
| `snackbar` | Imperative snackbar queue — SnackbarProvider plus useSnackbar() with actions, durations, and safe-area aware placement. |
| `menu` | Anchored dropdown menu (Menu + Menu.Item) that flips and shifts to stay on screen, with self-managing or controlled visibility. |
| `tooltip` | Plain and rich tooltips anchored to a control, shown on hover or a long press |
| `bottom-sheet` | MD3 bottom sheet — modal (scrim) and standard variants, drag handle, velocity-based snap points, drag-to-dismiss. |
| `tabs` | Primary and secondary tab rows, fixed or scrollable, with a sliding active indicator |
| `navigation-bar` | MD3 navigation bar — 80dp bottom destination bar with an animated indicator pill |
| `keyboard-avoiding-wrapper` | Zero-config keyboard-aware wrapper for form layouts |

## Import rewriting

The CLI rewrites the imports, so the copied files work in your project:

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

LLM-optimized reference: https://rootnative.github.io/ui/llms-full.txt. Or read `node_modules/@rootnative/cli/llms.txt` for the exact installed version.

## License

MIT
