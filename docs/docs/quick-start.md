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

## What's in the template

The generated project is a ready-to-run Expo app with RootNative UI wired up:

```
my-app/
├── app/
│   ├── _layout.tsx       # Root layout with ThemeProvider
│   └── index.tsx         # Home screen with example components
├── assets/               # Placeholder app icons and splash screen
├── app.json              # Expo config with your project name
├── babel.config.js
├── package.json
├── tsconfig.json
└── .gitignore
```

### Root layout

`ThemeProvider` is already configured in the root layout:

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { ThemeProvider } from '@rootnative/core'

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

The home screen demonstrates Buttons and Cards out of the box. Edit `app/index.tsx` to start building your app.

## Options

You can also pass the project name directly:

```bash
npx rootnative create my-app
```

Skip all prompts with `-y` (uses defaults: npm, auto display name, auto install):

```bash
npx rootnative create my-app -y
```

## Next steps

- [Theming](./theming) — customize colors, typography, and shape tokens
- [CLI](./cli) — add more components with `npx rootnative add`
- [Components](/introduction#components) — browse all available components
