---
sidebar_position: 2
---

# Quick Start

The fastest way to start a new project with RootNative UI.

## Create a new project

```bash
npx rootnative create
```

The CLI walks you through a few prompts:

```
? Template: Blank
? Project name: my-app
? Display name (shown on home screen): My App
? Package manager: npm
? Install dependencies? Yes
```

That's it. Start the dev server:

```bash
cd my-app
npx expo start
```

## Templates

`blank` is the default — a single-screen app with no navigation library, which
is the smallest thing that runs. Pick a different one with `-t`:

| Template | What you get |
|----------|--------------|
| `blank` (default) | One screen in `App.tsx`, `ThemeProvider` already wrapped around it. No router. |
| `with-router` | [Expo Router](https://docs.expo.dev/router/introduction/) file-based navigation — screens live in `app/`, with `ThemeProvider` in the root layout. |

```bash
npx rootnative create my-app -t with-router
```

More templates may be added over time — `npx rootnative create --help` lists
what the installed CLI supports.

## What's in the template

The generated project is a ready-to-run Expo app with RootNative UI wired up.
For `blank`:

```
my-app/
├── App.tsx               # Home screen, wrapped in ThemeProvider
├── index.js              # Expo entry point (registerRootComponent)
├── assets/               # Placeholder app icons and splash screen
├── app.json              # Expo config with your project name
├── babel.config.js
├── package.json
├── tsconfig.json
├── CLAUDE.md             # Points AI agents at the RootNative LLM docs
└── .gitignore
```

`with-router` swaps `App.tsx` and `index.js` for an `app/` directory holding
`_layout.tsx` (the root layout) and `index.tsx` (the home screen).

### Where ThemeProvider lives

Every component reads the theme through context, so `ThemeProvider` is wrapped
around your app for you. In `blank` that's `App.tsx`:

```tsx
// App.tsx
import { ThemeProvider } from '@rootnative/core'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <ThemeProvider>
      <HomeScreen />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
```

In `with-router` it's `app/_layout.tsx`, wrapping the `Stack`:

```tsx
// app/_layout.tsx
import { ThemeProvider } from '@rootnative/core'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
```

### Home screen

The home screen demonstrates Typography and Card out of the box. Edit
`App.tsx` (or `app/index.tsx` on `with-router`) to start building your app.

## Options

You can also pass the project name directly:

```bash
npx rootnative create my-app
```

Skip all prompts with `-y` (uses the `blank` template, npm, auto display name, auto install):

```bash
npx rootnative create my-app -y
```

See the [CLI reference](./cli#create) for every flag.

## Next steps

- [Theming](./theming) — customize colors, typography, and shape tokens
- [CLI](./cli) — add more components with `npx rootnative add`
- [Components](/introduction#components) — browse all available components
