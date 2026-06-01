# RootNative Quickstart

A ready-to-use Expo project with [RootNative UI](https://github.com/rootnative/ui) and Expo Router pre-configured.

## Getting Started

The recommended way to create this project is via the CLI:

```bash
npx rootnative create --template with-router
```

Or if you cloned this template directly:

```bash
npm install
npx expo start
```

Then press `i` for iOS, `a` for Android, or `w` for web.

## What's Included

- Expo SDK 54 with Expo Router
- `@rootnative/core` — Theme system with Material Design 3 tokens
- `@rootnative/components` — UI components (Button, Card, Typography, and more)
- ThemeProvider already wired up in the root layout
- Example home screen with Buttons and Cards

## Project Structure

```
app/
├── _layout.tsx       # Root layout with ThemeProvider
└── index.tsx         # Home screen with example components
assets/               # App icons and splash screen
app.json              # Expo config
package.json
tsconfig.json
```

## Learn More

- [Quick Start Guide](https://rootnative.github.io/ui/quick-start)
- [RootNative Docs](https://rootnative.github.io/ui)
- [Component API Reference](https://rootnative.github.io/ui/llms-full.txt)
- [GitHub](https://github.com/rootnative/ui)
