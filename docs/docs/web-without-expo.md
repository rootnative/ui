---
sidebar_position: 4
description: Use RootNative UI on web with Vite or webpack and no Expo — the react-native-web alias, the worklets Babel plugin on node_modules, the globals, and the Electron notes.
---

# Web without Expo

Expo and Metro do five things for a web app that a plain bundler does not. This
page lists them, with a Vite config and a webpack config that do the same. Use
it for a Vite or webpack site, an Electron or Tauri renderer, or any host that
runs `react-native-web` without Metro.

The recipe was built with Vite 8, `@rolldown/plugin-babel`, `react-native-web`
0.21 and Electron 31 on macOS. Each line of config below exists because a
build without it failed in a specific way. The [symptoms table](#symptoms)
maps each failure back to its line.

## Install

Install the library and its peers. `react-native` is a type and peer
dependency only; `react-native-web` is what runs.

<PackageManagerTabs cmd="npm install @rootnative/core @rootnative/components react react-dom react-native react-native-web react-native-reanimated react-native-worklets react-native-safe-area-context react-native-svg" />

Then the Babel toolchain that compiles the worklets:

<PackageManagerTabs cmd="npm install -D @babel/core @rolldown/plugin-babel" />

For webpack, install `babel-loader` instead of `@rolldown/plugin-babel`.

## The five things Metro does

### 1. Alias `react-native` to `react-native-web`

Every package in the library imports from `react-native`. Alias the bare name
only, with an exact-match pattern, so `react-native-svg`,
`react-native-reanimated` and the other `react-native-*` packages keep their
own names.

### 2. Resolve `.web.*` files first

`react-native-safe-area-context`, `react-native-reanimated` and the library
ship web variants as `.web.js` and `.web.ts` files. Metro picks them by
platform. Put the `.web.*` extensions before the plain ones in the resolver.

### 3. Run the worklets Babel plugin on `node_modules`

Reanimated needs every `'worklet'` function compiled by
`react-native-worklets/plugin`. Metro runs Babel on `node_modules`, so an Expo
app never sees this step. A web bundler skips `node_modules` by default, and
then **the build succeeds and nothing animates**: a `Dialog` stays at opacity
0, a `Tabs` indicator never moves, and a production build logs no error.

Run the plugin on your app source **and** on these three packages:

- `node_modules/@rootnative` — the library ships its `'worklet'` directives
  as written.
- `node_modules/react-native-reanimated` — its `lib` ships raw directives too.
  Without it, a dev build logs `timing easing: the provided easing function is
  not a worklet` for every `cubicBezier` easing in the theme.
- `node_modules/react-native-worklets` — the runtime the plugin targets.

`@rootnative/inertia` checks for the plugin at the first `Motion` render and
logs one `console.error` when it is missing, in production too. If you see that
message, the include list is incomplete.

### 4. Define the globals

Reanimated and the worklets runtime read `global`, the Node name. A browser and
a sandboxed Electron renderer have only `globalThis`, so the page throws
`ReferenceError: global is not defined` without a define. The library also
reads `__DEV__` and `process.env.NODE_ENV`, which Metro defines.

### 5. Resolve the default icon set

The components import `@expo/vector-icons/MaterialCommunityIcons` with a
static import, so every bundle must resolve it, even one that never renders an
MDI glyph. See [Installation](./installation.md#peer-dependencies) for why
the import is static.

You have two options:

- **Keep the default icons.** Install `@expo/vector-icons` and `expo-font`.
  Both work on web without the rest of Expo.
- **Bring your own icons.** Register an `iconResolver` on `ThemeProvider` (see
  [Icons](./icons.md#global-configure-an-iconresolver)) and alias the import
  to a stub that exports `null`. The library calls your resolver first and
  reads the import only when no resolver is set, so the stub is never reached.

```ts title="src/no-vector-icons.ts"
export default null
```

## Vite

```ts title="vite.config.ts"
import { fileURLToPath } from 'node:url'
import babel from '@rolldown/plugin-babel'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    babel({
      // 3. The plugin must see the app and the three worklet packages.
      include: [
        /src\/.*\.tsx?$/,
        /node_modules\/(@rootnative|react-native-reanimated|react-native-worklets)\/.*\.m?js$/,
      ],
      // The default `exclude` skips all of node_modules. Keep only its own
      // runtime entry excluded.
      exclude: /\0rolldown\/runtime\.js/,
      plugins: ['react-native-worklets/plugin'],
    }),
  ],
  resolve: {
    alias: [
      // 1. Exact match, so react-native-svg and friends keep their names.
      { find: /^react-native$/, replacement: 'react-native-web' },
      // 5. Only when you register your own iconResolver.
      {
        find: '@expo/vector-icons/MaterialCommunityIcons',
        replacement: fileURLToPath(
          new URL('src/no-vector-icons.ts', import.meta.url),
        ),
      },
    ],
    // 2. Web variants first.
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.mjs',
      '.web.js',
      '.tsx',
      '.ts',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ],
  },
  define: {
    // 4. The globals Metro provides.
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(
      process.env.NODE_ENV ?? 'production',
    ),
  },
})
```

## webpack

```js title="webpack.config.js"
const path = require('node:path')
const webpack = require('webpack')

const worklets = [
  path.resolve(__dirname, 'src'),
  path.resolve(__dirname, 'node_modules/@rootnative'),
  path.resolve(__dirname, 'node_modules/react-native-reanimated'),
  path.resolve(__dirname, 'node_modules/react-native-worklets'),
]

module.exports = {
  module: {
    rules: [
      {
        test: /\.(m?js|tsx?)$/,
        // 3. The app and the three worklet packages.
        include: worklets,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-typescript', '@babel/preset-react'],
            plugins: ['react-native-worklets/plugin'],
          },
        },
      },
    ],
  },
  resolve: {
    alias: {
      // 1. The `$` makes the alias exact.
      'react-native$': 'react-native-web',
      // 5. Only when you register your own iconResolver.
      '@expo/vector-icons/MaterialCommunityIcons': path.resolve(
        __dirname,
        'src/no-vector-icons.ts',
      ),
    },
    // 2. Web variants first.
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.mjs',
      '.web.js',
      '.tsx',
      '.ts',
      '.mjs',
      '.js',
      '.jsx',
      '.json',
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      // 4. The globals Metro provides.
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      global: 'globalThis',
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV ?? 'production',
      ),
    }),
  ],
}
```

## The app root

The root is the same as on Expo. No `SafeAreaProvider` is needed: on web
without a provider the components that apply insets use zero insets. Add one
only when your own code calls `useSafeAreaInsets`, or when the page needs the
`env(safe-area-inset-*)` values of a notched device.

```tsx title="src/App.tsx"
import { PortalHost } from '@rootnative/components/portal'
import { SnackbarProvider } from '@rootnative/components/snackbar'
import { ThemeProvider, darkTheme, lightTheme } from '@rootnative/core'

export function App() {
  return (
    <ThemeProvider theme={{ light: lightTheme, dark: darkTheme }}>
      <PortalHost>
        <SnackbarProvider>{/* Your app */}</SnackbarProvider>
      </PortalHost>
    </ThemeProvider>
  )
}
```

To remember the theme mode, pass `localStorage` as the `storage`. See
[Theming](./theming.md#remembering-the-choice) for the web notes.

## Electron

The recipe above runs in an Electron renderer with `contextIsolation`,
`sandbox` and no `nodeIntegration`, loaded from a `file://` URL. Three Electron
facts apply:

- **Relative asset paths.** A `file://` page cannot load `/assets/...`. Set
  Vite's `base` to `'./'`, or webpack's `output.publicPath` to `'./'`.
- **`style-src` needs `'unsafe-inline'`.** `react-native-web` inserts its
  style sheet at run time. A Content Security Policy of
  `style-src 'self'` blocks it and the page renders unstyled. `script-src
  'self'` works as is: the library needs no inline or remote script.
- **`global` is not defined in the sandbox.** The sandboxed renderer has no
  Node globals, so the define in step 4 is required, not optional.

Electron is not yet listed as a tested host in [Installation](./installation.md#platforms).
A macOS Electron app runs this recipe today; the remaining checks are window
drag regions, keyboard focus, Reduce motion, and the packaged build.

## Symptoms

| What you see | Cause | Fix |
| --- | --- | --- |
| The build succeeds, nothing animates, no console error | The worklets plugin did not run on `node_modules` | Step 3: add the three packages to the include |
| `[inertia] The Reanimated worklets babel plugin is not configured` | Same as above, reported by the library | Step 3 |
| `timing easing: the provided easing function is not a worklet` | The include covers `@rootnative` but not `react-native-reanimated` | Step 3: add `react-native-reanimated` |
| `ReferenceError: global is not defined` | No define for `global` | Step 4 |
| `Unable to resolve @expo/vector-icons` or `expo-font` | The static icon import | Step 5: install the two packages, or alias the import to a stub |
| `No safe area value available` on a blank page | A version before the web fallback | Update `@rootnative/components`; alpha.21 and earlier threw on web without a `SafeAreaProvider` |
| Native-only props such as `hitSlop` do nothing | Expected on `react-native-web` | See [Accessibility](./accessibility.md) for the web differences |
