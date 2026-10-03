import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/schema/index.ts',
    'src/react/index.ts',
    'src/expo-router/index.ts',
    'src/node/index.ts',
  ],
  dts: true,
  format: 'esm',
  // One shared chunk per module, so `SeoContext` exists once across the
  // `react` and `expo-router` entries. `check:singletons` reads the output.
  splitting: true,
  outDir: 'dist',
  clean: true,
  external: ['react', 'react-native', 'expo-router', 'expo-router/head'],
})
