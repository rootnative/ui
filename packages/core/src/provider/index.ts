export { ThemeProvider } from './ThemeProvider'
export type { ThemeProviderProps } from './ThemeProvider'
export { useTheme } from './useTheme'
export { useIconResolver } from './useIconResolver'
// `IconResolverContext` is deliberately NOT re-exported. `ThemeProvider`'s
// `iconResolver` prop writes it and `useIconResolver()` reads it, which covers
// the intended use; exporting the raw context would put a provider identity
// under the semver promise for no gain.
export type {
  IconResolver,
  IconRenderProps,
  IconSource,
} from './IconResolverContext'
