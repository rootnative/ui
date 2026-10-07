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
build or a dev server without it failed in a specific way. The
[symptoms table](#symptoms) maps each failure back to its line.

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
The Vite dev server needs the list a second time; see
[The Vite dev server](#the-vite-dev-server).

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

The Vite dev server needs the plugin a second time; see
[The Vite dev server](#the-vite-dev-server).

`@rootnative/inertia` checks for the plugin at the first `Motion` render and
logs one `console.error` when it is missing, in production too. If you see that
message, the include list is incomplete.

### 4. Define the globals

Reanimated and the worklets runtime read `global`, the Node name. A browser and
a sandboxed Electron renderer have only `globalThis`, so the page throws
`ReferenceError: global is not defined` without a define. The library also
reads `__DEV__` and `process.env.NODE_ENV`, which Metro defines.

### 5. Choose an icon set

A string icon name needs an `iconResolver` on `ThemeProvider`. Only the
`@rootnative/components/mdi` subpath imports an icon font package, so the
choice is yours and no alias is needed:

- **MaterialDesignIcons.** Install `@react-native-vector-icons/material-design-icons` and
  `expo-font`. Both work on web without the rest of Expo; the package loads
  its font through `expo-font` when `globalThis.expo` exists, and embeds it
  from its `/static` export otherwise. Pass `mdiResolver` from
  `@rootnative/components/mdi`.
- **Your own icons.** Register an `iconResolver` on `ThemeProvider` (see
  [Icons](./icons.md#global-configure-an-iconresolver)) and do not install
  the icon package. No module in the bundle imports it.

## Vite

```ts title="vite.config.ts"
import babel from '@rolldown/plugin-babel'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// 2. Web variants first.
const extensions = [
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
]

const workletPackages =
  /node_modules\/(@rootnative|react-native-reanimated|react-native-worklets)\/.*\.m?js$/

// 3. The worklets plugin.
function worklets(include: RegExp[]) {
  return babel({
    include,
    // The default `exclude` skips all of node_modules. Keep only its own
    // runtime entry excluded.
    exclude: /\0rolldown\/runtime\.js/,
    plugins: ['react-native-worklets/plugin'],
  })
}

export default defineConfig({
  // 3. The plugin must see the app and the three worklet packages.
  plugins: [react(), worklets([/src\/.*\.tsx?$/, workletPackages])],
  resolve: {
    alias: [
      // 1. Exact match, so react-native-svg and friends keep their names.
      { find: /^react-native$/, replacement: 'react-native-web' },
    ],
    extensions,
  },
  // 2. and 3. again for `vite dev`. Its dependency pre-bundle is a separate
  // pass that reads neither `plugins` nor `resolve.extensions` above.
  optimizeDeps: {
    rolldownOptions: {
      plugins: [worklets([workletPackages])],
      resolve: { extensions },
    },
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

### The Vite dev server

`vite dev` pre-bundles the packages in `node_modules` before it serves the
page. The pre-bundle is a separate Rolldown pass, and it reads neither the
`plugins` list nor `resolve.extensions`. The alias does reach it. So
`optimizeDeps.rolldownOptions` gives the pass its own copy of both. `vite build`
has no pre-bundle and ignores the block.

Each half fails in its own way when it is missing:

- **No extensions.** The dev server stops at start with
  `Error during dependency optimization` and `Flow is not supported` in
  `react-native/Libraries/...`. The pre-bundle takes the native files of
  `react-native-reanimated`, `react-native-safe-area-context` and
  `react-native-svg`, not their `.web.*` files, and those native files import
  Flow source from `react-native`.
- **No plugin.** The dev server starts, but the page is blank and throws
  ``[Reanimated] `useAnimatedStyle` was used without a dependency array or
  Babel plugin``. The pre-bundled packages keep their raw `'worklet'`
  directives.

Checked with Vite 8.3, `@rolldown/plugin-babel` 0.2, `react-native-web` 0.21
and `react-native-reanimated` 4.5. With the block, the pre-bundle holds no raw
`'worklet'` directive and the page renders with no error.

The webpack dev server compiles with the same rules as the build, so the
webpack config needs no second copy.

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
| `vite dev` stops at start: `Error during dependency optimization`, `Flow is not supported` in `react-native/Libraries/...` | The dev pre-bundle does not read `resolve.extensions` | [The Vite dev server](#the-vite-dev-server): add `resolve.extensions` to `optimizeDeps.rolldownOptions` |
| `vite build` works, but `vite dev` shows a blank page and ``[Reanimated] `useAnimatedStyle` was used without a dependency array or Babel plugin`` | The dev pre-bundle does not run the worklets plugin | [The Vite dev server](#the-vite-dev-server): add the plugin to `optimizeDeps.rolldownOptions` |
| `ReferenceError: global is not defined` | No define for `global` | Step 4 |
| `Unable to resolve @react-native-vector-icons/material-design-icons` | The app imports `@rootnative/components/mdi` | Step 5: install the package, or pass your own `iconResolver` and drop the import |
| MDI glyphs render as `?` or as empty squares | `@expo/vector-icons` and `@react-native-vector-icons/*` both register the font | Remove `@expo/vector-icons`; run `npx @react-native-vector-icons/codemod` on app code that imports it |
| A string icon renders nothing, and the console shows `no iconResolver is set` | `ThemeProvider` has no `iconResolver` | Step 5 |
| `No safe area value available` on a blank page | A version before the web fallback | Update `@rootnative/components`; alpha.21 and earlier threw on web without a `SafeAreaProvider` |
| Native-only props such as `hitSlop` do nothing | Expected on `react-native-web` | See [Accessibility](./accessibility.md) for the web differences |
