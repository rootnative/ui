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

1. Detect your project type (Expo or bare React Native) — it stops here if it finds neither
2. Detect your package manager (npm, yarn, pnpm, bun)
3. Read path aliases from your `tsconfig.json` to seed the defaults
4. Ask where to place components and utility files
5. Create an `rootnative.json` config file, pinned to the current release tag
6. Offer to point AI agents at the [LLM docs](./llms) from your `CLAUDE.md`
7. Offer to install `@rootnative/core`

Steps 6 and 7 are confirmation prompts; `-y` accepts both.

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

The CLI prompts for template, project name, display name, and package manager, then scaffolds a ready-to-run Expo project with `ThemeProvider` and example components.

**Options:**

| Flag | Description |
|------|-------------|
| `-y`, `--yes` | Skip prompts and use defaults |
| `-t`, `--template <name>` | Template to use: `blank` (default) or `with-router` |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

### `init`

Initialize your project for RootNative UI.

```bash
npx rootnative init
```

If `rootnative.json` already exists, you'll be asked whether to overwrite it.

**Options:**

| Flag | Description |
|------|-------------|
| `-y`, `--yes` | Skip prompts and use defaults |
| `--components-alias <alias>` | Components install path alias (e.g. `@/components/ui`) |
| `--lib-alias <alias>` | Utility files path alias (e.g. `@/lib`) |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

### `add`

Add one or more components to your project.

```bash
npx rootnative add button
npx rootnative add card chip text-field
npx rootnative add appbar
```

**Automatic dependency resolution** — if a component depends on other components, they are added automatically. For example, `appbar` depends on `button`, `icon-button` and `typography`, so all four are added together.

**Options:**

| Flag | Description |
|------|-------------|
| `--force`, `-f` | Overwrite existing component files |
| `--dry-run`, `-d` | Preview what would be installed without writing any files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

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
Available components (v<registry version>):

  Name                        Status          Description
  ----------------------------------------------------------------------
  button                      installed       MD3 button with 5 variants...
  card                        -               Surface container with 3...
  ...
```

The version is the registry's, which tracks the latest published release.
`installed` means the component's directory exists under your configured
components alias.

### `doctor`

Diagnose common issues in your project.

```bash
npx rootnative doctor
```

Checks performed:

| Check | Description | On failure |
|-------|-------------|------------|
| Config | `rootnative.json` exists — everything below is skipped without it | fail |
| Project type | An Expo or bare React Native project was detected | fail |
| React Native | `react-native` is present in your dependencies (the version is reported, not enforced) | fail |
| Core package | `@rootnative/core` is installed | fail |
| TypeScript | `tsconfig.json` present | warn |
| Component integrity | Every installed component directory has an `index.ts` | warn |
| Utility barrel | `rootnative-utils.ts` exists | warn |
| Animation engine | `@rootnative/inertia` is installed — every animated component imports it | fail |
| Optional peers | `react-native-safe-area-context` and `@expo/vector-icons` status | warn |

Only `fail` rows count toward the issue total in the summary line.

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
  "registryVersion": "v0.0.0-alpha.4"
}
```

| Field | Default | Description |
|-------|---------|-------------|
| `aliases.components` | `@/components/ui` | Directory where component folders are created |
| `aliases.lib` | `@/lib` | Directory where utility files are placed |
| `registryUrl` | GitHub raw URL | Base URL for fetching source files |
| `registryVersion` | the current release tag | Git ref to fetch from (tag, branch name, or commit hash) |

`init` pins `registryVersion` to the `v<version>` tag matching the latest
published `@rootnative/core`, so `add` and `update` fetch reproducible source.
It falls back to `main` only when npm is unreachable or the tag hasn't been
pushed yet. A pinned project doesn't pick up new component source on its
own — `rootnative upgrade` moves the pin forward. See
[API stability](./api-stability#registry-pinning).

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

After running `npx rootnative add appbar`, your project looks like this — `appbar` pulls in three components, so all four are installed:

```
src/
├── components/
│   └── ui/
│       ├── appbar/
│       │   ├── AppBar.tsx
│       │   ├── types.ts
│       │   ├── styles.ts
│       │   ├── index.ts
│       │   └── safe-area.tsx        ← shared file, flattened in
│       ├── button/                  ← auto-added (appbar dependency)
│       │   ├── Button.tsx
│       │   ├── types.ts
│       │   ├── styles.ts
│       │   ├── index.ts
│       │   ├── elevationShadow.ts   ← shared file, flattened in
│       │   ├── usePressMorph.ts     ← shared file, flattened in
│       │   └── useStateLayer.ts     ← shared file, flattened in
│       ├── icon-button/             ← auto-added (appbar dependency)
│       │   ├── IconButton.tsx
│       │   ├── types.ts
│       │   ├── styles.ts
│       │   ├── index.ts
│       │   ├── useBooleanProgress.ts
│       │   ├── usePressMorph.ts
│       │   └── useStateLayer.ts
│       └── typography/              ← auto-added (appbar dependency)
│           ├── Typography.tsx
│           ├── types.ts
│           ├── styles.ts
│           └── index.ts
└── lib/
    ├── color.ts                     ← alphaColor, blendColor
    ├── elevation.ts                 ← shadow/elevation helpers
    ├── pressable.ts                 ← Pressable style resolution
    ├── render-icon.tsx              ← icon resolution
    ├── rtl.ts                       ← RTL layout helpers
    └── rootnative-utils.ts          ← generated barrel (re-exports used utilities)
```

### What gets copied

**Component files** — each component is a self-contained directory with the same structure as the library source: the component file, types, styles, and an index barrel.

**Shared files** — hooks and helpers that several components share (`useStateLayer`, `usePressMorph`, `useBooleanProgress`, `elevationShadow`, `safe-area`) are **copied into each component's own directory** rather than into `lib/`, and their imports are rewritten to be local. That keeps every component directory self-contained and independently deletable, at the cost of duplicating a file when two components need it — `usePressMorph.ts` above lands in both `button/` and `icon-button/`. These are library internals, not API: see [API stability](./api-stability#copy-pasted-component-source).

**Utility files** — small helper functions that components depend on. These are copied from `@rootnative/utils` (which is not published to npm) into your `lib/` directory. Only the utilities needed by your installed components are copied.

**Barrel file** — `rootnative-utils.ts` is auto-generated and re-exports only the functions your components use:

```ts
// Auto-generated by rootnative CLI. Do not edit.
export { alphaColor, blendColor } from './color'
export { elevationStyle } from './elevation'
export { resolvePressableStyle, resolveColorFromStyle } from './pressable'
export type { PressableState, PressableStyleProp } from './pressable'
export { renderIcon } from './render-icon'
export type { IconSource } from './render-icon'
export { transformOrigin, selectRTL } from './rtl'
```

### Import rewriting

The CLI rewrites imports in copied component files so they work in your project:

| Original (library source) | Rewritten to |
|---------------------------|-------------|
| `from '@rootnative/core'` | Unchanged — npm package |
| `from '@rootnative/inertia'` | Unchanged — npm package |
| `from '@rootnative/utils'` | `from '@/lib/rootnative-utils'` |
| `from '../icon-button'` | `from '@/components/ui/icon-button'` |
| `from '../internal/useStateLayer'` | `from './useStateLayer'` — flattened into the component's own directory |
| `from '../safe-area'` | `from './safe-area'` — same flattening |
| `from './styles'` | Unchanged — same directory |

## Available components

All 28, with the components each one pulls in automatically. Descriptions match
what `npx rootnative list` prints, since both read the same registry.

| Component | Dependencies | Description |
|-----------|-------------|-------------|
| `appbar` | button, icon-button, typography | Top app bar with 4 variants (small, center-aligned, medium, large) and SafeAreaView support |
| `avatar` | — | Circular avatar with image, icon, or text initials and 5 sizes (xSmall to xLarge) |
| `bottom-sheet` | portal | MD3 bottom sheet — modal (scrim) and standard variants, drag handle, velocity-based snap points, drag-to-dismiss |
| `button` | — | MD3 button with 5 variants (filled, elevated, outlined, text, tonal) and icon support |
| `button-group` | — | Standard and connected button groups with single or multi-select toggle behavior; replaces the deprecated MD3 segmented button |
| `card` | — | Surface container with 3 variants (elevated, filled, outlined) and optional press handler |
| `checkbox` | — | Binary selection control with checked/unchecked states and customizable colors |
| `chip` | — | Input chip with 4 variants (assist, filter, input, suggestion) and icon/avatar support |
| `dialog` | icon-button, portal | Basic and full-screen modal dialogs with Icon / Title / Content / Actions slots, scrim, and Android back handling |
| `divider` | — | Horizontal or vertical 1dp rule with optional leading/trailing insets and thickness/color overrides |
| `fab` | — | Floating action button with 4 color variants (primary, secondary, tertiary, surface), 3 sizes (small, medium, large), and optional extended label |
| `icon-button` | — | Icon-only button with 4 variants (filled, tonal, outlined, standard) and toggle support |
| `keyboard-avoiding-wrapper` | — | Zero-config keyboard-aware wrapper with platform-specific behavior for form layouts |
| `layout` | — | Layout primitives: Box, Row, Column, Grid (flexbox utilities), and Layout (SafeAreaView wrapper) |
| `list` | divider | List container with interactive items, supporting headline/trailing text and dividers |
| `loading-indicator` | — | MD3 Expressive shape-morphing loading spinner (contained + uncontained, determinate + indeterminate) |
| `menu` | portal | Anchored dropdown menu (Menu + Menu.Item) that flips and shifts to stay on screen, with self-managing or controlled visibility |
| `navigation-bar` | — | MD3 navigation bar — 80dp bottom destination bar with an animated indicator pill |
| `portal` | — | Render children into a host elsewhere in the tree (Portal + PortalHost) for overlays like dialogs, sheets, and tooltips |
| `progress` | — | Linear and circular progress indicators with determinate and indeterminate modes |
| `radio` | — | Single-choice selection control with selected/unselected states |
| `slider` | — | Single-thumb or range slider with continuous and discrete (stepped) modes and optional centered origin |
| `snackbar` | button, icon-button, portal | Imperative snackbar queue — SnackbarProvider plus useSnackbar() with actions, durations, and safe-area aware placement |
| `switch` | — | Toggle control with optional icons and customizable thumb/track colors |
| `tabs` | divider | Primary and secondary tab rows, fixed or scrollable, with a sliding active indicator |
| `text-field` | — | Text input with animated floating label, 2 variants (filled, outlined), and icon support |
| `tooltip` | portal | Plain and rich tooltips anchored to a control, shown on hover or a long press |
| `typography` | — | Text component using MD3 type scale with 15 variants (displayLarge to labelSmall) |

## Comparison with npm packages

| | CLI (`npx rootnative add`) | npm (`@rootnative/components`) |
|---|---|---|
| Component code lives in | Your project (`src/`) | `node_modules/` |
| Customization | Edit source directly | Override via props/theme only |
| Updates | Re-run `add --force` when you choose | `npm update` |
| Bundle size | Only what you add | Tree-shaking at build time |
| Setup | `npx rootnative init` | `pnpm add @rootnative/components` |

Both approaches use `@rootnative/core` for theming — they are fully compatible and you can even mix them in the same project.
