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
npx rootnative add appbar  # also adds the components that appbar depends on
```

Options:

| Flag | Description |
|------|-------------|
| `-f, --force` | Overwrite existing components |
| `-d, --dry-run` | Preview what would be installed without writing files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

The `add` command does this:

1. Resolves the full dependency graph (for example, `appbar` requires `button`, `icon-button`, `layout`, `portal`, `tooltip` and `typography`, and `button` requires `progress`).
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
- `react-native-svg` is installed (a hard failure when it is missing, because the `@rootnative/components` barrel requires it at load time)
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

After `npx rootnative add button appbar`, the CLI installs eight directories: the two that you asked for, and the six components that they depend on. Each directory holds its own files and the shared internal files that it imports, in the same way as `appbar/`:

```
src/
  components/
    ui/
      appbar/
        AppBar.tsx
        index.ts
        styles.ts
        types.ts
        resolveAnimatedInsetKey.ts  # shared internal, flattened per component
        safe-area.tsx
        useMaterialTheme.ts
        warnOnce.ts
      button/
      icon-button/          # auto-added (appbar dependency)
      layout/               # auto-added (appbar dependency)
      portal/               # auto-added (appbar dependency)
      progress/             # auto-added (button dependency)
      tooltip/              # auto-added (appbar dependency)
      typography/           # auto-added (appbar dependency)
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

The descriptions match what `npx rootnative list` prints, because both read the same registry.

| Component | Description |
|-----------|-------------|
| `appbar` | Top app bar with 4 variants (small, center-aligned, medium, large) and SafeAreaView support. |
| `avatar` | Circular avatar with image, icon, or text initials and 5 sizes (extraSmall to extraLarge). |
| `badge` | Small 6dp dot or 16dp count badge anchored to an icon, with max cap and NavigationBar support. |
| `bottom-app-bar` | MD3 bottom app bar — 80dp bar with up to four icon actions at the start and a flat FAB at the end |
| `bottom-sheet` | MD3 bottom sheet — modal (scrim) and standard variants, drag handle, velocity-based snap points, drag-to-dismiss. |
| `button` | MD3 button with 5 variants (filled, elevated, outlined, text, tonal) and icon support. |
| `button-group` | Standard and connected button groups with single or multi-select toggle behavior; replaces the deprecated MD3 segmented button. |
| `card` | Surface container with 3 variants (elevated, filled, outlined), optional press handler, and Media / Content / Actions region slots. |
| `carousel` | Multi-browse, hero, uncontained and full-screen carousels with MD3 keyline masking, snapping, and pressable items. |
| `checkbox` | Binary selection control with checked/unchecked states and customizable colors. |
| `chip` | Input chip with 4 variants (assist, filter, input, suggestion) and icon/avatar support. |
| `dialog` | Basic and full-screen modal dialogs with Icon / Title / Content / Actions slots, scrim, and Android back handling. |
| `divider` | Horizontal or vertical 1dp rule with optional leading/trailing insets and thickness/color overrides. |
| `fab` | Floating action button with 4 color variants (primary, secondary, tertiary, surface), 3 sizes (small, medium, large), and optional extended label. |
| `icon` | Any IconSource (name, element, or render function) rendered through the theme's iconResolver, decorative or labelled. |
| `icon-button` | Icon-only button with 4 variants (filled, tonal, outlined, standard) and toggle support. |
| `keyboard-avoiding-wrapper` | Zero-config keyboard-aware wrapper with platform-specific behavior for form layouts. |
| `layout` | Layout primitives: Box, Row, Column, Container (a centred column with a maximum width), Grid with responsive columns and spanning cells, and Layout (SafeAreaView wrapper). |
| `list` | List container with interactive items, supporting headline/trailing text and dividers. |
| `loading-indicator` | MD3 Expressive shape-morphing loading spinner (contained + uncontained, determinate + indeterminate) |
| `menu` | Anchored dropdown menu (Menu, Menu.Item, Menu.Group) that flips and shifts to stay on screen, with self-managing or controlled visibility. |
| `navigation-bar` | MD3 navigation bar — 80dp bottom destination bar with an animated indicator pill |
| `navigation-drawer` | MD3 navigation drawer — modal (scrim, slide from the start edge) and standard variants with sections, headlines, badges, and dividers. |
| `navigation-rail` | MD3 navigation rail — 80dp side rail of destinations with an optional header, three alignments, and the NavigationBar indicator pill. |
| `portal` | Render children into a host elsewhere in the tree (Portal + PortalHost) for overlays like dialogs, sheets, and tooltips. |
| `progress` | Linear and circular progress indicators with determinate and indeterminate modes. |
| `radio` | Single-choice selection control with selected/unselected states. |
| `search-bar` | MD3 search bar — 56dp pill with a leading search or navigation icon, a clear button, and trailing icon actions or an avatar |
| `search-view` | MD3 search view — the panel that opens from a search bar, full screen on a compact window and docked on a wider one, with a focus trap and Android back handling |
| `side-sheet` | MD3 side sheet — modal (scrim, slide from the end edge) and standard variants with a headline, back and close buttons, scrolling content, and an action row |
| `skeleton` | Pulsing loading placeholder block that matches the shape of the content it stands in for |
| `slider` | Single-thumb or range slider with continuous and discrete (stepped) modes and optional centered origin. |
| `snackbar` | Imperative snackbar queue — SnackbarProvider plus useSnackbar() with actions, durations, and safe-area aware placement. |
| `switch` | Toggle control with optional icons and customizable thumb/track colors. |
| `tabs` | Primary and secondary tab rows, fixed or scrollable, with a sliding active indicator |
| `text-field` | Text input with animated floating label, 2 variants (filled, outlined), and icon support. |
| `tooltip` | Plain and rich tooltips anchored to a control, shown on hover or a long press |
| `typography` | Text component using the MD3 type scale — 15 base variants (displayLarge to labelSmall) plus their Expressive *Emphasized counterparts. |

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
