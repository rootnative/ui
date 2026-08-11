export { ThemeProvider, THEME_MODE_STORAGE_KEY } from './ThemeProvider'
export type { ThemePair, ThemeProviderProps } from './ThemeProvider'
export { useTheme } from './useTheme'
export { useThemeMode } from './useThemeMode'
export { useIconResolver } from './useIconResolver'
// As with `IconResolverContext`, `ThemeModeContext` stays internal — the
// provider writes it and `useThemeMode()` reads it.
export type {
  ColorScheme,
  ThemeMode,
  ThemeModeContextValue,
  ThemeModeStorage,
} from './ThemeModeContext'
// `IconResolverContext` is deliberately NOT re-exported. `ThemeProvider`'s
// `iconResolver` prop writes it and `useIconResolver()` reads it, which covers
// the intended use; exporting the raw context would put a provider identity
// under the semver promise for no gain.
export type {
  IconResolver,
  IconRenderProps,
  IconSource,
} from './IconResolverContext'
