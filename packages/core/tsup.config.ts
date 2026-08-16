import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/create-theme/index.ts'],
  dts: true,
  format: 'esm',
  outDir: 'dist',
  clean: true,
  // `@material/material-color-utilities` is bundled, not a peer dependency.
  // Two reasons, both from field feedback:
  // 1. The package ships ESM with extensionless imports, so plain Node cannot
  //    load it from node_modules — and `/create-theme` must stay importable
  //    from scripts and CI (that is the point of the subpath).
  // 2. As an optional peer it installed silently-absent: the package manager
  //    printed no warning, and `createMaterialTheme` failed at the first
  //    import with an unhelpful resolution error.
  // It is pure color math with no native code; tree-shaking keeps it out of
  // bundles that never import `create-theme`.
  noExternal: ['@material/material-color-utilities'],
})
