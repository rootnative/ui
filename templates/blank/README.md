# RootNative Quickstart

A ready-to-use Expo project with [RootNative UI](https://github.com/rootnative/ui) pre-configured.

## Getting Started

The recommended way to create this project is via the CLI:

```bash
npx rootnative create
```

Or if you cloned this template directly:

```bash
npm install
npx expo start
```

Then press `i` for iOS, `a` for Android, or `w` for web.

## What's Included

- Expo SDK 54
- `@rootnative/core` — Theme system with Material Design 3 tokens
- `@rootnative/components` — UI components (Button, Card, Typography, and more)
- ThemeProvider already wired up
- Example home screen using Typography and Card

## Project Structure

```
App.tsx               # ThemeProvider and the example home screen
index.js              # Expo entry point (registerRootComponent)
assets/               # App icons and splash screen
app.json              # Expo config
babel.config.js
package.json
tsconfig.json
CLAUDE.md             # Points AI agents at the RootNative LLM docs
```

## Learn More

- [Quick Start Guide](https://rootnative.github.io/ui/quick-start)
- [RootNative Docs](https://rootnative.github.io/ui)
- [Component API Reference](https://rootnative.github.io/ui/llms-full.txt)
- [GitHub](https://github.com/rootnative/ui)
