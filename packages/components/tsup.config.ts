import path from 'path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/typography/index.ts',
    'src/layout/index.ts',
    'src/button/index.ts',
    'src/button-group/index.ts',
    'src/icon-button/index.ts',
    'src/appbar/index.ts',
    'src/card/index.ts',
    'src/chip/index.ts',
    'src/checkbox/index.ts',
    'src/radio/index.ts',
    'src/switch/index.ts',
    'src/text-field/index.ts',
    'src/dialog/index.ts',
    'src/bottom-sheet/index.ts',
    'src/divider/index.ts',
    'src/menu/index.ts',
    'src/tooltip/index.ts',
    'src/tabs/index.ts',
    'src/navigation-bar/index.ts',
    'src/list/index.ts',
    'src/keyboard-avoiding-wrapper/index.ts',
    'src/avatar/index.ts',
    'src/portal/index.ts',
    'src/snackbar/index.ts',
    'src/slider/index.ts',
    'src/progress/index.ts',
    'src/loading-indicator/index.ts',
    'src/skeleton/index.ts',
    'src/fab/index.ts',
  ],
  // `@rootnative/utils` is private/unpublished and bundled into the JS via
  // `noExternal` below. `dts.resolve` makes the declaration bundler inline its
  // types too, so shipped .d.ts files don't leave a bare
  // `import ... from '@rootnative/utils'` that consumers can't resolve.
  dts: { resolve: ['@rootnative/utils'] },
  // ESM, not CJS, and that choice is load-bearing for animation.
  //
  // Under `format: 'cjs'` + `splitting: true`, esbuild emits a cross-chunk hook
  // call as `_reanimated.useAnimatedStyle.call(void 0, cb)`. The Reanimated
  // Babel plugin auto-workletizes **by callee name** — it unwraps a
  // SequenceExpression, then reads `callee.name` / `callee.property.name`. That
  // resolves to `call`, never matches, and the callback ships un-workletized;
  // the UI thread then receives a plain object and every animated component
  // dies with `TypeError: updater is not a function (it is Object)`.
  //
  // Without splitting, CJS emitted `(0, import_reanimated.useAnimatedStyle)(cb)`
  // which the plugin *does* match — that is why alpha.9 worked and alpha.10
  // (which added splitting to fix the PortalContext duplication) did not.
  // Reverting splitting is not an option: it is what keeps the singletons
  // unique. ESM satisfies both — bare `useAnimatedStyle(cb)` calls, and one
  // definition per singleton. `pnpm run check:worklets` guards the first,
  // `pnpm run check:singletons` the second.
  format: 'esm',
  // Load-bearing. Without it every one of the 30 entries above is a
  // self-contained bundle that inlines each module it reaches, so a
  // module-level singleton is emitted once *per entry*. `PortalContext` shipped
  // as 7 separate contexts that way, which silently broke every overlay
  // (Tooltip, Menu, Dialog, BottomSheet, Snackbar) for anyone mixing subpath
  // and root imports — the import style the docs recommend. Splitting is
  // automatic for ESM, so this is now belt-and-braces rather than the switch it
  // was under CJS; keep it explicit so the guarantee survives a format change.
  // `pnpm run check:singletons` guards it; see that script's header for why
  // nothing else in CI can see this class of regression.
  splitting: true,
  // Keep the `.js` extension tsup would otherwise turn into `.mjs`. `"type":
  // "module"` in package.json is what makes a `.js` file ESM, so the 30
  // `exports` entries, `typesVersions`, and every consumer path stay exactly as
  // they are — the format change stays invisible to the resolver.
  outExtension: () => ({ js: '.js' }),
  outDir: 'dist',
  clean: true,
  noExternal: ['@rootnative/utils'],
  external: [
    '@expo/vector-icons',
    'react-native-reanimated',
    'react-native-safe-area-context',
    'react-native-svg',
  ],
  esbuildOptions(options) {
    options.alias = {
      '@rootnative/utils': path.resolve(__dirname, '../utils/src/index.ts'),
    }
  },
})
