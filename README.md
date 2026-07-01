# RootNative UI

[![Node >=18](https://img.shields.io/badge/node-%3E%3D18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![pnpm 9](https://img.shields.io/badge/pnpm-9.x-F69220?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Expo SDK 54](https://img.shields.io/badge/expo-54-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Turborepo](https://img.shields.io/badge/monorepo-turbo-EF4444)](https://turbo.build/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**Design system agnostic component library for React Native**, built as a pnpm + Turborepo monorepo. Ships with a Material Design You theme out of the box — or bring your own design system using the pluggable theme engine.

> [Documentation](https://rootnative.github.io/ui/) &nbsp;|&nbsp; [Live Demo](https://rootnative.github.io/ui/demo/) &nbsp;|&nbsp; [LLM Docs](https://rootnative.github.io/ui/llms-full.txt) &nbsp;|&nbsp; [GitHub](https://github.com/rootnative/ui)

## Try it on your device

Scan the QR code with the [Expo Go](https://expo.dev/go) app to preview components on your device:


<img
  src="https://qr.expo.dev/eas-update?projectId=9bc1e6dd-2f68-433d-813a-4e4bd167298b&runtimeVersion=0.0.0&channel=main"
  alt="Expo Preview QR Code"
  width="200"
  height="200"
/>

## Features

- Pluggable theme engine — use the built-in Material Design You theme or create your own design system
- Token-based theming (colors, typography, shape, spacing, elevation, motion, state)
- Light and dark themes out of the box
- Responsive breakpoint utilities (`useBreakpoint`, `useBreakpointValue`)
- Pluggable icon system — MaterialCommunityIcons by default, or wire up Lucide, Phosphor, SF Symbols, or custom SVGs via the theme's `iconResolver` (adapters in `@rootnative/icons`)
- Subpath exports for tree-shaking (`@rootnative/components/button`, etc.)
- Accessible by default (`role`, `accessibilityLabel`, `accessibilityState`)
- State-layer press/hover/focus feedback
- TypeScript-first with strict mode

## Quick Start

The fastest way to start a new project:

```bash
npx rootnative create my-app
cd my-app
npx expo start
```

The `create` command scaffolds a ready-to-run Expo project with `ThemeProvider` and example components pre-configured. It prompts for project name, display name, and package manager.

### Add to an existing project

```bash
# Install the core theme package
yarn add @rootnative/core

# Install the component library
yarn add @rootnative/components
```

**Peer dependencies** — make sure these are installed in your project:

```bash
npx expo install react react-native react-native-safe-area-context
```

**Optional** — only needed if you plan to use icons in your app:

```bash
npx expo install @expo/vector-icons
```

Prefer Lucide, Phosphor, SF Symbols, or your own SVGs? Add [`@rootnative/icons`](packages/icons) and pass a resolver to `ThemeProvider` — see the [icons guide](https://rootnative.github.io/ui/icons).

Wrap your app with `ThemeProvider` and start using components:

```tsx
import { ThemeProvider, lightTheme } from '@rootnative/core'
import { Button, Typography } from '@rootnative/components'

export default function App() {
  return (
    <ThemeProvider theme={lightTheme}>
      <Typography variant="headlineSmall">Hello UI</Typography>
      <Button variant="filled">Press me</Button>
    </ThemeProvider>
  )
}
```

You can also import individual components via subpath exports:

```tsx
import { Button } from '@rootnative/components/button'
import { Card } from '@rootnative/components/card'
```

## CLI

```bash
npx rootnative create         # Scaffold a new project (interactive)
npx rootnative init           # Initialize existing project for CLI workflow
npx rootnative add button card text-field
```

The `init` + `add` workflow copies component source files directly into your project with imports rewritten to match your aliases — full ownership of the code. See the [CLI README](packages/cli) for the full command reference.

## Docs for AI agents

RootNative UI ships [llms.txt](https://llmstxt.org/) documentation for AI coding agents: [llms.txt](https://rootnative.github.io/ui/llms.txt) (overview) and [llms-full.txt](https://rootnative.github.io/ui/llms-full.txt) (complete API reference) are hosted on the docs site, and every published package ships its own `llms.txt` readable from `node_modules` (e.g. `node_modules/@rootnative/components/llms.txt`). See the [For AI Agents](https://rootnative.github.io/ui/llms) guide for a copy-paste `CLAUDE.md` snippet — projects scaffolded with `rootnative create` include it automatically.

## Packages

| Package | Size | Description |
| --- | --- | --- |
| [`@rootnative/core`](packages/core) | ![install size](https://packagephobia.com/badge?p=@rootnative/core) | Theme engine, theme contracts, built-in Material Design You theme, `ThemeProvider`, `useTheme` hook, responsive utilities. |
| [`@rootnative/components`](packages/components) | ![install size](https://packagephobia.com/badge?p=@rootnative/components) | UI components with subpath exports for tree-shaking. |
| [`@rootnative/icons`](packages/icons) | ![install size](https://packagephobia.com/badge?p=@rootnative/icons) | Icon-resolver adapters for Lucide, Phosphor, and `@expo/vector-icons`, with MDI-name compatibility helpers. |
| [`@rootnative/cli`](packages/cli) | ![install size](https://packagephobia.com/badge?p=@rootnative/cli) | CLI to scaffold components into your project (shadcn/ui-style). |
| [`rootnative`](packages/rootnative) | — | Shorthand wrapper for `@rootnative/cli`. |
| [`@rootnative/utils`](packages/utils) | — | Internal utilities used by components (not published). |
| [`example`](example) | — | Expo Router showcase app for testing and previewing components. |
| [`docs`](docs) | — | Docusaurus documentation site. |

## Repository Layout

```text
.
├── docs/                  # Docusaurus documentation site
├── example/               # Expo Router showcase app
├── packages/
│   ├── core/              # Theme + provider primitives
│   ├── components/        # Reusable UI component library
│   ├── icons/             # Icon-library adapters for the iconResolver
│   ├── cli/               # CLI for scaffolding components into projects
│   ├── rootnative/        # Shorthand CLI wrapper
│   └── utils/             # Internal utilities (not published)
├── templates/             # Quick start templates (used by `rootnative create`)
│   ├── blank/
│   └── with-router/
├── registry/              # Auto-generated component metadata for the CLI
├── scripts/               # Build utilities (registry, llms.txt generators)
├── turbo.json
└── pnpm-workspace.yaml
```

## Development

### Requirements

- Node.js `>=18`
- pnpm `9.x`

### Setup

```bash
pnpm install
```

### Commands

| Command | Description |
| --- | --- |
| `pnpm run build` | Build all packages with Turborepo |
| `pnpm run typecheck` | Type-check all packages (`tsc --noEmit`) |
| `pnpm run lint` | ESLint across example and packages |
| `pnpm run test` | Run tests across all packages |
| `pnpm run format` | Format with Prettier |
| `pnpm run example` | Start the Expo example app |
| `pnpm run clean` | Clean build outputs |
| `pnpm run docs:dev` | Start documentation dev server (first run exports the example app for the homepage demo embed; cached on subsequent runs) |

### Running the Example App

```bash
pnpm run example            # Start Expo dev server

# Or target a specific platform
pnpm --filter example ios
pnpm --filter example android
pnpm --filter example web
```

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | React 19.1, React Native 0.81.5, Expo SDK 54 |
| Language | TypeScript 5 (strict mode) |
| Build | tsup (package bundling), Turborepo (task orchestration) |
| Package Manager | pnpm 9 (workspace protocol) |
| Testing | Jest 29, @testing-library/react-native |
| Documentation | Docusaurus 3 |

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the [MIT License](LICENSE).
