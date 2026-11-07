---
sidebar_position: 2
description: Make a new React Native project with Root Native UI and render your first themed component.
---

# Quick Start

The fastest way to start a new project with Root Native UI.

## Create a new project

```bash
npx rootnative create
```

The CLI asks a few questions:

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

`blank` is the default: a single-screen app with no navigation library, the
smallest thing that runs. Pick a different template with `-t`:

| Template | What you get |
|----------|--------------|
| `blank` (default) | One screen in `App.tsx`, with `ThemeProvider` already around it. No router. |
| `with-router` | [Expo Router](https://docs.expo.dev/router/introduction/) file-based navigation. The screens live in `app/`, with `ThemeProvider` in the root layout. |

```bash
npx rootnative create my-app -t with-router
```

We may add more templates over time. `npx rootnative create --help` lists the
templates that the installed CLI supports.

## What's in the template

The generated project is a ready-to-run Expo app with Root Native UI set up.
For `blank`:

```
my-app/
├── App.tsx               # Home screen, wrapped in ThemeProvider
├── index.ts              # Expo entry point (registerRootComponent)
├── assets/               # App icons and splash screen, Root Native mark
├── app.json              # Expo config with your project name
├── package.json
├── tsconfig.json
├── CLAUDE.md             # Points AI agents at the Root Native LLM docs
└── .gitignore
```

There is no `babel.config.js`. Expo SDK 58 applies `babel-preset-expo` by
default, so the templates ship no Babel config.

The app icon, the adaptive icon, the favicon and the splash screen carry the
Root Native mark, declared through the `expo-splash-screen` plugin in
`app.json`. Replace the files in `assets/` with your own artwork. Keep
`imageWidth` in step with how much of the splash square your mark fills.

`with-router` replaces `App.tsx` and `index.ts` with an `app/` directory that
holds `_layout.tsx` (the root layout) and `index.tsx` (the home screen).

### Where ThemeProvider lives

Every component reads the theme through context, so the template wraps your
app in `ThemeProvider` for you. The `iconResolver` prop renders string icon
names such as `leadingIcon="check"` with MaterialDesignIcons. Both templates
install the icon package and pass the resolver. In `blank` that's `App.tsx`:

```tsx
// App.tsx
import { mdiResolver } from '@rootnative/components/mdi'
import { ThemeProvider } from '@rootnative/core'
import { StatusBar } from 'expo-status-bar'

export default function App() {
  return (
    <ThemeProvider iconResolver={mdiResolver}>
      <HomeScreen />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
```

In `with-router` it's `app/_layout.tsx`, around the `Stack`:

```tsx
// app/_layout.tsx
import { mdiResolver } from '@rootnative/components/mdi'
import { ThemeProvider } from '@rootnative/core'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

export default function RootLayout() {
  return (
    <ThemeProvider iconResolver={mdiResolver}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
```

### Home screen

The home screen shows Typography and Card. Edit `App.tsx` (or `app/index.tsx`
on `with-router`) to start your app.

## Options

You can also pass the project name directly:

```bash
npx rootnative create my-app
```

Skip all prompts with `-y`. It uses the `blank` template, npm, an automatic
display name, and an automatic install:

```bash
npx rootnative create my-app -y
```

Pass `.` to create the project in the directory you are already in, instead of
a new subdirectory. The project name comes from the name of that directory:

```bash
npx rootnative create .
```

See the [CLI reference](./cli#create) for every flag, and for what happens when
the template meets a file that is already there.

## Next steps

- [Theming](./theming): change the color, typography, and shape tokens
- [CLI](./cli): add more components with `npx rootnative add`
- [Components](/introduction#components): see all the components
