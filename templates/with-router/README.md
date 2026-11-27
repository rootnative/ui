# Root Native Quickstart

A ready-to-use Expo project with [Root Native UI](https://github.com/rootnative/ui) and Expo Router pre-configured.

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

- Expo SDK 58 with Expo Router
- `@rootnative/core` — Theme system with Material Design 3 tokens
- `@rootnative/components` — UI components (Button, Card, Typography, and more)
- ThemeProvider already wired up in the root layout
- The web target runs on [`@rootnative/web`](https://rootnative.github.io/web/). To use `react-native-web`, follow the comment in `metro.config.js`
- Example home screen using Typography and Card

## Project Structure

```
app/
├── _layout.tsx       # Root layout with ThemeProvider
└── index.tsx         # Home screen with example components
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
