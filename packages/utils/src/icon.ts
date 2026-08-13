import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

/**
 * MaterialCommunityIcons from `@expo/vector-icons`.
 *
 * The import is **static on purpose**. A lazy `require()` inside a try/catch
 * looks like the right shape for an optional peer, but it does not survive the
 * build: `splitting: true` makes esbuild compile through an ESM intermediate,
 * where `require` does not exist, so every literal `require('x')` becomes an
 * indirect `__require.call(void 0, 'x')`. Metro builds its module graph by
 * scanning for literal `require('...')` / `import` statements, so an indirect
 * call is invisible to it — the module never enters the graph and the call
 * throws "Requiring unknown module" at runtime. Every icon in the library
 * failed that way while the catch block reported the package as not installed.
 *
 * A static import is what Metro can see, so the module is bundled and resolves.
 * `@expo/vector-icons` stays in tsup's `external` list, so it is not inlined.
 */
export function getMaterialCommunityIcons() {
  if (!MaterialCommunityIcons) {
    throw new Error(
      '@expo/vector-icons is required for icon support. ' +
        'Install it with: npx expo install @expo/vector-icons',
    )
  }
  return MaterialCommunityIcons
}
