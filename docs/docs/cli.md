---
sidebar_position: 4
description: Add components to your project as owned source files with the Root Native CLI, in the shadcn/ui model — no component npm package.
---

# CLI

The Root Native CLI adds components to your project as source files. There is no npm package for the components, and you own the code. The model comes from [shadcn/ui](https://ui.shadcn.com).

```bash
npx rootnative init
npx rootnative add button card
```

## Why use the CLI?

With the standard `@rootnative/components` package, the components live in `node_modules`, and you import them as they are. The CLI takes a different approach:

- **Full ownership**: the component source files live in your project, not in `node_modules`
- **Customizable**: change the styles, change the behavior, or remove what you don't need
- **No version lock-in**: you decide when to pull an update
- **Tree-shake friendly**: only the components you use exist in your codebase

The theme system (`@rootnative/core`) stays an npm dependency, so a theme update reaches you through npm.

## Prerequisites

- Node.js >= 18
- Expo SDK 58: React Native `>=0.88.0 <0.89.0` and React `>=19.3.0 <20.0.0`, the band that the published packages declare
- A TypeScript project with path aliases (for example `@/*` → `src/*`)

## Quick start

### 1. Initialize

Run `init` in your React Native or Expo project:

```bash
npx rootnative init
```

The CLI does this:

1. Detects your project type (Expo or bare React Native). It stops here if it finds neither.
2. Detects your package manager (npm, yarn, pnpm, bun).
3. Reads the path aliases from your `tsconfig.json` as the defaults.
4. Asks where to put the components and the utility files.
5. Creates a `rootnative.json` config file, pinned to the current release tag.
6. Adds a `paths` mapping to your `tsconfig.json` when your alias prefix has none.
7. Offers to point AI agents at the [LLM docs](./llms) from your `CLAUDE.md`.
8. Offers to install `@rootnative/core`.

Steps 7 and 8 are confirmation prompts. `-y` accepts both.

### 2. Add components

```bash
npx rootnative add button
```

This copies the Button source files into your project and installs each required dependency.

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

A string icon name such as `leadingIcon="check"` needs an `iconResolver` on
`ThemeProvider`. A copy-paste project doesn't install `@rootnative/components`,
so it doesn't get `mdiResolver` from the npm package. Write the resolver in the
project instead:

```tsx
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons'
import type { IconResolver } from '@rootnative/core'
import type { ComponentProps } from 'react'

type MdiName = ComponentProps<typeof MaterialDesignIcons>['name']

const mdiResolver: IconResolver = (name, { size, color }) => (
  <MaterialDesignIcons name={name as MdiName} size={size} color={color} />
)

<ThemeProvider iconResolver={mdiResolver}>{/* ... */}</ThemeProvider>
```

Install `@react-native-vector-icons/material-design-icons`, and `expo-font` on
Expo, next to it. See the [Icons guide](./icons) for other icon sets.

In a static web export (`web.output: 'static'`), this resolver causes a
hydration mismatch. The icon set draws the glyph on the server, but on the
client it draws nothing until the font loads. Render the icon with no name
while the page hydrates, as `mdiResolver` from `@rootnative/components/mdi`
does.

## Commands

### `create`

Creates a new project with Root Native UI set up. See [Quick Start](./quick-start) for the full steps.

```bash
npx rootnative create
npx rootnative create my-app
npx rootnative create .
```

The CLI asks for the template, the project name, the display name, and the package manager. Then it makes a ready-to-run Expo project with `ThemeProvider` and example components.

**To create the project in the current directory**, pass `.` as the name. The CLI writes the template into the directory you are in, and takes the project name from the name of that directory. It never deletes your directory. If the template would overwrite a file that is already there, for example an existing `.gitignore` or `README.md`, the CLI lists each file and asks first. With `-y` it stops instead, and changes nothing.

A named project goes into a new subdirectory. If that subdirectory already exists, the CLI asks to delete it and all of its contents. With `-y` it stops instead.

**Options:**

| Flag | Description |
|------|-------------|
| `-y`, `--yes` | Skip prompts and use defaults |
| `-t`, `--template <name>` | Template to use: `blank` (default) or `with-router` |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

### `init`

Sets up your project for Root Native UI.

```bash
npx rootnative init
```

If `rootnative.json` already exists, the CLI asks whether to overwrite it.

**Options:**

| Flag | Description |
|------|-------------|
| `-y`, `--yes` | Skip prompts and use defaults |
| `--components-alias <alias>` | Components install path alias (e.g. `@/components/ui`) |
| `--lib-alias <alias>` | Utility files path alias (e.g. `@/lib`) |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

**What `init` writes:**

1. `rootnative.json`: your aliases, plus a `registryVersion` pinned to the release tag
   that matches the latest published `@rootnative/core`.
2. A `paths` mapping in `tsconfig.json` for your alias prefix, when there is none.
   `add` rewrites every generated import to that alias, so without the mapping
   TypeScript can't resolve any of them. `init` never overwrites an existing mapping.
3. A pointer to the LLM docs in `CLAUDE.md`, if you accept the prompt.

If `init` can't pin `registryVersion` to a release tag (npm is unreachable, or nobody
pushed the tag yet), it warns and falls back to `main`. Take that warning seriously.
`main` is the development branch, and component source from it can use
`@rootnative/core` APIs that your installed release doesn't export yet.

### `add`

Adds one or more components to your project.

```bash
npx rootnative add button
npx rootnative add card chip text-field
npx rootnative add appbar
```

**Automatic dependency resolution.** If a component depends on other components, the CLI adds them too. For example, `appbar` depends on `button`, `icon-button`, `portal`, `tooltip` and `typography`, so the CLI adds all six together.

**Options:**

| Flag | Description |
|------|-------------|
| `-y`, `--yes` | Skip prompts and use defaults |
| `--force`, `-f` | Overwrite existing component files |
| `--dry-run`, `-d` | Preview what would be installed without writing any files |
| `--package-manager <pm>` | Package manager to use (npm, yarn, pnpm, bun) |

**What happens when you run `add`:**

1. The CLI fetches the component registry and checks the requested names.
2. It resolves the full dependency graph.
3. It shows a summary of what it will install: components, utilities, and npm packages.
4. After your confirmation, it copies the utility files to your `lib/` directory.
5. It generates a barrel file (`rootnative-utils.ts`) that re-exports only the utilities your installed components need.
6. It fetches the component source files from the registry.
7. It rewrites the import paths to match the alias configuration of your project.
8. It installs each required npm package with your package manager.

### `update`

Updates the installed components to the latest version from the registry.

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

Upgrades `@rootnative/core` to the latest version and installs each new peer dependency.

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

Shows all available components with their install status.

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

The version is the version of the registry, which follows the latest published
release. `installed` means that the directory of the component exists under
your configured components alias.

### `doctor`

Finds common problems in your project.

```bash
npx rootnative doctor
```

The checks:

| Check | Description | On failure |
|-------|-------------|------------|
| Config | `rootnative.json` exists. Missing is not an error — a project that uses the published packages never needs one | info |
| Project type | An Expo or bare React Native project was detected | fail |
| React Native | `react-native` is present in your dependencies (the version is reported, not enforced) | fail |
| Core package | `@rootnative/core` is installed | fail |
| TypeScript | `tsconfig.json` present | warn |
| Component integrity | Every installed component directory has an `index.ts`. Skipped without a config | warn |
| Utility barrel | `rootnative-utils.ts` exists. Skipped without a config | warn |
| Animation engine | `@rootnative/inertia` is installed — every animated component imports it | fail |
| Required peers | `react-native-svg` is installed — the `@rootnative/components` barrel requires it at load time | fail |
| Optional peers | `react-native-safe-area-context` status, and `@react-native-vector-icons/material-design-icons` status (needed only by `mdiResolver`) | warn |

Only the `fail` rows count in the issue total of the summary line. The `info` rows never
do, so `doctor` runs and exits with zero on a project straight out of `create`.

## Configuration

`rootnative init` creates a `rootnative.json` file in your project root:

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
| `aliases.components` | `@/components/ui` | The directory where the CLI creates the component folders |
| `aliases.lib` | `@/lib` | The directory where the CLI puts the utility files |
| `registryUrl` | GitHub raw URL | The base URL for the source files |
| `registryVersion` | the current release tag | The Git ref to fetch from (a tag, a branch name, or a commit hash) |

`init` pins `registryVersion` to the `v<version>` tag that matches the latest
published `@rootnative/core`, so `add` and `update` fetch reproducible source.
It falls back to `main` only when npm is unreachable, or when nobody pushed the
tag yet. A pinned project doesn't get new component source on its own.
`rootnative upgrade` moves the pin forward. See
[API stability](./api-stability#registry-pinning).

### Path aliases

The CLI uses the path aliases of your `tsconfig.json` to generate clean import paths. If your project has:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Then `aliases.components` of `@/components/ui` maps to `src/components/ui/` on disk, and the generated imports use `@/components/ui/button` instead of relative paths.

> **Note:** If you use `~/*` instead of `@/*`, the CLI detects that and changes the default aliases to match.

## Project structure

After `npx rootnative add appbar`, your project looks like this. `appbar` pulls in five components, so the CLI installs all six:

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
│       ├── portal/                  ← auto-added (appbar dependency)
│       │   ├── Portal.tsx
│       │   ├── PortalHost.tsx
│       │   ├── context.ts
│       │   ├── layers.ts
│       │   ├── store.ts
│       │   ├── types.ts
│       │   ├── styles.ts
│       │   ├── index.ts
│       │   ├── pointerEvents.ts     ← shared file, flattened in
│       │   └── warnOnce.ts          ← shared file, flattened in
│       ├── tooltip/                 ← auto-added (appbar dependency)
│       │   ├── Tooltip.tsx
│       │   ├── types.ts
│       │   ├── styles.ts
│       │   ├── index.ts
│       │   ├── plainText.ts
│       │   ├── pointerEvents.ts
│       │   ├── pressableKeyDown.ts
│       │   ├── useAnchorPosition.ts
│       │   ├── useBackHandlerDismiss.ts
│       │   └── warnOnce.ts
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

**Component files.** Each component is a self-contained directory with the same structure as the library source: the component file, the types, the styles, and an index barrel.

**Shared files.** The CLI **copies the hooks and helpers that several components share** (`useStateLayer`, `usePressMorph`, `useBooleanProgress`, `elevationShadow`, `safe-area`) into the directory of each component, not into `lib/`, and rewrites their imports to local paths. So every component directory is self-contained, and you can delete it on its own. The cost is a duplicate file when two components need it: `usePressMorph.ts` above lands in both `button/` and `icon-button/`. These files are library internals, not API; see [API stability](./api-stability#copy-pasted-component-source).

**Utility files.** Small helper functions that the components depend on. The CLI copies them from `@rootnative/utils` (not published to npm) into your `lib/` directory. It copies only the utilities that your installed components need.

**Barrel file.** The CLI generates `rootnative-utils.ts`. It re-exports only the functions your components use:

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

The CLI rewrites the imports in the copied component files, so they work in your project:

| Original (library source) | Rewritten to |
|---------------------------|-------------|
| `from '@rootnative/core'` | Unchanged (npm package) |
| `from '@rootnative/inertia'` | Unchanged (npm package) |
| `from '@rootnative/utils'` | `from '@/lib/rootnative-utils'` |
| `from '../icon-button'` | `from '@/components/ui/icon-button'` |
| `from '../internal/useStateLayer'` | `from './useStateLayer'` (flattened into the directory of the component) |
| `from '../safe-area'` | `from './safe-area'` (the same flattening) |
| `from './styles'` | Unchanged (same directory) |

## Available components

All 37, with the components that each one pulls in. The descriptions match
what `npx rootnative list` prints, because both read the same registry.

| Component | Dependencies | Description |
|-----------|-------------|-------------|
| `appbar` | button, icon-button, layout, portal, tooltip, typography | Top app bar with 4 variants (small, center-aligned, medium, large) and SafeAreaView support |
| `avatar` | — | Circular avatar with image, icon, or text initials and 5 sizes (extraSmall to extraLarge) |
| `badge` | — | Small 6dp dot or 16dp count badge anchored to an icon, with max cap and NavigationBar support |
| `bottom-app-bar` | fab, icon-button, layout | MD3 bottom app bar — 80dp bar with up to four icon actions at the start and a flat FAB at the end |
| `bottom-sheet` | portal | MD3 bottom sheet — modal (scrim) and standard variants, drag handle, velocity-based snap points, drag-to-dismiss |
| `button` | progress | MD3 button with 5 variants (filled, elevated, outlined, text, tonal) and icon support |
| `button-group` | — | Standard and connected button groups with single or multi-select toggle behavior; replaces the deprecated MD3 segmented button |
| `card` | — | Surface container with 3 variants (elevated, filled, outlined) and optional press handler |
| `carousel` | — | Multi-browse, hero, uncontained and full-screen carousels with MD3 keyline masking and snap |
| `checkbox` | — | Binary selection control with checked/unchecked states and customizable colors |
| `chip` | — | Input chip with 4 variants (assist, filter, input, suggestion) and icon/avatar support |
| `dialog` | icon-button, portal | Basic and full-screen modal dialogs with Icon / Title / Content / Actions slots, scrim, and Android back handling |
| `divider` | — | Horizontal or vertical 1dp rule with optional leading/trailing insets and thickness/color overrides |
| `fab` | — | Floating action button with 4 color variants (primary, secondary, tertiary, surface), 3 sizes (small, medium, large), and optional extended label |
| `icon` | — | Any IconSource (name, element, or render function) rendered through the theme's iconResolver, decorative or labelled |
| `icon-button` | — | Icon-only button with 4 variants (filled, tonal, outlined, standard) and toggle support |
| `keyboard-avoiding-wrapper` | — | Zero-config keyboard-aware wrapper with platform-specific behavior for form layouts |
| `layout` | — | Layout primitives: Box, Row, Column, Container (a centred column with a maximum width), Grid (flexbox utilities), and Layout (SafeAreaView wrapper) |
| `list` | divider | List container with interactive items, supporting headline/trailing text and dividers |
| `loading-indicator` | — | MD3 Expressive shape-morphing loading spinner (contained + uncontained, determinate + indeterminate) |
| `menu` | portal | Anchored dropdown menu (Menu + Menu.Item) that flips and shifts to stay on screen, with self-managing or controlled visibility |
| `navigation-drawer` | divider, portal | MD3 navigation drawer — modal (scrim, slide from the start edge) and standard variants with sections, headlines, badges, and dividers |
| `navigation-bar` | badge, layout | MD3 navigation bar — 80dp bottom destination bar with an animated indicator pill |
| `navigation-rail` | navigation-bar | MD3 navigation rail — 80dp side rail of destinations with an optional header, three alignments, and the NavigationBar indicator pill |
| `portal` | — | Render children into a host elsewhere in the tree (Portal + PortalHost) for overlays like dialogs, sheets, and tooltips |
| `progress` | — | Linear and circular progress indicators with determinate and indeterminate modes |
| `radio` | — | Single-choice selection control with selected/unselected states |
| `search-bar` | icon-button | MD3 search bar — 56dp pill with a leading search or navigation icon, a clear button, and trailing icon actions or an avatar |
| `search-view` | divider, icon-button, portal, search-bar | MD3 search view — the panel that opens from a search bar, full screen on a compact window and docked on a wider one, with a focus trap and Android back handling |
| `side-sheet` | divider, icon-button, portal | MD3 side sheet — modal (scrim, slide from the end edge) and standard variants with a headline, back and close buttons, scrolling content, and an action row |
| `skeleton` | — | Pulsing loading placeholder block that matches the shape of the content it stands in for |
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
| Customization | Edit the source directly | Override through props and the theme only |
| Updates | Run `add --force` again when you choose | `npm update` |
| Bundle size | Only what you add | Tree-shaking at build time |
| Setup | `npx rootnative init` | `pnpm add @rootnative/components` |

Both approaches use `@rootnative/core` for the theme. They are fully compatible, and you can mix them in one project.
