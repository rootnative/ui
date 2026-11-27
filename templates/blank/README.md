# Root Native Quickstart

A ready-to-use Expo project with [Root Native UI](https://github.com/rootnative/ui) pre-configured.

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

- Expo SDK 58
- `@rootnative/core` — Theme system with Material Design 3 tokens
- `@rootnative/components` — UI components (Button, Card, Typography, and more)
- ThemeProvider already wired up
- The web target runs on [`@rootnative/web`](https://rootnative.github.io/web/). To use `react-native-web`, follow the comment in `metro.config.js`
- Example home screen using Typography and Card

## Project Structure

```
App.tsx               # ThemeProvider and the example home screen
index.ts              # Expo entry point (registerRootComponent)
assets/               # App icons and splash screen
app.json              # Expo config
metro.config.js       # Runs the web target on @rootnative/web
package.json
tsconfig.json
CLAUDE.md             # Points AI agents at the Root Native LLM docs
```

## Learn More

- [Quick Start Guide](https://rootnative.github.io/ui/quick-start)
- [Root Native Docs](https://rootnative.github.io/ui)
- [Component API Reference](https://rootnative.github.io/ui/llms-full.txt)
- [GitHub](https://github.com/rootnative/ui)
