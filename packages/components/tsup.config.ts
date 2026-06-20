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
    'src/list/index.ts',
    'src/keyboard-avoiding-wrapper/index.ts',
    'src/avatar/index.ts',
    'src/portal/index.ts',
    'src/slider/index.ts',
    'src/progress/index.ts',
    'src/fab/index.ts',
  ],
  // `@rootnative/utils` is private/unpublished and bundled into the JS via
  // `noExternal` below. `dts.resolve` makes the declaration bundler inline its
  // types too, so shipped .d.ts files don't leave a bare
  // `import ... from '@rootnative/utils'` that consumers can't resolve.
  dts: { resolve: ['@rootnative/utils'] },
  format: 'cjs',
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
